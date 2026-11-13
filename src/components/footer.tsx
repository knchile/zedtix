import Link from "next/link";
import { site } from "@/lib/config";
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="mt-20 bg-night-950 text-sm text-white/70">
      <div className="flag-rule" aria-hidden="true" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Logo className="h-8 w-auto" />
          <p className="mt-4 max-w-xs leading-relaxed">{site.tagline} Airtel Money, MTN MoMo and Zamtel Kwacha accepted.</p>
        </div>
        <div className="space-y-2.5">
          <p className="eyebrow text-white">Organisers</p>
          <p><Link href="/organiser/register" className="hover:text-white">Sell tickets on ZedTix</Link></p>
          <p><Link href="/organiser/login" className="hover:text-white">Organiser sign in</Link></p>
        </div>
        <div className="space-y-2.5">
          <p className="eyebrow text-white">Help</p>
          <p>
            <a href={`https://wa.me/${site.supportWhatsApp}`} target="_blank" rel="noopener noreferrer" className="hover:text-white">
              WhatsApp support
            </a>
          </p>
          <p><a href={`mailto:${site.supportEmail}`} className="hover:text-white">{site.supportEmail}</a></p>
          <p><Link href="/privacy" className="hover:text-white">Privacy policy</Link></p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs">
          © {new Date().getFullYear()} ZedTix. Made in Zambia by{" "}
          <a href="https://ntangitech.com" className="text-white/90 underline-offset-2 hover:underline">Ntangi Technologies</a>.
        </p>
      </div>
    </footer>
  );
}
