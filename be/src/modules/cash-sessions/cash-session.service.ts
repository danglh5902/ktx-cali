import type { CashSessionCloseInput, CashSessionOpenInput, RequestContext } from "../../shared/index.js";
import { withRequestContext } from "../../core/db/request-context.js";
import { generateSimpleNo } from "../../core/db/document-number.js";
import { writeAudit } from "../../core/audit/audit-log.js";
import { ConflictError, NotFoundError } from "../../core/errors/app-error.js";
import { paymentRepository } from "../payments/payment.repository.js";
import { cashSessionRepository, type CashSessionRow } from "./cash-session.repository.js";

export const cashSessionService = {
  async list(ctx: RequestContext, filter: { branchId?: string; status?: string }): Promise<CashSessionRow[]> {
    return withRequestContext(ctx, (tx) => cashSessionRepository.findMany(tx, filter));
  },

  async getById(ctx: RequestContext, id: string): Promise<CashSessionRow> {
    const row = await withRequestContext(ctx, (tx) => cashSessionRepository.findById(tx, id));
    if (!row) throw new NotFoundError("CashSession");
    return row;
  },

  async open(ctx: RequestContext, input: CashSessionOpenInput): Promise<CashSessionRow> {
    return withRequestContext(ctx, async (tx) => {
      const existing = await cashSessionRepository.findOpenByStaff(tx, ctx.userId);
      if (existing) throw new ConflictError("Bạn đang có ca quỹ chưa đóng, hãy đóng ca hiện tại trước");

      const sessionNo = await generateSimpleNo(tx, { docType: "CA" });
      const session = await cashSessionRepository.create(tx, {
        orgId: ctx.orgId,
        branchId: input.branchId,
        sessionNo,
        staffId: ctx.userId,
        openingBalance: BigInt(input.openingBalance),
      });

      await writeAudit(tx, {
        orgId: ctx.orgId,
        branchId: input.branchId,
        actorId: ctx.userId,
        actorName: ctx.userId,
        actorRole: ctx.scope,
        action: "cash_session.open",
        entity: "cash_sessions",
        entityId: session.id,
        after: { sessionNo, openingBalance: session.openingBalance.toString() },
      });

      return session;
    });
  },

  /** docs/09 §7: đóng ca — đối chiếu tiền mặt kiểm đếm thực tế với hệ thống, ghi nhận lệch (nếu có). */
  async close(ctx: RequestContext, id: string, input: CashSessionCloseInput): Promise<CashSessionRow> {
    return withRequestContext(ctx, async (tx) => {
      const before = await cashSessionRepository.findById(tx, id);
      if (!before) throw new NotFoundError("CashSession");
      if (before.status !== "OPEN") throw new ConflictError(`Ca đang ở trạng thái ${before.status}`);

      const cashReceived = await paymentRepository.sumCashSince(tx, before.branchId, before.openedAt);
      const systemTotal = before.openingBalance + cashReceived;
      const countedTotal = BigInt(input.countedTotal);
      const variance = countedTotal - systemTotal;

      if (variance !== 0n && !input.varianceReason) {
        throw new ConflictError("Có chênh lệch quỹ — bắt buộc nhập lý do (varianceReason)");
      }

      const after = await cashSessionRepository.close(tx, id, {
        systemTotal,
        countedTotal,
        variance,
        varianceReason: input.varianceReason,
        handoverNote: input.handoverNote,
      });
      if (!after) throw new NotFoundError("CashSession");

      await writeAudit(tx, {
        orgId: ctx.orgId,
        branchId: before.branchId,
        actorId: ctx.userId,
        actorName: ctx.userId,
        actorRole: ctx.scope,
        action: variance !== 0n ? "cash_session.close_with_variance" : "cash_session.close",
        entity: "cash_sessions",
        entityId: id,
        reason: input.varianceReason,
        after: { systemTotal: systemTotal.toString(), countedTotal: countedTotal.toString(), variance: variance.toString() },
      });

      return after;
    });
  },
};
