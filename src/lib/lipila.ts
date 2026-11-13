import "server-only";

/**
 * Lipila (Hobbiton) mobile money collections.
 * Production: https://blz.lipila.io   Sandbox: https://api.lipila.dev
 * Auth: x-api-key header. Amounts are whole kwacha.
 */
const BASE = (process.env.LIPILA_BASE_URL || "https://blz.lipila.io").replace(/\/$/, "");

function apiKey() {
  const k = process.env.LIPILA_API_KEY;
  if (!k) throw new Error("LIPILA_API_KEY is not set");
  return k;
}

export type LipilaStatus = "Pending" | "Successful" | "Failed" | string;

export type LipilaResult = {
  referenceId?: string;
  status?: LipilaStatus;
  message?: string;
  externalId?: string | null;
  identifier?: string | null;
  amount?: number;
};

export async function collect(input: {
  referenceId: string;
  amount: number;
  phone: string; // 260XXXXXXXXX
  narration: string;
  email?: string | null;
  callbackUrl: string;
}): Promise<{ ok: boolean; data: LipilaResult; httpStatus: number }> {
  const res = await fetch(`${BASE}/api/v1/collections/mobile-money`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
      "x-api-key": apiKey(),
      callbackUrl: input.callbackUrl,
    },
    body: JSON.stringify({
      referenceId: input.referenceId,
      amount: input.amount,
      narration: input.narration.slice(0, 100),
      accountNumber: input.phone,
      currency: "ZMW",
      ...(input.email ? { email: input.email } : {}),
    }),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as LipilaResult;
  return { ok: res.ok, data, httpStatus: res.status };
}

export async function checkStatus(referenceId: string): Promise<LipilaResult | null> {
  const url = `${BASE}/api/v1/collections/check-status?referenceId=${encodeURIComponent(referenceId)}`;
  const res = await fetch(url, {
    headers: { accept: "application/json", "x-api-key": apiKey() },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json().catch(() => null)) as LipilaResult | null;
}

export function isSuccess(s?: string) {
  return !!s && /^success/i.test(s);
}

export function isFailure(s?: string) {
  return !!s && /^(fail|reject|cancel|declin|expire|error)/i.test(s);
}
