import type { FastifyReply, FastifyRequest } from "fastify";
import { depositRefundRequestSchema } from "../../shared/index.js";
import { serializeVnd } from "../../core/money/index.js";
import type { DepositEntryRow } from "./deposit-ledger.repository.js";
import { depositService } from "./deposit.service.js";

function toDto(e: DepositEntryRow) {
  return {
    id: e.id,
    contractId: e.contractId,
    customerId: e.customerId,
    entryNo: e.entryNo,
    entryType: e.entryType,
    amount: serializeVnd(e.amount),
    balanceAfter: serializeVnd(e.balanceAfter),
    reason: e.reason,
    status: e.status,
    createdAt: e.createdAt,
  };
}

export const depositController = {
  async listByContract(request: FastifyRequest<{ Params: { contractId: string } }>) {
    const { entries, balance } = await depositService.listByContract(request.ctx, request.params.contractId);
    return { entries: entries.map(toDto), balance };
  },

  async listPendingRefunds(request: FastifyRequest<{ Querystring: { branchId?: string } }>) {
    const rows = await depositService.listPendingRefunds(request.ctx, request.query.branchId);
    return rows.map(toDto);
  },

  async requestRefund(request: FastifyRequest<{ Params: { contractId: string } }>, reply: FastifyReply) {
    const input = depositRefundRequestSchema.parse(request.body);
    const row = await depositService.requestRefund(request.ctx, request.params.contractId, input);
    reply.code(201);
    return toDto(row);
  },

  async approveRefund(request: FastifyRequest<{ Params: { id: string } }>) {
    const row = await depositService.approveRefund(request.ctx, request.params.id);
    return toDto(row);
  },

  async executeRefund(request: FastifyRequest<{ Params: { id: string } }>) {
    const row = await depositService.executeRefund(request.ctx, request.params.id);
    return toDto(row);
  },
};
