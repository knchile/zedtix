import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { displayPhone, eventDate, kwacha } from "@/lib/format";
import { site } from "@/lib/config";
import { addTickets, gateLookup, setPublished } from "../actions";

export const metadata: Metadata = { title: "Event sales", robots: { index: false } };

type Ev = { id: string; organiser_id: string; title: string; slug: string; status: string; starts_at: string; venue: string; city: string };
type TT = { id: string; name: string; price: number; quantity: number; sold: number; checked_in: number };
type O = { reference: string; buyer_name: string; buyer_phone: string; subtotal: number; status: string; created_at: string; qty: number };

export default async function EventAdmin({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const ev = (await q<Ev>`SELECT id, organiser_id, title, slug, status, starts_at, venue, city FROM events WHERE id = ${id}`)[0];
  if (!ev || (ev.organiser_id !== user.id && !user.isAdmin)) notFound();

  const [types, orders] = await Promise.all([
    q<TT>`
      SELECT t.id, t.name, t.price, t.quantity,
        (SELECT count(*) FROM tickets k WHERE k.ticket_type_id = t.id)::int AS sold,
        (SELECT count(*) FROM tickets k WHERE k.ticket_type_id = t.id AND k.checked_in_at IS NOT NULL)::int AS checked_in
      FROM ticket_types t WHERE t.event_id = ${ev.id} ORDER BY t.sort`,
    q<O>`
      SELECT o.reference, o.buyer_name, o.buyer_phone, o.subtotal, o.status, o.created_at,
        (SELECT COALESCE(sum(qty), 0) FROM order_items i WHERE i.order_id = o.id)::int AS qty
      FROM orders o WHERE o.event_id = ${ev.id} AND o.status IN ('paid', 'pending')
      ORDER BY o.created_at DESC LIMIT 200`,
  ]);

  const sold = types.reduce((a, t) => a + t.sold, 0);
  const capacity = types.reduce((a, t) => a + t.quantity, 0);
  const checkedIn = types.reduce((a, t) => a + t.checked_in, 0);
  const revenue = orders.filter((o) => o.status === "paid").reduce((a, o) => a + o.subtotal, 0);
  const publicUrl = `${site.url}/events/${ev.slug}`;
  const live = ev.status === "published";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <Link href="/organiser" className="text-sm font-semibold text-zinc-500 hover:text-zinc-800">← My events</Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">{ev.title}</h1>
          <p className="text-zinc-600">{eventDate(ev.starts_at)} · {ev.venue}, {ev.city}</p>
        </div>
        <form action={setPublished}>
          <input type="hidden" name="eventId" value={ev.id} />
          <input type="hidden" name="publish" value={live ? "0" : "1"} />
          <button className={live ? "btn-ghost" : "btn-primary"}>{live ? "Stop sales" : "Put on sale"}</button>
        </form>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Tickets sold", `${sold} / ${capacity}`],
          ["Ticket revenue", kwacha(revenue)],
          ["Checked in", String(checkedIn)],
          ["Status", live ? "On sale" : "Draft"],
        ].map(([k, v]) => (
          <div key={k} className="card p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{k}</dt>
            <dd className="mt-1 text-2xl font-black">{v}</dd>
          </div>
        ))}
      </dl>

      <section className="card mt-6 p-5">
        <h2 className="font-black">Share your event</h2>
        <p className="mt-1 break-all font-mono text-sm text-zinc-700">{publicUrl}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a className="btn bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700" target="_blank" rel="noopener noreferrer"
            href={`https://wa.me/?text=${encodeURIComponent(`Get your tickets for ${ev.title}: ${publicUrl}`)}`}>Share on WhatsApp</a>
          <a className="btn bg-[#1877f2] px-4 py-2 text-sm text-white" target="_blank" rel="noopener noreferrer"
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}`}>Share on Facebook</a>
          <Link className="btn-ghost px-4 py-2 text-sm" href={`/events/${ev.slug}`}>View page</Link>
        </div>
      </section>

      <section className="card mt-6 p-5">
        <h2 className="font-black">At the door</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Scan a ticket QR with your phone camera while logged in here, or type the ticket code.
        </p>
        <form action={gateLookup} className="mt-3 flex gap-2">
          <input className="input font-mono uppercase" name="code" placeholder="TICKET CODE" autoCapitalize="characters" />
          <button className="btn-dark shrink-0">Check</button>
        </form>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-black">Ticket types</h2>
        <div className="card mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr><th className="p-3">Type</th><th className="p-3">Price</th><th className="p-3">Sold</th><th className="p-3">In</th><th className="p-3">Add more</th></tr>
            </thead>
            <tbody>
              {types.map((t) => (
                <tr key={t.id} className="border-t border-zinc-100">
                  <td className="p-3 font-semibold">{t.name}</td>
                  <td className="p-3">{kwacha(t.price)}</td>
                  <td className="p-3">{t.sold} / {t.quantity}</td>
                  <td className="p-3">{t.checked_in}</td>
                  <td className="p-3">
                    <form action={addTickets} className="flex gap-1.5">
                      <input type="hidden" name="eventId" value={ev.id} />
                      <input type="hidden" name="ticketTypeId" value={t.id} />
                      <input name="extra" type="number" min={1} className="input w-20 py-1.5 text-sm" placeholder="+50" aria-label={`Add ${t.name} tickets`} />
                      <button className="btn-ghost px-3 py-1.5 text-sm">Add</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-black">Orders</h2>
        {orders.length === 0 ? (
          <p className="mt-2 text-zinc-600">No orders yet. Share your link to start selling.</p>
        ) : (
          <div className="card mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
                <tr><th className="p-3">Buyer</th><th className="p-3">Phone</th><th className="p-3">Tickets</th><th className="p-3">Amount</th><th className="p-3">Status</th></tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.reference} className="border-t border-zinc-100">
                    <td className="p-3 font-semibold">{o.buyer_name}</td>
                    <td className="p-3 whitespace-nowrap">{displayPhone(o.buyer_phone)}</td>
                    <td className="p-3">{o.qty}</td>
                    <td className="p-3">{kwacha(o.subtotal)}</td>
                    <td className="p-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${o.status === "paid" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                        {o.status === "paid" ? "Paid" : "Awaiting payment"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
