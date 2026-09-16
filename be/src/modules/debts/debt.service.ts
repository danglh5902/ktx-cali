import type { RequestContext } from "../../shared/index.js";
import { withRequestContext } from "../../core/db/request-context.js";
import { debtRepository } from "./debt.repository.js";

export interface DebtRow {
  customerId: string;
  customerCode: string;
  fullName: string;
  invoiceId: string;
  invoiceNo: string;
  dueDate: string | null;
  balance: string;
  agingBucket: "CURRENT" | "1_30" | "31_60" | "61_90" | "OVER_90";
}

function agingBucket(dueDate: string | null): DebtRow["agingBucket"] {
  if (!dueDate) return "CURRENT";
  const daysOverdue = Math.floor((Date.now() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24));
  if (daysOverdue <= 0) return "CURRENT";
  if (daysOverdue <= 30) return "1_30";
  if (daysOverdue <= 60) return "31_60";
  if (daysOverdue <= 90) return "61_90";
  return "OVER_90";
}

/** docs/09 §5.2: công nợ = hóa đơn ISSUED/PARTIAL/OVERDUE còn balance > 0, nhóm theo tuổi nợ — tính trực tiếp, không lưu bảng riêng. */
export const debtService = {
  async agingReport(ctx: RequestContext, branchId?: string): Promise<DebtRow[]> {
    return withRequestContext(ctx, async (tx) => {
      const rows = await debtRepository.listOutstanding(tx, branchId);
      return rows.map((r) => ({
        customerId: r.customerId,
        customerCode: r.customerCode,
        fullName: r.fullName,
        invoiceId: r.invoiceId,
        invoiceNo: r.invoiceNo,
        dueDate: r.dueDate,
        balance: r.balance.toString(),
        agingBucket: agingBucket(r.dueDate),
      }));
    });
  },
};
