import type { DepositRefundRequestInput, RequestContext } from "../../shared/index.js";
import { withRequestContext } from "../../core/db/request-context.js";
import { generateSimpleNo } from "../../core/db/document-number.js";
import { writeAudit } from "../../core/audit/audit-log.js";
import { ConflictError, NotFoundError } from "../../core/errors/app-error.js";
import { contractRepository } from "../contracts/contract.repository.js";
import { depositLedgerRepository, type DepositEntryRow } from "./deposit-ledger.repository.js";

export const depositService = {
  async listByContract(ctx: RequestContext, contractId: string): Promise<{ entries: DepositEntryRow[]; balance: string }> {
    return withRequestContext(ctx, async (tx) => {
      const entries = await depositLedgerRepository.listByContract(tx, contractId);
      const balance = await depositLedgerRepository.getBalance(tx, contractId);
      return { entries, balance: balance.toString() };
    });
  },

  async listPendingRefunds(ctx: RequestContext, branchId?: string): Promise<DepositEntryRow[]> {
    return withRequestContext(ctx, (tx) => depositLedgerRepository.listPendingRefunds(tx, branchId));
  },

  /** docs/09 §6: khách check-out → nhân viên đề nghị hoàn cọc (PENDING), cần duyệt rồi mới chi thật. */
  async requestRefund(ctx: RequestContext, contractId: string, input: DepositRefundRequestInput): Promise<DepositEntryRow> {
    return withRequestContext(ctx, async (tx) => {
      const contract = await contractRepository.findById(tx, contractId);
      if (!contract) throw new NotFoundError("Contract");

      const balance = await depositLedgerRepository.getBalance(tx, contractId);
      const amount = BigInt(input.amount);
      if (amount > balance) throw new ConflictError(`Số tiền hoàn (${amount}) vượt quá số dư cọc hiện có (${balance})`);

      const entryNo = await generateSimpleNo(tx, { docType: "HC" });
      const entry = await depositLedgerRepository.addEntry(tx, {
        orgId: ctx.orgId,
        branchId: contract.branchId,
        contractId,
        customerId: contract.customerId,
        entryNo,
        entryType: "REFUND",
        amount: -amount,
        reason: input.reason,
        status: "PENDING",
        requestedBy: ctx.userId,
      });

      await writeAudit(tx, {
        orgId: ctx.orgId,
        branchId: contract.branchId,
        actorId: ctx.userId,
        actorName: ctx.userId,
        actorRole: ctx.scope,
        action: "deposit.refund_request",
        entity: "deposit_ledger",
        entityId: entry.id,
        reason: input.reason,
        after: { amount: amount.toString() },
      });

      return entry;
    });
  },

  async approveRefund(ctx: RequestContext, entryId: string): Promise<DepositEntryRow> {
    return withRequestContext(ctx, async (tx) => {
      const before = await depositLedgerRepository.findById(tx, entryId);
      if (!before) throw new NotFoundError("DepositEntry");
      if (before.status !== "PENDING") throw new ConflictError(`Bút toán đang ở trạng thái ${before.status}`);

      const after = await depositLedgerRepository.updateStatus(tx, entryId, "APPROVED", { approvedBy: ctx.userId });
      if (!after) throw new NotFoundError("DepositEntry");

      await writeAudit(tx, {
        orgId: ctx.orgId,
        branchId: before.branchId,
        actorId: ctx.userId,
        actorName: ctx.userId,
        actorRole: ctx.scope,
        action: "deposit.refund_approve",
        entity: "deposit_ledger",
        entityId: entryId,
        reason: "Duyệt yêu cầu hoàn cọc",
      });

      return after;
    });
  },

  async executeRefund(ctx: RequestContext, entryId: string): Promise<DepositEntryRow> {
    return withRequestContext(ctx, async (tx) => {
      const before = await depositLedgerRepository.findById(tx, entryId);
      if (!before) throw new NotFoundError("DepositEntry");
      if (before.status !== "APPROVED") throw new ConflictError(`Bút toán đang ở trạng thái ${before.status}, cần duyệt trước`);

      const after = await depositLedgerRepository.updateStatus(tx, entryId, "EXECUTED", { executedBy: ctx.userId });
      if (!after) throw new NotFoundError("DepositEntry");

      await writeAudit(tx, {
        orgId: ctx.orgId,
        branchId: before.branchId,
        actorId: ctx.userId,
        actorName: ctx.userId,
        actorRole: ctx.scope,
        action: "deposit.refund_execute",
        entity: "deposit_ledger",
        entityId: entryId,
        reason: "Đã chi tiền hoàn cọc",
      });

      return after;
    });
  },
};
