# ZedTix

Event ticketing for Zambia: mobile money checkout (Lipila), QR tickets, organiser dashboard and door check-in.
A Ntangi Technologies platform.

**Stack:** Next.js 16 (App Router) · Neon Postgres · Lipila collections API · Vercel (hosting + Blob for posters).

## How it works
1. Organiser registers, creates an event with ticket types, publishes it.
2. Buyer picks tickets, enters a mobile money number. Tickets are held for 15 minutes and a Lipila collection is started.
3. The order page polls `/api/orders/[ref]`, which confirms status with Lipila's check-status API. Lipila's callback hits `/api/lipila/callback`, which does the same check. A callback body is never trusted on its own.
4. On success the order is marked paid and one ticket per seat is issued. Each QR encodes `https://zedtix.com/t/CODE`.
5. Door staff log in as the organiser and scan QRs with the phone camera. The ticket page shows Valid / Already used plus a Check in button.

Buyers pay a booking fee (`FEE_PERCENT`, default 5%) on top of the ticket price. `/admin` (emails in `ADMIN_EMAILS`) shows payouts owed per event and fees earned.

## Setup
See `.env.example`. The database schema is applied automatically at build time by `scripts/migrate.mjs`.

## Next steps
- SMS ticket delivery
- Event editing (details and ticket types)
- Door-staff accounts separate from the organiser login
- Automated organiser payouts via Lipila disbursements
