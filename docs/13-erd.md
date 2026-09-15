# 13 — ERD (Entity Relationship Diagram)

> MongoDB không có khóa ngoại cưỡng chế, nhưng quan hệ logic vẫn tồn tại và vẫn phải thiết kế đúng. ERD dưới đây mô tả quan hệ logic; ràng buộc được đảm bảo ở tầng ứng dụng và bằng unique index.
>
> Xem [12-database-schema.md](12-database-schema.md) cho chi tiết field và index.

---

## 1. ERD tổng thể

```mermaid
erDiagram
    ORGANIZATIONS ||--o{ BRANCHES : "có"
    BRANCHES ||--o{ BUILDINGS : "có"
    BUILDINGS ||--o{ FLOORS : "có"
    FLOORS ||--o{ ROOMS : "có"
    ROOM_TYPES ||--o{ ROOMS : "phân loại"
    BRANCHES ||--o{ ROOM_TYPES : "định nghĩa"
    ROOMS ||--o{ BEDS : "có"

    USERS ||--o{ USER_ROLE_ASSIGNMENTS : "được gán"
    ROLES ||--o{ USER_ROLE_ASSIGNMENTS : "cấp quyền"
    BRANCHES ||--o{ USER_ROLE_ASSIGNMENTS : "giới hạn phạm vi"
    STAFF ||--|| USERS : "có tài khoản"
    CUSTOMERS ||--o| USERS : "có tài khoản portal"

    CUSTOMERS ||--o{ CUSTOMER_DOCUMENTS : "sở hữu"
    CUSTOMERS ||--o{ BOOKINGS : "tạo"
    BOOKINGS ||--o| CONTRACTS : "chuyển thành"
    CUSTOMERS ||--o{ CONTRACTS : "ký"
    CONTRACTS ||--o{ BED_ASSIGNMENTS : "hiện thực bằng"
    BEDS ||--o{ BED_ASSIGNMENTS : "được ở bởi"
    CONTRACTS ||--o{ CHECKIN_CHECKOUT_RECORDS : "có biên bản"
    CONTRACTS ||--o| CONTRACTS : "gia hạn thành"

    BILLING_PERIODS ||--o{ INVOICES : "sinh ra"
    CONTRACTS ||--o{ INVOICES : "phát sinh"
    INVOICES ||--o{ INVOICE_LINES : "gồm"
    INVOICES ||--o{ INVOICE_ADJUSTMENTS : "được điều chỉnh"
    INVOICES ||--o{ PAYMENT_ALLOCATIONS : "được thanh toán qua"
    PAYMENTS ||--o{ PAYMENT_ALLOCATIONS : "phân bổ vào"
    CUSTOMERS ||--o{ PAYMENTS : "thanh toán"
    CASH_SESSIONS ||--o{ PAYMENTS : "thu tiền mặt trong"
    STAFF ||--o{ CASH_SESSIONS : "mở ca"
    CONTRACTS ||--o{ DEPOSIT_LEDGER : "sổ cọc"
    BRANCHES ||--o{ EXPENSES : "phát sinh"

    ROOMS ||--o{ UTILITY_METERS : "gắn"
    UTILITY_METERS ||--o{ UTILITY_READINGS : "ghi nhận"
    BILLING_PERIODS ||--o{ UTILITY_READINGS : "thuộc kỳ"
    UTILITY_READINGS ||--o{ INVOICE_LINES : "tính thành"

    BRANCHES ||--o{ SERVICES : "cung cấp"
    SERVICES ||--o{ SERVICE_SUBSCRIPTIONS : "được đăng ký"
    CONTRACTS ||--o{ SERVICE_SUBSCRIPTIONS : "bao gồm"
    SERVICES ||--o{ SERVICE_USAGES : "được sử dụng"

    ROOMS ||--o{ MAINTENANCE_TICKETS : "phát sinh sự cố"
    MAINTENANCE_TICKETS ||--o{ TICKET_EVENTS : "ghi lịch sử"
    ASSETS ||--o{ ASSET_EVENTS : "lịch sử"
    ROOMS ||--o{ ASSETS : "chứa"
    MAINTENANCE_TICKETS }o--o| ASSETS : "liên quan"
    MAINTENANCE_TICKETS }o--o| EXPENSES : "phát sinh chi phí"
    BEDS ||--o{ HOUSEKEEPING_TASKS : "cần dọn"

    HOUSE_RULES ||--o{ VIOLATIONS : "quy định"
    CUSTOMERS ||--o{ VIOLATIONS : "vi phạm"
    VIOLATIONS ||--o{ INVOICE_LINES : "tính phạt vào"

    CUSTOMERS ||--o{ VISITOR_LOGS : "tiếp khách"
    USERS ||--o{ AUDIT_LOGS : "thực hiện"
    USERS ||--o{ NOTIFICATIONS : "nhận"
    CUSTOMERS ||--o{ NOTIFICATIONS : "nhận"
```

