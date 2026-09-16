import type { ContractStatus } from "./types";

export const CONTRACT_STATUS_META: Record<ContractStatus, { label: string; tone: "green" | "amber" | "red" | "slate" | "blue" | "purple" | "cyan" }> = {
  DRAFT: { label: "Nháp", tone: "slate" },
  PENDING_APPROVAL: { label: "Chờ duyệt", tone: "amber" },
  ACTIVE: { label: "Đang hiệu lực", tone: "green" },
  EXPIRING: { label: "Sắp hết hạn", tone: "amber" },
  EXPIRED: { label: "Hết hạn", tone: "slate" },
  TERMINATED: { label: "Đã chấm dứt", tone: "slate" },
  CANCELLED: { label: "Đã hủy", tone: "red" },
};
