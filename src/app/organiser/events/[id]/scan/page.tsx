import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { q } from "@/lib/db";
import { Scanner } from "./scanner";

export const metadata: Metadata = { title: "Admit guests", robots: { index: false } };

export default async function ScanPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const ev = (await q<{ id: string; title: string; organiser_id: string }>`SELECT id, title, organiser_id FROM events WHERE id = ${id}`)[0];
  if (!ev || (ev.organiser_id !== user.id && !user.isAdmin)) notFound();
  const [c] = await q<{ admitted: number; sold: number }>`
    SELECT count(*) FILTER (WHERE checked_in_at IS NOT NULL)::int AS admitted, count(*)::int AS sold FROM tickets WHERE event_id = ${id}`;
  return <Scanner eventId={ev.id} title={ev.title} initialAdmitted={c.admitted} initialSold={c.sold} />;
}
