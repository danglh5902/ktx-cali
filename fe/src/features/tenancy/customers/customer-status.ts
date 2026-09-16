import type { CustomerStatus } from "./types";

export const CUSTOMER_STATUS_META: Record<CustomerStatus, { label: string; tone: "green" | "amber" | "red" | "slate" | "blue" | "purple" | "cyan" }> = {
  PROSPECT: { label: "Tiềm năng", tone: "cyan" },
  RESERVED: { label: "Đã giữ chỗ", tone: "blue" },
  ACTIVE: { label: "Đang thuê", tone: "green" },
  EXPIRING: { label: "Sắp hết hạn", tone: "amber" },
  CHECKED_OUT: { label: "Đã trả phòng", tone: "slate" },
  CHECKED_OUT_WITH_DEBT: { label: "Trả phòng — còn nợ", tone: "red" },
  SUSPENDED: { label: "Tạm ngưng", tone: "amber" },
  BLACKLISTED: { label: "Danh sách đen", tone: "red" },
};
