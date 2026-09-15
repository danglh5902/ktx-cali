# 12 — Database Schema (MongoDB)

## Quy ước chung

| Quy ước | Chi tiết |
|---|---|
| **Khóa chính** | `_id: ObjectId` ở mọi collection |
| **Đa tổ chức** | `orgId: ObjectId` ở mọi collection nghiệp vụ |
| **Phân chi nhánh** | `branchId: ObjectId` **denormalized** xuống mọi collection nghiệp vụ, kể cả cấp con |
| **Tiền** | `Long` (Int64), đơn vị **đồng**. Ký hiệu `VND` dưới đây |
| **Ngày thuần** | `startDate`, `endDate`... lưu `Date` đặt tại 00:00 giờ VN |
| **Xóa mềm** | `deletedAt: Date \| null` — mọi truy vấn lọc `deletedAt: null` |
| **Audit cơ bản** | `createdAt`, `createdBy`, `updatedAt`, `updatedBy` |
| **Mã chứng từ** | Sinh từ collection `counters`, có tiền tố chi nhánh |
| **Index** | `branchId` (hoặc `orgId`) luôn ở **vị trí đầu** compound index |

---

## Nhóm 1 — Tổ chức & Phân quyền

### `organizations`
| Field | Type | Ghi chú |
|---|---|---|
| `_id` | ObjectId | PK |
| `code` | String | unique |
| `name` | String | |
| `taxCode` | String | MST |
| `address`, `phone`, `email` | String | |
| `logo` | String | URL |
| `settings` | Object | Cấu hình mặc định cấp tổ chức |
| `status` | Enum | `ACTIVE` / `SUSPENDED` |

**Index:** `{code}` unique

---

### `branches`
| Field | Type | Ghi chú |
|---|---|---|
| `orgId` | ObjectId | FK → organizations |
| `code` | String | **Bất biến.** Dùng làm tiền tố mã chứng từ |
| `name`, `shortName` | String | |
| `address` | Object | `{street, ward, district, province}` |
| `geo` | Object | `{lat, lng}` |
| `region` | String | Chuẩn bị cho báo cáo theo vùng |
| `phone`, `email`, `zaloOaId` | String | |
| `managerId` | ObjectId | FK → users |
| `openingHours` | Object | |
| `curfewTime` | String | `"23:00"` |
| `genderPolicy` | Enum | `MALE` / `FEMALE` / `MIXED` |
| `billingDayOfMonth` | Int | Ngày chốt kỳ |
| `dueDayOfMonth` | Int | Hạn thanh toán |
| `lateFeePolicy` | Object | `{graceDays, feeType, feeValue, maxFee}` |
| `depositPolicy` | Object | `{months, refundDays, cancelPolicy[]}` |
| `approvalLimits` | Object | `{discount, refund, writeOff, expense, cashVariance}` — VND |
| `electricityPrice`, `waterPrice` | VND | Đơn giá hiện hành |
| `utilityBillingMode` | Object | `{electric: 'METER'\|'PER_PERSON'\|'INCLUDED', water: ...}` |
| `waterPerPersonAmount` | VND | Khi tính theo đầu người |
| `amenities[]`, `images[]`, `description`, `notes` | | |
| `status` | Enum | `ACTIVE` / `INACTIVE` / `ARCHIVED` |
| `openedAt`, `closedAt` | Date | |

**Index:** `{orgId, code}` unique · `{orgId, status}` · `{managerId}` · `{orgId, region}`

---

### `buildings`
| Field | Type | Ghi chú |
|---|---|---|
| `orgId`, `branchId` | ObjectId | |
| `code`, `name` | String | |
| `genderPolicy` | Enum | |
| `hasElevator` | Boolean | |
| `amenities[]` | String[] | |
| `monthlyRentCost` | VND | Chi phí thuê mặt bằng — đầu vào P&L |
| `mainElectricMeterId`, `mainWaterMeterId` | ObjectId | Đồng hồ tổng |
| `address` | String | Nếu khác địa chỉ chi nhánh |
| `images[]`, `notes` | | |
| `status` | Enum | `ACTIVE` / `RENOVATING` / `INACTIVE` |

**Index:** `{branchId, code}` unique · `{branchId, status}`

---

### `floors`
| Field | Type | Ghi chú |
|---|---|---|
| `orgId`, `branchId`, `buildingId` | ObjectId | |
| `number` | **String** | `"1"`, `"G"`, `"L"` — không phải Int |
| `sortOrder` | Int | Để sắp xếp đúng |
| `name` | String | |
| `genderPolicy` | Enum | Override của tòa |
| `layoutImage` | String | |
| `status` | Enum | |

**Index:** `{buildingId, number}` unique · `{branchId, sortOrder}`

---

### `room_types`
| Field | Type | Ghi chú |
|---|---|---|
| `orgId`, `branchId` | ObjectId | **Định nghĩa theo chi nhánh** |
| `code`, `name` | String | |
| `capacity` | Int | |
| `basePrice` | VND | Giá giường cơ bản |
| `wholeRoomPrice` | VND | Giá thuê nguyên phòng |
| `defaultAmenities[]` | String[] | |
| `description` | String | |
| `status` | Enum | |

**Index:** `{branchId, code}` unique

---

