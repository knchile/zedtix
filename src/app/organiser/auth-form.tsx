"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, register, type FormState } from "./actions";

export function AuthForm({ mode, next }: { mode: "login" | "register"; next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(mode === "login" ? login : register, {});
  return (
    <form action={action} className="card mt-6 space-y-4 p-6">
      {mode === "register" && (
        <>
          <div>
            <label className="label" htmlFor="name">Your name or company</label>
            <input className="input" id="name" name="name" required autoComplete="organization" />
          </div>
          <div>
            <label className="label" htmlFor="phone">Mobile money number</label>
            <input className="input" id="phone" name="phone" required inputMode="tel" placeholder="097 123 4567" />
            <p className="mt-1 text-xs text-zinc-500">Your ticket money is paid out to this number.</p>
          </div>
        </>
      )}
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input className="input" id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input className="input" id="password" name="password" type="password" required minLength={mode === "register" ? 8 : 1}
          autoComplete={mode === "login" ? "current-password" : "new-password"} />
      </div>
      {next && <input type="hidden" name="next" value={next} />}
      {state.error && <p role="alert" className="alert-error">{state.error}</p>}
      <button className="btn-primary w-full" disabled={pending}>
        {pending ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
      </button>
      <p className="text-center text-sm text-zinc-600">
        {mode === "login" ? (
          <>New to ZedTix? <Link className="font-semibold text-brand-600" href="/organiser/register">Create an account</Link></>
        ) : (
          <>Already have an account? <Link className="font-semibold text-brand-600" href="/organiser/login">Log in</Link></>
        )}
      </p>
    </form>
  );
}