---

## 2. Lõi lưu trú — quan hệ quan trọng nhất

Đây là phần thiết kế quyết định chất lượng của cả hệ thống.

```mermaid
erDiagram
    CUSTOMERS {
        ObjectId _id PK
        string customerCode UK
        string fullName
        string idNumber UK
        string phone
        enum status
        ObjectId currentBedId FK
        long creditBalance
    }

    CONTRACTS {
        ObjectId _id PK
        string contractNo UK
        ObjectId customerId FK
        ObjectId branchId FK
        date startDate
        date endDate
        long monthlyRent "SNAPSHOT"
        long depositAmount
        long electricityPrice "SNAPSHOT"
        string termsSnapshot "SNAPSHOT"
        enum status
        ObjectId previousContractId FK
    }

    BED_ASSIGNMENTS {
        ObjectId _id PK
        ObjectId contractId FK
        ObjectId customerId FK
        ObjectId bedId FK
        date startDate
        date endDate "null = dang o"
        enum reason
        long dailyRate "SNAPSHOT"
    }

    BEDS {
        ObjectId _id PK
        string code UK
        ObjectId roomId FK
        ObjectId branchId FK
        enum status
        long priceOverride
        ObjectId currentAssignmentId FK
    }

    BOOKINGS {
        ObjectId _id PK
        string bookingNo UK
        ObjectId customerId FK
        ObjectId bedId FK
        date holdUntil
        long depositPaid
        enum status
    }

    CUSTOMERS ||--o{ CONTRACTS : "ký nhiều hợp đồng theo thời gian"
    CONTRACTS ||--o{ BED_ASSIGNMENTS : "1 HĐ nhiều đoạn ở"
    BEDS ||--o{ BED_ASSIGNMENTS : "1 giường nhiều người theo thời gian"
    CUSTOMERS ||--o{ BOOKINGS : "đặt chỗ"
    BOOKINGS ||--o| CONTRACTS : "chuyển thành"
    BEDS ||--o| BOOKINGS : "được giữ bởi"
```

### Vì sao tách `CONTRACTS` và `BED_ASSIGNMENTS`

| | `contracts` | `bed_assignments` |
|---|---|---|
| **Bản chất** | Quan hệ pháp lý & thương mại | Sự kiện vật lý |
| **Trả lời câu hỏi** | "Khách cam kết gì, giá bao nhiêu, đến bao giờ?" | "Khách thực tế nằm ở đâu, từ ngày nào?" |
| **Thay đổi khi** | Ký mới, gia hạn, làm phụ lục | Chuyển giường, chuyển phòng, chuyển chi nhánh |
| **Số lượng** | 1 hợp đồng | 1..n assignment |

**Hệ quả tích cực:**

1. **Tính tiền phòng tự động prorate.** Engine chỉ cần duyệt các assignment giao với kỳ tính. Nghiệp vụ "chuyển phòng giữa tháng" không cần một dòng code đặc biệt nào.