### `rooms`
| Field | Type | Ghi chú |
|---|---|---|
| `orgId`, `branchId`, `buildingId`, `floorId` | ObjectId | Tất cả denormalized |
| `code` | String | unique theo `branchId` |
| `name` | String | |
| `roomTypeId` | ObjectId | |
| `capacity` | Int | Trần số người |
| `actualBedCount` | Int | Dẫn xuất, cập nhật khi thêm/bớt giường |
| `areaM2` | Number | |
| `priceOverride` | VND \| null | |
| `wholeRoomPrice` | VND \| null | |
| `amenities[]` | String[] | `AIR_CON`, `PRIVATE_TOILET`, `WATER_HEATER`, `BALCONY`, `WARDROBE`, `DESK`, `FRIDGE`, `WASHING_MACHINE`, `WINDOW`, `FAN`, `TV` |
| `hasPrivateToilet` | Boolean | Tách riêng vì ảnh hưởng giá lớn |
| `direction` | String | |
| `electricMeterId`, `waterMeterId` | ObjectId \| null | |
| `sharedMeterGroupId` | ObjectId \| null | Khi dùng chung đồng hồ |
| `images[]`, `notes` | | |
| `status` | Enum | `ACTIVE` / `MAINTENANCE` / `RENOVATING` / `INACTIVE` |

**Index:** `{branchId, code}` unique · `{floorId}` · `{branchId, status}` · `{roomTypeId}` · `{electricMeterId}`

---

### `beds`
| Field | Type | Ghi chú |
|---|---|---|
| `orgId`, `branchId`, `buildingId`, `floorId`, `roomId` | ObjectId | **Tất cả denormalized** để vẽ sơ đồ 1 truy vấn |
| `code` | String | unique theo `branchId` |
| `label` | String | "Giường tầng dưới cạnh cửa sổ" |
| `bedType` | Enum | `SINGLE` / `BUNK_LOWER` / `BUNK_UPPER` / `DOUBLE` |
| `priceOverride` | VND \| null | |
| `status` | Enum | `AVAILABLE` / `RESERVED` / `OCCUPIED` / `CHECKOUT_PENDING` / `CLEANING` / `MAINTENANCE` / `BLOCKED` |
| `currentAssignmentId` | ObjectId \| null | |
| `blockedReason`, `blockedUntil` | String, Date | |
| `notes` | String | |

**Index:** `{branchId, code}` unique · `{roomId, status}` · `{branchId, status}` · `{floorId, status}` · `{currentAssignmentId}`

---

### `users`
| Field | Type | Ghi chú |
|---|---|---|
| `orgId` | ObjectId | |
| `email` | String | unique — tài khoản đăng nhập nhân viên |
| `phone` | String | unique sparse — đăng nhập khách thuê |
| `passwordHash` | String | argon2id |
| `userType` | Enum | `STAFF` / `TENANT` |
| `staffId` \| `customerId` | ObjectId | Trỏ tới hồ sơ tương ứng |
| `fullName`, `avatar` | String | |
| `status` | Enum | `ACTIVE` / `INACTIVE` / `LOCKED` |
| `mustChangePassword` | Boolean | |
| `lastLoginAt`, `lastLoginIp` | | |
| `failedLoginCount`, `lockedUntil` | | |
| `twoFactorEnabled`, `twoFactorSecret` | | Phase 3 |
| `notificationPreferences` | Object | |

**Index:** `{email}` unique · `{phone}` unique sparse · `{orgId, userType, status}` · `{staffId}` · `{customerId}`

---

### `roles`
| Field | Type | Ghi chú |
|---|---|---|
| `orgId` | ObjectId | |
| `code`, `name`, `description` | String | |
| `permissions[]` | String[] | Danh sách permission |
| `limits` | Object | `{discountMax, refundApprovalMax, ...}` VND |
| `isSystem` | Boolean | Không cho sửa/xóa |
| `status` | Enum | |

**Index:** `{orgId, code}` unique

---

### `user_role_assignments`
| Field | Type | Ghi chú |
|---|---|---|
| `orgId`, `userId`, `roleId` | ObjectId | |
| `scope` | Enum | `ALL` / `BRANCH` |
| `branchIds[]` | ObjectId[] | Khi `scope = BRANCH` |
| `validFrom`, `validUntil` | Date | `validUntil = null` là vô thời hạn |
| `grantedBy`, `grantedAt` | | |
| `revokedBy`, `revokedAt`, `revokeReason` | | |

**Index:** `{userId, validUntil}` · `{orgId, roleId}` · `{branchIds}`

---

### `staff`
| Field | Type |
|---|---|
| `orgId`, `employeeCode`, `fullName`, `dateOfBirth`, `gender`, `idNumber` |
| `phone`, `email`, `address` |
| `position`, `department` |
| `branchIds[]`, `primaryBranchId` |
| `hireDate`, `terminationDate`, `terminationReason` |
| `emergencyContact` (Object) |
| `documents[]` |
| `status` — `ACTIVE` / `ON_LEAVE` / `SUSPENDED` / `TERMINATED` |

**Index:** `{orgId, employeeCode}` unique · `{branchIds, status}` · `{idNumber}`

---

## Nhóm 2 — Khách thuê & Lưu trú

