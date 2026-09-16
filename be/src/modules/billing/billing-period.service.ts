import type { CreateBillingPeriodInput, RequestContext } from "../../shared/index.js";
import { withRequestContext } from "../../core/db/request-context.js";
import { generateDocNo } from "../../core/db/document-number.js";
import { writeAudit } from "../../core/audit/audit-log.js";
import { ConflictError, NotFoundError } from "../../core/errors/app-error.js";
import { branchRepository } from "../branches/branch.repository.js";
import { contractRepository } from "../contracts/contract.repository.js";
import { billingPeriodRepository, type BillingPeriodRow } from "./billing-period.repository.js";
import { invoiceRepository } from "./invoice.repository.js";

export const billingPeriodService = {
  async list(ctx: RequestContext, branchId?: string): Promise<BillingPeriodRow[]> {
    return withRequestContext(ctx, (tx) => billingPeriodRepository.findMany(tx, { branchId }));
  },

  async getById(ctx: RequestContext, id: string): Promise<BillingPeriodRow> {
    const row = await withRequestContext(ctx, (tx) => billingPeriodRepository.findById(tx, id));
    if (!row) throw new NotFoundError("BillingPeriod");
    return row;
  },

  async create(ctx: RequestContext, input: CreateBillingPeriodInput): Promise<BillingPeriodRow> {
    return withRequestContext(ctx, async (tx) => {
      const period = await billingPeriodRepository.create(tx, ctx.orgId, input, ctx.userId);
      await writeAudit(tx, {
        orgId: ctx.orgId,
        branchId: input.branchId,
        actorId: ctx.userId,
        actorName: ctx.userId,
        actorRole: ctx.scope,
        action: "billing_period.create",
        entity: "billing_periods",
        entityId: period.id,
        after: { code: period.code, periodFrom: period.periodFrom, periodTo: period.periodTo },
      });
      return period;
    });
  },

  /**
   * MVP: sinh 1 hóa đơn/hợp đồng ACTIVE trong kỳ, đơn giá = tiền thuê tháng
   * trọn kỳ (không prorate theo ngày dở dang — docs/09 §2.2 nêu prorate đầy
   * đủ cho hợp đồng bắt đầu/kết thúc giữa kỳ, để lại cho vòng sau).
   */
  async generateInvoices(ctx: RequestContext, periodId: string): Promise<{ period: BillingPeriodRow; invoiceCount: number }> {
    return withRequestContext(ctx, async (tx) => {
      const period = await billingPeriodRepository.findById(tx, periodId);
      if (!period) throw new NotFoundError("BillingPeriod");
      if (period.status !== "OPEN") throw new ConflictError(`Kỳ đã ở trạng thái ${period.status}`);

      const branch = await branchRepository.findById(tx, period.branchId);
      if (!branch) throw new NotFoundError("Branch");

      const contracts = await contractRepository.findMany(tx, { branchId: period.branchId });
      const activeContracts = contracts.filter((c) => c.status === "ACTIVE");

      let totalAmount = 0n;
      let invoiceCount = 0;
      for (const contract of activeContracts) {
        const invoiceNo = await generateDocNo(tx, { docType: "INV", branchCode: branch.code });
        const grandTotal = contract.monthlyRent;
        await invoiceRepository.create(tx, {
          orgId: ctx.orgId,
          branchId: period.branchId,
          invoiceNo,
          contractId: contract.id,
          customerId: contract.customerId,
          billingPeriodId: period.id,
          periodFrom: period.periodFrom,
          periodTo: period.periodTo,
          dueDate: period.dueDate ?? undefined,
          subtotal: grandTotal,
          grandTotal,
          lines: [
            {
              lineType: "RENT",
              description: `Tiền phòng kỳ ${period.periodFrom} - ${period.periodTo}`,
              amount: grandTotal,
              unitPrice: contract.monthlyRent,
            },
          ],
        });
        totalAmount += grandTotal;
        invoiceCount += 1;
      }

      const updated = await billingPeriodRepository.markGenerated(tx, periodId, {
        invoiceCount,
        totalAmount,
        generatedBy: ctx.userId,
      });
      if (!updated) throw new NotFoundError("BillingPeriod");

      await writeAudit(tx, {
        orgId: ctx.orgId,
        branchId: period.branchId,
        actorId: ctx.userId,
        actorName: ctx.userId,
        actorRole: ctx.scope,
        action: "billing_period.generate_invoices",
        entity: "billing_periods",
        entityId: periodId,
        after: { invoiceCount, totalAmount: totalAmount.toString() },
      });

      return { period: updated, invoiceCount };
    });
  },

  async close(ctx: RequestContext, id: string): Promise<BillingPeriodRow> {
    return withRequestContext(ctx, async (tx) => {
      const row = await billingPeriodRepository.close(tx, id);
      if (!row) throw new NotFoundError("BillingPeriod");
      await writeAudit(tx, {
        orgId: ctx.orgId,
        branchId: row.branchId,
        actorId: ctx.userId,
        actorName: ctx.userId,
        actorRole: ctx.scope,
        action: "billing_period.close",
        entity: "billing_periods",
        entityId: id,
      });
      return row;
    });
  },
};
