"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/** Checks payment status every few seconds and refreshes the page when it changes. */
export function StatusPoller({ reference }: { reference: string }) {
  const router = useRouter();
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    let stop = false;
    const started = Date.now();
    async function tick() {
      if (stop) return;
      try {
        const r = await fetch(`/api/orders/${reference}`, { cache: "no-store" });
        const { status } = (await r.json()) as { status?: string };
        if (status && status !== "pending") {
          router.refresh();
          return;
        }
      } catch {
        /* network blip: keep polling */
      }
      if (Date.now() - started > 60_000) setSlow(true);
      if (Date.now() - started < 16 * 60_000) setTimeout(tick, 4000);
    }
    const t = setTimeout(tick, 3000);
    return () => {
      stop = true;
      clearTimeout(t);
    };
  }, [reference, router]);

  return slow ? (
    <p className="mt-4 text-sm text-zinc-500">
      Still waiting. If you didn&apos;t get a prompt, dial your network&apos;s mobile money menu to check pending approvals.
    </p>
  ) : null;
}
