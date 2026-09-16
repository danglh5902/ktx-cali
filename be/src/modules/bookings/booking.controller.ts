import type { FastifyReply, FastifyRequest } from "fastify";
import { cancelBookingSchema, createBookingSchema } from "../../shared/index.js";
import { serializeVnd } from "../../core/money/index.js";
import type { BookingRow } from "./booking.repository.js";
import { bookingService } from "./booking.service.js";

function toDto(b: BookingRow) {
  return {
    id: b.id,
    branchId: b.branchId,
    bookingNo: b.bookingNo,
    customerId: b.customerId,
    bedId: b.bedId,
    roomId: b.roomId,
    expectedCheckInDate: b.expectedCheckInDate,
    quotedPrice: serializeVnd(b.quotedPrice),
    depositRequired: serializeVnd(b.depositRequired),
    depositPaid: serializeVnd(b.depositPaid),
    holdUntil: b.holdUntil,
    status: b.status,
    contractId: b.contractId,
    cancelReason: b.cancelReason,
  };
}

export const bookingController = {
  async list(request: FastifyRequest<{ Querystring: { branchId?: string; customerId?: string } }>) {
    const rows = await bookingService.list(request.ctx, request.query);
    return rows.map(toDto);
  },

  async getById(request: FastifyRequest<{ Params: { id: string } }>) {
    const row = await bookingService.getById(request.ctx, request.params.id);
    return toDto(row);
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    const input = createBookingSchema.parse(request.body);
    const row = await bookingService.create(request.ctx, input);
    reply.code(201);
    return toDto(row);
  },

  async cancel(request: FastifyRequest<{ Params: { id: string } }>) {
    const input = cancelBookingSchema.parse(request.body);
    const row = await bookingService.cancel(request.ctx, request.params.id, input);
    return toDto(row);
  },
};