2. **Lịch sử đầy đủ hai chiều.** `{bedId}` → ai từng ở giường này. `{customerId}` → khách này từng ở đâu.

3. **Chống bán trùng ở tầng database.**
   ```js
   db.bed_assignments.createIndex(
     { bedId: 1 },
     { unique: true, partialFilterExpression: { endDate: null } }
   )
   ```
   Một giường chỉ có tối đa một assignment đang mở. Ràng buộc này bắt được cả race condition mà logic ứng dụng bỏ sót.

4. **Chuyển chi nhánh xử lý được.** Assignment mới có `branchId` khác → doanh thu tự phân bổ đúng chi nhánh, không cần logic riêng.

**Nếu làm sai** (nhét `bedId` vào `contracts`):
- Chuyển phòng buộc phải tạo hợp đồng mới (sai về pháp lý) hoặc sửa hợp đồng đang chạy (mất lịch sử)
- Mọi nơi tính tiền phải viết logic đặc biệt tra cứu log chuyển phòng
- Báo cáo "giường này năm qua ai ở" gần như không làm được

---

## 3. Lõi tài chính

```mermaid
erDiagram
    BILLING_PERIODS {
        ObjectId _id PK
        ObjectId branchId FK
        string code UK "2026-09"
        date periodFrom
        date periodTo
        date dueDate
        enum status
    }

    INVOICES {
        ObjectId _id PK
        string invoiceNo UK
        ObjectId contractId FK
        ObjectId customerId FK
        ObjectId billingPeriodId FK
        long grandTotal
        long paidAmount
        long balance
        enum status
        object snapshot "DONG BANG"
    }

    INVOICE_LINES {
        ObjectId _id PK
        ObjectId invoiceId FK
        enum lineType
        string description
        string calculationNote
        long amount
        string sourceType
        ObjectId sourceId FK
    }

    INVOICE_ADJUSTMENTS {
        ObjectId _id PK
        ObjectId invoiceId FK
        long amount
        string reason "BAT BUOC"
        ObjectId requestedBy FK
        ObjectId approvedBy FK
    }

    PAYMENTS {
        ObjectId _id PK
        string paymentNo UK
        ObjectId customerId FK
        long amount
        enum method
        string idempotencyKey UK
        string externalTxnId UK
        ObjectId cashSessionId FK
        enum status
    }

    PAYMENT_ALLOCATIONS {
        ObjectId _id PK
        ObjectId paymentId FK
        ObjectId invoiceId FK
        long amount
    }

    DEPOSIT_LEDGER {
        ObjectId _id PK
        ObjectId contractId FK
        enum entryType
        long amount
        long balanceAfter
        string reason
    }

    CASH_SESSIONS {
        ObjectId _id PK
        ObjectId staffId FK
        long openingBalance
        long systemTotal
        long countedTotal
        long variance
        enum status
    }

    BILLING_PERIODS ||--o{ INVOICES : "sinh"
    INVOICES ||--o{ INVOICE_LINES : "gồm"
    INVOICES ||--o{ INVOICE_ADJUSTMENTS : "điều chỉnh"
    INVOICES ||--o{ PAYMENT_ALLOCATIONS : "nhận"
    PAYMENTS ||--o{ PAYMENT_ALLOCATIONS : "phân bổ"
    CASH_SESSIONS ||--o{ PAYMENTS : "chứa payment tiền mặt"
```

### Bốn nguyên tắc đọc từ sơ đồ này

1. **`INVOICES` có `snapshot`** — đóng băng tên khách, phòng, giá tại thời điểm phát hành. In lại hóa đơn cũ ra đúng nội dung cũ.

2. **`INVOICE_ADJUSTMENTS` tồn tại vì hóa đơn `ISSUED` bất biến.** Không có API sửa hóa đơn. Điều chỉnh là bản ghi mới, có lý do bắt buộc, có người duyệt khác người đề xuất.

