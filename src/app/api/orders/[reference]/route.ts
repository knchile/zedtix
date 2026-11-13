import { NextResponse } from "next/server";
import { syncOrder } from "@/lib/orders";

export async function GET(_req: Request, ctx: { params: Promise<{ reference: string }> }) {
  const { reference } = await ctx.params;
  if (!/^ZT[A-Z0-9]{10}$/.test(reference)) return NextResponse.json({ status: null }, { status: 400 });
  try {
    const status = await syncOrder(reference);
    return NextResponse.json({ status }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[orders] sync failed", err);
    return NextResponse.json({ status: "pending" }, { headers: { "Cache-Control": "no-store" } });
  }
}
