import type { FastifyReply, FastifyRequest } from "fastify";
import {
  bulkCreateBedsSchema,
  createBedSchema,
  updateBedStatusSchema,
} from "../../shared/index.js";
import { serializeVnd } from "../../core/money/index.js";
import type { BedRow } from "./bed.repository.js";
import type { BedWithPrice } from "./bed.service.js";
import { bedService } from "./bed.service.js";

function toDto(bed: BedRow | BedWithPrice) {
  return {
    id: bed.id,
    branchId: bed.branchId,
    buildingId: bed.buildingId,
    floorId: bed.floorId,
    roomId: bed.roomId,
    code: bed.code,
    label: bed.label,
    bedType: bed.bedType,
    priceOverride: serializeVnd(bed.priceOverride),
    effectivePrice: "effectivePrice" in bed ? serializeVnd(bed.effectivePrice) : undefined,
    status: bed.status,
    currentAssignmentId: bed.currentAssignmentId,
    blockedReason: bed.blockedReason,
    blockedUntil: bed.blockedUntil,
  };
}

export const bedController = {
  async list(request: FastifyRequest<{ Querystring: { branchId?: string; roomId?: string } }>) {
    const rows = await bedService.list(request.ctx, request.query);
    return rows.map(toDto);
  },

  async getById(request: FastifyRequest<{ Params: { id: string } }>) {
    const row = await bedService.getById(request.ctx, request.params.id);
    return toDto(row);
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    const input = createBedSchema.parse(request.body);
    const row = await bedService.create(request.ctx, input);
    reply.code(201);
    return toDto(row);
  },

  async bulkCreate(request: FastifyRequest, reply: FastifyReply) {
    const input = bulkCreateBedsSchema.parse(request.body);
    const rows = await bedService.bulkCreate(request.ctx, input);
    reply.code(201);
    return rows.map(toDto);
  },

  async updateStatus(request: FastifyRequest<{ Params: { id: string } }>) {
    const input = updateBedStatusSchema.parse(request.body);
    const row = await bedService.updateStatus(request.ctx, request.params.id, input);
    return toDto(row);
  },
};
