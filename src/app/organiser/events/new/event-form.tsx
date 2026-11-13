"use client";

import { useActionState, useState } from "react";
import { createEvent, type EventFormState } from "../actions";

type Row = { key: number };

export function EventForm({ uploads }: { uploads: boolean }) {
  const [state, action, pending] = useActionState<EventFormState, FormData>(createEvent, {});
  const [rows, setRows] = useState<Row[]>([{ key: 0 }, { key: 1 }]);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  /** Shrink big phone photos to max 1600px JPEG so uploads are fast and under the size limit. */
  async function compress(file: File): Promise<Blob> {
    const webSafe = ["image/jpeg", "image/png", "image/webp"].includes(file.type);
    if (webSafe && file.size < 800 * 1024) return file;
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not read that image"))), "image/jpeg", 0.85)
    );
  }

  async function upload(file: File) {
    setUploadError("");
    if (!file.type.startsWith("image/")) {
      setUploadError("Choose an image file (JPG or PNG).");
      return;
    }
    setUploading(true);
    try {
      const blob = await compress(file);
      if (blob.size > 4 * 1024 * 1024) throw new Error("That image is too large. Try a smaller one.");
      const fd = new FormData();
      fd.append("file", blob, blob === file ? file.name : "poster.jpg");
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const j = (await r.json()) as { url?: string; error?: string };
      if (!r.ok || !j.url) throw new Error(j.error || "Upload failed");
      setImageUrl(j.url);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={action} className="mt-6 space-y-6">
      <section className="card space-y-4 p-5 sm:p-6">
        <div>
          <label className="label" htmlFor="title">Event name</label>
          <input className="input" id="title" name="title" required placeholder="e.g. Lusaka Jazz Night" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="venue">Venue</label>
            <input className="input" id="venue" name="venue" required placeholder="e.g. Mulungushi Conference Centre" />
          </div>
          <div>
            <label className="label" htmlFor="city">Town / city</label>
            <input className="input" id="city" name="city" required defaultValue="Lusaka" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="startsAt">Date and start time</label>
          <input className="input" id="startsAt" name="startsAt" type="datetime-local" required />
        </div>
        <div>
          <label className="label" htmlFor="description">About the event</label>
          <textarea className="input min-h-32" id="description" name="description" placeholder="Line-up, dress code, what's included…" />
        </div>
        <div>
          <span className="label">Event poster</span>
          {uploads ? (
            <>
              <label
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
                  imageUrl ? "border-green-400 bg-green-50" : "border-zinc-300 bg-zinc-50 hover:border-brand-500 hover:bg-brand-50"
                }`}
              >
                {imageUrl && !uploading ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt="Poster preview" className="max-h-72 rounded-lg shadow" />
                ) : (
                  <span className="text-4xl" aria-hidden="true">🖼️</span>
                )}
                <span className="font-bold text-zinc-900">
                  {uploading ? "Uploading…" : imageUrl ? "Change poster" : "Tap to upload your poster"}
                </span>
                <span className="text-sm text-zinc-500">JPG or PNG from your phone or computer</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={uploading}
                  onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
                />
              </label>
              <input type="hidden" name="imageUrl" value={imageUrl} />
            </>
          ) : (
            <>
              <input
                className="input"
                name="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Paste a link to the poster image"
              />
              {imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="Poster preview" className="mt-3 max-h-60 rounded-lg" />
              )}
            </>
          )}
          {uploadError && <p className="mt-2 text-sm font-semibold text-brand-700">{uploadError}</p>}
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="text-lg font-black">Tickets</h2>
        <p className="text-sm text-zinc-600">Price in kwacha. Buyers pay the booking fee on top.</p>
        <div className="mt-4 space-y-3">
          {rows.map((r, i) => (
            <div key={r.key} className="grid grid-cols-[1fr_6rem_6rem] gap-2">
              <input className="input" name="ticketName" placeholder={i === 0 ? "Ordinary" : i === 1 ? "VIP" : "Ticket name"} aria-label="Ticket name" />
              <input className="input" name="ticketPrice" type="number" min={1} inputMode="numeric" placeholder="K price" aria-label="Price in kwacha" />
              <input className="input" name="ticketQty" type="number" min={1} inputMode="numeric" placeholder="How many" aria-label="Number available" />
            </div>
          ))}
        </div>
        {rows.length < 8 && (
          <button type="button" className="mt-3 text-sm font-bold text-brand-600" onClick={() => setRows((rs) => [...rs, { key: Date.now() }])}>
            + Add another ticket type
          </button>
        )}
      </section>

      <label className="flex items-center gap-3 text-base font-semibold">
        <input type="checkbox" name="publish" defaultChecked className="h-5 w-5 accent-brand-600" />
        Put tickets on sale now
      </label>

      {state.error && <p role="alert" className="rounded-lg bg-brand-50 p-3 text-sm font-semibold text-brand-700">{state.error}</p>}
      <button className="btn-primary w-full" disabled={pending || uploading}>
        {pending ? "Creating…" : "Create event"}
      </button>
    </form>
  );
}
