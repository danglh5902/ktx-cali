# 12 — Database Schema (PostgreSQL / Supabase)

## Quy ước chung

| Quy ước | Chi tiết |
|---|---|
| **Khóa chính** | `id: uuid default gen_random_uuid()` ở mọi bảng |
| **Đa tổ chức** | `org_id: uuid` (FK → `organizations`) ở mọi bảng nghiệp vụ |
| **Phân chi nhánh** | `branch_id: uuid` (FK → `branches`) ở mọi bảng nghiệp vụ, kể cả cấp con — dùng cho index và RLS policy |
| **Row-Level Security** | Mọi bảng nghiệp vụ `ENABLE ROW LEVEL SECURITY` + policy lọc theo `org_id`/`branch_id` từ biến phiên (`current_setting('app.*')`) — xem [11-architecture.md §2 D5](11-architecture.md) |
| **Tiền** | `bigint`, đơn vị **đồng**. Ký hiệu `VND` dưới đây |
| **Ngày thuần** | `start_date`, `end_date`... kiểu `date` (không có giờ) |
| **Xóa mềm** | `deleted_at: timestamptz null` — partial index `WHERE deleted_at IS NULL`, mọi truy vấn lọc theo đó |
| **Audit cơ bản** | `created_at`, `created_by`, `updated_at`, `updated_by` |
| **Mã chứng từ** | Sinh từ bảng `counters`, có tiền tố chi nhánh, dùng `SELECT ... FOR UPDATE` hoặc `INSERT ... ON CONFLICT DO UPDATE RETURNING` để an toàn khi đồng thời |
| **Index** | `branch_id` (hoặc `org_id`) luôn ở **vị trí đầu** compound index |
| **Kiểu liệt kê (enum)** | Dùng Postgres `enum` type hoặc `text` + `CHECK constraint`, tùy độ ổn định của tập giá trị |

---

## Nhóm 1 — Tổ chức & Phân quyền

### `organizations`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | uuid | PK |
| `code` | text | unique |
| `name` | text | |
| `tax_code` | text | MST |
| `address`, `phone`, `email` | text | |
| `logo` | text | URL Cloudinary |
| `settings` | jsonb | Cấu hình mặc định cấp tổ chức |
| `status` | text | `ACTIVE` / `SUSPENDED` |

**Index:** `(code)` unique

---

### `branches`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `org_id` | uuid | FK → organizations |
| `code` | text | **Bất biến.** Dùng làm tiền tố mã chứng từ |
| `name`, `short_name` | text | |
| `address` | jsonb | `{street, ward, district, province}` |
| `geo` | jsonb | `{lat, lng}` |
| `region` | text | Chuẩn bị cho báo cáo theo vùng |
| `phone`, `email`, `zalo_oa_id` | text | |
| `manager_id` | uuid | FK → users |
| `opening_hours` | jsonb | |
| `curfew_time` | text | `"23:00"` |
| `gender_policy` | text | `MALE` / `FEMALE` / `MIXED` |
| `billing_day_of_month` | int | Ngày chốt kỳ |
| `due_day_of_month` | int | Hạn thanh toán |
| `late_fee_policy` | jsonb | `{graceDays, feeType, feeValue, maxFee}` |
| `deposit_policy` | jsonb | `{months, refundDays, cancelPolicy[]}` |
| `approval_limits` | jsonb | `{discount, refund, writeOff, expense, cashVariance}` — VND |
| `electricity_price`, `water_price` | bigint | Đơn giá hiện hành |
| `utility_billing_mode` | jsonb | `{electric: 'METER'|'PER_PERSON'|'INCLUDED', water: ...}` |
| `water_per_person_amount` | bigint | Khi tính theo đầu người |
| `amenities` | text[] | |
| `images` | text[] | URL Cloudinary |
| `description`, `notes` | text | |
| `status` | text | `ACTIVE` / `INACTIVE` / `ARCHIVED` |
| `opened_at`, `closed_at` | date | |

**Index:** `(org_id, code)` unique · `(org_id, status)` · `(manager_id)` · `(org_id, region)`

---

### `buildings`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `org_id`, `branch_id` | uuid | |
| `code`, `name` | text | |
| `gender_policy` | text | |
| `has_elevator` | boolean | |
| `amenities` | text[] | |
| `monthly_rent_cost` | bigint | Chi phí thuê mặt bằng — đầu vào P&L |
| `main_electric_meter_id`, `main_water_meter_id` | uuid | FK → utility_meters |
| `address` | text | Nếu khác địa chỉ chi nhánh |
| `images` | text[] | |
| `notes` | text | |
| `status` | text | `ACTIVE` / `RENOVATING` / `INACTIVE` |

**Index:** `(branch_id, code)` unique · `(branch_id, status)`

---

### `floors`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `org_id`, `branch_id`, `building_id` | uuid | |
| `number` | text | `"1"`, `"G"`, `"L"` — không phải int |
| `sort_order` | int | Để sắp xếp đúng |
| `name` | text | |
| `gender_policy` | text | Override của tòa |
| `layout_image` | text | URL Cloudinary |
| `status` | text | |

**Index:** `(building_id, number)` unique · `(branch_id, sort_order)`

---

### `room_types`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `org_id`, `branch_id` | uuid | **Định nghĩa theo chi nhánh** |
| `code`, `name` | text | |
| `capacity` | int | |
| `base_price` | bigint | Giá giường cơ bản |
| `whole_room_price` | bigint | Giá thuê nguyên phòng |
| `default_amenities` | text[] | |
| `description` | text | |
| `status` | text | |

