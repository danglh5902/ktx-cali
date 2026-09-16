import postgres from "postgres";
import { env } from "../../../env.js";
import { generateAllPolicySql } from "./policies.js";

/**
 * Applies (or re-applies, idempotently) every RLS policy. Run after
 * `pnpm db:migrate` whenever the schema or policies.ts changes:
 *   pnpm db:apply-rls
 */
async function main() {
  // ALTER TABLE ... ENABLE ROW LEVEL SECURITY / CREATE POLICY require the
  // table owner (or a superuser) — the app runtime role (DATABASE_URL) is
  // intentionally NOT the owner (see docs/11 §2 D5), so this must run as
  // the schema-owning `postgres` role instead.
  const sql = postgres(env.migrateDatabaseUrl, { max: 1 });
  const statements = generateAllPolicySql();

  console.log(`Applying ${statements.length} RLS statements...`);
  for (const statement of statements) {
    await sql.unsafe(statement);
  }
  console.log("RLS policies applied.");

  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
