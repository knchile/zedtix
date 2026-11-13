"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { q } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { randomCode, slugify } from "@/lib/format";

export type EventFormState = { error?: string };

const schema = z.object({
  title: z.string().trim().min(3, "Give your event a title").max(120),
  description: z.string().trim().max(5000).default(""),
  venue: z.string().trim().min(2, "Enter the venue").max(120),
  city: z.string().trim().min(2, "Enter the town or city").max(60),
  startsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Choose the date and start time"),
  imageUrl: z.union([z.literal(""), z.url("The poster link must be a web address")]).default(""),
});

export async function createEvent(_p: EventFormState, form: FormData): Promise<EventFormState> {
  const user = await requireUser();
  const parsed = schema.safeParse({
    title: form.get("title"),
    description: form.get("description") ?? "",
    venue: form.get("venue"),
    city: form.get("city"),
    startsAt: form.get("startsAt"),
    imageUrl: form.get("imageUrl") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const d = parsed.data;

  // Times are entered in Zambian time (CAT, UTC+2, no daylight saving).
  const startsAt = new Date(`${d.startsAt}:00+02:00`);
  if (startsAt.getTime() < Date.now()) return { error: "The event date must be in the future." };

  const names = form.getAll("ticketName").map(String);
  const prices = form.getAll("ticketPrice").map(Number);
  const qtys = form.getAll("ticketQty").map(Number);
  const tickets = names
    .map((name, i) => ({ name: name.trim(), price: Math.round(prices[i]), quantity: Math.round(qtys[i]) }))
    .filter((t) => t.name);
  if (tickets.length === 0) return { error: "Add at least one ticket type, for example Ordinary or VIP." };
  for (const t of tickets) {
    if (!(t.price >= 1)) return { error: `Set a price for "${t.name}".` };
    if (!(t.quantity >= 1)) return { error: `Set how many "${t.name}" tickets are available.` };
  }

  const slug = `${slugify(d.title) || "event"}-${randomCode(4).toLowerCase()}`;
  const ev = (await q<{ id: string }>`
    INSERT INTO events (organiser_id, slug, title, description, venue, city, starts_at, image_url, status)
    VALUES (${user.id}, ${slug}, ${d.title}, ${d.description}, ${d.venue}, ${d.city}, ${startsAt.toISOString()},
            ${d.imageUrl || null}, ${form.get("publish") === "on" ? "published" : "draft"})
    RETURNING id`)[0];
  for (const [i, t] of tickets.entries()) {
    await q`INSERT INTO ticket_types (event_id, name, price, quantity, sort) VALUES (${ev.id}, ${t.name}, ${t.price}, ${t.quantity}, ${i})`;
  }
  revalidatePath("/");
  redirect(`/organiser/events/${ev.id}`);
}

async function ownEvent(eventId: string) {
  const user = await requireUser();
  const ev = (await q<{ id: string; organiser_id: string; slug: string }>`
    SELECT id, organiser_id, slug FROM events WHERE id = ${eventId}`)[0];
  if (!ev || (ev.organiser_id !== user.id && !user.isAdmin)) redirect("/organiser");
  return ev;
}

export async function setPublished(form: FormData) {
  const ev = await ownEvent(String(form.get("eventId")));
  const publish = form.get("publish") === "1";
  await q`UPDATE events SET status = ${publish ? "published" : "draft"} WHERE id = ${ev.id}`;
  revalidatePath(`/organiser/events/${ev.id}`);
  revalidatePath(`/events/${ev.slug}`);
  revalidatePath("/");
}

export async function addTickets(form: FormData) {
  const ev = await ownEvent(String(form.get("eventId")));
  const typeId = String(form.get("ticketTypeId"));
  const extra = Math.round(Number(form.get("extra")));
  if (!(extra >= 1 && extra <= 100000)) return;
  await q`UPDATE ticket_types SET quantity = quantity + ${extra} WHERE id = ${typeId} AND event_id = ${ev.id}`;
  revalidatePath(`/organiser/events/${ev.id}`);
}

export async function gateLookup(form: FormData) {
  const code = String(form.get("code") || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (code) redirect(`/t/${code}`);
}
