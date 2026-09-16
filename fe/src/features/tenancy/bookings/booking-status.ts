import type { BookingStatus } from "./types";

export const BOOKING_STATUS_META: Record<BookingStatus, { label: string; tone: "green" | "amber" | "red" | "slate" | "blue" | "purple" | "cyan" }> = {
  NEW: { label: "Mới giữ chỗ", tone: "blue" },
  CONFIRMED: { label: "Đã xác nhận", tone: "cyan" },
  DEPOSIT_PAID: { label: "Đã đặt cọc", tone: "purple" },
  CHECKED_IN: { label: "Đã check-in", tone: "green" },
  CANCELLED: { label: "Đã hủy", tone: "slate" },
  EXPIRED: { label: "Hết hạn giữ chỗ", tone: "amber" },
  NO_SHOW: { label: "Không đến", tone: "red" },
};