### `customers`
| Field | Type | Ghi chú |
|---|---|---|
| `orgId` | ObjectId | |
| `customerCode` | String | unique |
| `fullName`, `dateOfBirth`, `gender` | | `gender` bắt buộc — dùng chặn xếp sai tòa |
| `idType` | Enum | `CCCD` / `CMND` / `PASSPORT` / `BIRTH_CERT` |
| `idNumber` | String | unique theo `orgId` (cảnh báo nếu trùng) |
| `idIssueDate`, `idIssuePlace` | | Cần cho tạm trú |
| `phone` | String | Chuẩn hóa `+84...` |
| `phoneHistory[]` | String[] | Số cũ — để đối soát chuyển khoản cũ |
| `email`, `zaloPhone` | String | |
| `permanentAddress` | Object | Bắt buộc cho tạm trú |
| `hometown` | String | |
| `emergencyContact` | Object | `{name, relationship, phone, address}` — bắt buộc |
| `secondaryContact` | Object | |
| `payer` | Object | `{name, phone, relationship, bankAccount}` — **người trả tiền ≠ người ở** |
| `occupation` | Enum | `STUDENT` / `EMPLOYEE` / `OTHER` |
| `school`, `company`, `studentId` | String | Phân tích nguồn khách |
| `photo`, `idFrontImage`, `idBackImage` | String | **Dữ liệu nhạy cảm** — presigned URL |
| `otherDocuments[]` | | |
| `currentBranchId`, `currentRoomId`, `currentBedId` | ObjectId | Denormalized để tra cứu nhanh |
| `currentContractId` | ObjectId | |
| `creditBalance` | VND | Số dư trả thừa |
| `status` | Enum | `PROSPECT` / `RESERVED` / `ACTIVE` / `EXPIRING` / `CHECKED_OUT` / `CHECKED_OUT_WITH_DEBT` / `SUSPENDED` / `BLACKLISTED` |
| `isBlacklisted`, `blacklistReason`, `blacklistedAt` | | |
| `temporaryResidenceStatus` | Enum | `NOT_REGISTERED` / `PENDING` / `REGISTERED` |
| `source` | String | Nguồn khách |
| `preferences`, `internalNotes` | String | |
| `mergedIntoCustomerId` | ObjectId | Khi gộp hồ sơ trùng |
| `anonymizedAt` | Date | Khi ẩn danh hóa |

**Index:** `{orgId, customerCode}` unique · `{orgId, idNumber}` unique sparse · `{orgId, phone}` · `{currentBranchId, status}` · `{fullName}` text · `{orgId, status}`

---

### `bookings`
| Field | Type | Ghi chú |
|---|---|---|
| `orgId`, `branchId` | ObjectId | |
| `bookingNo` | String | unique |
| `customerId` | ObjectId | |
| `bedId` | ObjectId \| null | `null` khi chưa xếp giường |
| `roomId` | ObjectId \| null | |
| `expectedCheckInDate`, `expectedDurationMonths` | | |
| `quotedPrice` | VND | Snapshot giá đã báo |
| `depositRequired`, `depositPaid` | VND | |
| `holdUntil` | Date | **Bắt buộc** — hết hạn tự hủy |
| `status` | Enum | `NEW` / `CONFIRMED` / `DEPOSIT_PAID` / `CHECKED_IN` / `CANCELLED` / `EXPIRED` / `NO_SHOW` |
| `source` | String | |
| `roommatePreferences` | String | |
| `cancelReason`, `cancelledBy`, `cancelledAt` | | |
| `contractId` | ObjectId | Hợp đồng sinh ra từ booking |
| `notes` | String | |

**Index:** `{branchId, status}` · `{bookingNo}` unique · `{customerId}` · `{bedId, status}` · `{holdUntil, status}` (cho job hết hạn)

---

### `contracts`
| Field | Type | Ghi chú |
|---|---|---|
| `orgId`, `branchId` | ObjectId | |
| `contractNo` | String | unique toàn hệ thống |
| `version` | Int | Số phụ lục |
| `customerId` | ObjectId | |
| `coTenants[]` | ObjectId[] | Người ở cùng (thuê nguyên phòng) |
| `guardianInfo` | Object | Khách vị thành niên |
| `wholeRoom` | Boolean | |
| `bedIds[]` | ObjectId[] | Giường **dự kiến**. Thực tế lấy từ `bed_assignments` |
| `startDate`, `endDate` | Date | |
| `durationMonths` | Int | |
| `autoRenewMonthly` | Boolean | |
| `noticePeriodDays` | Int | Mặc định 30 |
| `monthlyRent` | VND | **Snapshot** |
| `depositAmount`, `depositMonths` | VND, Int | |
| `billingCycle` | Enum | `MONTHLY` / `QUARTERLY` / `SEMESTER` / `YEARLY` |
| `billingDayOfMonth`, `dueDayOfMonth` | Int | |
| `electricityPrice`, `waterPrice` | VND | **Snapshot** |
| `includedServices[]` | ObjectId[] | |
| `discounts[]` | Object[] | `{type, value, reason, approvedBy, validFrom, validTo}` |
| `templateId` | ObjectId | |
| `termsSnapshot` | String | **Toàn văn điều khoản tại thời điểm ký** |
| `specialTerms` | String | |
| `houseRulesVersion` | String | |
| `status` | Enum | `DRAFT` / `PENDING_APPROVAL` / `ACTIVE` / `EXPIRING` / `EXPIRED` / `TERMINATED` / `CANCELLED` |
| `approvedBy`, `approvedAt` | | |
| `terminatedAt`, `terminationReason`, `terminationType` | | `MUTUAL` / `BY_TENANT` / `BY_LANDLORD` / `ABANDONMENT` |
| `bookingId`, `previousContractId`, `nextContractId` | ObjectId | |
| `pdfUrl`, `signedPdfUrl`, `signatureMethod`, `signedAt` | | |

