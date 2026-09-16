import type { FastifyReply, FastifyRequest } from "fastify";
import { cashSessionCloseSchema, cashSessionOpenSchema } from "../../shared/index.js";
import { serializeVnd } from "../../core/money/index.js";
import type { CashSessionRow } from "./cash-session.repository.js";
import { cashSessionService } from "./cash-session.service.js";

function toDto(s: CashSessionRow) {
  return {
    id: s.id,
    branchId: s.branchId,
    sessionNo: s.sessionNo,
    staffId: s.staffId,
    openedAt: s.openedAt,
    openingBalance: serializeVnd(s.openingBalance),
    closedAt: s.closedAt,
    systemTotal: serializeVnd(s.systemTotal),
    countedTotal: serializeVnd(s.countedTotal),
    variance: serializeVnd(s.variance),
    varianceReason: s.varianceReason,
    status: s.status,
  };
}

export const cashSessionController = {
  async list(request: FastifyRequest<{ Querystring: { branchId?: string; status?: string } }>) {
    const rows = await cashSessionService.list(request.ctx, request.query);
    return rows.map(toDto);
  },

  async getById(request: FastifyRequest<{ Params: { id: string } }>) {
    const row = await cashSessionService.getById(request.ctx, request.params.id);
    return toDto(row);
  },

  async open(request: FastifyRequest, reply: FastifyReply) {
    const input = cashSessionOpenSchema.parse(request.body);
    const row = await cashSessionService.open(request.ctx, input);
    reply.code(201);
    return toDto(row);
  },

  async close(request: FastifyRequest<{ Params: { id: string } }>) {
    const input = cashSessionCloseSchema.parse(request.body);
    const row = await cashSessionService.close(request.ctx, request.params.id, input);
    return toDto(row);
  },
};
