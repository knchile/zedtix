import Link from "next/link";
import { site } from "@/lib/config";

export function Footer() {
  return (
    <footer className="mt-16 bg-night-950 text-sm text-white/70">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="text-lg font-black text-white">
            Zed<span className="text-brand-500">Tix</span>
          </p>
          <p className="mt-2">{site.tagline}</p>
        </div>
        <div className="space-y-2">
          <p className="font-semibold text-white">Organisers</p>
          <p><Link href="/organiser/register" className="hover:text-white">Sell tickets on ZedTix</Link></p>
          <p><Link href="/organiser/login" className="hover:text-white">Organiser login</Link></p>
        </div>
        <div className="space-y-2">
          <p className="font-semibold text-white">Help</p>
          <p>
            <a href={`https://wa.me/${site.supportWhatsApp}`} target="_blank" rel="noopener noreferrer" className="hover:text-white">
              WhatsApp support
            </a>
          </p>
          <p><a href={`mailto:${site.supportEmail}`} className="hover:text-white">{site.supportEmail}</a></p>
        </div>
      </div>
      <p className="border-t border-white/10 py-5 text-center text-xs">
        © {new Date().getFullYear()} ZedTix, a{" "}
        <a href="https://ntangitech.com" className="underline-offset-2 hover:underline">Ntangi Technologies</a> platform.
      </p>
    </footer>
  );
}
