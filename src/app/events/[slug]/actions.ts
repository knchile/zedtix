"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { q } from "@/lib/db";
import { MAX_PER_ORDER, bookingFee } from "@/lib/config";
import { normalisePhone } from "@/lib/format";
import { collect } from "@/lib/lipila";
import { callbackUrl, expireStaleOrders, markFailed, markPaid, newReference, reserve } from "@/lib/orders";

export type BuyState = { error?: string };

const schema = z.object({
  eventId: z.uuid(),
  name: z.string().trim().min(2, "Please enter your name").max(80),
  phone: z.string().trim().min(9, "Please enter your mobile money number"),
  email: z.union([z.literal(""), z.email("Please check your email address")]).optional(),
});

export async function createOrder(_prev: BuyState, form: FormData): Promise<BuyState> {
  const parsed = schema.safeParse({
    eventId: form.get("eventId"),
    name: form.get("name"),
    phone: form.get("phone"),
    email: form.get("email") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check your details" };
  const { eventId, name, email } = parsed.data;

  const phone = normalisePhone(parsed.data.phone);
  if (!phone) return { error: "Please enter a valid Zambian mobile number, for example 097 123 4567." };

  const ev = (await q<{ id: string; title: string; starts_at: string }>`
    SELECT id, title, starts_at FROM events WHERE id = ${eventId} AND status = 'published'`)[0];
  if (!ev) return { error: "This event is no longer on sale." };

  const types = await q<{ id: string; name: string; price: number }>`
    SELECT id, name, price FROM ticket_types WHERE event_id = ${ev.id}`;

  const lines = types
    .map((t) => ({ ticketTypeId: t.id, qty: Math.floor(Number(form.get(`qty_${t.id}`) || 0)), price: t.price }))
    .filter((l) => l.qty > 0);
  const count = lines.reduce((a, l) => a + l.qty, 0);
  if (count === 0) return { error: "Choose at least one ticket." };
  if (count > MAX_PER_ORDER) return { error: `You can buy up to ${MAX_PER_ORDER} tickets per order.` };

  await expireStaleOrders();
  const held = await reserve(lines);
  if (!held) return { error: "Sorry, there aren't enough tickets left for that selection. Please try fewer." };

  const subtotal = lines.reduce((a, l) => a + l.qty * l.price, 0);
  const fee = bookingFee(subtotal);
  const total = subtotal + fee;
  const reference = newReference();

  const order = (await q<{ id: string }>`
    INSERT INTO orders (event_id, reference, buyer_name, buyer_phone, buyer_email, subtotal, fee, total)
    VALUES (${ev.id}, ${reference}, ${name}, ${phone}, ${email || null}, ${subtotal}, ${fee}, ${total})
    RETURNING id`)[0];
  for (const l of lines) {
    await q`INSERT INTO order_items (order_id, ticket_type_id, qty, unit_price) VALUES (${order.id}, ${l.ticketTypeId}, ${l.qty}, ${l.price})`;
  }

  if (total === 0) {
    await markPaid(reference, "FREE");
    redirect(`/orders/${reference}`);
  }

  let failed: string | null = null;
  try {
    const r = await collect({
      referenceId: reference,
      amount: total,
      phone,
      narration: `ZedTix ${ev.title}`,
      email: email || null,
      callbackUrl: callbackUrl(),
    });
    if (!r.ok) failed = r.data.message || "The payment could not be started.";
  } catch (err) {
    console.error("[lipila] collect failed", err);
    failed = "We couldn't reach the payment service.";
  }

  if (failed) {
    await markFailed(reference, failed);
    return { error: `${failed} Please check the number and try again.` };
  }

  redirect(`/orders/${reference}`);
}
