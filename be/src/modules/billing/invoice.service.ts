import type { RequestContext } from "../../shared/index.js";
import { withRequestContext } from "../../core/db/request-context.js";
import { writeAudit } from "../../core/audit/audit-log.js";
import { ConflictError, NotFoundError } from "../../core/errors/app-error.js";
import { invoiceRepository, type InvoiceLineRow, type InvoiceRow } from "./invoice.repository.js";

export const invoiceService = {
  async list(ctx: RequestContext, filter: { branchId?: string; customerId?: string; status?: string }): Promise<InvoiceRow[]> {
    return withRequestContext(ctx, (tx) => invoiceRepository.findMany(tx, filter));
  },

  async getById(ctx: RequestContext, id: string): Promise<{ invoice: InvoiceRow; lines: InvoiceLineRow[] }> {
    return withRequestContext(ctx, async (tx) => {
      const invoice = await invoiceRepository.findById(tx, id);
      if (!invoice) throw new NotFoundError("Invoice");
      const lines = await invoiceRepository.listLines(tx, id);
      return { invoice, lines };
    });
  },

  async issue(ctx: RequestContext, id: string): Promise<InvoiceRow> {
    return withRequestContext(ctx, async (tx) => {
      const before = await invoiceRepository.findById(tx, id);
      if (!before) throw new NotFoundError("Invoice");
      if (before.status !== "DRAFT") throw new ConflictError(`Hóa đơn đang ở trạng thái ${before.status}, không thể phát hành`);

      const after = await invoiceRepository.issue(tx, id, ctx.userId);
      if (!after) throw new NotFoundError("Invoice");

      await writeAudit(tx, {
        orgId: ctx.orgId,
        branchId: after.branchId,
        actorId: ctx.userId,
        actorName: ctx.userId,
        actorRole: ctx.scope,
        action: "invoice.issue",
        entity: "invoices",
        entityId: id,
        after: { status: "ISSUED", grandTotal: after.grandTotal.toString() },
      });

      return after;
    });
  },
};
