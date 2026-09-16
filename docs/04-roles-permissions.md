# 04 — Vai trò & Phân quyền

## 1. Mô hình phân quyền

### 1.1 Ba lớp kiểm soát

```
┌─────────────────────────────────────────────────────────┐
│ Lớp 1 — PERMISSION: Được làm hành động này không?       │
│         vd: invoice:issue, payment:create                │
├─────────────────────────────────────────────────────────┤
│ Lớp 2 — SCOPE: Trên dữ liệu của chi nhánh nào?          │
│         ALL (toàn hệ thống) | BRANCH[id1, id2]           │
├─────────────────────────────────────────────────────────┤
│ Lớp 3 — CONDITION: Có vượt hạn mức/điều kiện không?     │
│         vd: hoàn cọc >5tr phải Owner duyệt               │
│              kỹ thuật chỉ sửa ticket được giao cho mình  │
└─────────────────────────────────────────────────────────┘
```

Cả ba lớp phải được kiểm tra ở **backend**. Frontend ẩn nút chỉ là trải nghiệm, không phải bảo mật.

### 1.2 Cấu trúc dữ liệu

```ts
// permissions — hằng số trong code, KHÔNG lưu DB (tránh lệch giữa code và dữ liệu)
const PERMISSIONS = ['branch:view', 'branch:create', ... ] as const

// roles — lưu DB, có thể tạo vai trò tùy chỉnh
{ id, orgId, code: 'BRANCH_MANAGER', name: 'Quản lý chi nhánh',
  permissions: ['branch:view', 'room:manage', ...],
  isSystem: true,          // vai trò hệ thống, không cho sửa/xóa
  limits: { refundApprovalMax: 5_000_000, discountMax: 500_000 } }

// user_role_assignments — gán quyền, có phạm vi và thời hạn
{ id, userId, roleId, orgId,
  scope: 'ALL' | 'BRANCH',
  branchIds: string[],     // uuid[], khi scope = BRANCH
  validFrom: Date, validUntil: Date | null,   // quyền tạm thời tự hết hạn
  grantedBy, grantedAt }
```

### 1.3 Danh mục permission

Định dạng: `<resource>:<action>`

**Actions chuẩn:** `view` · `create` · `update` · `delete` · `manage` (= tất cả CRUD trong phạm vi) · `approve` · `export` · `import`

| Nhóm | Permissions |
|---|---|
| **Tổ chức** | `org:view` `org:manage` `branch:view` `branch:create` `branch:update` `branch:delete` `branch:config` |
| **Tài sản BĐS** | `building:view/create/update/delete` `floor:*` `room:view/create/update/delete` `room:status_update` `bed:view/create/update/delete` `bed:status_update` `bed:block` |
| **Giá** | `pricing:view` `pricing:update` `pricing:approve` |
| **Khách thuê** | `customer:view` `customer:create` `customer:update` `customer:delete` `customer:export` `customer:view_id_doc` `customer:blacklist` |
| **Đặt chỗ** | `booking:view/create/update/cancel` `booking:assign_bed` |
| **Hợp đồng** | `contract:view/create/update/delete` `contract:approve` `contract:terminate` `contract:renew` `contract:print` `contract:template_manage` |
| **Lưu trú** | `checkin:execute` `checkout:execute` `assignment:transfer` `assignment:transfer_branch` |
| **Điện nước** | `utility:view` `utility:create_reading` `utility:update_reading` `utility:approve_reading` `utility:config_price` `utility:import` |
| **Dịch vụ** | `service:view` `service:manage` `subscription:view/create/update/cancel` |
| **Hóa đơn** | `invoice:view` `invoice:generate` `invoice:update_draft` `invoice:issue` `invoice:adjust` `invoice:approve_adjust` `invoice:void` `invoice:export` `invoice:add_charge` `invoice:discount` `invoice:approve_discount` |
| **Thanh toán** | `payment:view` `payment:create` `payment:reverse` `payment:approve_reverse` `payment:reconcile` `payment:allocate` |
| **Cọc** | `deposit:view` `deposit:hold` `deposit:deduct` `deposit:refund_request` `deposit:refund_approve` `deposit:refund_execute` `deposit:forfeit` |
| **Công nợ** | `debt:view` `debt:view_all_branches` `debt:write_off` `debt:approve_write_off` `debt:send_reminder` |
| **Két tiền mặt** | `cash:open_session` `cash:close_session` `cash:approve_variance` `cash:view` |
| **Chi phí** | `expense:view` `expense:create` `expense:approve` |
| **Bảo trì** | `ticket:view` `ticket:view_assigned` `ticket:create` `ticket:update` `ticket:assign` `ticket:close` `ticket:set_cost` |
| **Tài sản** | `asset:view` `asset:create/update/delete` `asset:update_condition` `asset:transfer` |
| **Vệ sinh** | `housekeeping:view` `housekeeping:create` `housekeeping:complete` |
| **Nội quy** | `rule:view` `rule:manage` `violation:view` `violation:create` `violation:approve` `violation:waive` |
| **Khách ra vào** | `visitor:view` `visitor:checkin` `visitor:checkout` |
| **Nhân viên** | `staff:view` `staff:create/update/deactivate` `staff:assign_role` `shift:manage` |
| **Thông báo** | `notification:view` `notification:send` `notification:send_broadcast` `notification:template_manage` |
| **Báo cáo** | `report:occupancy` `report:revenue` `report:expense` `report:debt` `report:customer` `report:contract` `report:maintenance` `report:asset` `report:cashflow` `report:pnl` `report:export` |
| **Hệ thống** | `audit:view` `audit:view_all` `settings:manage` `data:import` `data:export_bulk` |