**Index:** `{contractNo}` unique · `{branchId, status}` · `{customerId, status}` · `{branchId, endDate, status}` (cho job cảnh báo hết hạn) · `{previousContractId}`

---

### `bed_assignments` ★ collection quan trọng nhất
| Field | Type | Ghi chú |
|---|---|---|
| `orgId`, `branchId` | ObjectId | |
| `contractId`, `customerId` | ObjectId | |
| `bedId`, `roomId`, `floorId`, `buildingId` | ObjectId | Denormalized |
| `startDate` | Date | Ngày bắt đầu ở thực tế |
| `endDate` | Date \| null | `null` = đang ở |
| `reason` | Enum | `CHECK_IN` / `TRANSFER_BED` / `TRANSFER_ROOM` / `TRANSFER_BUILDING` / `TRANSFER_BRANCH` / `RENEWAL` / `CHECK_OUT` |
| `dailyRate` | VND | **Snapshot giá ngày** — không lookup ngược |
| `monthlyRate` | VND | Snapshot |
| `transferReason` | String | |
| `previousAssignmentId` | ObjectId | Chuỗi lịch sử |
| `createdBy`, `createdAt` | | |

**Index:**
- `{bedId}` **unique partial** `{endDate: null}` — ★ chống bán trùng giường ở tầng DB
- `{contractId, startDate}`
- `{customerId, startDate: -1}`
- `{bedId, startDate: -1}` — lịch sử người ở
- `{branchId, startDate, endDate}` — tính lấp đầy
- `{branchId, endDate}` — tìm assignment đang mở

---

### `checkin_checkout_records`
| Field | Type | Ghi chú |
|---|---|---|
| `orgId`, `branchId`, `type` | | `CHECK_IN` / `CHECK_OUT` |
| `contractId`, `customerId`, `bedId`, `roomId`, `assignmentId` | ObjectId | |
| `performedAt`, `performedBy` | | |
| `checklist[]` | Object[] | `{item, done, note}` |
| `assetInventory[]` | Object[] | `{assetId, name, quantity, condition, note}` |
| `photos[]` | String[] | **Bắt buộc** |
| `keysHandedOver[]` | Object[] | `{type, code, quantity}` |
| `utilityReadings` | Object | Chỉ số lúc vào/ra |
| `damages[]` | Object[] | `{description, estimatedCost, photos[], chargedToTenant}` — chỉ ở check-out |
| `tenantSignature`, `staffSignature` | String | Ảnh chữ ký hoặc xác nhận điện tử |
| `documentUrl` | String | Biên bản PDF |
| `notes` | String | |

**Index:** `{contractId, type}` · `{branchId, performedAt: -1}` · `{customerId}`

---

## Nhóm 3 — Tài chính

### `billing_periods`
| Field | Type | Ghi chú |
|---|---|---|
| `orgId`, `branchId` | ObjectId | |
| `code` | String | `"2026-09"` |
| `periodFrom`, `periodTo` | Date | |
| `issueDate`, `dueDate` | Date | |
| `status` | Enum | `OPEN` / `READY` / `GENERATED` / `ISSUED` / `CLOSED` |
| `invoiceCount`, `totalAmount` | Int, VND | |
| `generatedAt`, `generatedBy`, `issuedAt`, `issuedBy`, `closedAt` | | |

**Index:** `{branchId, code}` unique · `{branchId, status}`

---

### `invoices`
| Field | Type | Ghi chú |
|---|---|---|
| `orgId`, `branchId` | ObjectId | |
| `invoiceNo` | String | unique toàn hệ thống |
| `invoiceType` | Enum | `PERIODIC` / `CHECKOUT_SETTLEMENT` / `ONE_TIME` |
| `contractId`, `customerId`, `billingPeriodId` | ObjectId | |
| `periodFrom`, `periodTo` | Date | |
| `issueDate`, `dueDate` | Date | |
| `subtotal`, `discountTotal`, `penaltyTotal`, `adjustmentTotal`, `grandTotal` | VND | |
| `paidAmount`, `balance` | VND | Cập nhật khi có thanh toán |
| `status` | Enum | `DRAFT` / `ISSUED` / `PARTIALLY_PAID` / `PAID` / `OVERDUE` / `VOID` |
| `snapshot` | Object | `{customerName, customerPhone, idNumber, address, branchName, branchAddress, roomCode, bedCode, contractNo, monthlyRent}` — **đóng băng để in lại đúng** |
| `issuedBy`, `issuedAt` | | |
| `voidedBy`, `voidedAt`, `voidReason` | | |
| `pdfUrl` | String | |
| `sentAt`, `sentChannels[]` | | |
| `notes` | String | |