**Index:** `(branch_id, code)` unique

---

### `rooms`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `org_id`, `branch_id`, `building_id`, `floor_id` | uuid | Tất cả denormalized (FK thật) |
| `code` | text | unique theo `branch_id` |
| `name` | text | |
| `room_type_id` | uuid | FK → room_types |
| `capacity` | int | Trần số người |
| `actual_bed_count` | int | Dẫn xuất, cập nhật khi thêm/bớt giường |
| `area_m2` | numeric | |
| `price_override` | bigint null | |
| `whole_room_price` | bigint null | |
| `amenities` | text[] | `AIR_CON`, `PRIVATE_TOILET`, `WATER_HEATER`, `BALCONY`, `WARDROBE`, `DESK`, `FRIDGE`, `WASHING_MACHINE`, `WINDOW`, `FAN`, `TV` |
| `has_private_toilet` | boolean | Tách riêng vì ảnh hưởng giá lớn |
| `direction` | text | |
| `electric_meter_id`, `water_meter_id` | uuid null | FK → utility_meters |
| `shared_meter_group_id` | uuid null | Khi dùng chung đồng hồ |
| `images` | text[] | |
| `notes` | text | |
| `status` | text | `ACTIVE` / `MAINTENANCE` / `RENOVATING` / `INACTIVE` |

**Index:** `(branch_id, code)` unique · `(floor_id)` · `(branch_id, status)` · `(room_type_id)` · `(electric_meter_id)`

---

### `beds`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `org_id`, `branch_id`, `building_id`, `floor_id`, `room_id` | uuid | **Tất cả denormalized** để vẽ sơ đồ 1 truy vấn |
| `code` | text | unique theo `branch_id` |
| `label` | text | "Giường tầng dưới cạnh cửa sổ" |
| `bed_type` | text | `SINGLE` / `BUNK_LOWER` / `BUNK_UPPER` / `DOUBLE` |
| `price_override` | bigint null | |
| `status` | text | `AVAILABLE` / `RESERVED` / `OCCUPIED` / `CHECKOUT_PENDING` / `CLEANING` / `MAINTENANCE` / `BLOCKED` |
| `current_assignment_id` | uuid null | FK → bed_assignments |
| `blocked_reason`, `blocked_until` | text, timestamptz | |
| `notes` | text | |

**Index:** `(branch_id, code)` unique · `(room_id, status)` · `(branch_id, status)` · `(floor_id, status)` · `(current_assignment_id)`

---

### `users`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | uuid | **= Supabase Auth user id** (bảng này mở rộng `auth.users` bằng 1-1, không tự sinh id riêng) |
| `org_id` | uuid | |
| `email` | text | unique — tài khoản đăng nhập nhân viên |
| `phone` | text | unique nullable — đăng nhập khách thuê (Supabase Auth Phone OTP) |
| `user_type` | text | `STAFF` / `TENANT` |
| `staff_id` \| `customer_id` | uuid | Trỏ tới hồ sơ tương ứng |
| `full_name`, `avatar` | text | |
| `status` | text | `ACTIVE` / `INACTIVE` / `LOCKED` |
| `must_change_password` | boolean | |
| `last_login_at`, `last_login_ip` | | |
| `failed_login_count`, `locked_until` | | |
| `two_factor_enabled` | boolean | Phase 3 — dùng Supabase Auth MFA |
| `notification_preferences` | jsonb | |

**Index:** `(email)` unique · `(phone)` unique nullable · `(org_id, user_type, status)` · `(staff_id)` · `(customer_id)`

> Mật khẩu, session, token và MFA do **Supabase Auth** quản lý (bảng `auth.users` nội bộ của Supabase) — không tự lưu `password_hash` trong bảng `users` của ứng dụng.

---

### `roles`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `org_id` | uuid | |
| `code`, `name`, `description` | text | |
| `permissions` | text[] | Danh sách permission |
| `limits` | jsonb | `{discountMax, refundApprovalMax, ...}` VND |
| `is_system` | boolean | Không cho sửa/xóa |
| `status` | text | |

**Index:** `(org_id, code)` unique

---

### `user_role_assignments`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `org_id`, `user_id`, `role_id` | uuid | |
| `scope` | text | `ALL` / `BRANCH` |
| `branch_ids` | uuid[] | Khi `scope = BRANCH` |
| `valid_from`, `valid_until` | timestamptz | `valid_until = null` là vô thời hạn |
| `granted_by`, `granted_at` | | |
| `revoked_by`, `revoked_at`, `revoke_reason` | | |

**Index:** `(user_id, valid_until)` · `(org_id, role_id)` · GIN trên `(branch_ids)`

> `branch_ids` được nạp vào biến phiên Postgres (`app.allowed_branch_ids`) khi bắt đầu mỗi request — dùng trực tiếp trong RLS policy, xem [11-architecture.md §2 D5](11-architecture.md).

---

### `staff`
| Cột | Kiểu |
|---|---|
| `org_id`, `employee_code`, `full_name`, `date_of_birth`, `gender`, `id_number` |
| `phone`, `email`, `address` |
| `position`, `department` |
| `branch_ids` (uuid[]), `primary_branch_id` |
| `hire_date`, `termination_date`, `termination_reason` |
| `emergency_contact` (jsonb) |
| `documents` (jsonb[]) |
| `status` — `ACTIVE` / `ON_LEAVE` / `SUSPENDED` / `TERMINATED` |