---

## 2. Permission Matrix đầy đủ

**Chú thích:**
`V` View · `C` Create · `U` Update · `D` Delete · `M` Manage (toàn quyền trong phạm vi) · `A` Approve · `E` Export · `I` Import · `–` Không có quyền
Chữ trong ngoặc là điều kiện. Ô có **đậm** là quyền then chốt của vai trò đó.

| # | Chức năng | Super Admin | Owner | Branch Manager | Receptionist | Accountant | Technician | Housekeeper | Security | Tenant |
|---|---|---|---|---|---|---|---|---|---|---|
| | **TỔ CHỨC & CẤU HÌNH** |
| 1 | Tổ chức (Organization) | M | V | – | – | – | – | – | – | – |
| 2 | Chi nhánh — xem | V (all) | V (all) | V (của mình) | V (của mình) | V (all) | V (của mình) | V (của mình) | V (của mình) | – |
| 3 | Chi nhánh — tạo | **C** | – | – | – | – | – | – | – | – |
| 4 | Chi nhánh — sửa thông tin | U | – | U (của mình) | – | – | – | – | – | – |
| 5 | Chi nhánh — xóa/lưu trữ | **D** | – | – | – | – | – | – | – | – |
| 6 | Cấu hình chi nhánh (giờ, quy định) | M | V | **U** | V | V | – | – | – | – |
| 7 | Cấu hình hệ thống | **M** | – | – | – | – | – | – | – | – |
| | **TÀI SẢN BẤT ĐỘNG SẢN** |
| 8 | Tòa nhà | M | V | **M** | V | V | V | V | V | – |
| 9 | Tầng | M | V | **M** | V | V | V | V | V | – |
| 10 | Loại phòng | M | V | M | V | V | – | – | – | – |
| 11 | Phòng — CRUD | M | V | **M** | V | V | V | V | – | – |
| 12 | Phòng — đổi trạng thái | U | – | U | **U** | – | U | U | – | – |
| 13 | Giường — CRUD | M | V | **M** | V | V | V | V | – | – |
| 14 | Giường — đổi trạng thái | U | – | U | **U** | – | U | U | – | – |
| 15 | Giường — khóa (BLOCKED) | U | – | **U** | – | – | – | – | – | – |
| | **GIÁ** |
| 16 | Bảng giá — xem | V | V | V | V (giá bán) | V | – | – | – | – |
| 17 | Bảng giá — sửa | U | – | **Đề xuất** | – | – | – | – | – | – |
| 18 | Bảng giá — duyệt | **A** | A | – | – | – | – | – | – | – |
| 19 | Giá riêng cho giường/phòng | U | – | **U** | – | – | – | – | – | – |
| | **KHÁCH THUÊ** |
| 20 | Hồ sơ khách — xem | V (all) | V (all) | V (chi nhánh) | **V** | V | – | – | V (tên, phòng) | V (của mình) |
| 21 | Hồ sơ khách — tạo/sửa | M | – | M | **C, U** | U (thông tin TC) | – | – | – | U (liên hệ) |
| 22 | Hồ sơ khách — xóa/ẩn danh | **D** | – | Đề xuất | – | – | – | – | – | Yêu cầu |
| 23 | **Xem ảnh CCCD** | V (có log) | V (có log) | **V (có log)** | V (có log) | – | – | – | – | V (của mình) |
| 24 | **Export danh sách khách** | **E** | E | E | **–** ⚠️ | E | – | – | – | – |
| 25 | Danh sách đen (blacklist) | M | V | **M** | V | V | – | – | V | – |
| | **ĐẶT CHỖ** |
| 26 | Booking — xem | V | V | V | **V** | V | – | – | – | V (của mình) |
| 27 | Booking — tạo | C | – | C | **C** | – | – | – | – | C |
| 28 | Booking — xếp giường | U | – | U | **U** | – | – | – | – | – |
| 29 | Booking — hủy | U | – | U | **U** | – | – | – | – | Yêu cầu |
| | **HỢP ĐỒNG** |
| 30 | Hợp đồng — xem | V | V | V | **V** | V | – | – | – | V (của mình) |
| 31 | Hợp đồng — soạn | C | – | C | **C** | – | – | – | – | – |
| 32 | Hợp đồng — duyệt | A | – | **A** | – | – | – | – | – | – |
| 33 | Hợp đồng — chấm dứt sớm | U | – | **U + A** | Đề xuất | – | – | – | – | Yêu cầu |
| 34 | Hợp đồng — gia hạn | U | – | U | **U** | – | – | – | – | Yêu cầu |
| 35 | Hợp đồng — in trực tiếp từ màn hình xem | E | E | E | **E** | E | – | – | – | E (của mình) |
| 36 | Template hợp đồng | **M** | V | V | – | – | – | – | – | – |
| | **LƯU TRÚ** |
| 37 | Check-in | M | V | M | **M** | – | – | – | – | – |
| 38 | Check-out | M | V | M | **M** | – | – | – | – | – |
| 39 | Chuyển giường/phòng (trong chi nhánh) | U | V | U | **U** | – | – | – | – | Yêu cầu |
| 40 | Chuyển chi nhánh | U | V | **U + A** | Đề xuất | – | – | – | – | Yêu cầu |
| | **ĐIỆN NƯỚC** |
| 41 | Chỉ số — xem | V | V | V | V | V | V | – | – | V (phòng mình) |
| 42 | Chỉ số — nhập | C | – | C | **C** | – | C | – | – | – |
| 43 | Chỉ số — sửa (chưa duyệt) | U | – | U | U | – | – | – | – | – |
| 44 | Chỉ số — duyệt & khóa kỳ | A | – | **A** | – | A | – | – | – | – |
| 45 | Chỉ số — import Excel | I | – | **I** | – | I | – | – | – | – |
| 46 | Giá điện/nước | U | V | Đề xuất | V | V | – | – | – | V |
| | **DỊCH VỤ** |
| 47 | Danh mục dịch vụ | M | V | **M** | V | V | – | – | – | V |
| 48 | Đăng ký dịch vụ cho khách | M | V | M | **C, U** | V | – | – | – | Yêu cầu |
| 49 | Ghi nhận lần sử dụng dịch vụ | C | – | C | **C** | – | – | C | – | – |
| | **HÓA ĐƠN** |
| 50 | Hóa đơn — xem | V (all) | V (all) | V (chi nhánh) | **V** | V (all) | – | – | – | V (của mình) |
| 51 | Hóa đơn — sinh hàng loạt | C | – | **C** | – | C | – | – | – | – |
| 52 | Hóa đơn nháp — sửa/xóa | U, D | – | **U, D** | – | U, D | – | – | – | – |
| 53 | **Hóa đơn — phát hành** | U | – | **U** | – | **U** | – | – | – | – |
| 54 | Hóa đơn — thêm phí phát sinh | C | – | C | **C** | C | – | – | – | – |
| 55 | Hóa đơn — giảm giá (≤ hạn mức) | C | – | **C** | Đề xuất | C | – | – | – | – |
| 56 | Hóa đơn — giảm giá (> hạn mức) | A | **A** | Đề xuất | – | Đề xuất | – | – | – | – |
| 57 | **Hóa đơn — bút toán điều chỉnh** | C | – | Đề xuất | – | **C** | – | – | – | – |
| 58 | Hóa đơn — duyệt điều chỉnh | A | A | **A** | – | – | – | – | – | – |
| 59 | Hóa đơn — hủy (VOID) | U + A | – | Đề xuất | – | Đề xuất | – | – | – | – |
| 60 | Hóa đơn — export | E | E | E | E | **E** | – | – | – | E (của mình) |
| | **THANH TOÁN** |
| 61 | Thanh toán — xem | V | V | V (chi nhánh) | **V** | V (all) | – | – | – | V (của mình) |
| 62 | **Thanh toán — ghi nhận thu tiền** | C | – | C | **C** | C | – | – | – | – |
| 63 | Thanh toán — phân bổ vào hóa đơn | U | – | U | U (mặc định FIFO) | **U** | – | – | – | – |
| 64 | Thanh toán — đảo/hủy | U + A | – | Đề xuất | – | Đề xuất | – | – | – | – |
| 65 | Thanh toán — duyệt đảo | A | A | **A** | – | – | – | – | – | – |
| 66 | **Đối soát ngân hàng** | M | V | V | – | **M** | – | – | – | – |
| | **CỌC** |
| 67 | Sổ cọc — xem | V | V | V | **V** | V | – | – | – | V (của mình) |
| 68 | Cọc — ghi nhận nhận cọc | C | – | C | **C** | C | – | – | – | – |
| 69 | Cọc — trừ vào hư hỏng/nợ | C | – | **C** | Đề xuất | C | – | – | – | – |
| 70 | Cọc — đề nghị hoàn | C | – | C | **C** | C | – | – | – | – |
| 71 | Cọc — duyệt hoàn (≤ hạn mức) | A | A | **A** | – | – | – | – | – | – |
| 72 | Cọc — duyệt hoàn (> hạn mức) | A | **A** | – | – | – | – | – | – | – |
| 73 | Cọc — thực hiện chi trả | U | – | U | U | **U** | – | – | – | – |
| 74 | Cọc — tịch thu (forfeit) | U + A | A | **Đề xuất** | – | – | – | – | – | – |
| | **CÔNG NỢ** |
| 75 | Công nợ — xem chi nhánh | V | V | **V** | V | V | – | – | – | V (của mình) |
| 76 | Công nợ — xem toàn hệ thống | V | **V** | – | – | **V** | – | – | – | – |
| 77 | Công nợ — gửi nhắc nợ | C | – | C | **C** | C | – | – | – | – |
| 78 | Công nợ — xóa nợ (write-off) | C + A | **A** | Đề xuất | – | Đề xuất | – | – | – | – |
| | **KÉT TIỀN MẶT** |
| 79 | Mở/đóng ca két | M | V | M | **M** | V | – | – | – | – |
| 80 | Duyệt chênh lệch két | A | V | **A** | – | V | – | – | – | – |
| 81 | Xem lịch sử két | V | V | **V** | V (của mình) | V | – | – | – | – |
| | **CHI PHÍ** |
| 82 | Chi phí — xem | V | **V** | V (chi nhánh) | – | V (all) | – | – | – | – |
| 83 | Chi phí — tạo | C | – | **C** | – | C | C (chi phí sửa chữa) | – | – | – |
| 84 | Chi phí — duyệt | A | A | **A** (≤ hạn mức) | – | A | – | – | – | – |
| | **BẢO TRÌ** |
| 85 | Ticket — xem | V (all) | V (all) | V (chi nhánh) | V | V | **V (được giao)** | V (vệ sinh) | V | V (của mình) |
| 86 | Ticket — tạo | C | – | C | **C** | – | C | C | C | **C** |
| 87 | Ticket — phân công | U | – | **U** | U | – | – | – | – | – |
| 88 | Ticket — cập nhật tiến độ | U | – | U | U | – | **U** | U | – | – |
| 89 | Ticket — ghi nhận chi phí | U | – | U | – | U | **U** | – | – | – |
| 90 | Ticket — đóng | U | – | **U** | U | – | Đề xuất | – | – | Xác nhận |
| 91 | Cấu hình SLA | M | V | **M** | – | – | – | – | – | – |
| | **TÀI SẢN** |
| 92 | Tài sản — xem | V | V | **V** | V | V | V | V | – | – |
| 93 | Tài sản — CRUD | M | V | **M** | V | V | – | – | – | – |
| 94 | Tài sản — cập nhật tình trạng | U | – | U | U | – | **U** | U | – | – |
| 95 | Tài sản — điều chuyển | U | – | **U** | – | – | – | – | – | – |
| 96 | Khấu hao | V | V | V | – | **M** | – | – | – | – |
| | **VỆ SINH** |
| 97 | Công việc vệ sinh — xem | V | V | **V** | V | – | – | **V** | – | – |
| 98 | Công việc vệ sinh — giao | C, U | – | **C, U** | C, U | – | – | – | – | – |
| 99 | Công việc vệ sinh — hoàn thành | U | – | U | U | – | – | **U** | – | – |
| | **NỘI QUY & VI PHẠM** |
| 100 | Nội quy — xem | V | V | V | V | – | V | V | V | **V** |
| 101 | Nội quy — soạn/sửa | M | V | **M** | – | – | – | – | – | – |
| 102 | Vi phạm — ghi nhận | C | – | C | **C** | – | – | C | **C** | – |
| 103 | Vi phạm — duyệt & áp phạt | A | V | **A** | – | – | – | – | – | – |
| 104 | Vi phạm — miễn phạt | A | A | **A** | Đề xuất | – | – | – | – | Khiếu nại |
| | **KHÁCH RA VÀO** |
| 105 | Sổ khách thăm — xem | V | V | **V** | V | – | – | – | **V** | V (của mình) |
| 106 | Ghi nhận vào/ra | C, U | – | C, U | **C, U** | – | – | – | **C, U** | – |
| | **NHÂN VIÊN** |
| 107 | Nhân viên — xem | V (all) | V (all) | **V (chi nhánh)** | – | V | – | – | – | – |
| 108 | Nhân viên — tạo/sửa | M | – | **C, U (chi nhánh)** | – | – | – | – | – | – |
| 109 | **Gán vai trò** | **M** | – | U (vai trò cấp dưới, chi nhánh mình) | – | – | – | – | – | – |
| 110 | Vô hiệu hóa tài khoản | U | – | **U (chi nhánh)** | – | – | – | – | – | – |
| 111 | Ca làm việc | M | V | **M** | V | – | V | V | V | – |
| | **THÔNG BÁO** |
| 112 | Gửi thông báo cá nhân | C | – | C | **C** | C | – | – | – | – |
| 113 | Gửi thông báo toàn chi nhánh | C | – | **C** | Đề xuất | – | – | – | – | – |
| 114 | Gửi thông báo toàn hệ thống | **C** | C | – | – | – | – | – | – | – |
| 115 | Quản lý template thông báo | **M** | V | V | – | – | – | – | – | – |
| | **BÁO CÁO** |
| 116 | BC lấp đầy | V + E | **V + E (all)** | V + E (chi nhánh) | V | V | – | – | – | – |
| 117 | BC doanh thu | V + E | **V + E (all)** | V + E (chi nhánh) | – | **V + E** | – | – | – | – |
| 118 | BC chi phí | V + E | **V + E (all)** | V + E (chi nhánh) | – | **V + E** | – | – | – | – |
| 119 | **BC lãi lỗ (P&L)** | V + E | **V + E (all)** | V (chi nhánh) | – | V + E | – | – | – | – |
| 120 | BC công nợ | V + E | V + E | V + E (chi nhánh) | V | **V + E** | – | – | – | – |
| 121 | BC dòng tiền | V + E | **V + E** | V (chi nhánh) | – | **V + E** | – | – | – | – |
| 122 | BC khách thuê | V + E | V + E | V + E (chi nhánh) | V | V | – | – | – | – |
| 123 | BC hợp đồng | V + E | V + E | V + E | V | V | – | – | – | – |
| 124 | BC bảo trì | V + E | V | **V + E** | V | – | V | – | – | – |
| 125 | BC tài sản | V + E | V | **V + E** | – | V | V | – | – | – |
| | **HỆ THỐNG** |
| 126 | Audit log — xem toàn bộ | **V** | **V** | – | – | – | – | – | – | – |
| 127 | Audit log — xem chi nhánh | V | V | **V** | – | V (tài chính) | – | – | – | – |
| 128 | Import dữ liệu hàng loạt | **I** | – | I (có duyệt) | – | I (tài chính) | – | – | – | – |
| 129 | Export dữ liệu hàng loạt | **E** | E | – | – | E | – | – | – | – |

