export const site = {
  name: "ZedTix",
  url: (process.env.SITE_URL || "https://zedtix.com").replace(/\/$/, ""),
  tagline: "Tickets for Zambian events, paid with mobile money.",
  supportWhatsApp: process.env.SUPPORT_WHATSAPP || "260974403007",
  supportEmail: "sales@ntangitech.com",
};

/** Booking fee added to the buyer's total, as a percentage of the ticket subtotal. */
export const FEE_PERCENT = Number(process.env.FEE_PERCENT ?? 5);

/** How long unpaid orders hold tickets before they are released. */
export const HOLD_MINUTES = 15;

/** Max tickets per order. */
export const MAX_PER_ORDER = 10;

export function bookingFee(subtotal: number) {
  return Math.ceil((subtotal * FEE_PERCENT) / 100);
}

export function adminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}
