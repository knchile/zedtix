// Creates the Ntangi Tech test event on the owner's account, once.
// Runs at build time after migrate.mjs; does nothing until the owner has registered.
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
const owner = (process.env.SEED_OWNER_EMAIL || "knchile@gmail.com").toLowerCase();
if (!url) process.exit(0);

const sql = neon(url);
const slug = "ntangi-tech-test-night";
try {
  const [user] = await sql`SELECT id FROM users WHERE email = ${owner}`;
  if (!user) {
    console.log(`[seed] ${owner} has not registered yet, skipping test event.`);
    process.exit(0);
  }
  const [exists] = await sql`SELECT id FROM events WHERE slug = ${slug}`;
  if (exists) {
    console.log("[seed] Test event already exists.");
    process.exit(0);
  }
  const [ev] = await sql`
    INSERT INTO events (organiser_id, slug, title, description, venue, city, starts_at, image_url, status)
    VALUES (${user.id}, ${slug}, 'Ntangi Tech Test Night',
      ${"A free test event by Ntangi Technologies to try ZedTix from start to finish: book a ticket, get your QR code, and check in at the door.\n\nFree Pass: no payment needed.\nSupporter (K5): tests a real mobile money payment."},
      'Ntangi Technologies', 'Lusaka', '2026-11-28T18:00:00+02:00', '/brand/zedtix-og.png', 'published')
    RETURNING id`;
  await sql`INSERT INTO ticket_types (event_id, name, price, quantity, sort) VALUES (${ev.id}, 'Free Pass', 0, 100, 0)`;
  await sql`INSERT INTO ticket_types (event_id, name, price, quantity, sort) VALUES (${ev.id}, 'Supporter', 5, 20, 1)`;
  console.log("[seed] Created Ntangi Tech Test Night.");
} catch (err) {
  console.error("[seed] skipped:", err.message);
}
