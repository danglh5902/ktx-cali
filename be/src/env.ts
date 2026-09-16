import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.string().default("info"),
  SUPABASE_URL: z.string().url(),
  SUPABASE_JWT_SECRET: z.string().min(1),
  /** Project Settings → API → "anon public" key — required as the `apikey` header for Supabase Auth REST calls (login/refresh/logout). Not secret, but keep out of client bundles anyway; the server is the one calling Supabase here. */
  SUPABASE_ANON_KEY: z.string().min(1),
  /** App runtime connection — must be a role WITHOUT BYPASSRLS (e.g. `ktx_app`), never `postgres`. */
  DATABASE_URL: z.string().min(1),
  /**
   * Connection used only by db:generate/db:migrate/db:apply-rls — the
   * `postgres` role (schema owner). Falls back to DATABASE_URL so local dev
   * with a single role still works, but that setup has NO real RLS
   * enforcement (see core/db/rls/README or docs/11 §2 D5) and must never be
   * used in production.
   */
  MIGRATE_DATABASE_URL: z.string().min(1).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration — check .env against .env.example");
}

export const env = {
  ...parsed.data,
  /** Always resolved — use this instead of the raw field when connecting for schema changes. */
  migrateDatabaseUrl: parsed.data.MIGRATE_DATABASE_URL ?? parsed.data.DATABASE_URL,
  /**
   * Origin only, path stripped — some `.env` files end up with a path suffix
   * (e.g. a copy-pasted `/rest/v1/` from the API settings page). Supabase
   * Auth (GoTrue) always lives at `<project-origin>/auth/v1/*`, regardless
   * of what path SUPABASE_URL happens to carry.
   */
  supabaseAuthUrl: `${new URL(parsed.data.SUPABASE_URL).origin}/auth/v1`,
};