3. **`PAYMENT_ALLOCATIONS` là bảng trung gian n-n** — một khoản trả nhiều hóa đơn, một hóa đơn nhận nhiều khoản. Không thể gắn `invoiceId` trực tiếp vào `payments`.

4. **`DEPOSIT_LEDGER` là sổ cái, tách hoàn toàn khỏi doanh thu.** Mỗi thao tác một bút toán, có `balanceAfter` để đối chiếu. Cọc không bao giờ xuất hiện trong báo cáo doanh thu.

---

## 4. Lõi phân quyền

```mermaid
erDiagram
    USERS {
        ObjectId _id PK
        string email UK
        string phone UK
        enum userType "STAFF | TENANT"
        ObjectId staffId FK
        ObjectId customerId FK
        enum status
    }

    ROLES {
        ObjectId _id PK
        string code UK
        string name
        array permissions
        object limits
        boolean isSystem
    }

    USER_ROLE_ASSIGNMENTS {
        ObjectId _id PK
        ObjectId userId FK
        ObjectId roleId FK
        enum scope "ALL | BRANCH"
        array branchIds
        date validFrom
        date validUntil "quyen tam thoi"
    }

    BRANCHES {
        ObjectId _id PK
        string code UK
        string name
        object approvalLimits
        enum status
    }

    USERS ||--o{ USER_ROLE_ASSIGNMENTS : "được gán"
    ROLES ||--o{ USER_ROLE_ASSIGNMENTS : "định nghĩa quyền"
    BRANCHES ||--o{ USER_ROLE_ASSIGNMENTS : "giới hạn phạm vi"
```

Ba lớp kiểm soát rút ra từ sơ đồ:
- **Permission** (`roles.permissions`) — được làm hành động gì
- **Scope** (`user_role_assignments.scope` + `branchIds`) — trên dữ liệu chi nhánh nào
- **Limit** (`roles.limits` + `branches.approvalLimits`) — trong hạn mức nào

Ba lớp này đều kiểm tra ở backend. Xem [11-architecture.md §2 D5](11-architecture.md).

---

## 5. Lõi điện nước

```mermaid
erDiagram
    UTILITY_METERS {
        ObjectId _id PK
        string code UK
        enum type "ELECTRIC | WATER"
        enum scope "ROOM | SHARED_GROUP | BUILDING_MAIN"
        array roomIds
        object sharingRule
        int maxReading
        enum status
    }

    UTILITY_READINGS {
        ObjectId _id PK
        ObjectId meterId FK
        ObjectId billingPeriodId FK
        number previousReading
        number currentReading
        number consumption
        long unitPrice "SNAPSHOT"
        string photoUrl "BAT BUOC"
        enum status
        boolean isAbnormal
        ObjectId adjustedFromReadingId FK
    }

    ROOMS ||--o{ UTILITY_METERS : "gắn đồng hồ riêng"
    BUILDINGS ||--o{ UTILITY_METERS : "có đồng hồ tổng"
    UTILITY_METERS ||--o{ UTILITY_READINGS : "ghi nhận theo kỳ"
    UTILITY_READINGS ||--o| UTILITY_READINGS : "bản sửa của"
    UTILITY_READINGS ||--o{ INVOICE_LINES : "tính thành"
```

Điểm quan trọng: `unitPrice` snapshot trong `utility_readings`, và cũng snapshot trong `contracts`. Tăng giá điện không ảnh hưởng hồi tố các kỳ đã tính.

Đồng hồ tổng tòa nhà (`scope = BUILDING_MAIN`) dùng để đối chiếu với tổng các phòng — chênh lệch lớn là dấu hiệu rò rỉ hoặc câu trộm.

---

## 6. Lõi vận hành

