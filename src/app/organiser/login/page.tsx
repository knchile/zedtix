import type { Metadata } from "next";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Organiser login" };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-black tracking-tight">Organiser login</h1>
      <p className="mt-2 text-zinc-600">Manage your events, sales and door check-ins.</p>
      <AuthForm mode="login" next={next} />
    </div>
  );
}
