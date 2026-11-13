import Link from "next/link";
import { kwacha } from "@/lib/format";

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

const tz = "Africa/Lusaka";
const part = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleString("en-GB", { timeZone: tz, ...o });

export function EventCard({ e }: { e: EventSummary }) {
  const d = new Date(e.starts_at);
  return (
    <Link href={`/events/${e.slug}`} className="group flex flex-col overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-zinc-200 transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-sun-400">
      <div className="relative aspect-[16/10] overflow-hidden bg-night-900">
        {e.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={e.image_url} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" loading="lazy" />
        ) : (
          <div className="flex h-full items-end bg-[radial-gradient(circle_at_80%_20%,#157a00_0,transparent_55%)] p-5">
            <span className="font-display text-2xl font-extrabold italic leading-tight text-white">{e.title}</span>
          </div>
        )}
        {e.sold_out && (
          <span className="absolute left-3 top-3 rounded bg-flag-red px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">Sold out</span>
        )}
      </div>
      <div className="flex flex-1 gap-4 p-4">
        <div className="flex w-12 shrink-0 flex-col items-center rounded-md border border-zinc-200 py-1.5 text-center">
          <span className="text-[0.65rem] font-bold uppercase tracking-wider text-flag-red">{part(d, { month: "short" })}</span>
          <span className="font-display text-xl font-extrabold leading-none">{part(d, { day: "numeric" })}</span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-base font-bold leading-snug text-zinc-950 group-hover:text-brand-700">{e.title}</h3>
          <p className="mt-1 truncate text-sm text-zinc-600">
            {part(d, { weekday: "short", hour: "2-digit", minute: "2-digit" })} · {e.venue}, {e.city}
          </p>
          <p className="mt-2 text-sm font-semibold text-zinc-900">
            {e.sold_out ? "Sold out" : e.min_price != null ? `From ${kwacha(e.min_price)}` : "Tickets soon"}
          </p>
        </div>
      </div>
    </Link>
  );
}
