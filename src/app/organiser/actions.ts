"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { q } from "@/lib/db";
import { endSession, startSession } from "@/lib/auth";
import { normalisePhone } from "@/lib/format";

export type FormState = { error?: string };

const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name or company name").max(80),
  email: z.email("Enter a valid email").transform((e) => e.toLowerCase()),
  phone: z.string().trim(),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
});

export async function register(_p: FormState, form: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { name, email, password } = parsed.data;
  const phone = normalisePhone(parsed.data.phone);
  if (!phone) return { error: "Enter a valid Zambian mobile number. We use it to pay you out." };

  const exists = await q`SELECT 1 FROM users WHERE email = ${email}`;
  if (exists.length) return { error: "An account with this email already exists. Log in instead." };

  const hash = await bcrypt.hash(password, 10);
  const u = (await q<{ id: string }>`
    INSERT INTO users (name, email, phone, password_hash) VALUES (${name}, ${email}, ${phone}, ${hash}) RETURNING id`)[0];
  await startSession(u.id);
  redirect("/organiser/events/new");
}

export async function login(_p: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const u = (await q<{ id: string; password_hash: string }>`SELECT id, password_hash FROM users WHERE email = ${email}`)[0];
  const ok = u ? await bcrypt.compare(password, u.password_hash) : false;
  if (!u || !ok) return { error: "Wrong email or password." };
  await startSession(u.id);
  const next = String(form.get("next") || "");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/organiser");
}

export async function logout() {
  await endSession();
  redirect("/");
}
