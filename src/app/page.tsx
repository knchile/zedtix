import Link from "next/link";
import { connection } from "next/server";
import { q } from "@/lib/db";
import { EventCard, type EventSummary } from "@/components/event-card";
import { FEE_PERCENT } from "@/lib/config";

async function upcoming(): Promise<EventSummary[]> {
  try {
    return await q<EventSummary>`
      SELECT e.slug, e.title, e.venue, e.city, e.starts_at, e.image_url,
             MIN(t.price) AS min_price,
             COALESCE(BOOL_AND(t.reserved >= t.quantity), false) AS sold_out
      FROM events e LEFT JOIN ticket_types t ON t.event_id = e.id
      WHERE e.status = 'published' AND e.starts_at > now() - interval '6 hours'
      GROUP BY e.id ORDER BY e.starts_at ASC LIMIT 48`;
  } catch {
    return [];
  }
}

export default async function Home() {
  await connection();
  const events = await upcoming();

  return (
    <>
      <section className="bg-night-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-sun-300">Zambia&apos;s event tickets</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
            Get your ticket in a minute. Pay with mobile money.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/75">
            Airtel Money, MTN MoMo and Zamtel Kwacha. Your QR ticket arrives on your phone the moment you pay.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#events" className="btn-primary">Find an event</a>
            <Link href="/organiser/register" className="btn border border-white/25 text-white hover:bg-white/10">
              Sell tickets for your event
            </Link>
          </div>
        </div>
      </section>

      <section id="events" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12">
        <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Upcoming events</h2>
        {events.length === 0 ? (
          <div className="card mt-6 p-8 text-center">
            <p className="text-lg font-semibold">New events are on the way.</p>
            <p className="mt-2 text-zinc-600">Organising something? List it on ZedTix today, it&apos;s free to start.</p>
            <Link href="/organiser/register" className="btn-primary mt-5">List your event</Link>
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
        <div className="card grid gap-8 overflow-hidden p-6 sm:p-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-brand-600">For organisers</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">Sell out your next event on ZedTix.</h2>
            <p className="mt-3 text-zinc-600">
              Create your event in minutes, share the link on Facebook and WhatsApp, and let fans pay with mobile money.
              Scan QR tickets at the door with any phone. No more fake tickets or cash at the gate.
            </p>
            <Link href="/organiser/register" className="btn-primary mt-6">Create your event free</Link>
          </div>
          <ul className="grid gap-3 text-sm">
            {[
              ["Free to list", `No setup fee. Buyers pay a ${FEE_PERCENT}% booking fee.`],
              ["Mobile money checkout", "Airtel, MTN and Zamtel, straight from the buyer's phone."],
              ["QR tickets at the door", "Scan with your phone camera. Each ticket works once."],
              ["Live sales dashboard", "See every sale and every check-in as it happens."],
            ].map(([t, d]) => (
              <li key={t} className="rounded-xl bg-zinc-50 p-4">
                <p className="font-bold text-zinc-900">{t}</p>
                <p className="mt-0.5 text-zinc-600">{d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
