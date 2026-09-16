import { sql } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { branchRepository } from "./branch.repository.js";

/**
 * Integration test for RLS branch scoping (docs/04-roles-permissions.md §5,
 * checks #1 and #5). Requires a reachable Postgres with RLS policies already
 * applied (`pnpm db:migrate && pnpm db:apply-rls`) — opt in explicitly so
 * `pnpm test` stays safe to run without a database configured:
 *
 *   RUN_DB_TESTS=1 pnpm test
 *
 * The whole test runs inside ONE transaction that is always rolled back
 * (never committed), so it never leaves data behind regardless of which
 * database DATABASE_URL points at.
 *
 * `core/db/client.ts` validates env vars at import time, so it's imported
 * dynamically (only once we know the test will actually run) rather than
 * statically — otherwise this file would crash test collection whenever
 * .env isn't configured, even though the suite is skipped.
 */
const runDbTests = process.env.RUN_DB_TESTS === "1";

describe.skipIf(!runDbTests)("branchRepository RLS scoping", () => {
  afterAll(async () => {
    const { closeDb } = await import("../../core/db/client.js");
    await closeDb();
  });

  it("only returns branches within the caller's allowed_branch_ids", async () => {
    const { db } = await import("../../core/db/client.js");
    const { organizations } = await import("../../core/db/schema/index.js");
    class Rollback extends Error {}

    await expect(
      db.transaction(async (tx) => {
        const [org] = await tx
          .insert(organizations)
          .values({ code: `TEST-${Date.now()}`, name: "Test Org" })
          .returning();
        if (!org) throw new Error("failed to seed organization");

        await tx.execute(sql`SELECT set_config('app.org_id', ${org.id}, true)`);
        await tx.execute(sql`SELECT set_config('app.scope', 'ALL', true)`);
        await tx.execute(sql`SELECT set_config('app.allowed_branch_ids', '', true)`);

        const branchA = await branchRepository.create(
          tx,
          org.id,
          { code: "A", name: "Branch A", address: { street: "1", province: "HCM" }, genderPolicy: "MIXED", billingDayOfMonth: 28, dueDayOfMonth: 10 },
          "00000000-0000-0000-0000-000000000000",
        );
        const branchB = await branchRepository.create(
          tx,
          org.id,
          { code: "B", name: "Branch B", address: { street: "2", province: "HCM" }, genderPolicy: "MIXED", billingDayOfMonth: 28, dueDayOfMonth: 10 },
          "00000000-0000-0000-0000-000000000000",
        );

        // Simulate a BRANCH-scoped caller who can only see Branch A.
        await tx.execute(sql`SELECT set_config('app.scope', 'BRANCH', true)`);
        await tx.execute(sql`SELECT set_config('app.allowed_branch_ids', ${branchA.id}, true)`);

        const visible = await branchRepository.findMany(tx);
        expect(visible.map((b) => b.id)).toEqual([branchA.id]);
        expect(visible.map((b) => b.id)).not.toContain(branchB.id);

        throw new Rollback("test complete — rolling back");
      }),
    ).rejects.toThrow(Rollback);
  });
});