```mermaid
erDiagram
    MAINTENANCE_TICKETS {
        ObjectId _id PK
        string ticketNo UK
        ObjectId roomId FK
        ObjectId assetId FK
        enum category
        enum priority
        date slaResolveDeadline
        int pausedDurationMinutes
        ObjectId assignedTo FK
        enum status
        long totalCost
        boolean chargeToTenant
    }

    ASSETS {
        ObjectId _id PK
        string assetCode UK
        string name
        ObjectId roomId FK
        date warrantyUntil
        enum condition
        enum status
        int repairCount
        long totalRepairCost
    }

    ASSET_EVENTS {
        ObjectId _id PK
        ObjectId assetId FK
        enum eventType
        date at
        long cost
    }

    HOUSE_RULES {
        ObjectId _id PK
        string version
        array penaltyRules
        date effectiveFrom
    }

    VIOLATIONS {
        ObjectId _id PK
        string violationNo UK
        ObjectId customerId FK
        string ruleCode
        array evidence "BAT BUOC"
        long penaltyAmount
        enum status
        ObjectId chargedInvoiceId FK
    }

    ROOMS ||--o{ ASSETS : "chứa"
    ASSETS ||--o{ ASSET_EVENTS : "lịch sử"
    ASSETS ||--o{ MAINTENANCE_TICKETS : "phát sinh sự cố"
    MAINTENANCE_TICKETS ||--o| EXPENSES : "ghi chi phí"
    MAINTENANCE_TICKETS ||--o| INVOICE_LINES : "tính cho khách"
    HOUSE_RULES ||--o{ VIOLATIONS : "quy định mức phạt"
    CUSTOMERS ||--o{ VIOLATIONS : "vi phạm"
    VIOLATIONS ||--o| INVOICE_LINES : "tính phạt"
```

Điểm đáng chú ý: ticket bảo trì dẫn tới **hai nhánh tài chính khác nhau** — `expenses` (Cali chịu) hoặc `invoice_lines` (khách chịu). Quyết định thuộc về Branch Manager, không để kỹ thuật tự quyết.

---

## 7. Ma trận quan hệ tóm tắt

| Từ | Tới | Kiểu | Ghi chú |
|---|---|---|---|
| organizations | branches | 1-n | |
| branches | buildings | 1-n | Luôn ≥1 |
| buildings | floors | 1-n | |
| floors | rooms | 1-n | Tầng có thể 0 phòng |
| room_types | rooms | 1-n | Định nghĩa theo chi nhánh |
| rooms | beds | 1-n | |
| customers | bookings | 1-n | |
| bookings | contracts | 1-0..1 | |
| customers | contracts | 1-n | Theo thời gian |
| contracts | contracts | 1-0..1 | Gia hạn (`previousContractId`) |
| **contracts** | **bed_assignments** | **1-n** | ★ Quan hệ then chốt |
| **beds** | **bed_assignments** | **1-n** | ★ Lịch sử người ở |
| billing_periods | invoices | 1-n | |
| contracts | invoices | 1-n | Unique theo `(contractId, billingPeriodId)` |
| invoices | invoice_lines | 1-n | |
| invoices | invoice_adjustments | 1-n | |
| **payments ↔ invoices** | payment_allocations | **n-n** | ★ Bảng trung gian |
| cash_sessions | payments | 1-n | Chỉ payment tiền mặt |
| contracts | deposit_ledger | 1-n | Sổ cái |
| rooms | utility_meters | 1-n | Có thể dùng chung |
| utility_meters | utility_readings | 1-n | Unique theo `(meterId, billingPeriodId)` |
| branches | services | 1-n | Cấu hình riêng từng chi nhánh |
| contracts | service_subscriptions | 1-n | |
| rooms | assets | 1-n | |
| assets | maintenance_tickets | 1-n | |
| assets | asset_events | 1-n | |
| customers | violations | 1-n | |
| customers | visitor_logs | 1-n | |
| users ↔ roles ↔ branches | user_role_assignments | n-n-n | |
