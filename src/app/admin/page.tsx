import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { displayPhone, eventDate, kwacha } from "@/lib/format";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

type Row = {
  id: string; title: string; starts_at: string; status: string;
  organiser: string; organiser_phone: string;
  tickets: number; gross: number; fees: number;
};

export default async function Admin() {
  const user = await requireUser();
  if (!user.isAdmin) notFound();

  const rows = await q<Row>`
    SELECT e.id, e.title, e.starts_at, e.status, u.name AS organiser, u.phone AS organiser_phone,
      COALESCE((SELECT count(*) FROM tickets k WHERE k.event_id = e.id), 0)::int AS tickets,
      COALESCE((SELECT sum(subtotal) FROM orders o WHERE o.event_id = e.id AND o.status = 'paid'), 0)::int AS gross,
      COALESCE((SELECT sum(fee) FROM orders o WHERE o.event_id = e.id AND o.status = 'paid'), 0)::int AS fees
    FROM events e JOIN users u ON u.id = e.organiser_id
    ORDER BY e.starts_at DESC LIMIT 200`;
  const totals = rows.reduce((a, r) => ({ tickets: a.tickets + r.tickets, gross: a.gross + r.gross, fees: a.fees + r.fees }), { tickets: 0, gross: 0, fees: 0 });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <h1 className="text-3xl font-black tracking-tight">ZedTix admin</h1>
      <dl className="mt-6 grid grid-cols-3 gap-3">
        {[["Tickets sold", String(totals.tickets)], ["Owed to organisers", kwacha(totals.gross)], ["ZedTix fees", kwacha(totals.fees)]].map(([k, v]) => (
          <div key={k} className="card p-4"><dt className="text-xs font-semibold uppercase text-zinc-500">{k}</dt><dd className="mt-1 text-2xl font-black">{v}</dd></div>
        ))}
      </dl>
      <div className="card mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr><th className="p-3">Event</th><th className="p-3">Organiser</th><th className="p-3">Tickets</th><th className="p-3">Payout due</th><th className="p-3">Fees</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-zinc-100">
                <td className="p-3"><Link className="font-semibold hover:underline" href={`/organiser/events/${r.id}`}>{r.title}</Link><br /><span className="text-zinc-500">{eventDate(r.starts_at)} · {r.status}</span></td>
                <td className="p-3">{r.organiser}<br /><span className="text-zinc-500">{displayPhone(r.organiser_phone)}</span></td>
                <td className="p-3">{r.tickets}</td>
                <td className="p-3 font-semibold">{kwacha(r.gross)}</td>
                <td className="p-3">{kwacha(r.fees)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
