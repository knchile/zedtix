import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { EventForm } from "./event-form";

export const metadata: Metadata = { title: "New event", robots: { index: false } };

export default async function NewEvent() {
  await requireUser();
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <h1 className="text-3xl font-black tracking-tight">Create your event</h1>
      <p className="mt-2 text-zinc-600">Takes about two minutes. You can save it as a draft and publish later.</p>
      <EventForm uploads={!!process.env.BLOB_READ_WRITE_TOKEN} />
    </div>
  );
}
