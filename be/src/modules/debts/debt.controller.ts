import type { FastifyRequest } from "fastify";
import { debtService } from "./debt.service.js";

export const debtController = {
  async agingReport(request: FastifyRequest<{ Querystring: { branchId?: string } }>) {
    return debtService.agingReport(request.ctx, request.query.branchId);
  },
};
