import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { currentUser } from "@/lib/auth";
import { randomCode } from "@/lib/format";

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Please log in again." }, { status: 401 });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({ error: "Uploads are not set up yet. Paste a link instead." }, { status: 503 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file received." }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: "Use a JPG, PNG or WebP image." }, { status: 400 });
  if (file.size > 4 * 1024 * 1024) return NextResponse.json({ error: "Poster must be under 4 MB." }, { status: 400 });

  const blob = await put(`posters/${user.id}/${randomCode(12).toLowerCase()}.${ext}`, file, {
    access: "public",
    contentType: file.type,
  });
  return NextResponse.json({ url: blob.url });
}
