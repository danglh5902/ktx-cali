import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../../env.js";
import * as schema from "./schema/index.js";

/**
 * A single session-mode connection pool. `SET LOCAL app.*` (used by
 * request-context.ts for RLS) only lasts for the current transaction on the
 * current connection, so this MUST be the Postgres session pooler / direct
 * connection — never the transaction pooler (pgbouncer transaction mode)
 * which hands out a different backend connection per statement.
 *
 * `prepare: false` is required behind Supabase's pooler (Supavisor/PgBouncer):
 * it can transparently rotate the physical backend under a logical
 * connection, so postgres.js's server-side prepared-statement cache goes
 * stale and a later query on the same client can silently reuse a *previous*
 * query's bind parameters (observed as `invalid input syntax for type uuid:
 * ""` on unrelated routes after the first request). Disabling prepare makes
 * every query a plain unnamed statement — immune to that rotation.
 */
const queryClient = postgres(env.DATABASE_URL, { max: 10, prepare: false });

export const db = drizzle(queryClient, { schema });
export type Database = typeof db;

export async function closeDb(): Promise<void> {
  await queryClient.end({ timeout: 5 });
}
