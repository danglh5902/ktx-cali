import type { CreatePaymentInput, RequestContext } from "../../shared/index.js";
import { withRequestContext } from "../../core/db/request-context.js";
import { generateSimpleNo } from "../../core/db/document-number.js";
import { writeAudit } from "../../core/audit/audit-log.js";
import { NotFoundError } from "../../core/errors/app-error.js";
import { invoiceRepository } from "../billing/invoice.repository.js";
import { paymentRepository, type PaymentRow } from "./payment.repository.js";

export const paymentService = {
  async list(ctx: RequestContext, filter: { customerId?: string; branchId?: string }): Promise<PaymentRow[]> {
    return withRequestContext(ctx, (tx) => paymentRepository.findMany(tx, filter));
  },

  async getById(ctx: RequestContext, id: string): Promise<{ payment: PaymentRow; allocations: Awaited<ReturnType<typeof paymentRepository.listAllocationsByPayment>> }> {
    return withRequestContext(ctx, async (tx) => {
      const payment = await paymentRepository.findById(tx, id);
      if (!payment) throw new NotFoundError("Payment");
      const allocations = await paymentRepository.listAllocationsByPayment(tx, payment.id);
      return { payment, allocations };
    });
  },

  /**
   * docs/09 §4: nhận tiền → tự động phân bổ FIFO vào các hóa đơn còn nợ của
   * khách theo hạn thanh toán cũ nhất trước. Idempotency key tránh ghi trùng
   * khi client gọi lại do timeout mạng.
   */
  async record(ctx: RequestContext, input: CreatePaymentInput): Promise<PaymentRow> {
    return withRequestContext(ctx, async (tx) => {
      if (input.idempotencyKey) {
        const existing = await paymentRepository.findByIdempotencyKey(tx, input.idempotencyKey);
        if (existing) return existing;
      }

      const paymentNo = await generateSimpleNo(tx, { docType: "PT" });
      const amount = BigInt(input.amount);
      const payment = await paymentRepository.create(tx, {
        orgId: ctx.orgId,
        branchId: input.branchId,
        paymentNo,
        customerId: input.customerId,
        payerName: input.payerName,
        amount,
        method: input.method,
        bankRef: input.bankRef,
        note: input.note,
        idempotencyKey: input.idempotencyKey,
        receivedBy: ctx.userId,
      });

      const outstandingInvoices = await invoiceRepository.findOutstandingByCustomer(tx, input.customerId);
      let remaining = amount;
      for (const invoice of outstandingInvoices) {
        if (remaining <= 0n) break;
        const applyAmount = remaining < invoice.balance ? remaining : invoice.balance;
        if (applyAmount <= 0n) continue;

        await paymentRepository.addAllocation(tx, {
          orgId: ctx.orgId,
          branchId: input.branchId,
          paymentId: payment.id,
          invoiceId: invoice.id,
          amount: applyAmount,
          allocatedBy: ctx.userId,
        });
        await invoiceRepository.applyPayment(tx, invoice.id, invoice.paidAmount + applyAmount, invoice.balance - applyAmount);

        remaining -= applyAmount;
      }

      const allocatedAmount = amount - remaining;
      await paymentRepository.updateAllocated(tx, payment.id, allocatedAmount, remaining);

      await writeAudit(tx, {
        orgId: ctx.orgId,
        branchId: input.branchId,
        actorId: ctx.userId,
        actorName: ctx.userId,
        actorRole: ctx.scope,
        action: "payment.create",
        entity: "payments",
        entityId: payment.id,
        after: { paymentNo, amount: amount.toString(), allocatedAmount: allocatedAmount.toString() },
      });

      return { ...payment, allocatedAmount, unallocatedAmount: remaining };
    });
  },
};
