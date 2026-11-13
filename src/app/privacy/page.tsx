import type { Metadata } from "next";
import { site } from "@/lib/config";

export const metadata: Metadata = { title: "Privacy policy", alternates: { canonical: "/privacy" } };

export default function Privacy() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 leading-relaxed text-zinc-800">
      <h1 className="text-3xl font-extrabold tracking-tight">Privacy policy</h1>
      <p className="mt-2 text-sm text-zinc-500">Last updated 14 November 2026</p>
      <div className="mt-8 space-y-5">
        <p>
          ZedTix is run by Ntangi Technologies, Lusaka, Zambia. This page explains what information we collect when you
          buy a ticket, list an event or contact us, and how we use it.
        </p>
        <h2 className="pt-2 text-xl font-bold">What we collect</h2>
        <p>
          <strong>Ticket buyers:</strong> your name, mobile number and, if you give it, your email address, plus the
          tickets you bought. <strong>Organisers:</strong> your name or company name, email, mobile money number and the
          event details you enter. <strong>Enquiries:</strong> the details you send us through our website, WhatsApp or
          Facebook forms, such as your name, phone number and event information.
        </p>
        <h2 className="pt-2 text-xl font-bold">How we use it</h2>
        <p>
          To issue and check tickets, process mobile money payments through our payment provider (Lipila), pay organisers,
          set up events, and reply to your enquiry. Organisers see the name and phone number of people who bought tickets
          to their own event so they can manage entry. We do not sell your information.
        </p>
        <h2 className="pt-2 text-xl font-bold">Payments</h2>
        <p>
          Mobile money payments are handled by Lipila. We do not see or store your mobile money PIN.
        </p>
        <h2 className="pt-2 text-xl font-bold">Your choices</h2>
        <p>
          You can ask us to see, correct or delete your information at any time. Contact us on WhatsApp{" "}
          <span className="font-semibold">+{site.supportWhatsApp}</span> or email{" "}
          <span className="font-semibold">{site.supportEmail}</span>.
        </p>
      </div>
    </div>
  );
}
