import type { BedStatus } from "./types";

/**
 * Nhãn + ký hiệu cho từng trạng thái giường — LUÔN kèm chữ, không chỉ dùng
 * màu (docs/15-ux-navigation.md §5, §10: người mù màu / bản in đen trắng
 * vẫn phải đọc được).
 */
export const BED_STATUS_META: Record<BedStatus, { label: string; symbol: string; className: string }> = {
  AVAILABLE: { label: "Trống", symbol: "▢", className: "bg-green-50 text-green-700 border-green-300" },
  OCCUPIED: { label: "Đang ở", symbol: "▣", className: "bg-blue-50 text-blue-700 border-blue-300" },
  RESERVED: { label: "Giữ chỗ", symbol: "◐", className: "bg-amber-50 text-amber-700 border-amber-300" },
  CHECKOUT_PENDING: { label: "Chờ trả", symbol: "▨", className: "bg-purple-50 text-purple-700 border-purple-300" },
  CLEANING: { label: "Chờ dọn", symbol: "▧", className: "bg-cyan-50 text-cyan-700 border-cyan-300" },
  MAINTENANCE: { label: "Bảo trì", symbol: "▧", className: "bg-red-50 text-red-700 border-red-300" },
  BLOCKED: { label: "Đã khóa", symbol: "▩", className: "bg-slate-100 text-slate-600 border-slate-300" },
};

export const BED_STATUS_OPTIONS: BedStatus[] = [
  "AVAILABLE",
  "CLEANING",
  "MAINTENANCE",
  "BLOCKED",
  "CHECKOUT_PENDING",
];
