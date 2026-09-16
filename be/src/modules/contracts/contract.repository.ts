import { and, eq, isNull } from "drizzle-orm";
import type { CreateContractInput } from "../../shared/index.js";
import { contracts } from "../../core/db/schema/index.js";
import type { Tx } from "../../core/db/request-context.js";

export type ContractRow = typeof contracts.$inferSelect;

export const contractRepository = {
  async findMany(tx: Tx, filter: { branchId?: string; customerId?: string } = {}): Promise<ContractRow[]> {
    const conditions = [isNull(contracts.deletedAt)];
    if (filter.branchId) conditions.push(eq(contracts.branchId, filter.branchId));
    if (filter.customerId) conditions.push(eq(contracts.customerId, filter.customerId));
    return tx.select().from(contracts).where(and(...conditions));
  },

  async findById(tx: Tx, id: string): Promise<ContractRow | null> {
    const [row] = await tx
      .select()
      .from(contracts)
      .where(and(eq(contracts.id, id), isNull(contracts.deletedAt)))
      .limit(1);
    return row ?? null;
  },

  async create(
    tx: Tx,
    orgId: string,
    contractNo: string,
    input: CreateContractInput,
    actorId: string,
  ): Promise<ContractRow> {
    const [row] = await tx
      .insert(contracts)
      .values({
        orgId,
        branchId: input.branchId,
        contractNo,
        customerId: input.customerId,
        bookingId: input.bookingId,
        bedIds: input.bedIds,
        startDate: input.startDate,
        endDate: input.endDate,
        durationMonths: input.durationMonths,
        monthlyRent: BigInt(input.monthlyRent),
        depositAmount: BigInt(input.depositAmount),
        depositMonths: input.depositMonths,
        billingCycle: input.billingCycle,
        electricityPrice: input.electricityPrice ? BigInt(input.electricityPrice) : undefined,
        waterPrice: input.waterPrice ? BigInt(input.waterPrice) : undefined,
        termsSnapshot: input.termsSnapshot,
        specialTerms: input.specialTerms,
        status: "DRAFT",
        createdBy: actorId,
        updatedBy: actorId,
      })
      .returning();
    if (!row) throw new Error("contract insert returned no row");
    return row;
  },

  async updateStatus(
    tx: Tx,
    id: string,
    status: ContractRow["status"],
    extra: { terminatedAt?: Date; terminationReason?: string; terminationType?: string } = {},
  ): Promise<ContractRow | null> {
    const [row] = await tx
      .update(contracts)
      .set({ status, ...extra, updatedAt: new Date() })
      .where(eq(contracts.id, id))
      .returning();
    return row ?? null;
  },
};
