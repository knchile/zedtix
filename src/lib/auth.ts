import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { q } from "./db";
import { adminEmails } from "./config";

const COOKIE = "zt_session";
const MAX_AGE = 60 * 60 * 24 * 30;

function key() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET must be set (32+ characters)");
  return new TextEncoder().encode(s);
}

export type User = { id: string; name: string; email: string; phone: string; isAdmin: boolean };

export async function startSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(key());
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function currentUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    if (!payload.sub) return null;
    const rows = await q<{ id: string; name: string; email: string; phone: string }>`
      SELECT id, name, email, phone FROM users WHERE id = ${payload.sub}`;
    const u = rows[0];
    if (!u) return null;
    return { ...u, isAdmin: adminEmails().includes(u.email.toLowerCase()) };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<User> {
  const u = await currentUser();
  if (!u) redirect("/organiser/login");
  return u;
}