---

## 3. Mười quy tắc phân quyền bắt buộc

### R1. Owner là read-only
Chủ doanh nghiệp **xem tất cả, không sửa gì** (trừ phê duyệt vượt hạn mức).

*Lý do:* (a) tránh rủi ro thao tác nhầm trên dữ liệu tài chính; (b) giữ audit trail sạch — mọi thay đổi đều có người vận hành chịu trách nhiệm; (c) buộc quy trình chạy đúng thay vì "sếp bảo sửa giúp".

Nếu Owner cần sửa thật, cấp thêm vai trò Super Admin — nhưng đó là hành động có ý thức, có audit.

### R2. Lễ tân KHÔNG được export danh sách khách
Đây là ô `–` có chủ đích ở dòng 24.

*Lý do:* Đây là rủi ro thật tại Việt Nam — nhân viên nghỉ việc mang theo danh sách khách bán cho KTX đối thủ. Lễ tân cần **tra cứu từng khách**, không cần tải cả danh sách.

Nếu thật sự cần (in danh sách phòng để đi kiểm tra), tạo permission hẹp riêng: `report:room_roster` chỉ xuất tên + phòng, không có SĐT/CCCD, và có watermark tên người in.

### R3. Hóa đơn đã phát hành là bất biến
Không ai — kể cả Super Admin — có quyền `UPDATE` trên hóa đơn `ISSUED`. Chỉ có `invoice:adjust` tạo bút toán điều chỉnh mới, tham chiếu hóa đơn gốc.

