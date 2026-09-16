import { db } from "./client.js";
import type { Tx } from "./request-context.js";

/**
 * Plain Postgres transaction, no RLS session variables attached. Use this
 * for system-level jobs that run outside a user request (cron, migrations,
 * seeding). Business logic reached from an HTTP request should go through
 * `withRequestContext()` instead so RLS stays in effect. See docs/11 §2 D6.
 */
export async function withTransaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => fn(tx));
}
