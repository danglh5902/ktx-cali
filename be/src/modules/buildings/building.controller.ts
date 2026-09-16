import type { FastifyReply, FastifyRequest } from "fastify";
import { createBuildingSchema, updateBuildingSchema } from "../../shared/index.js";
import { serializeVnd } from "../../core/money/index.js";
import type { BuildingRow } from "./building.repository.js";
import { buildingService } from "./building.service.js";

function toDto(building: BuildingRow) {
  return {
    id: building.id,
    orgId: building.orgId,
    branchId: building.branchId,
    code: building.code,
    name: building.name,
    genderPolicy: building.genderPolicy,
    hasElevator: building.hasElevator,
    monthlyRentCost: serializeVnd(building.monthlyRentCost),
    address: building.address,
    status: building.status,
    createdAt: building.createdAt,
    updatedAt: building.updatedAt,
  };
}

export const buildingController = {
  async list(request: FastifyRequest<{ Querystring: { branchId?: string } }>) {
    const rows = await buildingService.list(request.ctx, request.query.branchId);
    return rows.map(toDto);
  },

  async getById(request: FastifyRequest<{ Params: { id: string } }>) {
    const row = await buildingService.getById(request.ctx, request.params.id);
    return toDto(row);
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    const input = createBuildingSchema.parse(request.body);
    const row = await buildingService.create(request.ctx, input);
    reply.code(201);
    return toDto(row);
  },

  async update(request: FastifyRequest<{ Params: { id: string } }>) {
    const input = updateBuildingSchema.parse(request.body);
    const row = await buildingService.update(request.ctx, request.params.id, input);
    return toDto(row);
  },
};