**Index:** `(org_id, employee_code)` unique · GIN trên `(branch_ids)` + `(status)` · `(id_number)`

---

## Nhóm 2 — Khách thuê & Lưu trú

### `customers`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `org_id` | uuid | |
| `customer_code` | text | unique |
| `full_name`, `date_of_birth`, `gender` | | `gender` bắt buộc — dùng chặn xếp sai tòa |
| `id_type` | text | `CCCD` / `CMND` / `PASSPORT` / `BIRTH_CERT` |
| `id_number` | text | unique theo `org_id` (cảnh báo nếu trùng) |
| `id_issue_date`, `id_issue_place` | | Cần cho tạm trú |
| `phone` | text | Chuẩn hóa `+84...` |
| `phone_history` | text[] | Số cũ — để đối soát chuyển khoản cũ |
| `email`, `zalo_phone` | text | |
| `permanent_address` | jsonb | Bắt buộc cho tạm trú |
| `hometown` | text | |
| `emergency_contact` | jsonb | `{name, relationship, phone, address}` — bắt buộc |
| `secondary_contact` | jsonb | |
| `payer` | jsonb | `{name, phone, relationship, bankAccount}` — **người trả tiền ≠ người ở** |
| `occupation` | text | `STUDENT` / `EMPLOYEE` / `OTHER` |
| `school`, `company`, `student_id` | text | Phân tích nguồn khách |
| `photo`, `id_front_image`, `id_back_image` | text | **Dữ liệu nhạy cảm** — Cloudinary signed URL |
| `other_documents` | jsonb[] | |
| `current_branch_id`, `current_room_id`, `current_bed_id` | uuid | Denormalized để tra cứu nhanh |
| `current_contract_id` | uuid | |
| `credit_balance` | bigint | Số dư trả thừa |
| `status` | text | `PROSPECT` / `RESERVED` / `ACTIVE` / `EXPIRING` / `CHECKED_OUT` / `CHECKED_OUT_WITH_DEBT` / `SUSPENDED` / `BLACKLISTED` |
| `is_blacklisted`, `blacklist_reason`, `blacklisted_at` | | |
| `temporary_residence_status` | text | `NOT_REGISTERED` / `PENDING` / `REGISTERED` |
| `source` | text | Nguồn khách |
| `preferences`, `internal_notes` | text | |
| `merged_into_customer_id` | uuid | Khi gộp hồ sơ trùng |
| `anonymized_at` | timestamptz | Khi ẩn danh hóa |

**Index:** `(org_id, customer_code)` unique · `(org_id, id_number)` unique nullable · `(org_id, phone)` · `(current_branch_id, status)` · GIN full-text trên `(full_name)` · `(org_id, status)`

---

### `bookings`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `org_id`, `branch_id` | uuid | |
| `booking_no` | text | unique |
| `customer_id` | uuid | |
| `bed_id` | uuid null | `null` khi chưa xếp giường |
| `room_id` | uuid null | |
| `expected_check_in_date`, `expected_duration_months` | | |
| `quoted_price` | bigint | Snapshot giá đã báo |
| `deposit_required`, `deposit_paid` | bigint | |
| `hold_until` | timestamptz | **Bắt buộc** — hết hạn tự hủy |
| `status` | text | `NEW` / `CONFIRMED` / `DEPOSIT_PAID` / `CHECKED_IN` / `CANCELLED` / `EXPIRED` / `NO_SHOW` |
| `source` | text | |
| `roommate_preferences` | text | |
| `cancel_reason`, `cancelled_by`, `cancelled_at` | | |
| `contract_id` | uuid | Hợp đồng sinh ra từ booking |
| `notes` | text | |

**Index:** `(branch_id, status)` · `(booking_no)` unique · `(customer_id)` · `(bed_id, status)` · `(hold_until, status)` (cho job hết hạn)

---

### `contracts`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `org_id`, `branch_id` | uuid | |
| `contract_no` | text | unique toàn hệ thống |
| `version` | int | Số phụ lục |
| `customer_id` | uuid | |
| `co_tenant_ids` | uuid[] | Người ở cùng (thuê nguyên phòng) |
| `guardian_info` | jsonb | Khách vị thành niên |
| `whole_room` | boolean | |
| `bed_ids` | uuid[] | Giường **dự kiến**. Thực tế lấy từ `bed_assignments` |
| `start_date`, `end_date` | date | |
| `duration_months` | int | |
| `auto_renew_monthly` | boolean | |
| `notice_period_days` | int | Mặc định 30 |
| `monthly_rent` | bigint | **Snapshot** |
| `deposit_amount`, `deposit_months` | bigint, int | |
| `billing_cycle` | text | `MONTHLY` / `QUARTERLY` / `SEMESTER` / `YEARLY` |
| `billing_day_of_month`, `due_day_of_month` | int | |
| `electricity_price`, `water_price` | bigint | **Snapshot** |
| `included_service_ids` | uuid[] | |
| `discounts` | jsonb[] | `{type, value, reason, approvedBy, validFrom, validTo}` |
| `template_id` | uuid | |
| `terms_snapshot` | text | **Toàn văn điều khoản tại thời điểm ký** |
| `special_terms` | text | |
| `house_rules_version` | text | |
| `status` | text | `DRAFT` / `PENDING_APPROVAL` / `ACTIVE` / `EXPIRING` / `EXPIRED` / `TERMINATED` / `CANCELLED` |
| `approved_by`, `approved_at` | | |
| `terminated_at`, `termination_reason`, `termination_type` | | `MUTUAL` / `BY_TENANT` / `BY_LANDLORD` / `ABANDONMENT` |
| `booking_id`, `previous_contract_id`, `next_contract_id` | uuid | |
| `signature_method`, `signed_at` | | Xem ghi chú dưới |