**Index:** `{invoiceNo}` unique · `{contractId, billingPeriodId}` **unique** (chống sinh trùng) · `{branchId, status, dueDate}` (aging) · `{customerId, status}` · `{branchId, issueDate}` · `{branchId, billingPeriodId, status}`

---

### `invoice_lines`
| Field | Type | Ghi chú |
|---|---|---|
| `orgId`, `branchId`, `invoiceId` | ObjectId | |
| `lineType` | Enum | `RENT` / `ELECTRICITY` / `WATER` / `SERVICE_RECURRING` / `SERVICE_USAGE` / `PENALTY` / `LATE_FEE` / `DAMAGE` / `ONE_TIME` / `DISCOUNT` / `ADJUSTMENT` |
| `description` | String | Câu lễ tân đọc cho khách |
| `calculationNote` | String | **"Chỉ số 4521 → 4587 = 66 kWh × 3.500đ"** — trường quan trọng hay bị quên |
| `quantity`, `unit`, `unitPrice` | | |
| `amount` | VND | Âm với `DISCOUNT` |
| `periodFrom`, `periodTo` | Date | Cho dòng prorate |
| `sourceType`, `sourceId` | | Trỏ về bản ghi nguồn (`utility_readings`, `violations`, `service_usages`...) |
| `sortOrder` | Int | |

**Index:** `{invoiceId, sortOrder}` · `{branchId, lineType, periodFrom}` (báo cáo doanh thu theo nguồn) · `{sourceType, sourceId}`

---

### `invoice_adjustments`
| Field | Type | Ghi chú |
|---|---|---|
| `orgId`, `branchId`, `invoiceId` | ObjectId | |
| `adjustmentNo` | String | unique |
| `amount` | VND | Dương hoặc âm |
| `reason` | String | **Bắt buộc** |
| `evidenceUrls[]` | String[] | |
| `requestedBy`, `requestedAt` | | |
| `approvedBy`, `approvedAt` | | **Phải khác `requestedBy`** |
| `status` | Enum | `PENDING` / `APPROVED` / `REJECTED` |
| `rejectReason` | String | |

**Index:** `{invoiceId}` · `{branchId, status}` · `{adjustmentNo}` unique

---

### `payments`
| Field | Type | Ghi chú |
|---|---|---|
| `orgId`, `branchId` | ObjectId | |
| `paymentNo` | String | unique |
| `customerId` | ObjectId | |
| `payerName`, `payerAccount` | String | Người trả thực tế (phụ huynh) |
| `amount` | VND | |
| `method` | Enum | `CASH` / `BANK_TRANSFER` / `VIETQR` / `EWALLET` / `GATEWAY` / `DEPOSIT_OFFSET` / `CREDIT_OFFSET` |
| `externalTxnId` | String | Mã GD ngân hàng/cổng |
| `idempotencyKey` | String | **unique sparse — chống ghi trùng** |
| `bankRef`, `bankStatementId` | String | |
| `receivedAt`, `receivedBy` | | |
| `cashSessionId` | ObjectId | Bắt buộc khi `method = CASH` |
| `allocatedAmount`, `unallocatedAmount` | VND | |
| `reconciledAt`, `reconciledBy` | | |
| `status` | Enum | `PENDING` / `CONFIRMED` / `FAILED` / `REVERSED` |
| `reversedBy`, `reversedAt`, `reverseReason`, `reversalOfPaymentId` | | |
| `receiptUrl` | String | Phiếu thu PDF |
| `note` | String | |

**Index:** `{idempotencyKey}` **unique sparse** · `{externalTxnId}` **unique sparse** · `{paymentNo}` unique · `{branchId, receivedAt: -1}` · `{customerId, receivedAt: -1}` · `{cashSessionId}` · `{branchId, status, reconciledAt}`

---

### `payment_allocations`
| Field | Type |
|---|---|
| `orgId`, `branchId`, `paymentId`, `invoiceId` |
| `amount` — VND |
| `allocatedBy`, `allocatedAt` |
| `isAutomatic` — Boolean (FIFO tự động hay người chỉ định) |
| `reversedAt`, `reversedBy` |

**Index:** `{paymentId}` · `{invoiceId}` · `{branchId, allocatedAt}`

---

### `deposit_ledger`
| Field | Type | Ghi chú |
|---|---|---|
| `orgId`, `branchId`, `contractId`, `customerId` | ObjectId | |
| `entryNo` | String | unique |
| `entryType` | Enum | `HOLD` / `TOP_UP` / `DEDUCT_DEBT` / `DEDUCT_DAMAGE` / `DEDUCT_PENALTY` / `REFUND` / `FORFEIT` / `TRANSFER_IN` / `TRANSFER_OUT` |
| `amount` | VND | Dương với thu vào, âm với chi ra |
| `balanceAfter` | VND | Số dư sau bút toán — để đối chiếu |
| `reason` | String | Bắt buộc với `DEDUCT_*`, `FORFEIT` |
| `relatedInvoiceId`, `relatedPaymentId`, `relatedTicketId` | ObjectId | |
| `requestedBy`, `approvedBy`, `approvedAt`, `executedBy`, `executedAt` | | |
| `status` | Enum | `PENDING` / `APPROVED` / `EXECUTED` / `REJECTED` |
| `refundMethod`, `refundDueDate` | | |
| `evidenceUrls[]` | String[] | |

