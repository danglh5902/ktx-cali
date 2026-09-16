import type { FastifyReply, FastifyRequest } from "fastify";
import { bulkCreateRoomsSchema, createRoomSchema, updateRoomSchema } from "../../shared/index.js";
import { serializeVnd } from "../../core/money/index.js";
import type { RoomRow } from "./room.repository.js";
import { roomService } from "./room.service.js";

function toDto(room: RoomRow) {
  return {
    id: room.id,
    branchId: room.branchId,
    buildingId: room.buildingId,
    floorId: room.floorId,
    code: room.code,
    name: room.name,
    roomTypeId: room.roomTypeId,
    capacity: room.capacity,
    actualBedCount: room.actualBedCount,
    hasPrivateToilet: room.hasPrivateToilet,
    amenities: room.amenities,
    priceOverride: serializeVnd(room.priceOverride),
    status: room.status,
  };
}

export const roomController = {
  async list(request: FastifyRequest<{ Querystring: { branchId?: string; floorId?: string } }>) {
    const rows = await roomService.list(request.ctx, request.query);
    return rows.map(toDto);
  },

  async getById(request: FastifyRequest<{ Params: { id: string } }>) {
    const row = await roomService.getById(request.ctx, request.params.id);
    return toDto(row);
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    const input = createRoomSchema.parse(request.body);
    const row = await roomService.create(request.ctx, input);
    reply.code(201);
    return toDto(row);
  },

  async update(request: FastifyRequest<{ Params: { id: string } }>) {
    const input = updateRoomSchema.parse(request.body);
    const row = await roomService.update(request.ctx, request.params.id, input);
    return toDto(row);
  },

  async bulkCreate(request: FastifyRequest, reply: FastifyReply) {
    const input = bulkCreateRoomsSchema.parse(request.body);
    const rows = await roomService.bulkCreate(request.ctx, input);
    reply.code(201);
    return rows.map(toDto);
  },
};
