import type { FastifyReply, FastifyRequest } from "fastify";
import { createBranchSchema, updateBranchSchema } from "../../shared/index.js";
import { serializeVnd } from "../../core/money/index.js";
import type { BranchRow } from "./branch.repository.js";
import { branchService } from "./branch.service.js";

function toDto(branch: BranchRow) {
  return {
    id: branch.id,
    orgId: branch.orgId,
    code: branch.code,
    name: branch.name,
    shortName: branch.shortName,
    address: branch.address,
    region: branch.region,
    phone: branch.phone,
    email: branch.email,
    genderPolicy: branch.genderPolicy,
    billingDayOfMonth: branch.billingDayOfMonth,
    dueDayOfMonth: branch.dueDayOfMonth,
    electricityPrice: serializeVnd(branch.electricityPrice),
    waterPrice: serializeVnd(branch.waterPrice),
    status: branch.status,
    createdAt: branch.createdAt,
    updatedAt: branch.updatedAt,
  };
}

export const branchController = {
  async list(request: FastifyRequest) {
    const branches = await branchService.list(request.ctx);
    return branches.map(toDto);
  },

  async getById(request: FastifyRequest<{ Params: { id: string } }>) {
    const branch = await branchService.getById(request.ctx, request.params.id);
    return toDto(branch);
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    const input = createBranchSchema.parse(request.body);
    const branch = await branchService.create(request.ctx, input);
    reply.code(201);
    return toDto(branch);
  },

  async update(request: FastifyRequest<{ Params: { id: string } }>) {
    const input = updateBranchSchema.parse(request.body);
    const branch = await branchService.update(request.ctx, request.params.id, input);
    return toDto(branch);
  },

  async archive(request: FastifyRequest<{ Params: { id: string } }>) {
    const branch = await branchService.archive(request.ctx, request.params.id);
    return toDto(branch);
  },
};
