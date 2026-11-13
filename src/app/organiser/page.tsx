import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { eventDate, kwacha } from "@/lib/format";
import { logout } from "./actions";

export const metadata: Metadata = { title: "My events", robots: { index: false } };

type Row = { id: string; title: string; slug: string; status: string; starts_at: string; sold: number; revenue: number; capacity: number };

export default async function Dashboard() {
  const user = await requireUser();
  const events = await q<Row>`
    SELECT e.id, e.title, e.slug, e.status, e.starts_at,
      COALESCE((SELECT count(*) FROM tickets k WHERE k.event_id = e.id), 0)::int AS sold,
      COALESCE((SELECT sum(subtotal) FROM orders o WHERE o.event_id = e.id AND o.status = 'paid'), 0)::int AS revenue,
      COALESCE((SELECT sum(quantity) FROM ticket_types t WHERE t.event_id = e.id), 0)::int AS capacity
    FROM events e WHERE e.organiser_id = ${user.id} ORDER BY e.starts_at DESC`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-500">Hi {user.name}</p>
          <h1 className="text-3xl font-black tracking-tight">My events</h1>
        </div>
        <div className="flex gap-2">
          {user.isAdmin && <Link href="/admin" className="btn-ghost">Admin</Link>}
          <Link href="/organiser/events/new" className="btn-primary">+ New event</Link>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="card mt-8 p-8 text-center">
          <p className="text-lg font-semibold">You haven&apos;t created an event yet.</p>
          <Link href="/organiser/events/new" className="btn-primary mt-4">Create your first event</Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {events.map((e) => (
            <li key={e.id}>
              <Link href={`/organiser/events/${e.id}`} className="card flex flex-wrap items-center justify-between gap-4 p-5 hover:shadow-md">
                <div>
                  <p className="font-bold">{e.title}</p>
                  <p className="text-sm text-zinc-600">{eventDate(e.starts_at)}</p>
                </div>
                <div className="flex items-center gap-5 text-sm">
                  <span><strong>{e.sold}</strong>/{e.capacity} sold</span>
                  <span className="font-bold">{kwacha(e.revenue)}</span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${e.status === "published" ? "bg-green-100 text-green-800" : "bg-zinc-100 text-zinc-700"}`}>
                    {e.status === "published" ? "On sale" : "Draft"}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <form action={logout} className="mt-10">
        <button className="text-sm font-semibold text-zinc-500 hover:text-zinc-800">Log out</button>
      </form>
    </div>
  );
}
