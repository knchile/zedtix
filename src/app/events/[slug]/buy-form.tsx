"use client";

import { useActionState, useMemo, useState } from "react";
import { createOrder, type BuyState } from "./actions";

export type TicketOption = { id: string; name: string; price: number; available: number };

const MAX = 10;

export function BuyForm({ eventId, tickets, feePercent }: { eventId: string; tickets: TicketOption[]; feePercent: number }) {
  const [qty, setQty] = useState<Record<string, number>>({});
  const [state, action, pending] = useActionState<BuyState, FormData>(createOrder, {});

  const count = Object.values(qty).reduce((a, b) => a + b, 0);
  const subtotal = useMemo(
    () => tickets.reduce((sum, t) => sum + t.price * (qty[t.id] || 0), 0),
    [qty, tickets]
  );
  const fee = Math.ceil((subtotal * feePercent) / 100);

  function change(id: string, delta: number, available: number) {
    setQty((q) => {
      const cur = q[id] || 0;
      const next = Math.max(0, Math.min(available, cur + delta, MAX - (count - cur)));
      return { ...q, [id]: next };
    });
  }

  return (
    <form action={action} className="mt-4 space-y-5">
      <input type="hidden" name="eventId" value={eventId} />
      <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200">
        {tickets.map((t) => {
          const n = qty[t.id] || 0;
          const soldOut = t.available <= 0;
          return (
            <li key={t.id} className="flex items-center justify-between gap-3 p-3.5">
              <div>
                <p className="font-bold">{t.name}</p>
                <p className="text-sm text-zinc-600">
                  K{t.price.toLocaleString()} {soldOut ? <span className="font-semibold text-brand-600">· Sold out</span> : t.available <= 20 ? `· ${t.available} left` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" aria-label={`Fewer ${t.name}`} onClick={() => change(t.id, -1, t.available)} disabled={n === 0}
                  className="h-10 w-10 rounded-full border border-zinc-300 text-xl font-bold disabled:opacity-30">−</button>
                <span className="w-6 text-center text-lg font-bold tabular-nums">{n}</span>
                <button type="button" aria-label={`More ${t.name}`} onClick={() => change(t.id, 1, t.available)} disabled={soldOut || n >= t.available || count >= MAX}
                  className="h-10 w-10 rounded-full bg-night-900 text-xl font-bold text-white disabled:opacity-30">+</button>
              </div>
              <input type="hidden" name={`qty_${t.id}`} value={n} />
            </li>
          );
        })}
      </ul>

      {count > 0 && (
        <>
          <div className="space-y-3">
            <div>
              <label className="label" htmlFor="name">Your name</label>
              <input className="input" id="name" name="name" required autoComplete="name" />
            </div>
            <div>
              <label className="label" htmlFor="phone">Mobile money number</label>
              <input className="input" id="phone" name="phone" required inputMode="tel" autoComplete="tel" placeholder="097 123 4567" />
              <p className="mt-1 text-xs text-zinc-500">Airtel, MTN or Zamtel. You&apos;ll get a prompt on this phone to approve the payment.</p>
            </div>
            <div>
              <label className="label" htmlFor="email">Email (optional)</label>
              <input className="input" id="email" name="email" type="email" autoComplete="email" />
            </div>
          </div>

          <dl className="space-y-1 rounded-xl bg-zinc-50 p-4 text-sm">
            <div className="flex justify-between"><dt>Tickets ({count})</dt><dd>K{subtotal.toLocaleString()}</dd></div>
            <div className="flex justify-between"><dt>Booking fee</dt><dd>K{fee.toLocaleString()}</dd></div>
            <div className="flex justify-between border-t border-zinc-200 pt-2 text-base font-black"><dt>Total</dt><dd>K{(subtotal + fee).toLocaleString()}</dd></div>
          </dl>
        </>
      )}

      {state.error && <p role="alert" className="alert-error">{state.error}</p>}

      <button type="submit" className="btn-primary w-full" disabled={count === 0 || pending}>
        {pending ? "Sending payment prompt…" : count === 0 ? "Choose your tickets" : `Pay K${(subtotal + fee).toLocaleString()} with mobile money`}
      </button>
    </form>
  );
}
