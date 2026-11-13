import type { MetadataRoute } from "next";
import { q } from "@/lib/db";
import { site } from "@/lib/config";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let events: { slug: string; created_at: string }[] = [];
  try {
    events = await q`SELECT slug, created_at FROM events WHERE status = 'published' AND starts_at > now() - interval '1 day'`;
  } catch {
    /* no database at build time */
  }
  return [
    { url: site.url, changeFrequency: "daily", priority: 1 },
    { url: `${site.url}/organiser/register`, changeFrequency: "monthly", priority: 0.6 },
    ...events.map((e) => ({ url: `${site.url}/events/${e.slug}`, lastModified: new Date(e.created_at), changeFrequency: "daily" as const, priority: 0.8 })),
  ];
}
