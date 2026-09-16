import postgres from "postgres";
import { env } from "../../../env.js";
import { generateAllPolicySql } from "./policies.js";

/**
 * Applies (or re-applies, idempotently) every RLS policy. Run after
 * `pnpm db:migrate` whenever the schema or policies.ts changes:
 *   pnpm db:apply-rls
 */
async function main() {
  const sql = postgres(env.DATABASE_URL, { max: 1 });
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