**Index:** `{contractId, createdAt}` · `{customerId}` · `{branchId, status}` · `{branchId, refundDueDate, status}` (danh sách cọc đến hạn hoàn) · `{entryNo}` unique

---

### `cash_sessions`
| Field | Type |
|---|---|
| `orgId`, `branchId`, `sessionNo`, `staffId`, `shiftId` |
| `openedAt`, `openingBalance` — VND |
| `closedAt`, `systemTotal`, `countedTotal`, `variance` — VND |
| `varianceReason` |
| `handoverNote` — **ghi chú bàn giao ca** |
| `status` — `OPEN` / `PENDING_REVIEW` / `DISPUTED` / `CLOSED` |
| `reviewedBy`, `reviewedAt` |
| `depositedToBank` (Boolean), `bankDepositRef`, `depositedAt` |

**Index:** `{branchId, status}` · `{staffId, openedAt: -1}` · `{sessionNo}` unique · `{branchId, openedAt: -1}`

---

### `expenses`
| Field | Type |
|---|---|
| `orgId`, `branchId`, `buildingId` |
| `expenseNo` — unique |
| `category` — `RENT` / `SALARY` / `UTILITIES` / `MAINTENANCE` / `CLEANING` / `EQUIPMENT` / `MARKETING` / `ADMIN` / `TAX` / `OTHER` |
| `amount` — VND |
| `expenseDate`, `paidAt` |
| `vendor`, `vendorInvoiceRef` |
| `paymentMethod` |
| `description` |
| `attachments[]` — ảnh hóa đơn |
| `isRecurring`, `recurringConfig` |
| `relatedTicketId`, `relatedAssetId` |
| `allocationRule` — khi là chi phí chung |
| `status` — `DRAFT` / `PENDING_APPROVAL` / `APPROVED` / `PAID` / `REJECTED` |
| `createdBy`, `approvedBy`, `approvedAt` |

**Index:** `{branchId, expenseDate: -1}` · `{branchId, category, expenseDate}` · `{expenseNo}` unique · `{status}`

---

### `idempotency_keys`
| Field | Type |
|---|---|
| `key` — unique |
| `scope`, `requestHash`, `responseBody`, `statusCode` |
| `createdAt` — TTL 7 ngày |

**Index:** `{key}` unique · `{createdAt}` TTL 604800

---

## Nhóm 4 — Điện nước & Dịch vụ

### `utility_meters`
| Field | Type | Ghi chú |
|---|---|---|
| `orgId`, `branchId`, `buildingId` | ObjectId | |
| `code`, `serialNumber` | String | |
| `type` | Enum | `ELECTRIC` / `WATER` |
| `scope` | Enum | `ROOM` / `SHARED_GROUP` / `BUILDING_MAIN` |
| `roomIds[]` | ObjectId[] | Các phòng dùng đồng hồ này |
| `sharingRule` | Object | `{method: 'PER_PERSON'\|'PER_ROOM'\|'FIXED_RATIO', ratios}` |
| `multiplier` | Number | Hệ số nhân |
| `maxReading` | Int | Số vòng tối đa (vd 99999) |
| `installedAt`, `replacedAt`, `replacedByMeterId` | | |
| `status` | Enum | `ACTIVE` / `REPLACED` / `FAULTY` |

**Index:** `{branchId, code}` unique · `{roomIds}` · `{branchId, type, status}`

---

### `utility_readings`
| Field | Type | Ghi chú |
|---|---|---|
| `orgId`, `branchId`, `meterId`, `roomId` | ObjectId | |
| `billingPeriodId` | ObjectId | |
| `previousReading`, `currentReading` | Number | |
| `consumption` | Number | **Lưu lại** dù dẫn xuất được — công thức có thể đổi |
| `isRollover`, `isMeterReplaced` | Boolean | |
| `unitPrice` | VND | **Snapshot** |
| `amount` | VND | |
| `readingDate` | Date | |
| `photoUrl` | String | **Bắt buộc — bằng chứng duy nhất khi tranh chấp** |
| `recordedBy`, `recordedAt` | | |
| `status` | Enum | `DRAFT` / `SUBMITTED` / `APPROVED` / `LOCKED` |
| `approvedBy`, `approvedAt` | | |
| `isAbnormal`, `abnormalNote` | | |
| `isEstimated`, `estimationBasis` | | Khi đồng hồ hỏng |
| `adjustedFromReadingId` | ObjectId | Khi là bản sửa |

**Index:** `{meterId, billingPeriodId}` unique · `{branchId, billingPeriodId, status}` · `{roomId, readingDate: -1}` · `{branchId, isAbnormal}`

---

### `services`
| Field | Type |
|---|---|
| `orgId`, `branchId` — **theo chi nhánh** |
| `code`, `name`, `category` |
| `price` — VND, `unit` |
| `billingType` — `RECURRING` / `PER_USE` / `ONE_TIME` |
| `cycle` — `MONTHLY` / `QUARTERLY` |
| `prorateOnStart`, `prorateOnCancel` — Boolean |
| `isIncludedByDefault`, `requiresApproval` |
| `status` |

**Index:** `{branchId, code}` unique · `{branchId, status}`

---

