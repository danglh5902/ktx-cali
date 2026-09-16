import { bigint, timestamp, uuid } from "drizzle-orm/pg-core";

/** Standard UUID primary key, matches `id: uuid default gen_random_uuid()` in docs/12. */
export const id = () => uuid("id").primaryKey().defaultRandom();

/** VND amount column — bigint, never numeric/float. See docs/11 §4 and §2 D4. */
export const money = (name: string) => bigint(name, { mode: "bigint" });

/** `created_at/by`, `updated_at/by` audit columns present on every business table. */
export const auditColumns = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid("created_by"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid("updated_by"),
};

/** Soft-delete column — every query must filter `deletedAt IS NULL` (partial index). */
export const deletedAt = () => timestamp("deleted_at", { withTimezone: true });
