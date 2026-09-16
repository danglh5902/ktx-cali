import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/core/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // drizzle-kit only reads DDL metadata (table list for `drizzle-kit pull`,
    // migration history table for `generate`) — use the schema-owning role,
    // same as db:migrate/db:apply-rls. See env.ts.
    url: process.env.MIGRATE_DATABASE_URL ?? process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