*Lý do:* Đây là nền tảng của khả năng kiểm toán. Nếu sửa được thì mọi con số lịch sử đều mất giá trị.

### R4. Tách ba quyền tiền bạc
| Quyền | Ai có | Vì sao tách |
|---|---|---|
| **Xem tiền** (`invoice:view`, `debt:view`) | Nhiều vai trò | Cần để làm việc |
| **Thu tiền** (`payment:create`) | Lễ tân, Kế toán | Hành động vận hành |
| **Sửa số tiền** (`invoice:adjust`, `invoice:discount`) | Kế toán (+ duyệt) | Hành động rủi ro cao |

Gộp ba quyền này là lỗ hổng kiểm soát nội bộ kinh điển.

### R5. Nguyên tắc bốn mắt cho hành động rủi ro cao
Người **đề xuất** và người **duyệt** phải khác nhau, hệ thống cưỡng chế điều này.

Áp dụng cho: hoàn cọc, tịch thu cọc, xóa nợ, hủy hóa đơn, bút toán điều chỉnh, đảo thanh toán, giảm giá vượt hạn mức, duyệt chênh lệch két.

### R6. Hạn mức phê duyệt cấu hình được theo chi nhánh

| Hành động | Mức mặc định đề xuất | Vượt mức thì ai duyệt |
|---|---|---|
| Giảm giá trên 1 hóa đơn | 500.000đ | Owner |
| Hoàn cọc | 5.000.000đ | Owner |
| Xóa nợ | 1.000.000đ | Owner (bắt buộc, mọi mức) |
| Chênh lệch két | 50.000đ | Branch Manager |
| Chi phí | 2.000.000đ | Owner |