**Index:** `(contract_no)` unique · `(branch_id, status)` · `(customer_id, status)` · `(branch_id, end_date, status)` (cho job cảnh báo hết hạn) · `(previous_contract_id)`

> **Không có `pdf_url`/`signed_pdf_url`.** Hợp đồng chỉ tồn tại dạng dữ liệu trong hệ thống (xem/duyệt qua UI); khi cần bản in để ký tay, in trực tiếp từ màn hình xem. Xem ghi chú ở [11-architecture.md §7.2](11-architecture.md) và [08-module-contracts.md](08-module-contracts.md).

---

### `bed_assignments` ★ bảng quan trọng nhất
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `org_id`, `branch_id` | uuid | |
| `contract_id`, `customer_id` | uuid | |
| `bed_id`, `room_id`, `floor_id`, `building_id` | uuid | Denormalized |
| `start_date` | date | Ngày bắt đầu ở thực tế |
| `end_date` | date null | `null` = đang ở |
| `reason` | text | `CHECK_IN` / `TRANSFER_BED` / `TRANSFER_ROOM` / `TRANSFER_BUILDING` / `TRANSFER_BRANCH` / `RENEWAL` / `CHECK_OUT` |
| `daily_rate` | bigint | **Snapshot giá ngày** — không lookup ngược |
| `monthly_rate` | bigint | Snapshot |
| `transfer_reason` | text | |
| `previous_assignment_id` | uuid | Chuỗi lịch sử |
| `created_by`, `created_at` | | |

**Index:**
- `(bed_id)` **unique partial** `WHERE end_date IS NULL` — ★ chống bán trùng giường ở tầng database
- `(contract_id, start_date)`
- `(customer_id, start_date desc)`
- `(bed_id, start_date desc)` — lịch sử người ở
- `(branch_id, start_date, end_date)` — tính lấp đầy
- `(branch_id, end_date)` — tìm assignment đang mở

---

### `checkin_checkout_records`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `org_id`, `branch_id`, `type` | | `CHECK_IN` / `CHECK_OUT` |
| `contract_id`, `customer_id`, `bed_id`, `room_id`, `assignment_id` | uuid | |
| `performed_at`, `performed_by` | | |
| `checklist` | jsonb[] | `{item, done, note}` |
| `asset_inventory` | jsonb[] | `{assetId, name, quantity, condition, note}` |
| `photos` | text[] | **Bắt buộc** — URL Cloudinary |
| `keys_handed_over` | jsonb[] | `{type, code, quantity}` |
| `utility_readings` | jsonb | Chỉ số lúc vào/ra |
| `damages` | jsonb[] | `{description, estimatedCost, photos[], chargedToTenant}` — chỉ ở check-out |
| `tenant_signature`, `staff_signature` | text | Ảnh chữ ký (Cloudinary) hoặc xác nhận điện tử |
| `notes` | text | |

**Index:** `(contract_id, type)` · `(branch_id, performed_at desc)` · `(customer_id)`

> **Không có `document_url` (biên bản PDF).** Biên bản kiểm kê xem trực tiếp trong hệ thống (checklist + ảnh 2 chiều); in khi cần từ màn hình xem.

---

## Nhóm 3 — Tài chính

### `billing_periods`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `org_id`, `branch_id` | uuid | |
| `code` | text | `"2026-09"` |
| `period_from`, `period_to` | date | |
| `issue_date`, `due_date` | date | |
| `status` | text | `OPEN` / `READY` / `GENERATED` / `ISSUED` / `CLOSED` |
| `invoice_count`, `total_amount` | int, bigint | |
| `generated_at`, `generated_by`, `issued_at`, `issued_by`, `closed_at` | | |

**Index:** `(branch_id, code)` unique · `(branch_id, status)`

---

### `invoices`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `org_id`, `branch_id` | uuid | |
| `invoice_no` | text | unique toàn hệ thống |
| `invoice_type` | text | `PERIODIC` / `CHECKOUT_SETTLEMENT` / `ONE_TIME` |
| `contract_id`, `customer_id`, `billing_period_id` | uuid | |
| `period_from`, `period_to` | date | |
| `issue_date`, `due_date` | date | |
| `subtotal`, `discount_total`, `penalty_total`, `adjustment_total`, `grand_total` | bigint | |
| `paid_amount`, `balance` | bigint | Cập nhật khi có thanh toán |
| `status` | text | `DRAFT` / `ISSUED` / `PARTIALLY_PAID` / `PAID` / `OVERDUE` / `VOID` |
| `snapshot` | jsonb | `{customerName, customerPhone, idNumber, address, branchName, branchAddress, roomCode, bedCode, contractNo, monthlyRent}` — **đóng băng để xem lại đúng nội dung cũ** |
| `issued_by`, `issued_at` | | |
| `voided_by`, `voided_at`, `void_reason` | | |
| `sent_at`, `sent_channels` | timestamptz, text[] | |
| `notes` | text | |

**Index:** `(invoice_no)` unique · `(contract_id, billing_period_id)` **unique** (chống sinh trùng) · `(branch_id, status, due_date)` (aging) · `(customer_id, status)` · `(branch_id, issue_date)` · `(branch_id, billing_period_id, status)`

