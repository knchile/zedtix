import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { Logo } from "./logo";

export async function Header() {
  const user = await currentUser().catch(() => null);
  return (
    <header className="sticky top-0 z-30 bg-night-900 text-white shadow-[0_1px_0_rgba(0,0,0,0.2)]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" aria-label="ZedTix home" className="shrink-0">
          <Logo className="h-7 w-auto sm:h-8" />
        </Link>
        <nav className="flex items-center gap-1 text-sm font-semibold sm:gap-2">
          <Link href="/#events" className="hidden rounded-md px-3 py-2 text-white/85 hover:bg-white/10 hover:text-white sm:block">
            Browse events
          </Link>
          {user ? (
            <Link href="/organiser" className="rounded-md px-3 py-2 text-white/85 hover:bg-white/10 hover:text-white">
              My events
            </Link>
          ) : (
            <Link href="/organiser/login" className="hidden rounded-md px-3 py-2 text-white/85 hover:bg-white/10 hover:text-white sm:block">
              Sign in
            </Link>
          )}
          <Link href={user ? "/organiser/events/new" : "/organiser/register"} className="rounded-md bg-sun-400 px-4 py-2 font-bold text-flag-black hover:bg-sun-300">
            Sell tickets
          </Link>
        </nav>
      </div>
      <div className="flag-rule" aria-hidden="true" />
    </header>
  );
}