Lưu trong `roles.limits` và `branches.approvalLimits`. **Không hard-code.**

### R7. Phạm vi chi nhánh áp dụng cả trên báo cáo
Lỗi hay gặp: chặn scope ở API danh sách nhưng quên ở API tổng hợp/báo cáo/dashboard.

**Quy tắc:** mọi truy vấn đều đi qua repository, biến phiên `app.*` được set trước khi query (kích hoạt RLS). Không có ngoại lệ. Có test tự động cho từng endpoint để bắt trường hợp quên set context.

### R8. Quyền có thời hạn
`user_role_assignments` có `validUntil`. Dùng cho: nhân viên hỗ trợ chi nhánh khác tạm thời, thực tập sinh, kiểm toán viên bên ngoài.

Job hằng ngày thu hồi quyền hết hạn và thông báo.

### R9. Quyền theo quyền sở hữu (ownership)
Một số quyền chỉ áp dụng trên bản ghi của chính mình:
- Kỹ thuật: chỉ cập nhật ticket được giao cho mình (`ticket:view_assigned`)
- Lễ tân: chỉ xem/đóng ca két của chính mình
- Khách thuê: chỉ xem hợp đồng, hóa đơn, ticket của mình

Đây là lớp CONDITION, kiểm tra trong service layer.

