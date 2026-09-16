import type { FastifyReply, FastifyRequest } from "fastify";
import { blacklistCustomerSchema, createCustomerSchema, updateCustomerSchema } from "../../shared/index.js";
import { serializeVnd } from "../../core/money/index.js";
import type { CustomerRow } from "./customer.repository.js";
import { customerService } from "./customer.service.js";

function toDto(c: CustomerRow) {
  return {
    id: c.id,
    customerCode: c.customerCode,
    fullName: c.fullName,
    dateOfBirth: c.dateOfBirth,
    gender: c.gender,
    idNumber: c.idNumber,
    phone: c.phone,
    email: c.email,
    emergencyContact: c.emergencyContact,
    occupation: c.occupation,
    school: c.school,
    company: c.company,
    currentBranchId: c.currentBranchId,
    currentRoomId: c.currentRoomId,
    currentBedId: c.currentBedId,
    currentContractId: c.currentContractId,
    creditBalance: serializeVnd(c.creditBalance),
    status: c.status,
    isBlacklisted: c.isBlacklisted,
    blacklistReason: c.blacklistReason,
    createdAt: c.createdAt,
  };
}

export const customerController = {
  async list(request: FastifyRequest<{ Querystring: { search?: string; bedId?: string } }>) {
    const rows = await customerService.list(request.ctx, request.query);
    return rows.map(toDto);
  },

  async getById(request: FastifyRequest<{ Params: { id: string } }>) {
    const row = await customerService.getById(request.ctx, request.params.id);
    return toDto(row);
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    const input = createCustomerSchema.parse(request.body);
    const row = await customerService.create(request.ctx, input);
    reply.code(201);
    return toDto(row);
  },

  async update(request: FastifyRequest<{ Params: { id: string } }>) {
    const input = updateCustomerSchema.parse(request.body);
    const row = await customerService.update(request.ctx, request.params.id, input);
    return toDto(row);
  },

  async blacklist(request: FastifyRequest<{ Params: { id: string } }>) {
    const input = blacklistCustomerSchema.parse(request.body);
    const row = await customerService.blacklist(request.ctx, request.params.id, input);
    return toDto(row);
  },
};
