import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { q } from "@/lib/db";
import { eventDate } from "@/lib/format";
import { FEE_PERCENT } from "@/lib/config";
import { BuyForm, type TicketOption } from "./buy-form";

type Ev = {
  id: string;
  slug: string;
  title: string;
  description: string;
  venue: string;
  city: string;
  starts_at: string;
  image_url: string | null;
};

async function load(slug: string) {
  const ev = (await q<Ev>`
    SELECT id, slug, title, description, venue, city, starts_at, image_url
    FROM events WHERE slug = ${slug} AND status = 'published'`)[0];
  if (!ev) return null;
  const tickets = await q<TicketOption>`
    SELECT id, name, price, GREATEST(0, quantity - reserved)::int AS available
    FROM ticket_types WHERE event_id = ${ev.id} ORDER BY sort, price`;
  return { ev, tickets };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await load(slug).catch(() => null);
  if (!data) return { title: "Event not found" };
  const { ev } = data;
  const description = `${eventDate(ev.starts_at)} at ${ev.venue}, ${ev.city}. Buy tickets with mobile money on ZedTix.`;
  return {
    title: ev.title,
    description,
    alternates: { canonical: `/events/${ev.slug}` },
    openGraph: { title: ev.title, description, images: ev.image_url ? [ev.image_url] : undefined },
  };
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await params;
  const data = await load(slug);
  if (!data) notFound();
  const { ev, tickets } = data;
  const past = new Date(ev.starts_at).getTime() < Date.now() - 6 * 3600 * 1000;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: ev.title,
    startDate: new Date(ev.starts_at).toISOString(),
    location: { "@type": "Place", name: ev.venue, address: `${ev.venue}, ${ev.city}, Zambia` },
    image: ev.image_url ? [ev.image_url] : undefined,
    description: ev.description,
    offers: tickets.map((t) => ({
      "@type": "Offer",
      name: t.name,
      price: t.price,
      priceCurrency: "ZMW",
      availability: t.available > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
    })),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-night-900">
            {ev.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ev.image_url} alt={ev.title} className="max-h-[560px] w-full object-cover" />
            ) : (
              <div className="flex aspect-[16/9] items-center justify-center p-8 text-center text-4xl font-black text-white">
                {ev.title}
              </div>
            )}
          </div>
          <p className="mt-6 text-sm font-bold text-brand-600">{eventDate(ev.starts_at)}</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">{ev.title}</h1>
          <p className="mt-2 text-lg text-zinc-700">
            {ev.venue}, {ev.city}
          </p>
          {ev.description && (
            <div className="mt-6 whitespace-pre-line leading-relaxed text-zinc-700">{ev.description}</div>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5 sm:p-6">
            <h2 className="text-xl font-black">Get tickets</h2>
            {past ? (
              <p className="mt-3 text-zinc-600">This event has ended.</p>
            ) : tickets.length === 0 ? (
              <p className="mt-3 text-zinc-600">Tickets are not on sale yet.</p>
            ) : (
              <BuyForm eventId={ev.id} tickets={tickets} feePercent={FEE_PERCENT} />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