### R10. Xóa là soft delete
Mọi `delete` mặc định là `deletedAt = now()`. Hard delete chỉ Super Admin và chỉ khi:
- Không có chứng từ tài chính tham chiếu
- Có xác nhận hai bước
- Ghi audit với lý do

Chi nhánh và tòa nhà **không bao giờ** hard delete — chỉ chuyển `ARCHIVED`.

---

## 4. Vai trò — tóm tắt trách nhiệm

| Vai trò | Một câu mô tả | Quyền nguy hiểm nhất nắm giữ |
|---|---|---|
| **Super Admin** | Quản trị kỹ thuật toàn hệ thống, không tham gia vận hành hằng ngày | Gán vai trò, xóa dữ liệu, cấu hình hệ thống |
| **Owner** | Nhìn toàn cảnh tài chính, phê duyệt ngoại lệ lớn | Duyệt xóa nợ, duyệt hoàn cọc lớn |
| **Branch Manager** | Chịu trách nhiệm kết quả kinh doanh và vận hành 1+ chi nhánh | Duyệt hóa đơn, duyệt két, duyệt điều chỉnh |
| **Receptionist** | Tuyến đầu: tiếp khách, thu tiền, check-in/out | Thu tiền mặt |
| **Accountant** | Đảm bảo sổ sách đúng và khớp | Bút toán điều chỉnh, đối soát |
| **Technician** | Xử lý sự cố kỹ thuật | Ghi nhận chi phí sửa chữa |
| **Housekeeper** | Vệ sinh, báo cáo tình trạng phòng | Đổi trạng thái giường |
| **Security** | Kiểm soát ra vào, ghi nhận vi phạm an ninh | Ghi nhận vi phạm |
| **Tenant** | Khách thuê — tự phục vụ | Không có quyền ghi trên dữ liệu vận hành |

