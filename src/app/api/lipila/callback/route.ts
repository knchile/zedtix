import { NextResponse } from "next/server";
import { syncOrder } from "@/lib/orders";

/**
 * Lipila payment callback. The body only tells us which order to look at;
 * the actual status is always confirmed with Lipila's check-status API.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { referenceId?: string };
  const ref = body.referenceId;
  if (ref && /^ZT[A-Z0-9]{10}$/.test(ref)) {
    try {
      await syncOrder(ref);
    } catch (err) {
      console.error("[lipila] callback sync failed", err);
    }
  }
  return NextResponse.json({ received: true });
}
