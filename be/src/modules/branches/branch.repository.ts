import { and, eq, isNull } from "drizzle-orm";
import type { CreateBranchInput, UpdateBranchInput } from "../../shared/index.js";
import { branches } from "../../core/db/schema/index.js";
import type { Tx } from "../../core/db/request-context.js";

/**
 * ★ The only file in this module allowed to import the Drizzle schema
 * directly (enforced by the `no-restricted-imports` ESLint rule in
 * .eslintrc.cjs) — see docs/11-architecture.md §2 D5.
 *
 * Every method takes an already-scoped `tx` (opened via
 * `withRequestContext()` by the caller) so RLS is always in effect; this
 * repository adds no scoping logic of its own beyond the soft-delete filter,
 * which RLS does not know about.
 */
export type BranchRow = typeof branches.$inferSelect;

export const branchRepository = {
  async findMany(tx: Tx): Promise<BranchRow[]> {
    return tx.select().from(branches).where(isNull(branches.deletedAt));
  },

  async findById(tx: Tx, id: string): Promise<BranchRow | null> {
    const [row] = await tx
      .select()
      .from(branches)
      .where(and(eq(branches.id, id), isNull(branches.deletedAt)))
      .limit(1);
    return row ?? null;
  },

  async findByCode(tx: Tx, orgId: string, code: string): Promise<BranchRow | null> {
    const [row] = await tx
      .select()
      .from(branches)
      .where(and(eq(branches.orgId, orgId), eq(branches.code, code), isNull(branches.deletedAt)))
      .limit(1);
    return row ?? null;
  },

  async create(tx: Tx, orgId: string, input: CreateBranchInput, actorId: string): Promise<BranchRow> {
    const [row] = await tx
      .insert(branches)
      .values({
        orgId,
        code: input.code,
        name: input.name,
        shortName: input.shortName,
        address: input.address,
        region: input.region,
        phone: input.phone,
        email: input.email,
        genderPolicy: input.genderPolicy,
        billingDayOfMonth: input.billingDayOfMonth,
        dueDayOfMonth: input.dueDayOfMonth,
        createdBy: actorId,
        updatedBy: actorId,
      })
      .returning();
    if (!row) throw new Error("branch insert returned no row");
    return row;
  },

  async update(tx: Tx, id: string, input: UpdateBranchInput, actorId: string): Promise<BranchRow | null> {
    const [row] = await tx
      .update(branches)
      .set({ ...input, updatedBy: actorId, updatedAt: new Date() })
      .where(and(eq(branches.id, id), isNull(branches.deletedAt)))
      .returning();
    return row ?? null;
  },

  async archive(tx: Tx, id: string, actorId: string): Promise<BranchRow | null> {
    const [row] = await tx
      .update(branches)
      .set({ status: "ARCHIVED", updatedBy: actorId, updatedAt: new Date() })
      .where(and(eq(branches.id, id), isNull(branches.deletedAt)))
      .returning();
    return row ?? null;
  },
};
