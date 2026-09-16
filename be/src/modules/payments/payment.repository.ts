import { and, eq, gte, sql } from "drizzle-orm";
import { paymentAllocations, payments } from "../../core/db/schema/index.js";
import type { Tx } from "../../core/db/request-context.js";

export type PaymentRow = typeof payments.$inferSelect;
export type PaymentAllocationRow = typeof paymentAllocations.$inferSelect;

export const paymentRepository = {
  async findMany(tx: Tx, filter: { customerId?: string; branchId?: string } = {}): Promise<PaymentRow[]> {
    const conditions = [];
    if (filter.customerId) conditions.push(eq(payments.customerId, filter.customerId));
    if (filter.branchId) conditions.push(eq(payments.branchId, filter.branchId));
    return tx.select().from(payments).where(conditions.length ? and(...conditions) : undefined);
  },

  async findById(tx: Tx, id: string): Promise<PaymentRow | null> {
    const [row] = await tx.select().from(payments).where(eq(payments.id, id)).limit(1);
    return row ?? null;
  },

  async findByIdempotencyKey(tx: Tx, key: string): Promise<PaymentRow | null> {
    const [row] = await tx.select().from(payments).where(eq(payments.idempotencyKey, key)).limit(1);
    return row ?? null;
  },

  async create(
    tx: Tx,
    entry: {
      orgId: string;
      branchId: string;
      paymentNo: string;
      customerId: string;
      payerName?: string;
      amount: bigint;
      method: string;
      bankRef?: string;
      note?: string;
      idempotencyKey?: string;
      receivedBy: string;
    },
  ): Promise<PaymentRow> {
    const [row] = await tx
      .insert(payments)
      .values({
        orgId: entry.orgId,
        branchId: entry.branchId,
        paymentNo: entry.paymentNo,
        customerId: entry.customerId,
        payerName: entry.payerName,
        amount: entry.amount,
        method: entry.method,
        bankRef: entry.bankRef,
        note: entry.note,
        idempotencyKey: entry.idempotencyKey,
        receivedBy: entry.receivedBy,
        allocatedAmount: 0n,
        unallocatedAmount: entry.amount,
        status: "RECONCILED",
      })
      .returning();
    if (!row) throw new Error("payment insert returned no row");
    return row;
  },

  async updateAllocated(tx: Tx, id: string, allocatedAmount: bigint, unallocatedAmount: bigint): Promise<void> {
    await tx.update(payments).set({ allocatedAmount, unallocatedAmount }).where(eq(payments.id, id));
  },

  async addAllocation(
    tx: Tx,
    entry: { orgId: string; branchId: string; paymentId: string; invoiceId: string; amount: bigint; allocatedBy: string },
  ): Promise<PaymentAllocationRow> {
    const [row] = await tx
      .insert(paymentAllocations)
      .values({
        orgId: entry.orgId,
        branchId: entry.branchId,
        paymentId: entry.paymentId,
        invoiceId: entry.invoiceId,
        amount: entry.amount,
        allocatedBy: entry.allocatedBy,
      })
      .returning();
    if (!row) throw new Error("payment allocation insert returned no row");
    return row;
  },

  async listAllocationsByPayment(tx: Tx, paymentId: string): Promise<PaymentAllocationRow[]> {
    return tx.select().from(paymentAllocations).where(eq(paymentAllocations.paymentId, paymentId));
  },

  /** Dùng khi đóng ca quỹ tiền mặt — tổng tiền mặt hệ thống ghi nhận từ lúc mở ca. */
  async sumCashSince(tx: Tx, branchId: string, since: Date): Promise<bigint> {
    const [row] = await tx
      .select({ total: sql<string>`coalesce(sum(${payments.amount}), 0)` })
      .from(payments)
      .where(and(eq(payments.branchId, branchId), eq(payments.method, "CASH"), gte(payments.receivedAt, since)));
    return BigInt(row?.total ?? "0");
  },
};