### `service_subscriptions`
| Field | Type |
|---|---|
| `orgId`, `branchId`, `contractId`, `customerId`, `serviceId` |
| `startDate`, `endDate` |
| `quantity`, `priceSnapshot` — VND |
| `metadata` — vd biển số xe |
| `status` — `ACTIVE` / `PAUSED` / `CANCELLED` |
| `cancelledAt`, `cancelReason` |

**Index:** `{contractId, status}` · `{branchId, serviceId, status}` · `{customerId}`

---

### `service_usages`
| Field | Type |
|---|---|
| `orgId`, `branchId`, `customerId`, `serviceId` |
| `usedAt`, `quantity`, `unitPrice`, `amount` — VND |
| `recordedBy` |
| `billedInvoiceId` — đã tính vào hóa đơn nào |

**Index:** `{customerId, usedAt}` · `{branchId, billedInvoiceId}` · `{branchId, usedAt}`

---

## Nhóm 5 — Vận hành

### `maintenance_tickets`
| Field | Type |
|---|---|
| `orgId`, `branchId`, `buildingId`, `floorId`, `roomId`, `bedId`, `assetId` |
| `ticketNo` — unique |
| `category`, `title`, `description` |
| `attachments[]` |
| `priority` — `URGENT` / `HIGH` / `NORMAL` / `LOW` |
| `slaResponseDeadline`, `slaResolveDeadline` |
| `slaBreached`, `slaBreachedAt`, `pausedDurationMinutes` |
| `reportedBy`, `reporterType` (`TENANT`/`STAFF`), `reportedAt` |
| `assignedTo`, `assignedBy`, `assignedAt` |
| `startedAt`, `resolvedAt`, `closedAt` |
| `resolution`, `resolutionAttachments[]` |
| `laborCost`, `partsCost`, `totalCost` — VND |
| `chargeToTenant` (Boolean), `chargedInvoiceId`, `expenseId` |
| `status`, `mergedIntoTicketId` |
| `tenantRating`, `tenantFeedback` |

**Index:** `{branchId, status, priority}` · `{assignedTo, status}` · `{roomId, reportedAt: -1}` · `{assetId}` · `{ticketNo}` unique · `{branchId, slaResolveDeadline, status}` (job escalate)

---

### `ticket_events`
| Field | Type |
|---|---|
| `ticketId`, `branchId`, `eventType`, `fromStatus`, `toStatus` |
| `by`, `at`, `note`, `attachments[]` |

**Index:** `{ticketId, at}`

---

### `assets`
| Field | Type |
|---|---|
| `orgId`, `branchId`, `buildingId`, `floorId`, `roomId`, `bedId` |
| `assetCode` — unique, `qrCode` |
| `name`, `category`, `brand`, `model`, `serialNumber` |
| `locationType` — `ROOM` / `COMMON_AREA` / `STORAGE` |
| `purchaseDate`, `purchasePrice` — VND, `supplier` |
| `warrantyUntil` |
| `depreciationMethod`, `usefulLifeMonths`, `currentBookValue` — VND |
| `condition` — `NEW` / `GOOD` / `FAIR` / `POOR` / `BROKEN` |
| `status` — `IN_USE` / `IN_REPAIR` / `IN_STORAGE` / `DISPOSED` / `LOST` |
| `repairCount`, `totalRepairCost` — VND |
| `images[]`, `notes` |

**Index:** `{branchId, assetCode}` unique · `{roomId}` · `{branchId, category, status}` · `{branchId, warrantyUntil}` (cảnh báo hết bảo hành)

---

### `asset_events`
| Field | Type |
|---|---|
| `assetId`, `branchId`, `eventType`, `at`, `by` |
| `fromLocation`, `toLocation`, `cost` — VND, `note`, `ticketId`, `attachments[]` |

**Index:** `{assetId, at: -1}`

---

### `housekeeping_tasks`
| Field | Type |
|---|---|
| `orgId`, `branchId`, `roomId`, `bedId` |
| `taskType` — `CHECKOUT_CLEANING` / `ROUTINE` / `DEEP_CLEAN` / `INSPECTION` |
| `assignedTo`, `dueAt` |
| `status` — `PENDING` / `IN_PROGRESS` / `DONE` / `SKIPPED` |
| `completedAt`, `completedBy`, `photos[]`, `issuesFound` |

**Index:** `{branchId, status, dueAt}` · `{assignedTo, status}` · `{bedId}`

---

### `house_rules`
| Field | Type |
|---|---|
| `orgId`, `branchId`, `version`, `effectiveFrom`, `effectiveTo` |
| `sections[]` — `{title, content, order}` |
| `penaltyRules[]` — `{ruleCode, name, severity, penalties: [{occurrence, type, amount}]}` |
| `status`, `publishedAt`, `publishedBy` |

**Index:** `{branchId, version}` unique · `{branchId, status}`

---

### `violations`
| Field | Type |
|---|---|
| `orgId`, `branchId`, `customerId`, `roomId` |
| `violationNo` — unique |
| `ruleCode`, `ruleVersion` |
| `occurredAt`, `reportedBy`, `description` |
| `evidence[]` — **bắt buộc với phạt tiền** |
| `severity`, `occurrenceCount` |
| `penaltyType` — `WARNING` / `FINE` / `COMPENSATION` / `SUSPENSION` / `TERMINATION` |
| `penaltyAmount` — VND |
| `status` — `DRAFT` / `PENDING_APPROVAL` / `APPROVED` / `APPEALED` / `WAIVED` / `CHARGED` |
| `approvedBy`, `approvedAt` |
| `chargedInvoiceId` |
| `tenantAcknowledgedAt`, `appealReason`, `appealResolution` |

