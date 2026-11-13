import Link from "next/link";
import { eventDate, kwacha } from "@/lib/format";

export type EventSummary = {
  slug: string;
  title: string;
  venue: string;
  city: string;
  starts_at: string | Date;
  image_url: string | null;
  min_price: number | null;
  sold_out: boolean;
};

export function EventCard({ e }: { e: EventSummary }) {
  return (
    <Link href={`/events/${e.slug}`} className="card group flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-brand-600 to-night-900">
        {e.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={e.image_url} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center p-6 text-center text-2xl font-black text-white/90">
            {e.title}
          </span>
        )}
        {e.sold_out && (
          <span className="absolute left-3 top-3 rounded-full bg-night-950 px-3 py-1 text-xs font-bold text-white">Sold out</span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-sm font-semibold text-brand-600">{eventDate(e.starts_at)}</p>
        <h3 className="mt-1 text-lg font-bold leading-snug text-zinc-900">{e.title}</h3>
        <p className="mt-1 text-sm text-zinc-600">
          {e.venue}, {e.city}
        </p>
        <p className="mt-auto pt-3 text-sm font-bold text-zinc-900">
          {e.min_price != null ? `From ${kwacha(e.min_price)}` : "Tickets soon"}
        </p>
      </div>
    </Link>
  );
}
