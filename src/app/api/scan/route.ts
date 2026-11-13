import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { q } from "@/lib/db";

export type ScanResult =
  | { result: "admitted"; code: string; type: string; name: string; admitted: number; sold: number }
  | { result: "used"; code: string; type: string; name: string; at: string; admitted: number; sold: number }
  | { result: "wrong_event"; code: string; event: string }
  | { result: "invalid"; code: string }
  | { result: "error"; message: string };

/** Pull the ticket code out of whatever the camera read: a ZedTix ticket URL or a bare code. */
function extractCode(raw: string) {
  const s = raw.trim();
  const m = s.match(/\/t\/([A-Za-z0-9]+)/);
  return (m ? m[1] : s).replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 20);
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ result: "error", message: "Please sign in again." } satisfies ScanResult, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { eventId?: string; code?: string };
  const eventId = String(body.eventId || "");
  const code = extractCode(String(body.code || ""));
  if (!/^[0-9a-f-]{36}$/.test(eventId) || !code) {
    return NextResponse.json({ result: "invalid", code } satisfies ScanResult);
  }

  const ev = (await q<{ organiser_id: string }>`SELECT organiser_id FROM events WHERE id = ${eventId}`)[0];
  if (!ev || (ev.organiser_id !== user.id && !user.isAdmin)) {
    return NextResponse.json({ result: "error", message: "You can only admit guests to your own events." } satisfies ScanResult, { status: 403 });
  }

  const t = (await q<{ id: string; event_id: string; event_title: string; type: string; name: string }>`
    SELECT k.id, k.event_id, e.title AS event_title, tt.name AS type, o.buyer_name AS name
    FROM tickets k
    JOIN events e ON e.id = k.event_id
    JOIN ticket_types tt ON tt.id = k.ticket_type_id
    JOIN orders o ON o.id = k.order_id
    WHERE k.code = ${code}`)[0];

  if (!t) return NextResponse.json({ result: "invalid", code } satisfies ScanResult);
  if (t.event_id !== eventId) return NextResponse.json({ result: "wrong_event", code, event: t.event_title } satisfies ScanResult);

  // Atomic: only the first scan flips checked_in_at, so two doors can't admit the same ticket.
  const admittedNow = await q<{ id: string }>`
    UPDATE tickets SET checked_in_at = now() WHERE id = ${t.id} AND checked_in_at IS NULL RETURNING id`;

  const [counts] = await q<{ admitted: number; sold: number }>`
    SELECT count(*) FILTER (WHERE checked_in_at IS NOT NULL)::int AS admitted, count(*)::int AS sold
    FROM tickets WHERE event_id = ${eventId}`;

  if (admittedNow[0]) {
    return NextResponse.json({ result: "admitted", code, type: t.type, name: t.name, ...counts } satisfies ScanResult);
  }
  const [prev] = await q<{ checked_in_at: string }>`SELECT checked_in_at FROM tickets WHERE id = ${t.id}`;
  return NextResponse.json({ result: "used", code, type: t.type, name: t.name, at: prev.checked_in_at, ...counts } satisfies ScanResult);
}
