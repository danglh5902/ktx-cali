import { and, eq } from "drizzle-orm";
import { depositLedger } from "../../core/db/schema/index.js";
import type { Tx } from "../../core/db/request-context.js";

export type DepositEntryRow = typeof depositLedger.$inferSelect;
export type DepositEntryType = DepositEntryRow["entryType"];

/**
 * Sổ cọc theo mô hình sổ cái (docs/09-module-billing.md §6, docs/11 §2 D3) —
 * mỗi thao tác một bút toán, KHÔNG sửa bản ghi cũ. `balanceAfter` tính từ
 * tổng các bút toán trước đó + amount hiện tại (dương = thu vào, âm = chi ra).
 */
export const depositLedgerRepository = {
  /** Chỉ cộng bút toán đã EXECUTED — PENDING/APPROVED là ý định, chưa phải tiền đã di chuyển thật. */
  async getBalance(tx: Tx, contractId: string): Promise<bigint> {
    const rows = await tx
      .select({ amount: depositLedger.amount })
      .from(depositLedger)
      .where(and(eq(depositLedger.contractId, contractId), eq(depositLedger.status, "EXECUTED")));
    return rows.reduce((sum, r) => sum + r.amount, 0n);
  },

  async listByContract(tx: Tx, contractId: string): Promise<DepositEntryRow[]> {
    return tx.select().from(depositLedger).where(eq(depositLedger.contractId, contractId)).orderBy(depositLedger.createdAt);
  },

  async listPendingRefunds(tx: Tx, branchId?: string): Promise<DepositEntryRow[]> {
    const conditions = [eq(depositLedger.entryType, "REFUND"), eq(depositLedger.status, "PENDING")];
    if (branchId) conditions.push(eq(depositLedger.branchId, branchId));
    return tx.select().from(depositLedger).where(and(...conditions));
  },

  async findById(tx: Tx, id: string): Promise<DepositEntryRow | null> {
    const [row] = await tx.select().from(depositLedger).where(eq(depositLedger.id, id)).limit(1);
    return row ?? null;
  },

  async addEntry(
    tx: Tx,
    entry: {
      orgId: string;
      branchId: string;
      contractId: string;
      customerId: string;
      entryNo: string;
      entryType: DepositEntryType;
      amount: bigint;
      reason?: string;
      status?: DepositEntryRow["status"];
      requestedBy?: string;
      approvedBy?: string;
      executedBy?: string;
      refundDueDate?: string;
    },
  ): Promise<DepositEntryRow> {
    const status = entry.status ?? "EXECUTED";
    const balanceBefore = await depositLedgerRepository.getBalance(tx, entry.contractId);
    // Chỉ bút toán EXECUTED mới thực sự đổi số dư; PENDING/APPROVED chỉ là ý
    // định, `balanceAfter` giữ nguyên cho tới khi được thực thi (xem updateStatus).
    const balanceAfter = status === "EXECUTED" ? balanceBefore + entry.amount : balanceBefore;
    const [row] = await tx
      .insert(depositLedger)
      .values({
        orgId: entry.orgId,
        branchId: entry.branchId,
        contractId: entry.contractId,
        customerId: entry.customerId,
        entryNo: entry.entryNo,
        entryType: entry.entryType,
        amount: entry.amount,
        balanceAfter,
        reason: entry.reason,
        status,
        requestedBy: entry.requestedBy,
        approvedBy: entry.approvedBy,
        approvedAt: entry.approvedBy ? new Date() : undefined,
        executedBy: entry.executedBy,
        executedAt: entry.executedBy ? new Date() : undefined,
        refundDueDate: entry.refundDueDate,
      })
      .returning();
    if (!row) throw new Error("deposit ledger insert returned no row");
    return row;
  },

  async updateStatus(
    tx: Tx,
    id: string,
    status: DepositEntryRow["status"],
    fields: { approvedBy?: string; executedBy?: string } = {},
  ): Promise<DepositEntryRow | null> {
    const entry = await depositLedgerRepository.findById(tx, id);
    if (!entry) return null;

    // Chuyển sang EXECUTED là lúc bút toán thật sự đổi số dư — tính lại
    // balanceAfter tại thời điểm thực thi, không phải lúc tạo yêu cầu.
    const balanceAfter =
      status === "EXECUTED" ? (await depositLedgerRepository.getBalance(tx, entry.contractId)) + entry.amount : undefined;

    const [row] = await tx
      .update(depositLedger)
      .set({
        status,
        balanceAfter,
        approvedBy: fields.approvedBy,
        approvedAt: fields.approvedBy ? new Date() : undefined,
        executedBy: fields.executedBy,
        executedAt: fields.executedBy ? new Date() : undefined,
      })
      .where(eq(depositLedger.id, id))
      .returning();
    return row ?? null;
  },
};
