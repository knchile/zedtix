import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { connection } from "next/server";
import { q } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { eventDate } from "@/lib/format";

export const metadata: Metadata = { title: "Ticket check", robots: { index: false } };

type T = {
  id: string;
  code: string;
  checked_in_at: string | null;
  type: string;
  title: string;
  starts_at: string;
  organiser_id: string;
  buyer_name: string;
};

async function load(code: string) {
  return (await q<T>`
    SELECT k.id, k.code, k.checked_in_at, t.name AS type, e.title, e.starts_at, e.organiser_id, o.buyer_name
    FROM tickets k
    JOIN ticket_types t ON t.id = k.ticket_type_id
    JOIN events e ON e.id = k.event_id
    JOIN orders o ON o.id = k.order_id
    WHERE k.code = ${code.toUpperCase()}`)[0];
}

async function checkIn(form: FormData) {
  "use server";
  const code = String(form.get("code") || "");
  const user = await currentUser();
  const t = await load(code);
  if (!user || !t || (t.organiser_id !== user.id && !user.isAdmin)) return;
  await q`UPDATE tickets SET checked_in_at = now() WHERE id = ${t.id} AND checked_in_at IS NULL`;
  revalidatePath(`/t/${t.code}`);
}

export default async function TicketCheck({ params }: { params: Promise<{ code: string }> }) {
  await connection();
  const { code } = await params;
  const [t, user] = await Promise.all([load(code), currentUser()]);
  const isStaff = !!t && !!user && (t.organiser_id === user.id || user.isAdmin);

  if (!t) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="rounded-2xl bg-red-600 p-8 text-white">
          <p className="text-5xl">✕</p>
          <h1 className="mt-3 text-2xl font-black">Not a valid ticket</h1>
          <p className="mt-2 text-white/85">Code {code.toUpperCase()} doesn&apos;t match any ZedTix ticket.</p>
        </div>
      </div>
    );
  }

  const used = !!t.checked_in_at;
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className={`rounded-2xl p-8 text-center text-white ${used ? "bg-amber-500" : "bg-green-600"}`}>
        <p className="text-5xl">{used ? "!" : "✓"}</p>
        <h1 className="mt-3 text-2xl font-black">{used ? "Already checked in" : "Valid ticket"}</h1>
        {used && <p className="mt-1 text-white/90">Used {eventDate(t.checked_in_at!)}</p>}
      </div>
      <div className="card mt-5 space-y-1 p-5">
        <p className="font-mono text-lg font-bold tracking-[0.2em]">{t.code}</p>
        <p className="font-bold">{t.type}</p>
        <p className="text-zinc-600">{t.title} · {eventDate(t.starts_at)}</p>
        {isStaff && <p className="text-zinc-600">Holder: {t.buyer_name}</p>}
      </div>
      {isStaff && !used && (
        <form action={checkIn} className="mt-5">
          <input type="hidden" name="code" value={t.code} />
          <button className="btn-primary w-full py-4 text-lg">Check in now</button>
        </form>
      )}
      {!isStaff && (
        <p className="mt-5 text-center text-sm text-zinc-500">Door staff: log in as the organiser to check tickets in.</p>
      )}
    </div>
  );
}
