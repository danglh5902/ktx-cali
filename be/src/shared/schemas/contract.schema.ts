import { z } from "zod";
import { vndString } from "./branch.schema.js";

export const contractStatusSchema = z.enum([
  "DRAFT",
  "PENDING_APPROVAL",
  "ACTIVE",
  "EXPIRING",
  "EXPIRED",
  "TERMINATED",
  "CANCELLED",
]);

export const createContractSchema = z.object({
  branchId: z.string().uuid(),
  customerId: z.string().uuid(),
  bookingId: z.string().uuid().optional(),
  bedIds: z.array(z.string().uuid()).min(1, "Chọn ít nhất 1 giường"),
  startDate: z.string(),
  endDate: z.string(),
  durationMonths: z.number().int().min(1).optional(),
  monthlyRent: vndString,
  depositAmount: vndString,
  depositMonths: z.number().int().min(0).optional(),
  billingCycle: z.enum(["MONTHLY", "QUARTERLY", "SEMESTER", "YEARLY"]).default("MONTHLY"),
  electricityPrice: vndString.optional(),
  waterPrice: vndString.optional(),
  termsSnapshot: z.string().min(1, "Bắt buộc — toàn văn điều khoản tại thời điểm ký"),
  specialTerms: z.string().optional(),
});
export type CreateContractInput = z.infer<typeof createContractSchema>;

export const checkOutContractSchema = z.object({
  terminationType: z.enum(["MUTUAL", "BY_TENANT", "BY_LANDLORD", "ABANDONMENT"]),
  terminationReason: z.string().optional(),
  checkOutDate: z.string(),
});
export type CheckOutContractInput = z.infer<typeof checkOutContractSchema>;