> **Không có `pdf_url`.** Hóa đơn xem trực tiếp trong hệ thống (web admin hoặc portal khách); khi cần bản in, in từ màn hình xem thay vì hệ thống tạo/lưu PDF.

---

### `invoice_lines`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `org_id`, `branch_id`, `invoice_id` | uuid | |
| `line_type` | text | `RENT` / `ELECTRICITY` / `WATER` / `SERVICE_RECURRING` / `SERVICE_USAGE` / `PENALTY` / `LATE_FEE` / `DAMAGE` / `ONE_TIME` / `DISCOUNT` / `ADJUSTMENT` |
| `description` | text | Câu lễ tân đọc cho khách |
| `calculation_note` | text | **"Chỉ số 4521 → 4587 = 66 kWh × 3.500đ"** — trường quan trọng hay bị quên |
| `quantity`, `unit`, `unit_price` | | |
| `amount` | bigint | Âm với `DISCOUNT` |
| `period_from`, `period_to` | date | Cho dòng prorate |
| `source_type`, `source_id` | | Trỏ về bản ghi nguồn (`utility_readings`, `violations`, `service_usages`...) |
| `sort_order` | int | |

**Index:** `(invoice_id, sort_order)` · `(branch_id, line_type, period_from)` (báo cáo doanh thu theo nguồn) · `(source_type, source_id)`

---

### `invoice_adjustments`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `org_id`, `branch_id`, `invoice_id` | uuid | |
| `adjustment_no` | text | unique |
| `amount` | bigint | Dương hoặc âm |
| `reason` | text | **Bắt buộc** |
| `evidence_urls` | text[] | URL Cloudinary |
| `requested_by`, `requested_at` | | |
| `approved_by`, `approved_at` | | **Phải khác `requested_by`** |
| `status` | text | `PENDING` / `APPROVED` / `REJECTED` |
| `reject_reason` | text | |

**Index:** `(invoice_id)` · `(branch_id, status)` · `(adjustment_no)` unique

---

### `payments`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `org_id`, `branch_id` | uuid | |
| `payment_no` | text | unique |
| `customer_id` | uuid | |
| `payer_name`, `payer_account` | text | Người trả thực tế (phụ huynh) |
| `amount` | bigint | |
| `method` | text | `CASH` / `BANK_TRANSFER` / `VIETQR` / `EWALLET` / `GATEWAY` / `DEPOSIT_OFFSET` / `CREDIT_OFFSET` |
| `external_txn_id` | text | Mã GD ngân hàng/cổng (VietQR/Casso/SePay) |
| `idempotency_key` | text | **unique nullable — chống ghi trùng** |
| `bank_ref`, `bank_statement_id` | text | |
| `received_at`, `received_by` | | |
| `cash_session_id` | uuid | Bắt buộc khi `method = CASH` |
| `allocated_amount`, `unallocated_amount` | bigint | |
| `reconciled_at`, `reconciled_by` | | |
| `status` | text | `PENDING` / `CONFIRMED` / `FAILED` / `REVERSED` |
| `reversed_by`, `reversed_at`, `reverse_reason`, `reversal_of_payment_id` | | |
| `note` | text | |

**Index:** `(idempotency_key)` **unique nullable** · `(external_txn_id)` **unique nullable** · `(payment_no)` unique · `(branch_id, received_at desc)` · `(customer_id, received_at desc)` · `(cash_session_id)` · `(branch_id, status, reconciled_at)`

> **Không có `receipt_url`.** Phiếu thu xem/tải trực tiếp từ màn hình danh sách thanh toán.

---

### `payment_allocations`
| Cột | Kiểu |
|---|---|
| `org_id`, `branch_id`, `payment_id`, `invoice_id` |
| `amount` — bigint |
| `allocated_by`, `allocated_at` |
| `is_automatic` — boolean (FIFO tự động hay người chỉ định) |
| `reversed_at`, `reversed_by` |

**Index:** `(payment_id)` · `(invoice_id)` · `(branch_id, allocated_at)`

---

### `deposit_ledger`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `org_id`, `branch_id`, `contract_id`, `customer_id` | uuid | |
| `entry_no` | text | unique |
| `entry_type` | text | `HOLD` / `TOP_UP` / `DEDUCT_DEBT` / `DEDUCT_DAMAGE` / `DEDUCT_PENALTY` / `REFUND` / `FORFEIT` / `TRANSFER_IN` / `TRANSFER_OUT` |
| `amount` | bigint | Dương với thu vào, âm với chi ra |
| `balance_after` | bigint | Số dư sau bút toán — để đối chiếu |
| `reason` | text | Bắt buộc với `DEDUCT_*`, `FORFEIT` |
| `related_invoice_id`, `related_payment_id`, `related_ticket_id` | uuid | |
| `requested_by`, `approved_by`, `approved_at`, `executed_by`, `executed_at` | | |
| `status` | text | `PENDING` / `APPROVED` / `EXECUTED` / `REJECTED` |
| `refund_method`, `refund_due_date` | | |
| `evidence_urls` | text[] | URL Cloudinary |

**Index:** `(contract_id, created_at)` · `(customer_id)` · `(branch_id, status)` · `(branch_id, refund_due_date, status)` (danh sách cọc đến hạn hoàn) · `(entry_no)` unique

---