### Vai trò tùy chỉnh
Hệ thống cho phép tạo vai trò mới bằng cách chọn tập permission. Ví dụ thực tế:
- **"Quản lý vùng"** = Branch Manager với scope nhiều chi nhánh
- **"Kế toán trưởng"** = Accountant + quyền duyệt
- **"Lễ tân ca đêm"** = Receptionist bỏ quyền thu tiền (chỉ ghi nhận, sáng hôm sau ca ngày xác nhận)
- **"Kiểm toán viên"** = chỉ `view` + `audit:view`, có `validUntil`

Vai trò hệ thống (`isSystem: true`) không cho sửa/xóa để tránh tự khóa mình ra khỏi hệ thống.

---

## 5. Test phân quyền — bắt buộc, không thương lượng

Postgres/Supabase có **Row-Level Security native** — database tự chặn sai phạm vi chi nhánh kể cả khi code tầng ứng dụng có bug (xem [11-architecture.md §2 D5](11-architecture.md)). RLS là lớp chặn đầu tiên và an toàn nhất, nhưng **không thay thế được test phân quyền**: RLS chỉ kiểm soát lớp SCOPE (dữ liệu chi nhánh nào), còn lớp PERMISSION (được làm hành động gì) và CONDITION (có vượt hạn mức không) vẫn hoàn toàn do code tầng ứng dụng quyết định — chỉ test tự động mới bắt được lỗi ở hai lớp này.

Bộ test tối thiểu cho mỗi endpoint:

```
1. User chi nhánh B gọi API đọc dữ liệu chi nhánh A → 404 (không phải 403, tránh lộ sự tồn tại)
2. User chi nhánh B gọi API ghi lên dữ liệu chi nhánh A → 404
3. User không có permission gọi API → 403
4. User có permission nhưng vượt hạn mức → 403 kèm thông báo "cần phê duyệt"
5. Endpoint báo cáo/tổng hợp: user chi nhánh B chỉ thấy số liệu chi nhánh B
6. Khách thuê gọi API xem hóa đơn của khách khác → 404
7. Người đề xuất tự duyệt chính đề xuất của mình → 403
```

Bổ sung một test "canary" chạy trong CI: quét toàn bộ route, phát hiện route nào chưa có test phân quyền → fail build.
