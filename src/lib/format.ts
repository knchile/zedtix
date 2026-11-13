export function kwacha(n: number) {
  return `K${n.toLocaleString("en-ZM")}`;
}

const tz = "Africa/Lusaka";

export function eventDate(d: Date | string) {
  return new Date(d).toLocaleString("en-GB", {
    timeZone: tz,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function shortDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-GB", { timeZone: tz, day: "numeric", month: "short" });
}

/** Normalise a Zambian mobile number to 260XXXXXXXXX, or null if invalid. */
export function normalisePhone(raw: string): string | null {
  const d = raw.replace(/\D/g, "");
  let n = d;
  if (n.startsWith("260")) n = n.slice(3);
  else if (n.startsWith("0")) n = n.slice(1);
  if (!/^(9[5-7]|7[5-7])\d{7}$/.test(n)) return null;
  return `260${n}`;
}

export function displayPhone(p: string) {
  const n = p.replace(/^260/, "0");
  return `${n.slice(0, 4)} ${n.slice(4, 7)} ${n.slice(7)}`;
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Random code from an unambiguous alphabet (no 0/O, 1/I/L). */
export function randomCode(len: number) {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}
