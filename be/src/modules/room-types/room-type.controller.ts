import type { FastifyReply, FastifyRequest } from "fastify";
import { createRoomTypeSchema, updateRoomTypeSchema } from "../../shared/index.js";
import { serializeVnd } from "../../core/money/index.js";
import type { RoomTypeRow } from "./room-type.repository.js";
import { roomTypeService } from "./room-type.service.js";

function toDto(roomType: RoomTypeRow) {
  return {
    id: roomType.id,
    branchId: roomType.branchId,
    code: roomType.code,
    name: roomType.name,
    capacity: roomType.capacity,
    basePrice: serializeVnd(roomType.basePrice),
    bunkLowerPrice: serializeVnd(roomType.bunkLowerPrice),
    bunkUpperPrice: serializeVnd(roomType.bunkUpperPrice),
    wholeRoomPrice: serializeVnd(roomType.wholeRoomPrice),
    defaultAmenities: roomType.defaultAmenities,
    description: roomType.description,
    status: roomType.status,
  };
}

export const roomTypeController = {
  async list(request: FastifyRequest<{ Querystring: { branchId?: string } }>) {
    const rows = await roomTypeService.list(request.ctx, request.query.branchId);
    return rows.map(toDto);
  },

  async getById(request: FastifyRequest<{ Params: { id: string } }>) {
    const row = await roomTypeService.getById(request.ctx, request.params.id);
    return toDto(row);
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    const input = createRoomTypeSchema.parse(request.body);
    const row = await roomTypeService.create(request.ctx, input);
    reply.code(201);
    return toDto(row);
  },

  async update(request: FastifyRequest<{ Params: { id: string } }>) {
    const input = updateRoomTypeSchema.parse(request.body);
    const row = await roomTypeService.update(request.ctx, request.params.id, input);
    return toDto(row);
  },
};
