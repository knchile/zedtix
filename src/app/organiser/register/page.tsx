import type { Metadata } from "next";
import { FEE_PERCENT } from "@/lib/config";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = {
  title: "Sell tickets for your event",
  description: "List your event on ZedTix free. Fans pay with Airtel Money, MTN MoMo or Zamtel Kwacha and get QR tickets instantly.",
};

export default function Register() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-black tracking-tight">Sell tickets on ZedTix</h1>
      <p className="mt-2 text-zinc-600">
        Free to list. Buyers pay a {FEE_PERCENT}% booking fee and you receive your full ticket price.
      </p>
      <AuthForm mode="register" />
    </div>
  );
}
