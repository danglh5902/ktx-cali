import { z } from "zod";
import { vndString } from "./branch.schema.js";

export const bookingStatusSchema = z.enum([
  "NEW",
  "CONFIRMED",
  "DEPOSIT_PAID",
  "CHECKED_IN",
  "CANCELLED",
  "EXPIRED",
  "NO_SHOW",
]);

export const createBookingSchema = z.object({
  branchId: z.string().uuid(),
  customerId: z.string().uuid(),
  bedId: z.string().uuid().optional(),
  roomId: z.string().uuid().optional(),
  expectedCheckInDate: z.string(),
  expectedDurationMonths: z.number().int().min(1).optional(),
  quotedPrice: vndString.optional(),
  depositRequired: vndString.optional(),
  /** Số giờ giữ chỗ kể từ lúc tạo — hết hạn thì job dọn sau (chưa xây), xem docs/07. */
  holdHours: z.number().int().min(1).max(168).default(48),
  source: z.string().optional(),
  roommatePreferences: z.string().optional(),
});
export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const cancelBookingSchema = z.object({ reason: z.string().min(1) });
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
