import "server-only";
import { neon } from "@neondatabase/serverless";

let client: ReturnType<typeof neon> | null = null;

/** Tagged-template SQL client. Each call is one HTTP round trip to Neon. */
export function db() {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    client = neon(url);
  }
  return client;
}

export type Row = Record<string, unknown>;

/** Run a query and return typed rows. */
export async function q<T = Row>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]> {
  return (await db()(strings, ...values)) as T[];
}
