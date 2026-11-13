// Runs before `next build`. Applies scripts/schema.sql (idempotent).
// Skips quietly when DATABASE_URL is not set, so builds without a DB still pass.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.log("[migrate] DATABASE_URL not set, skipping schema migration.");
  process.exit(0);
}

const here = dirname(fileURLToPath(import.meta.url));
const statements = readFileSync(join(here, "schema.sql"), "utf8")
  .split("\n")
  .filter((l) => !l.trim().startsWith("--"))
  .join("\n")
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

const sql = neon(url);
try {
  for (const s of statements) await sql.query(s);
  console.log(`[migrate] Schema is up to date (${statements.length} statements).`);
} catch (err) {
  console.error("[migrate] Failed:", err);
  process.exit(1);
}
