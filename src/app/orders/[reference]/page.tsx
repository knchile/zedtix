import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { q } from "@/lib/db";
import { displayPhone, eventDate, kwacha } from "@/lib/format";
import { site } from "@/lib/config";
import { QR } from "@/components/qr";
import { StatusPoller } from "./status-poller";

export const metadata: Metadata = { title: "Your tickets", robots: { index: false } };

type Order = {
  id: string;
  reference: string;
  status: string;
  buyer_name: string;
  buyer_phone: string;
  total: number;
  provider_msg: string | null;
  title: string;
  slug: string;
  venue: string;
  city: string;
  starts_at: string;
};

export default async function OrderPage({ params }: { params: Promise<{ reference: string }> }) {
  await connection();
  const { reference } = await params;
  const order = (await q<Order>`
    SELECT o.id, o.reference, o.status, o.buyer_name, o.buyer_phone, o.total, o.provider_msg,
           e.title, e.slug, e.venue, e.city, e.starts_at
    FROM orders o JOIN events e ON e.id = o.event_id WHERE o.reference = ${reference}`)[0];
  if (!order) notFound();

  const tickets =
    order.status === "paid"
      ? await q<{ code: string; type: string; checked_in_at: string | null }>`
          SELECT k.code, t.name AS type, k.checked_in_at
          FROM tickets k JOIN ticket_types t ON t.id = k.ticket_type_id
          WHERE k.order_id = ${order.id} ORDER BY t.sort, k.created_at`
      : [];

  const pageUrl = `${site.url}/orders/${order.reference}`;

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:py-12">
      <p className="text-sm font-bold text-brand-600">{eventDate(order.starts_at)}</p>
      <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{order.title}</h1>
      <p className="mt-1 text-zinc-600">{order.venue}, {order.city}</p>

      {order.status === "pending" && (
        <div className="card mt-6 p-6 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-zinc-200 border-t-brand-600" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-black">Approve the payment on your phone</h2>
          <p className="mt-2 text-zinc-600">
            We&apos;ve sent a {kwacha(order.total)} mobile money prompt to <strong>{displayPhone(order.buyer_phone)}</strong>.
            Enter your PIN to approve it. Your tickets will appear here automatically.
          </p>
          <StatusPoller reference={order.reference} />
        </div>
      )}

      {(order.status === "failed" || order.status === "expired") && (
        <div className="card mt-6 p-6 text-center">
          <h2 className="text-xl font-black">Payment not completed</h2>
          <p className="mt-2 text-zinc-600">
            {order.provider_msg || "The payment was not approved in time."} No money was taken for these tickets.
          </p>
          <Link href={`/events/${order.slug}`} className="btn-primary mt-5">Try again</Link>
        </div>
      )}

      {order.status === "paid" && (
        <>
          <div className="mt-6 rounded-2xl bg-green-50 p-4 text-green-900">
            <p className="font-bold">Payment received. You&apos;re in, {order.buyer_name.split(" ")[0]}!</p>
            <p className="mt-1 text-sm">
              Show the QR code at the door. Save this page or send it to yourself on WhatsApp so you can find it later.
            </p>
            <a
              className="btn mt-3 bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
              href={`https://wa.me/?text=${encodeURIComponent(`My ZedTix tickets for ${order.title}: ${pageUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Send to my WhatsApp
            </a>
          </div>
          <ul className="mt-6 space-y-5">
            {tickets.map((t, i) => (
              <li key={t.code} className="overflow-hidden rounded-lg bg-white shadow-md ring-1 ring-zinc-200">
                <div className="flex items-center justify-between bg-night-900 px-5 py-3 text-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/brand/zedtix-logo-white.svg" alt="ZedTix" className="h-5 w-auto" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/70">Ticket {i + 1} of {tickets.length}</span>
                </div>
                <div className="flag-rule" aria-hidden="true" />
                <div className="px-5 pt-4">
                  <p className="eyebrow text-brand-700">{t.type}</p>
                  <p className="mt-1 font-display text-lg font-extrabold leading-snug">{order.title}</p>
                  <p className="text-sm text-zinc-600">{eventDate(order.starts_at)} · {order.venue}</p>
                </div>
                <div className="relative my-4 border-t-2 border-dashed border-zinc-200">
                  <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-page" aria-hidden="true" />
                  <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-page" aria-hidden="true" />
                </div>
                <div className="flex flex-col items-center px-5 pb-5">
                  <QR value={`${site.url}/t/${t.code}`} />
                  <p className="mt-3 font-mono text-xl font-bold tracking-[0.2em]">{t.code}</p>
                  {t.checked_in_at && <p className="mt-1 text-sm font-semibold text-red-700">Already used</p>}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="mt-8 text-center text-sm text-zinc-500">
        Order {order.reference} · Need help?{" "}
        <a className="font-semibold text-brand-600" href={`https://wa.me/${site.supportWhatsApp}?text=${encodeURIComponent(`Hi ZedTix, I need help with order ${order.reference}`)}`}>
          WhatsApp us
        </a>
      </p>
    </div>
  );
}
