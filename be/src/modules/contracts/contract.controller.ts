import type { FastifyReply, FastifyRequest } from "fastify";
import { checkOutContractSchema, createContractSchema } from "../../shared/index.js";
import { serializeVnd } from "../../core/money/index.js";
import type { ContractRow } from "./contract.repository.js";
import { contractService } from "./contract.service.js";

function toDto(c: ContractRow) {
  return {
    id: c.id,
    branchId: c.branchId,
    contractNo: c.contractNo,
    customerId: c.customerId,
    bookingId: c.bookingId,
    bedIds: c.bedIds,
    startDate: c.startDate,
    endDate: c.endDate,
    durationMonths: c.durationMonths,
    monthlyRent: serializeVnd(c.monthlyRent),
    depositAmount: serializeVnd(c.depositAmount),
    depositMonths: c.depositMonths,
    billingCycle: c.billingCycle,
    electricityPrice: c.electricityPrice ? serializeVnd(c.electricityPrice) : null,
    waterPrice: c.waterPrice ? serializeVnd(c.waterPrice) : null,
    status: c.status,
    terminatedAt: c.terminatedAt,
    terminationReason: c.terminationReason,
    terminationType: c.terminationType,
  };
}

export const contractController = {
  async list(request: FastifyRequest<{ Querystring: { branchId?: string; customerId?: string } }>) {
    const rows = await contractService.list(request.ctx, request.query);
    return rows.map(toDto);
  },

  async getById(request: FastifyRequest<{ Params: { id: string } }>) {
    const row = await contractService.getById(request.ctx, request.params.id);
    return toDto(row);
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    const input = createContractSchema.parse(request.body);
    const row = await contractService.create(request.ctx, input);
    reply.code(201);
    return toDto(row);
  },

  async checkIn(request: FastifyRequest<{ Params: { id: string } }>) {
    const row = await contractService.checkIn(request.ctx, request.params.id);
    return toDto(row);
  },

  async checkOut(request: FastifyRequest<{ Params: { id: string } }>) {
    const input = checkOutContractSchema.parse(request.body);
    const row = await contractService.checkOut(request.ctx, request.params.id, input);
    return toDto(row);
  },
};
