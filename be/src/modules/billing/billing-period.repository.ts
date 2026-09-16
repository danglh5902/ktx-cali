import { and, eq } from "drizzle-orm";
import type { CreateBillingPeriodInput } from "../../shared/index.js";
import { billingPeriods } from "../../core/db/schema/index.js";
import type { Tx } from "../../core/db/request-context.js";

export type BillingPeriodRow = typeof billingPeriods.$inferSelect;

export const billingPeriodRepository = {
  async findMany(tx: Tx, filter: { branchId?: string } = {}): Promise<BillingPeriodRow[]> {
    const conditions = filter.branchId ? [eq(billingPeriods.branchId, filter.branchId)] : [];
    return tx.select().from(billingPeriods).where(conditions.length ? and(...conditions) : undefined);
  },

  async findById(tx: Tx, id: string): Promise<BillingPeriodRow | null> {
    const [row] = await tx.select().from(billingPeriods).where(eq(billingPeriods.id, id)).limit(1);
    return row ?? null;
  },

  async create(tx: Tx, orgId: string, input: CreateBillingPeriodInput, actorId: string): Promise<BillingPeriodRow> {
    const [row] = await tx
      .insert(billingPeriods)
      .values({
        orgId,
        branchId: input.branchId,
        code: input.code,
        periodFrom: input.periodFrom,
        periodTo: input.periodTo,
        dueDate: input.dueDate,
        status: "OPEN",
        generatedBy: actorId,
      })
      .returning();
    if (!row) throw new Error("billing period insert returned no row");
    return row;
  },

  async markGenerated(
    tx: Tx,
    id: string,
    fields: { invoiceCount: number; totalAmount: bigint; generatedBy: string },
  ): Promise<BillingPeriodRow | null> {
    const [row] = await tx
      .update(billingPeriods)
      .set({
        status: "ISSUED",
        invoiceCount: fields.invoiceCount,
        totalAmount: fields.totalAmount,
        generatedAt: new Date(),
        generatedBy: fields.generatedBy,
        issuedAt: new Date(),
        issuedBy: fields.generatedBy,
      })
      .where(eq(billingPeriods.id, id))
      .returning();
    return row ?? null;
  },

  async close(tx: Tx, id: string): Promise<BillingPeriodRow | null> {
    const [row] = await tx
      .update(billingPeriods)
      .set({ status: "CLOSED", closedAt: new Date() })
      .where(eq(billingPeriods.id, id))
      .returning();
    return row ?? null;
  },
};
