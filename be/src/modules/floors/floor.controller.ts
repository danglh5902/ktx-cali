import type { FastifyReply, FastifyRequest } from "fastify";
import { createFloorSchema, updateFloorSchema } from "../../shared/index.js";
import type { FloorRow } from "./floor.repository.js";
import { floorService } from "./floor.service.js";

function toDto(floor: FloorRow) {
  return {
    id: floor.id,
    branchId: floor.branchId,
    buildingId: floor.buildingId,
    number: floor.number,
    sortOrder: floor.sortOrder,
    name: floor.name,
    genderPolicy: floor.genderPolicy,
    status: floor.status,
  };
}

export const floorController = {
  async list(request: FastifyRequest<{ Querystring: { buildingId?: string } }>) {
    const rows = await floorService.list(request.ctx, request.query.buildingId);
    return rows.map(toDto);
  },

  async getById(request: FastifyRequest<{ Params: { id: string } }>) {
    const row = await floorService.getById(request.ctx, request.params.id);
    return toDto(row);
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    const input = createFloorSchema.parse(request.body);
    const row = await floorService.create(request.ctx, input);
    reply.code(201);
    return toDto(row);
  },

  async update(request: FastifyRequest<{ Params: { id: string } }>) {
    const input = updateFloorSchema.parse(request.body);
    const row = await floorService.update(request.ctx, request.params.id, input);
    return toDto(row);
  },
};