### `cash_sessions`
| Cột | Kiểu |
|---|---|
| `org_id`, `branch_id`, `session_no`, `staff_id`, `shift_id` |
| `opened_at`, `opening_balance` — bigint |
| `closed_at`, `system_total`, `counted_total`, `variance` — bigint |
| `variance_reason` |
| `handover_note` — **ghi chú bàn giao ca** |
| `status` — `OPEN` / `PENDING_REVIEW` / `DISPUTED` / `CLOSED` |
| `reviewed_by`, `reviewed_at` |
| `deposited_to_bank` (boolean), `bank_deposit_ref`, `deposited_at` |

**Index:** `(branch_id, status)` · `(staff_id, opened_at desc)` · `(session_no)` unique · `(branch_id, opened_at desc)`

---

### `expenses`
| Cột | Kiểu |
|---|---|
| `org_id`, `branch_id`, `building_id` |
| `expense_no` — unique |
| `category` — `RENT` / `SALARY` / `UTILITIES` / `MAINTENANCE` / `CLEANING` / `EQUIPMENT` / `MARKETING` / `ADMIN` / `TAX` / `OTHER` |
| `amount` — bigint |
| `expense_date`, `paid_at` |
| `vendor`, `vendor_invoice_ref` |
| `payment_method` |
| `description` |
| `attachments` — text[] (ảnh hóa đơn qua Cloudinary) |
| `is_recurring`, `recurring_config` |
| `related_ticket_id`, `related_asset_id` |
| `allocation_rule` — khi là chi phí chung |
| `status` — `DRAFT` / `PENDING_APPROVAL` / `APPROVED` / `PAID` / `REJECTED` |
| `created_by`, `approved_by`, `approved_at` |

**Index:** `(branch_id, expense_date desc)` · `(branch_id, category, expense_date)` · `(expense_no)` unique · `(status)`

---

### `idempotency_keys`
| Cột | Kiểu |
|---|---|
| `key` — unique |
| `scope`, `request_hash`, `response_body`, `status_code` |
| `created_at` — dọn bằng job định kỳ sau 7 ngày (Postgres không có TTL index sẵn) |

**Index:** `(key)` unique · `(created_at)`

---

## Nhóm 4 — Điện nước & Dịch vụ

### `utility_meters`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `org_id`, `branch_id`, `building_id` | uuid | |
| `code`, `serial_number` | text | |
| `type` | text | `ELECTRIC` / `WATER` |
| `scope` | text | `ROOM` / `SHARED_GROUP` / `BUILDING_MAIN` |
| `room_ids` | uuid[] | Các phòng dùng đồng hồ này |
| `sharing_rule` | jsonb | `{method: 'PER_PERSON'|'PER_ROOM'|'FIXED_RATIO', ratios}` |
| `multiplier` | numeric | Hệ số nhân |
| `max_reading` | int | Số vòng tối đa (vd 99999) |
| `installed_at`, `replaced_at`, `replaced_by_meter_id` | | |
| `status` | text | `ACTIVE` / `REPLACED` / `FAULTY` |

**Index:** `(branch_id, code)` unique · GIN trên `(room_ids)` · `(branch_id, type, status)`

---

### `utility_readings`
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `org_id`, `branch_id`, `meter_id`, `room_id` | uuid | |
| `billing_period_id` | uuid | |
| `previous_reading`, `current_reading` | numeric | |
| `consumption` | numeric | **Lưu lại** dù dẫn xuất được — công thức có thể đổi |
| `is_rollover`, `is_meter_replaced` | boolean | |
| `unit_price` | bigint | **Snapshot** |
| `amount` | bigint | |
| `reading_date` | date | |
| `photo_url` | text | **Bắt buộc — bằng chứng duy nhất khi tranh chấp**, URL Cloudinary |
| `recorded_by`, `recorded_at` | | |
| `status` | text | `DRAFT` / `SUBMITTED` / `APPROVED` / `LOCKED` |
| `approved_by`, `approved_at` | | |
| `is_abnormal`, `abnormal_note` | | |
| `is_estimated`, `estimation_basis` | | Khi đồng hồ hỏng |
| `adjusted_from_reading_id` | uuid | Khi là bản sửa |

**Index:** `(meter_id, billing_period_id)` unique · `(branch_id, billing_period_id, status)` · `(room_id, reading_date desc)` · `(branch_id, is_abnormal)`

---

### `services`
| Cột | Kiểu |
|---|---|
| `org_id`, `branch_id` — **theo chi nhánh** |
| `code`, `name`, `category` |
| `price` — bigint, `unit` |
| `billing_type` — `RECURRING` / `PER_USE` / `ONE_TIME` |
| `cycle` — `MONTHLY` / `QUARTERLY` |
| `prorate_on_start`, `prorate_on_cancel` — boolean |
| `is_included_by_default`, `requires_approval` |
| `status` |

**Index:** `(branch_id, code)` unique · `(branch_id, status)`

---

### `service_subscriptions`
| Cột | Kiểu |
|---|---|
| `org_id`, `branch_id`, `contract_id`, `customer_id`, `service_id` |
| `start_date`, `end_date` |
| `quantity`, `price_snapshot` — bigint |
| `metadata` — jsonb, vd biển số xe |
| `status` — `ACTIVE` / `PAUSED` / `CANCELLED` |
| `cancelled_at`, `cancel_reason` |

**Index:** `(contract_id, status)` · `(branch_id, service_id, status)` · `(customer_id)`

---

### `service_usages`
| Cột | Kiểu |
|---|---|
| `org_id`, `branch_id`, `customer_id`, `service_id` |
| `used_at`, `quantity`, `unit_price`, `amount` — bigint |
| `recorded_by` |
| `billed_invoice_id` — đã tính vào hóa đơn nào |

