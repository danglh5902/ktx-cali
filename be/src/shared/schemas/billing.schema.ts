import { z } from "zod";
import { vndString } from "./branch.schema.js";

export const billingPeriodStatusSchema = z.enum(["OPEN", "GENERATING", "ISSUED", "CLOSED"]);

export const createBillingPeriodSchema = z.object({
  branchId: z.string().uuid(),
  code: z.string().min(1),
  periodFrom: z.string(),
  periodTo: z.string(),
  dueDate: z.string().optional(),
});
export type CreateBillingPeriodInput = z.infer<typeof createBillingPeriodSchema>;

export const invoiceStatusSchema = z.enum(["DRAFT", "ISSUED", "PARTIAL", "PAID", "OVERDUE", "VOID"]);

export const createPaymentSchema = z.object({
  customerId: z.string().uuid(),
  branchId: z.string().uuid(),
  amount: vndString,
  method: z.enum(["CASH", "BANK_TRANSFER", "VIETQR", "CARD"]),
  payerName: z.string().optional(),
  bankRef: z.string().optional(),
  note: z.string().optional(),
  idempotencyKey: z.string().optional(),
});
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

export const cashSessionOpenSchema = z.object({
  branchId: z.string().uuid(),
  openingBalance: vndString,
});
export type CashSessionOpenInput = z.infer<typeof cashSessionOpenSchema>;

export const cashSessionCloseSchema = z.object({
  countedTotal: vndString,
  varianceReason: z.string().optional(),
  handoverNote: z.string().optional(),
});
export type CashSessionCloseInput = z.infer<typeof cashSessionCloseSchema>;

export const depositRefundRequestSchema = z.object({
  amount: vndString,
  reason: z.string().min(1, "Bắt buộc nêu lý do hoàn/khấu trừ cọc"),
});
export type DepositRefundRequestInput = z.infer<typeof depositRefundRequestSchema>;
