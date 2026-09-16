import { sql } from "drizzle-orm";
import type { RequestContext } from "../../shared/index.js";
import { db } from "./client.js";
import { withTransientRetry } from "./transient-retry.js";

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Sets the Postgres session variables that every RLS policy reads
 * (`app.org_id`, `app.scope`, `app.allowed_branch_ids`) and runs `fn` inside
 * that same transaction, so every query issued by `fn` is automatically
 * scoped by the database — not just by application code.
 *
 * See docs/11-architecture.md §2 D5. Uses `set_config(..., true)` (the
 * parameterised equivalent of `SET LOCAL`) so context values are always bind
 * parameters, never string-interpolated into SQL.
 */
export async function withRequestContext<T>(
  ctx: RequestContext,
  fn: (tx: Tx) => Promise<T>,
): Promise<T> {
  return withTransientRetry(() =>
    db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.org_id', ${ctx.orgId}, true)`);
      await tx.execute(sql`SELECT set_config('app.scope', ${ctx.scope}, true)`);
      await tx.execute(
        sql`SELECT set_config('app.allowed_branch_ids', ${ctx.allowedBranchIds.join(",")}, true)`,
      );
      return fn(tx);
    }),
  );
}