**Index:** `(customer_id, used_at)` · `(branch_id, billed_invoice_id)` · `(branch_id, used_at)`

---

## Nhóm 5 — Vận hành

### `maintenance_tickets`
| Cột | Kiểu |
|---|---|
| `org_id`, `branch_id`, `building_id`, `floor_id`, `room_id`, `bed_id`, `asset_id` |
| `ticket_no` — unique |
| `category`, `title`, `description` |
| `attachments` — text[] (Cloudinary) |
| `priority` — `URGENT` / `HIGH` / `NORMAL` / `LOW` |
| `sla_response_deadline`, `sla_resolve_deadline` |
| `sla_breached`, `sla_breached_at`, `paused_duration_minutes` |
| `reported_by`, `reporter_type` (`TENANT`/`STAFF`), `reported_at` |
| `assigned_to`, `assigned_by`, `assigned_at` |
| `started_at`, `resolved_at`, `closed_at` |
| `resolution`, `resolution_attachments` — text[] |
| `labor_cost`, `parts_cost`, `total_cost` — bigint |
| `charge_to_tenant` (boolean), `charged_invoice_id`, `expense_id` |
| `status`, `merged_into_ticket_id` |
| `tenant_rating`, `tenant_feedback` |

**Index:** `(branch_id, status, priority)` · `(assigned_to, status)` · `(room_id, reported_at desc)` · `(asset_id)` · `(ticket_no)` unique · `(branch_id, sla_resolve_deadline, status)` (job escalate)

---

### `ticket_events`
| Cột | Kiểu |
|---|---|
| `ticket_id`, `branch_id`, `event_type`, `from_status`, `to_status` |
| `by`, `at`, `note`, `attachments` — text[] |

**Index:** `(ticket_id, at)`

---

### `assets`
| Cột | Kiểu |
|---|---|
| `org_id`, `branch_id`, `building_id`, `floor_id`, `room_id`, `bed_id` |
| `asset_code` — unique, `qr_code` |
| `name`, `category`, `brand`, `model`, `serial_number` |
| `location_type` — `ROOM` / `COMMON_AREA` / `STORAGE` |
| `purchase_date`, `purchase_price` — bigint, `supplier` |
| `warranty_until` |
| `depreciation_method`, `useful_life_months`, `current_book_value` — bigint |
| `condition` — `NEW` / `GOOD` / `FAIR` / `POOR` / `BROKEN` |
| `status` — `IN_USE` / `IN_REPAIR` / `IN_STORAGE` / `DISPOSED` / `LOST` |
| `repair_count`, `total_repair_cost` — bigint |
| `images` — text[], `notes` |

**Index:** `(branch_id, asset_code)` unique · `(room_id)` · `(branch_id, category, status)` · `(branch_id, warranty_until)` (cảnh báo hết bảo hành)

---

### `asset_events`
| Cột | Kiểu |
|---|---|
| `asset_id`, `branch_id`, `event_type`, `at`, `by` |
| `from_location`, `to_location`, `cost` — bigint, `note`, `ticket_id`, `attachments` — text[] |

**Index:** `(asset_id, at desc)`

---

### `housekeeping_tasks`
| Cột | Kiểu |
|---|---|
| `org_id`, `branch_id`, `room_id`, `bed_id` |
| `task_type` — `CHECKOUT_CLEANING` / `ROUTINE` / `DEEP_CLEAN` / `INSPECTION` |
| `assigned_to`, `due_at` |
| `status` — `PENDING` / `IN_PROGRESS` / `DONE` / `SKIPPED` |
| `completed_at`, `completed_by`, `photos` — text[], `issues_found` |

**Index:** `(branch_id, status, due_at)` · `(assigned_to, status)` · `(bed_id)`

---

### `house_rules`
| Cột | Kiểu |
|---|---|
| `org_id`, `branch_id`, `version`, `effective_from`, `effective_to` |
| `sections` — jsonb[] `{title, content, order}` |
| `penalty_rules` — jsonb[] `{ruleCode, name, severity, penalties: [{occurrence, type, amount}]}` |
| `status`, `published_at`, `published_by` |

**Index:** `(branch_id, version)` unique · `(branch_id, status)`

---

### `violations`
| Cột | Kiểu |
|---|---|
| `org_id`, `branch_id`, `customer_id`, `room_id` |
| `violation_no` — unique |
| `rule_code`, `rule_version` |
| `occurred_at`, `reported_by`, `description` |
| `evidence` — text[] **bắt buộc với phạt tiền**, URL Cloudinary |
| `severity`, `occurrence_count` |
| `penalty_type` — `WARNING` / `FINE` / `COMPENSATION` / `SUSPENSION` / `TERMINATION` |
| `penalty_amount` — bigint |
| `status` — `DRAFT` / `PENDING_APPROVAL` / `APPROVED` / `APPEALED` / `WAIVED` / `CHARGED` |
| `approved_by`, `approved_at` |
| `charged_invoice_id` |
| `tenant_acknowledged_at`, `appeal_reason`, `appeal_resolution` |

**Index:** `(customer_id, occurred_at desc)` · `(branch_id, status)` · `(violation_no)` unique · `(branch_id, status, charged_invoice_id)` (job tính phí)

---

