import Link from "next/link";
import { currentUser } from "@/lib/auth";

export async function Header() {
  const user = await currentUser().catch(() => null);
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-night-950/95 text-white backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="text-xl font-black tracking-tight">
          Zed<span className="text-brand-500">Tix</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm font-semibold sm:gap-4">
          <Link href="/#events" className="hidden px-2 py-2 text-white/80 hover:text-white sm:block">
            Events
          </Link>
          {user ? (
            <Link href="/organiser" className="rounded-lg bg-white/10 px-3 py-2 hover:bg-white/15">
              My events
            </Link>
          ) : (
            <Link href="/organiser/register" className="rounded-lg bg-brand-600 px-3 py-2 hover:bg-brand-700">
              Sell tickets
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