**Index:** `{customerId, occurredAt: -1}` · `{branchId, status}` · `{violationNo}` unique · `{branchId, status, chargedInvoiceId}` (job tính phí)

---

### `visitor_logs`
| Field | Type |
|---|---|
| `orgId`, `branchId`, `visitorType` |
| `visitorName`, `visitorPhone`, `visitorIdNumber` |
| `hostCustomerId`, `roomId`, `purpose` |
| `checkInAt`, `checkOutAt`, `recordedBy` |
| `approvedByHost` (Boolean), `approvedAt` |
| `vehiclePlate`, `overnightStay` (Boolean), `notes` |

**Index:** `{branchId, checkInAt: -1}` · `{hostCustomerId}` · `{branchId, checkOutAt}` (tìm người chưa ra)

---

### `staff_shifts`
| Field | Type |
|---|---|
| `orgId`, `branchId`, `staffId`, `date` |
| `shiftType`, `startTime`, `endTime` |
| `status` — `SCHEDULED` / `CHECKED_IN` / `COMPLETED` / `ABSENT` |
| `actualStartAt`, `actualEndAt`, `note` |

**Index:** `{branchId, date}` · `{staffId, date}` unique

---

## Nhóm 6 — Hệ thống

### `notifications`
| Field | Type |
|---|---|
| `orgId`, `branchId`, `recipientType` (`USER`/`CUSTOMER`), `recipientId` |
| `templateCode`, `title`, `body`, `data` (Object) |
| `channels[]` — `IN_APP` / `EMAIL` / `ZALO` / `SMS` |
| `channelStatus` — `{zalo: {status, sentAt, error}, ...}` |
| `priority`, `relatedEntity`, `relatedEntityId` |
| `status` — `PENDING` / `SENT` / `PARTIALLY_SENT` / `FAILED` |
| `readAt`, `scheduledAt`, `sentAt`, `retryCount` |

**Index:** `{recipientId, readAt, createdAt: -1}` · `{status, scheduledAt}` (job gửi) · `{branchId, createdAt: -1}`

---

### `notification_templates`
| Field | Type |
|---|---|
| `orgId`, `code` — unique, `name` |
| `channels[]`, `subject`, `bodyTemplate`, `zaloTemplateId` |
| `variables[]`, `version`, `status` |

**Index:** `{orgId, code}` unique

---

### `audit_logs` (append-only)
| Field | Type |
|---|---|
| `orgId`, `branchId` |
| `actorId`, `actorName`, `actorRole` — **snapshot** |
| `action`, `entity`, `entityId` |
| `before`, `after`, `diff[]` |
| `reason` — bắt buộc với nhóm nhạy cảm |
| `ip`, `userAgent`, `requestId` |
| `at` |

**Index:** `{entity, entityId, at: -1}` · `{branchId, at: -1}` · `{actorId, at: -1}` · `{action, at: -1}`
TTL 3 năm cho action không thuộc nhóm tài chính; nhóm tài chính giữ vĩnh viễn (tách collection `audit_logs_financial` hoặc dùng cờ `retainForever`).

---

### `attachments`
| Field | Type |
|---|---|
| `orgId`, `branchId`, `ownerType`, `ownerId` |
| `fileName`, `mimeType`, `sizeBytes`, `storageKey` |
| `isSensitive` — ảnh CCCD |
| `uploadedBy`, `uploadedAt`, `deletedAt` |

**Index:** `{ownerType, ownerId}` · `{branchId, uploadedAt: -1}`

---

### `counters`
| Field | Type |
|---|---|
| `key` — vd `"invoice:TD:2026"` |
| `seq` — Int |

**Index:** `{key}` unique
Dùng `findOneAndUpdate` với `$inc` để sinh số an toàn khi đồng thời.

---

### `report_snapshots` (Phase 2)
| Field | Type |
|---|---|
| `orgId`, `branchId`, `date`, `metricType` |
| `values` — Object |
| `computedAt` |

**Index:** `{branchId, metricType, date}` unique · `{orgId, metricType, date}`

---

## Tổng kết index quan trọng nhất

| Index | Vì sao then chốt |
|---|---|
| `bed_assignments {bedId}` unique partial `{endDate: null}` | **Chống bán trùng giường ở tầng database** |
| `payments {idempotencyKey}` unique sparse | **Chống ghi nhận thanh toán trùng** |
| `payments {externalTxnId}` unique sparse | Chống webhook trùng |
| `invoices {contractId, billingPeriodId}` unique | Chống sinh hóa đơn trùng kỳ |
| `customers {orgId, idNumber}` unique sparse | Chống hồ sơ trùng |
| `invoices {branchId, status, dueDate}` | Aging công nợ |
| `beds {branchId, status}` | Sơ đồ giường |
| `contracts {branchId, endDate, status}` | Job cảnh báo hết hạn |
| `bookings {holdUntil, status}` | Job hết hạn giữ chỗ |