### `visitor_logs`
| Cột | Kiểu |
|---|---|
| `org_id`, `branch_id`, `visitor_type` |
| `visitor_name`, `visitor_phone`, `visitor_id_number` |
| `host_customer_id`, `room_id`, `purpose` |
| `check_in_at`, `check_out_at`, `recorded_by` |
| `approved_by_host` (boolean), `approved_at` |
| `vehicle_plate`, `overnight_stay` (boolean), `notes` |

**Index:** `(branch_id, check_in_at desc)` · `(host_customer_id)` · `(branch_id, check_out_at)` (tìm người chưa ra)

---

### `staff_shifts`
| Cột | Kiểu |
|---|---|
| `org_id`, `branch_id`, `staff_id`, `date` |
| `shift_type`, `start_time`, `end_time` |
| `status` — `SCHEDULED` / `CHECKED_IN` / `COMPLETED` / `ABSENT` |
| `actual_start_at`, `actual_end_at`, `note` |

**Index:** `(branch_id, date)` · `(staff_id, date)` unique

---

## Nhóm 6 — Hệ thống

### `notifications`
| Cột | Kiểu |
|---|---|
| `org_id`, `branch_id`, `recipient_type` (`USER`/`CUSTOMER`), `recipient_id` |
| `template_code`, `title`, `body`, `data` (jsonb) |
| `channels` — text[] `IN_APP` / `EMAIL` / `ZALO` / `SMS` |
| `channel_status` — jsonb `{zalo: {status, sentAt, error}, ...}` |
| `priority`, `related_entity`, `related_entity_id` |
| `status` — `PENDING` / `SENT` / `PARTIALLY_SENT` / `FAILED` |
| `read_at`, `scheduled_at`, `sent_at`, `retry_count` |

**Index:** `(recipient_id, read_at, created_at desc)` · `(status, scheduled_at)` (job gửi) · `(branch_id, created_at desc)`

---

### `notification_templates`
| Cột | Kiểu |
|---|---|
| `org_id`, `code` — unique, `name` |
| `channels` — text[], `subject`, `body_template`, `zalo_template_id` |
| `variables` — text[], `version`, `status` |

**Index:** `(org_id, code)` unique

---

### `audit_logs` (append-only)
| Cột | Kiểu |
|---|---|
| `org_id`, `branch_id` |
| `actor_id`, `actor_name`, `actor_role` — **snapshot** |
| `action`, `entity`, `entity_id` |
| `before`, `after` — jsonb, `diff` — jsonb[] |
| `reason` — bắt buộc với nhóm nhạy cảm |
| `ip`, `user_agent`, `request_id` |
| `at` |

**Index:** `(entity, entity_id, at desc)` · `(branch_id, at desc)` · `(actor_id, at desc)` · `(action, at desc)`
Không có API `UPDATE`/`DELETE` (revoke ở tầng permission + không có route). Nhóm tài chính giữ vĩnh viễn; nhóm còn lại dọn sau 3 năm bằng job định kỳ (Postgres không có TTL index sẵn như MongoDB).

---

### `attachments`
| Cột | Kiểu |
|---|---|
| `org_id`, `branch_id`, `owner_type`, `owner_id` |
| `file_name`, `mime_type`, `size_bytes`, `cloudinary_public_id` |
| `is_sensitive` — ảnh CCCD |
| `uploaded_by`, `uploaded_at`, `deleted_at` |

**Index:** `(owner_type, owner_id)` · `(branch_id, uploaded_at desc)`

> Bảng này chỉ theo dõi **ảnh** (Cloudinary `public_id` + metadata) — hệ thống không lưu file PDF.

---

### `counters`
| Cột | Kiểu |
|---|---|
| `key` — vd `"invoice:TD:2026"` |
| `seq` — bigint |

**Index:** `(key)` unique
Sinh số an toàn khi đồng thời bằng `INSERT ... ON CONFLICT (key) DO UPDATE SET seq = counters.seq + 1 RETURNING seq` (tương đương `findOneAndUpdate` + `$inc` của MongoDB).

---

### `report_snapshots` (Phase 2)
| Cột | Kiểu |
|---|---|
| `org_id`, `branch_id`, `date`, `metric_type` |
| `values` — jsonb |
| `computed_at` |

**Index:** `(branch_id, metric_type, date)` unique · `(org_id, metric_type, date)`

---

## Tổng kết index quan trọng nhất

| Index | Vì sao then chốt |
|---|---|
| `bed_assignments (bed_id)` unique partial `WHERE end_date IS NULL` | **Chống bán trùng giường ở tầng database** |
| `payments (idempotency_key)` unique nullable | **Chống ghi nhận thanh toán trùng** |
| `payments (external_txn_id)` unique nullable | Chống webhook trùng |
| `invoices (contract_id, billing_period_id)` unique | Chống sinh hóa đơn trùng kỳ |
| `customers (org_id, id_number)` unique nullable | Chống hồ sơ trùng |
| `invoices (branch_id, status, due_date)` | Aging công nợ |
| `beds (branch_id, status)` | Sơ đồ giường |
| `contracts (branch_id, end_date, status)` | Job cảnh báo hết hạn |
| `bookings (hold_until, status)` | Job hết hạn giữ chỗ |

## Row-Level Security

Mọi bảng nghiệp vụ ở trên (trừ các bảng cấu hình toàn cục nếu có) phải `ENABLE ROW LEVEL SECURITY` và có tối thiểu 1 policy lọc theo `org_id`/`branch_id` từ biến phiên request. Mẫu policy và cách set biến phiên: [11-architecture.md §2 D5](11-architecture.md).
