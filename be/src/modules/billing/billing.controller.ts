import type { FastifyReply, FastifyRequest } from "fastify";
import { createBillingPeriodSchema } from "../../shared/index.js";
import { serializeVnd } from "../../core/money/index.js";
import type { BillingPeriodRow } from "./billing-period.repository.js";
import { billingPeriodService } from "./billing-period.service.js";
import type { InvoiceLineRow, InvoiceRow } from "./invoice.repository.js";
import { invoiceService } from "./invoice.service.js";

function periodToDto(p: BillingPeriodRow) {
  return {
    id: p.id,
    branchId: p.branchId,
    code: p.code,
    periodFrom: p.periodFrom,
    periodTo: p.periodTo,
    dueDate: p.dueDate,
    status: p.status,
    invoiceCount: p.invoiceCount,
    totalAmount: serializeVnd(p.totalAmount),
    generatedAt: p.generatedAt,
  };
}

function invoiceToDto(inv: InvoiceRow, lines?: InvoiceLineRow[]) {
  return {
    id: inv.id,
    branchId: inv.branchId,
    invoiceNo: inv.invoiceNo,
    contractId: inv.contractId,
    customerId: inv.customerId,
    billingPeriodId: inv.billingPeriodId,
    periodFrom: inv.periodFrom,
    periodTo: inv.periodTo,
    issueDate: inv.issueDate,
    dueDate: inv.dueDate,
    subtotal: serializeVnd(inv.subtotal),
    grandTotal: serializeVnd(inv.grandTotal),
    paidAmount: serializeVnd(inv.paidAmount),
    balance: serializeVnd(inv.balance),
    status: inv.status,
    lines: lines?.map((l) => ({
      id: l.id,
      lineType: l.lineType,
      description: l.description,
      unitPrice: serializeVnd(l.unitPrice),
      amount: serializeVnd(l.amount),
    })),
  };
}

export const billingPeriodController = {
  async list(request: FastifyRequest<{ Querystring: { branchId?: string } }>) {
    const rows = await billingPeriodService.list(request.ctx, request.query.branchId);
    return rows.map(periodToDto);
  },

  async getById(request: FastifyRequest<{ Params: { id: string } }>) {
    const row = await billingPeriodService.getById(request.ctx, request.params.id);
    return periodToDto(row);
  },

  async create(request: FastifyRequest, reply: FastifyReply) {
    const input = createBillingPeriodSchema.parse(request.body);
    const row = await billingPeriodService.create(request.ctx, input);
    reply.code(201);
    return periodToDto(row);
  },

  async generateInvoices(request: FastifyRequest<{ Params: { id: string } }>) {
    const { period, invoiceCount } = await billingPeriodService.generateInvoices(request.ctx, request.params.id);
    return { period: periodToDto(period), invoiceCount };
  },

  async close(request: FastifyRequest<{ Params: { id: string } }>) {
    const row = await billingPeriodService.close(request.ctx, request.params.id);
    return periodToDto(row);
  },
};

export const invoiceController = {
  async list(request: FastifyRequest<{ Querystring: { branchId?: string; customerId?: string; status?: string } }>) {
    const rows = await invoiceService.list(request.ctx, request.query);
    return rows.map((r) => invoiceToDto(r));
  },

  async getById(request: FastifyRequest<{ Params: { id: string } }>) {
    const { invoice, lines } = await invoiceService.getById(request.ctx, request.params.id);
    return invoiceToDto(invoice, lines);
  },

  async issue(request: FastifyRequest<{ Params: { id: string } }>) {
    const row = await invoiceService.issue(request.ctx, request.params.id);
    return invoiceToDto(row);
  },
};
