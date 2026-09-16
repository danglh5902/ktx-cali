/**
 * Supabase's Session Pooler (Supavisor) occasionally corrupts a bind
 * parameter on a query that follows another statement in the same
 * transaction — observed as `invalid input syntax for type uuid: ""` on an
 * otherwise-correct, non-empty parameter. Reproduced outside this app with a
 * minimal script (plain `postgres` + `drizzle`, no app code) — it happens
 * intermittently regardless of query shape, so it's pooler/network flakiness,
 * not a bug in a specific query. A whole-transaction retry is the correct
 * mitigation: the corruption is a one-off wire glitch, not a stable state, so
 * a clean retry on a fresh transaction succeeds.
 */
const TRANSIENT_PATTERNS = [/invalid input syntax for type uuid: ""/, /Connection terminated/, /connection reset/i];

function isTransient(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return TRANSIENT_PATTERNS.some((pattern) => pattern.test(message));
}

export async function withTransientRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isTransient(err) || attempt === attempts) throw err;
    }
  }
  throw lastErr;
}
