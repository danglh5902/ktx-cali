import type { FastifyReply, FastifyRequest } from "fastify";
import { createPaymentSchema } from "../../shared/index.js";
import { serializeVnd } from "../../core/money/index.js";
import type { PaymentAllocationRow, PaymentRow } from "./payment.repository.js";
import { paymentService } from "./payment.service.js";

function toDto(p: PaymentRow, allocations?: PaymentAllocationRow[]) {
  return {
    id: p.id,
    branchId: p.branchId,
    paymentNo: p.paymentNo,
    customerId: p.customerId,
    payerName: p.payerName,
    amount: serializeVnd(p.amount),
    method: p.method,
    bankRef: p.bankRef,
    allocatedAmount: serializeVnd(p.allocatedAmount),
    unallocatedAmount: serializeVnd(p.unallocatedAmount),
    status: p.status,
    receivedAt: p.receivedAt,
    allocations: allocations?.map((a) => ({ invoiceId: a.invoiceId, amount: serializeVnd(a.amount) })),
  };
}

export const paymentController = {
  async list(request: FastifyRequest<{ Querystring: { customerId?: string; branchId?: string } }>) {
    const rows = await paymentService.list(request.ctx, request.query);
    return rows.map((r) => toDto(r));
  },

  async getById(request: FastifyRequest<{ Params: { id: string } }>) {
    const { payment, allocations } = await paymentService.getById(request.ctx, request.params.id);
    return toDto(payment, allocations);
  },

  async record(request: FastifyRequest, reply: FastifyReply) {
    const input = createPaymentSchema.parse(request.body);
    const row = await paymentService.record(request.ctx, input);
    reply.code(201);
    return toDto(row);
  },
};
