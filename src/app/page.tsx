import Link from "next/link";
import { connection } from "next/server";
import { q } from "@/lib/db";
import { EventCard, type EventSummary } from "@/components/event-card";
import { FEE_PERCENT } from "@/lib/config";

async function upcoming(search: string): Promise<EventSummary[]> {
  const like = `%${search.replace(/[%_]/g, "")}%`;
  try {
    return await q<EventSummary>`
      SELECT e.slug, e.title, e.venue, e.city, e.starts_at, e.image_url,
             MIN(t.price) AS min_price,
             COALESCE(BOOL_AND(t.reserved >= t.quantity), false) AS sold_out
      FROM events e LEFT JOIN ticket_types t ON t.event_id = e.id
      WHERE e.status = 'published' AND e.starts_at > now() - interval '6 hours'
        AND (${search} = '' OR e.title ILIKE ${like} OR e.venue ILIKE ${like} OR e.city ILIKE ${like})
      GROUP BY e.id ORDER BY e.starts_at ASC LIMIT 48`;
  } catch {
    return [];
  }
}

const promises = [
  ["Mobile money checkout", "Airtel Money, MTN MoMo and Zamtel Kwacha"],
  ["Instant QR tickets", "On your phone the moment you pay"],
  ["Genuine tickets only", "Every ticket scans once at the door"],
];

export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await connection();
  const search = ((await searchParams).q ?? "").trim().slice(0, 60);
  const events = await upcoming(search);

  return (
    <>
      <section className="relative overflow-hidden bg-night-900 text-white">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-brand-600/25 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-12 sm:pb-16 sm:pt-16">
          <p className="eyebrow text-sun-300">Zambia&apos;s ticketing platform</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold italic leading-[1.02] tracking-tight sm:text-6xl">
            Live events across Zambia. Tickets in a minute.
          </h1>
          <form action="/#events" className="mt-8 flex max-w-2xl overflow-hidden rounded-md bg-white shadow-xl">
            <label htmlFor="q" className="sr-only">Search events</label>
            <input
              id="q"
              name="q"
              defaultValue={search}
              placeholder="Search by event, artist, venue or town"
              className="min-w-0 flex-1 px-4 py-4 text-base text-zinc-900 placeholder:text-zinc-500 focus:outline-none"
            />
            <button className="shrink-0 bg-brand-600 px-5 font-bold text-white hover:bg-brand-700 sm:px-8">Search</button>
          </form>
        </div>
        <div className="border-t border-white/10 bg-night-950/60">
          <ul className="mx-auto grid max-w-6xl gap-3 px-4 py-4 text-sm sm:grid-cols-3">
            {promises.map(([t, d]) => (
              <li key={t} className="flex items-baseline gap-2">
                <span className="h-2 w-2 shrink-0 translate-y-[-1px] rotate-45 bg-sun-400" aria-hidden="true" />
                <span><strong className="text-white">{t}.</strong> <span className="text-white/70">{d}</span></span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="events" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {search ? `Results for “${search}”` : "Upcoming events"}
          </h2>
          {search && <Link href="/#events" className="text-sm font-semibold text-brand-700 hover:underline">Clear search</Link>}
        </div>
        {events.length === 0 ? (
          <div className="card mt-6 px-6 py-12 text-center">
            <p className="text-lg font-bold">{search ? "No events match that search." : "New events are on the way."}</p>
            <p className="mx-auto mt-2 max-w-md text-zinc-600">Organising something? List it on ZedTix and start selling today. It&apos;s free to list.</p>
            <Link href="/organiser/register" className="btn-primary mt-6">List your event</Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => (
              <EventCard key={e.slug} e={e} />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4">
        <div className="relative overflow-hidden rounded-lg bg-night-900 text-white">
          <div className="grid gap-10 p-6 sm:p-10 lg:grid-cols-[1.1fr_1fr] lg:p-12">
            <div>
              <p className="eyebrow text-sun-300">For organisers</p>
              <h2 className="mt-3 text-3xl font-extrabold italic tracking-tight sm:text-4xl">Sell out your next event.</h2>
              <p className="mt-4 max-w-lg leading-relaxed text-white/80">
                Concerts, festivals, church events, conferences and parties. Set up in minutes, share on Facebook and WhatsApp,
                and scan tickets at the door with any phone. No cash at the gate, no fake tickets.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/organiser/register" className="btn-accent">Create your event</Link>
                <Link href="/organiser/login" className="btn border border-white/25 text-white hover:bg-white/10">Organiser sign in</Link>
              </div>
            </div>
            <dl className="grid content-start gap-px overflow-hidden rounded-md bg-white/10 sm:grid-cols-2">
              {[
                ["K0", "to list your event"],
                [`${FEE_PERCENT}%`, "booking fee, paid by the buyer"],
                ["100%", "of your ticket price to you"],
                ["Live", "sales and check-in dashboard"],
              ].map(([v, l]) => (
                <div key={l} className="bg-night-900 p-5">
                  <dt className="sr-only">{l}</dt>
                  <dd className="font-display text-3xl font-extrabold italic text-sun-400">{v}</dd>
                  <dd className="mt-1 text-sm text-white/75">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="flag-rule" aria-hidden="true" />
        </div>
      </section>
    </>
  );
}
