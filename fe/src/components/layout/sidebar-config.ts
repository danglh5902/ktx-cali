import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Bell,
  Building2,
  ClipboardList,
  DoorOpen,
  FileText,
  Gauge,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";

export interface SidebarItem {
  label: string;
  /** `undefined` = mục chưa có API thật, hiển thị dạng "sắp có". */
  path?: string;
}

export interface SidebarSection {
  label: string;
  icon: LucideIcon;
  items?: SidebarItem[];
  path?: string;
}

/**
 * Cấu trúc đầy đủ theo docs/15-ux-navigation.md §2 — kể cả các mục chưa có
 * API thật (hiển thị mờ, không click được) để phản ánh đúng kiến trúc dự
 * kiến của toàn hệ thống, không chỉ phần đã xây (Cơ sở vật chất).
 *
 * TODO: ẩn hẳn theo permission thay vì hiển thị mờ — cần endpoint trả về
 * permission của user hiện tại (chưa có, xem be/src/modules/auth) trước khi
 * làm được "R7 ẩn hoàn toàn mục không có quyền" đúng theo docs/15 §2.
 */
export const SIDEBAR_SECTIONS: SidebarSection[] = [
  { label: "Tổng quan", icon: LayoutDashboard, path: "/" },
  {
    label: "Tác nghiệp",
    icon: ClipboardList,
    items: [
      { label: "Sơ đồ giường", path: "/beds" },
      { label: "Check-in hôm nay" },
      { label: "Check-out hôm nay" },
      { label: "Thu tiền", path: "/payments" },
      { label: "Ca két của tôi", path: "/cash-sessions" },
    ],
  },
  {
    label: "Khách thuê",
    icon: Users,
    items: [
      { label: "Danh sách khách", path: "/customers" },
      { label: "Đặt chỗ", path: "/bookings" },
      { label: "Danh sách chờ" },
      { label: "Danh sách đen" },
    ],
  },
  {
    label: "Hợp đồng",
    icon: FileText,
    items: [{ label: "Tất cả hợp đồng", path: "/contracts" }, { label: "Sắp hết hạn" }, { label: "Mẫu hợp đồng" }],
  },
  {
    label: "Tài chính",
    icon: Wallet,
    items: [
      { label: "Kỳ chốt hóa đơn", path: "/billing-periods" },
      { label: "Hóa đơn", path: "/invoices" },
      { label: "Thanh toán", path: "/payments" },
      { label: "Công nợ", path: "/debts" },
      { label: "Tiền cọc", path: "/deposits" },
      { label: "Đối soát" },
      { label: "Két tiền mặt", path: "/cash-sessions" },
      { label: "Chi phí" },
    ],
  },
  { label: "Điện nước", icon: Gauge, items: [{ label: "Nhập chỉ số" }, { label: "Lịch sử chỉ số" }] },
  { label: "Dịch vụ", icon: Sparkles, items: [{ label: "Danh mục dịch vụ" }] },
  {
    label: "Bảo trì",
    icon: Wrench,
    items: [{ label: "Ticket" }, { label: "Vệ sinh" }, { label: "Tài sản" }],
  },
  { label: "Nội quy & Vi phạm", icon: AlertTriangle, items: [{ label: "Nội quy" }, { label: "Vi phạm" }] },
  { label: "Khách ra vào", icon: DoorOpen, items: [{ label: "Sổ khách thăm" }] },
  {
    label: "Cơ sở vật chất",
    icon: Building2,
    items: [
      { label: "Chi nhánh", path: "/branches" },
      { label: "Tòa nhà", path: "/buildings" },
      { label: "Tầng", path: "/floors" },
      { label: "Phòng", path: "/rooms" },
      { label: "Giường", path: "/beds" },
      { label: "Bảng giá (loại phòng)", path: "/room-types" },
    ],
  },
  { label: "Nhân viên", icon: UserRound, items: [{ label: "Danh sách nhân viên" }] },
  { label: "Thông báo", icon: Bell },
  { label: "Báo cáo", icon: FileText },
  { label: "Cấu hình", icon: Settings },
  { label: "Audit Log", icon: ShieldCheck },
];
