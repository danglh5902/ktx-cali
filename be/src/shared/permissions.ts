/**
 * Permission catalogue — hằng số trong code, KHÔNG lưu DB (tránh lệch giữa
 * code và dữ liệu). Xem docs/04-roles-permissions.md §1.3.
 *
 * Format: `<resource>:<action>`.
 */
export const PERMISSIONS = [
  // Tổ chức
  "org:view",
  "org:manage",
  "branch:view",
  "branch:create",
  "branch:update",
  "branch:delete",
  "branch:config",

  // Tài sản BĐS
  "building:view",
  "building:create",
  "building:update",
  "building:delete",
  "floor:view",
  "floor:create",
  "floor:update",
  "floor:delete",
  "room:view",
  "room:create",
  "room:update",
  "room:delete",
  "room:status_update",
  "bed:view",
  "bed:create",
  "bed:update",
  "bed:delete",
  "bed:status_update",
  "bed:block",

  // Giá
  "pricing:view",
  "pricing:update",
  "pricing:approve",

  // Khách thuê
  "customer:view",
  "customer:create",
  "customer:update",
  "customer:delete",
  "customer:export",
  "customer:view_id_doc",
  "customer:blacklist",

  // Đặt chỗ
  "booking:view",
  "booking:create",
  "booking:update",
  "booking:cancel",
  "booking:assign_bed",

  // Hợp đồng
  "contract:view",
  "contract:create",
  "contract:update",
  "contract:delete",
  "contract:approve",
  "contract:terminate",
  "contract:renew",
  "contract:print",
  "contract:template_manage",

  // Lưu trú
  "checkin:execute",
  "checkout:execute",
  "assignment:transfer",
  "assignment:transfer_branch",

  // Điện nước
  "utility:view",
  "utility:create_reading",
  "utility:update_reading",
  "utility:approve_reading",
  "utility:config_price",
  "utility:import",

  // Dịch vụ
  "service:view",
  "service:manage",
  "subscription:view",
  "subscription:create",
  "subscription:update",
  "subscription:cancel",

  // Hóa đơn
  "invoice:view",
  "invoice:generate",
  "invoice:update_draft",
  "invoice:issue",
  "invoice:adjust",
  "invoice:approve_adjust",
  "invoice:void",
  "invoice:export",
  "invoice:add_charge",
  "invoice:discount",
  "invoice:approve_discount",

  // Thanh toán
  "payment:view",
  "payment:create",
  "payment:reverse",
  "payment:approve_reverse",
  "payment:reconcile",
  "payment:allocate",

  // Cọc
  "deposit:view",
  "deposit:hold",
  "deposit:deduct",
  "deposit:refund_request",
  "deposit:refund_approve",
  "deposit:refund_execute",
  "deposit:forfeit",

  // Công nợ
  "debt:view",
  "debt:view_all_branches",
  "debt:write_off",
  "debt:approve_write_off",
  "debt:send_reminder",

  // Két tiền mặt
  "cash:open_session",
  "cash:close_session",
  "cash:approve_variance",
  "cash:view",

  // Chi phí
  "expense:view",
  "expense:create",
  "expense:approve",

  // Bảo trì
  "ticket:view",
  "ticket:view_assigned",
  "ticket:create",
  "ticket:update",
  "ticket:assign",
  "ticket:close",
  "ticket:set_cost",

  // Tài sản
  "asset:view",
  "asset:create",
  "asset:update",
  "asset:delete",
  "asset:update_condition",
  "asset:transfer",

  // Vệ sinh
  "housekeeping:view",
  "housekeeping:create",
  "housekeeping:complete",

  // Nội quy
  "rule:view",
  "rule:manage",
  "violation:view",
  "violation:create",
  "violation:approve",
  "violation:waive",

  // Khách ra vào
  "visitor:view",
  "visitor:checkin",
  "visitor:checkout",

  // Nhân viên
  "staff:view",
  "staff:create",
  "staff:update",
  "staff:deactivate",
  "staff:assign_role",
  "shift:manage",

  // Thông báo
  "notification:view",
  "notification:send",
  "notification:send_broadcast",
  "notification:template_manage",

  // Báo cáo
  "report:occupancy",
  "report:revenue",
  "report:expense",
  "report:debt",
  "report:customer",
  "report:contract",
  "report:maintenance",
  "report:asset",
  "report:cashflow",
  "report:pnl",
  "report:export",

  // Hệ thống
  "audit:view",
  "audit:view_all",
  "settings:manage",
  "data:import",
  "data:export_bulk",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export function isPermission(value: string): value is Permission {
  return (PERMISSIONS as readonly string[]).includes(value);
}
