import "server-only";
import { db, q } from "./db";
import { HOLD_MINUTES, site } from "./config";
import { randomCode } from "./format";
import { checkStatus, isFailure, isSuccess } from "./lipila";

/** Release tickets held by orders that were never paid. Cheap; called on each checkout. */
export async function expireStaleOrders() {
  const stale = await q<{ id: string }>`
    UPDATE orders SET status = 'expired'
    WHERE status = 'pending' AND created_at < now() - make_interval(mins => ${HOLD_MINUTES})
    RETURNING id`;
  for (const o of stale) await releaseItems(o.id);
}

async function releaseItems(orderId: string) {
  await q`
    UPDATE ticket_types t SET reserved = GREATEST(0, t.reserved - i.qty)
    FROM order_items i WHERE i.order_id = ${orderId} AND i.ticket_type_id = t.id`;
}

/**
 * Hold tickets for each line. All-or-nothing: if any line can't be held,
 * every hold made so far is released and null is returned.
 */
export async function reserve(lines: { ticketTypeId: string; qty: number }[]) {
  const held: { ticketTypeId: string; qty: number }[] = [];
  for (const l of lines) {
    const r = await q<{ id: string }>`
      UPDATE ticket_types SET reserved = reserved + ${l.qty}
      WHERE id = ${l.ticketTypeId} AND reserved + ${l.qty} <= quantity
      RETURNING id`;
    if (!r[0]) {
      for (const h of held) {
        await q`UPDATE ticket_types SET reserved = GREATEST(0, reserved - ${h.qty}) WHERE id = ${h.ticketTypeId}`;
      }
      return false;
    }
    held.push(l);
  }
  return true;
}

/** Mark a pending order paid and issue its tickets. Idempotent. */
export async function markPaid(reference: string, providerRef?: string | null) {
  const rows = await q<{ id: string; event_id: string }>`
    UPDATE orders SET status = 'paid', paid_at = now(), provider_ref = COALESCE(${providerRef ?? null}, provider_ref)
    WHERE reference = ${reference} AND status IN ('pending', 'expired', 'failed')
    RETURNING id, event_id`;
  const order = rows[0];
  if (!order) return; // already paid or unknown

  const items = await q<{ ticket_type_id: string; qty: number }>`
    SELECT ticket_type_id, qty FROM order_items WHERE order_id = ${order.id}`;
  const existing = await q<{ n: number }>`SELECT count(*)::int AS n FROM tickets WHERE order_id = ${order.id}`;
  if ((existing[0]?.n ?? 0) > 0) return;

  const sql = db();
  const inserts = [];
  for (const it of items) {
    for (let i = 0; i < it.qty; i++) {
      inserts.push(sql`
        INSERT INTO tickets (code, order_id, event_id, ticket_type_id)
        VALUES (${randomCode(10)}, ${order.id}, ${order.event_id}, ${it.ticket_type_id})`);
    }
  }
  await sql.transaction(inserts);
}

/** Re-hold tickets for an order that is being revived after release. */
async function rehold(orderId: string) {
  await q`
    UPDATE ticket_types t SET reserved = LEAST(t.quantity, t.reserved + i.qty)
    FROM order_items i WHERE i.order_id = ${orderId} AND i.ticket_type_id = t.id`;
}

export async function markFailed(reference: string, message?: string) {
  const rows = await q<{ id: string }>`
    UPDATE orders SET status = 'failed', provider_msg = ${message ?? null}
    WHERE reference = ${reference} AND status = 'pending'
    RETURNING id`;
  if (rows[0]) await releaseItems(rows[0].id);
}

/**
 * Ask Lipila for the latest status of an order and apply it.
 * Never trusts a callback body on its own: every state change is confirmed here.
 */
export async function syncOrder(reference: string) {
  const rows = await q<{ id: string; status: string }>`SELECT id, status FROM orders WHERE reference = ${reference}`;
  const order = rows[0];
  if (!order || order.status === "paid") return order?.status ?? null;

  const r = await checkStatus(reference);
  if (!r) return order.status;
  if (isSuccess(r.status)) {
    if (order.status !== "pending") await rehold(order.id);
    await markPaid(reference, r.externalId ?? r.identifier ?? null);
    return "paid";
  }
  if (isFailure(r.status) && order.status === "pending") {
    await markFailed(reference, r.message);
    return "failed";
  }
  return order.status;
}

export function newReference() {
  return `ZT${randomCode(10)}`;
}

export function callbackUrl() {
  return `${site.url}/api/lipila/callback`;
}
