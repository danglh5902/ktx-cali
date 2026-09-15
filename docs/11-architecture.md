# 11 — Kiến trúc hệ thống

---

## 1. Công nghệ

### 1.1 Stack đã chốt
| Lớp | Công nghệ | Ghi chú |
|---|---|---|
| **Web admin** | Vite + React 19 + TypeScript | SPA |
| **Portal khách thuê** | Cùng codebase, route riêng | Phase 3 |
| **API** | Node.js + TypeScript + **Fastify** + Mongoose | Fastify nhanh hơn và có validation schema sẵn; Express cũng chấp nhận được nếu team quen hơn |
| **Database** | **MongoDB replica set** | Bắt buộc replica set, xem §2 |
| **File/ảnh** | S3-compatible (AWS S3, Cloudflare R2, hoặc MinIO tự host) | Không lưu file trong MongoDB |
| **Queue/Job** | BullMQ + Redis | Cho cron, gửi thông báo, báo cáo nặng |
| **Cache** | Redis | Session, rate limit, cache báo cáo |
| **Xác thực** | JWT access token (15 phút) + refresh token (httpOnly cookie) | |

### 1.2 Thư viện đề xuất
| Mục đích | Thư viện |
|---|---|
| Validation | **Zod** — dùng chung schema cho FE và BE qua `packages/shared` |
| Data fetching | TanStack Query |
| Form | React Hook Form + Zod resolver |
| UI | shadcn/ui + Tailwind (hoặc Ant Design nếu ưu tiên bảng biểu phong phú sẵn có) |
| Bảng dữ liệu | TanStack Table |
| Biểu đồ | Recharts hoặc ECharts |
| Ngày tháng | date-fns + date-fns-tz |
| PDF | Puppeteer (render HTML → PDF, dùng cho hợp đồng/hóa đơn) |
| Excel | ExcelJS |
| Test | Vitest + Supertest + mongodb-memory-server |

### 1.3 Cấu trúc monorepo
```
ktx-cali/
├── apps/
│   ├── web/                 # Vite + React (admin + portal)
│   └── api/                 # Fastify + Mongoose
├── packages/
│   ├── shared/              # Zod schema, types, constants, permission list
│   └── config/              # eslint, tsconfig dùng chung
├── docs/                    # Bộ tài liệu này
└── scripts/                 # seed, migration, import
```

Dùng **pnpm workspace**. Lợi ích lớn nhất: type và Zod schema dùng chung giữa FE và BE — đổi một chỗ, cả hai bên báo lỗi biên dịch ngay.

### 1.4 Cấu trúc thư mục API
```
apps/api/src/
├── modules/
│   ├── branches/
│   │   ├── branch.model.ts        # Mongoose schema
│   │   ├── branch.repository.ts   # ★ CHỖ DUY NHẤT truy cập model
│   │   ├── branch.service.ts      # Nghiệp vụ
│   │   ├── branch.controller.ts   # HTTP
│   │   ├── branch.routes.ts
│   │   └── branch.test.ts
│   ├── invoices/ ...
│   └── ...
├── core/
│   ├── auth/                  # JWT, xác thực
│   ├── rbac/                  # permission, scope guard
│   ├── audit/                 # ghi audit log
│   ├── db/                    # kết nối, transaction helper
│   ├── money/                 # số nguyên VNĐ, làm tròn
│   ├── errors/
│   └── jobs/                  # BullMQ workers
└── server.ts
```

---

## 2. Tám quyết định thiết kế cốt lõi

> Đọc phần này trước khi viết dòng code đầu tiên. Làm sai những điểm này thì chi phí sửa về sau rất lớn.

### D1. Đơn vị tồn kho là GIƯỜNG, không phải PHÒNG
Với mô hình ở ghép, hợp đồng gắn vào giường. Phòng chỉ là container. Thuê nguyên phòng = một hợp đồng giữ nhiều giường, không phải model riêng.

### D2. Tách `contracts` khỏi `bed_assignments` — quyết định quan trọng nhất

```
contracts         = quan hệ pháp lý & thương mại (giá, cọc, kỳ hạn, điều khoản)
bed_assignments   = các đoạn ở thực tế (ai, giường nào, từ ngày nào đến ngày nào)
```

Một hợp đồng có nhiều assignment. Khi tính tiền phòng, engine duyệt assignment giao với kỳ → **prorate tự động, không cần code riêng cho chuyển phòng**.

Nếu nhét `bedId` vào contract: mỗi lần chuyển phòng phải tạo hợp đồng mới (sai pháp lý) hoặc viết logic đặc biệt ở mọi nơi tính tiền. Mọi báo cáo lịch sử trở nên khó.

### D3. Tiền cọc là công nợ phải trả, không phải doanh thu
Sổ cọc riêng (`deposit_ledger`) theo mô hình sổ cái. Không bao giờ vào báo cáo doanh thu.

### D4. Tiền lưu dạng số nguyên VNĐ

```ts
// SAI
{ amount: 2850000.00 }          // Double → sai số tích lũy

// ĐÚNG
{ amount: NumberLong(2850000) } // Int64, đơn vị đồng
```

VNĐ không có phần thập phân nên không cần đơn vị nhỏ hơn. `Int64` chứa được tới ~9×10¹⁸ đồng — thừa đủ.

Tạo module `core/money`:
```ts
type VND = bigint
function roundToThousand(v: VND): VND
function splitEvenly(total: VND, weights: number[]): VND[]  // phần dư dồn vào phần tử cuối
function toText(v: VND): string                              // "Hai triệu tám trăm năm mươi nghìn đồng"
```

### D5. Multi-branch: scope guard ở tầng repository

MongoDB **không có** Row Level Security. Bảo mật phân chi nhánh phải cưỡng chế bằng code, ở một chỗ duy nhất.

```ts
// core/rbac/scope.ts
export interface RequestContext {
  userId: ObjectId
  orgId: ObjectId
  permissions: Set<string>
  scope: 'ALL' | 'BRANCH'
  allowedBranchIds: ObjectId[]
}

export function scopeFilter(ctx: RequestContext): FilterQuery<any> {
  const base = { orgId: ctx.orgId, deletedAt: null }
  if (ctx.scope === 'ALL') return base
  return { ...base, branchId: { $in: ctx.allowedBranchIds } }
}

// Mọi repository:
export class InvoiceRepository {
  async findMany(ctx: RequestContext, filter: FilterQuery<Invoice> = {}) {
    return InvoiceModel.find({ ...scopeFilter(ctx), ...filter })
  }
  async findById(ctx: RequestContext, id: ObjectId) {
    // Lưu ý: KHÔNG findById rồi mới check branch — lộ sự tồn tại của bản ghi
    return InvoiceModel.findOne({ _id: id, ...scopeFilter(ctx) })
  }
}
```

**Bốn biện pháp bắt buộc kèm theo:**

1. **`branchId` denormalized xuống mọi collection nghiệp vụ** — kể cả `invoice_lines`, `payment_allocations`, `audit_logs`. Không bao giờ join ngược lên để kiểm tra quyền.

2. **ESLint rule cấm import model ngoài repository:**
   ```js
   // .eslintrc — no-restricted-imports
   { patterns: [{ group: ['**/*.model'], message:
     'Chỉ repository được import model. Dùng repository để scope guard luôn được áp dụng.' }] }
   ```
   Có ngoại lệ cho chính file repository và file test.

3. **Test phân quyền cho mọi endpoint** — xem [04-roles-permissions.md §5](04-roles-permissions.md).

4. **`orgId` có mặt từ đầu**, dù hiện chỉ có 1 tổ chức. Thêm sau này là dự án migration đau đớn.

> **Trade-off đã ghi nhận:** PostgreSQL + Row Level Security an toàn hơn về mặt cấu trúc — database tự chặn kể cả khi code sai. Với MongoDB, an toàn phụ thuộc kỷ luật code. Vì vậy test phân quyền ở đây **không phải tùy chọn**. Nếu sau này muốn chuyển sang Postgres, mô hình nghiệp vụ trong tài liệu này chuyển đổi được gần như nguyên vẹn (các collection ánh xạ thẳng thành bảng).

### D6. Bắt buộc MongoDB replica set

Multi-document transaction chỉ hoạt động trên replica set. Các nghiệp vụ **bắt buộc** phải atomic:

| Nghiệp vụ | Nếu không atomic |
|---|---|
| Check-in | Khách đang ở mà không có hợp đồng, hoặc giường `OCCUPIED` mà không ai ở |
| Check-out | Giường giải phóng mà cọc chưa quyết toán |
| Sinh hóa đơn | Hóa đơn có nhưng thiếu dòng chi tiết |
| Ghi nhận thanh toán | Tiền ghi nhận nhưng hóa đơn không cập nhật |
| Chuyển giường | Hai assignment cùng mở, hoặc không assignment nào |
| Quyết toán cọc | Bút toán lệch, số dư sai |

```ts
// core/db/transaction.ts
export async function withTransaction<T>(fn: (session: ClientSession) => Promise<T>): Promise<T> {
  const session = await mongoose.startSession()
  try {
    return await session.withTransaction(fn, {
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' },
    })
  } finally {
    await session.endSession()
  }
}
```

**Triển khai:** MongoDB Atlas (gói M10 trở lên) hoặc tự host replica set 3 node. Môi trường dev: single-node replica set (`mongod --replSet rs0` rồi `rs.initiate()`) — vẫn hỗ trợ transaction.

### D7. Trạng thái giường là dữ liệu dẫn xuất

`beds.status` lưu để query nhanh, nhưng **nguồn sự thật** là `bed_assignments` + `maintenance_tickets` + `bookings`.

Job nightly reconcile:
```
Với mỗi giường:
  expected = tính từ assignment/ticket/booking đang hiệu lực
  if (expected !== bed.status) → ghi vào báo cáo lệch trạng thái
→ Gửi danh sách cho Branch Manager mỗi sáng
```

Lý do: lễ tân sẽ quên bấm nút. Luôn luôn. Hệ thống phải tự phát hiện thay vì tin vào kỷ luật con người.

### D8. Két tiền mặt theo ca
Xem [09-module-billing.md §7](09-module-billing.md). Không có thì tiền mặt thất thoát không ai biết.

---

## 3. Kiến trúc Multi-branch

### 3.1 So sánh các phương án

| Phương án | Cách làm | Ưu | Nhược | Phù hợp Cali? |
|---|---|---|---|---|
| **Shared DB + branchId** ✅ | Một database, mọi document có `branchId`, lọc ở tầng repository | Đơn giản nhất, báo cáo hợp nhất dễ, chi phí hạ tầng thấp, migration một lần | Phụ thuộc kỷ luật code, rủi ro nếu quên scope | **Khuyến nghị** |
| Database riêng mỗi chi nhánh | Mỗi chi nhánh một DB | Cách ly tuyệt đối | Báo cáo hợp nhất rất khó, migration nhân lên theo số chi nhánh, chi phí cao | Không |
| Collection riêng mỗi chi nhánh | `invoices_TD`, `invoices_BT`... | — | Truy vấn động, index nhân lên, không mở rộng được | Không |

**Chọn: Shared DB + `branchId` + scope guard tầng repository.**

Lý do: ở quy mô 1–50 chi nhánh, báo cáo hợp nhất là yêu cầu cốt lõi (Owner muốn xem toàn hệ thống). Tách DB làm việc đó trở nên rất phức tạp mà không mang lại lợi ích tương xứng.

### 3.2 Phân cấp định danh
```
orgId    → luôn có, chuẩn bị cho multi-tenant
branchId → ranh giới phân quyền
```

Mọi collection nghiệp vụ có cả hai. Mọi compound index đặt `branchId` (hoặc `orgId`) ở vị trí **đầu tiên**.

### 3.3 Luồng xử lý một request
```
HTTP Request
  → Auth middleware: verify JWT → userId
  → Context middleware: nạp user + role assignments → RequestContext
      { orgId, permissions: Set, scope, allowedBranchIds }
  → Permission guard: route khai báo permission cần có
      route.config = { permission: 'invoice:issue' }
  → Controller: validate input bằng Zod
  → Service: nghiệp vụ + kiểm tra điều kiện (hạn mức, quyền sở hữu)
  → Repository: scopeFilter(ctx) tự động áp vào mọi query
  → MongoDB
  ← Response (chỉ trả field mà vai trò đó được xem)
```

### 3.4 Owner/Super Admin xem toàn hệ thống
`scope = 'ALL'` → `scopeFilter` chỉ lọc theo `orgId`, bỏ qua `branchId`. Không có code path riêng — cùng một hàm, khác tham số.

---

## 4. Xử lý tiền tệ

```ts
// packages/shared/money.ts

/** Tiền VNĐ, đơn vị đồng, luôn là số nguyên */
export type VND = bigint

export const vnd = (n: number | string | bigint): VND => BigInt(n)

/** Làm tròn tới 1.000đ, nửa lên */
export function roundToThousand(v: VND): VND {
  const r = v % 1000n
  return r >= 500n ? v - r + 1000n : v - r
}

/** Chia theo trọng số, phần dư dồn vào phần tử cuối — tổng luôn khớp */
export function splitByWeight(total: VND, weights: number[]): VND[] {
  const sum = weights.reduce((a, b) => a + b, 0)
  const parts = weights.map(w => (total * BigInt(Math.round(w * 1000))) / BigInt(Math.round(sum * 1000)))
  const allocated = parts.reduce((a, b) => a + b, 0n)
  parts[parts.length - 1] += total - allocated   // phần dư
  return parts
}

/** Đọc thành chữ — bắt buộc cho hợp đồng và phiếu thu */
export function toVietnameseText(v: VND): string
```

**Lưu trong MongoDB:** `Long` (Int64) qua `mongoose.Schema.Types.BigInt` hoặc custom type. Đọc ra chuyển về `bigint`. **Tuyệt đối không dùng `Number` cho tiền.**

**Truyền qua JSON:** `bigint` không serialize được sang JSON → truyền dạng **chuỗi** (`"2850000"`), FE parse lại. Đặt quy ước này ngay từ đầu, thống nhất trong Zod schema dùng chung.

---

## 5. Thời gian & múi giờ

| Quy tắc | Chi tiết |
|---|---|
| **Lưu trữ** | Luôn UTC (`Date` của MongoDB) |
| **Hiển thị** | `Asia/Ho_Chi_Minh` (UTC+7) |
| **Mốc kỳ** | Ngày chốt kỳ, hạn thanh toán tính theo giờ VN, không phải UTC |
| **Ngày thuần túy** | `startDate`, `endDate` của hợp đồng/assignment là **ngày**, không có giờ → lưu chuỗi `YYYY-MM-DD` hoặc `Date` đặt ở 00:00 giờ VN. Nếu không, hợp đồng bắt đầu 01/09 sẽ thành 31/08 khi hiển thị |
| **Prorate** | Đếm theo ngày lịch giờ VN, không theo mili-giây |

Đây là nguồn bug âm thầm rất phổ biến. Chốt quy ước từ đầu và viết test cho ranh giới tháng.

---

## 6. Audit Log

### 6.1 Nguyên tắc
- **Append-only.** Không có API update/delete.
- Ghi ở tầng service, không ở tầng repository (để có ngữ cảnh nghiệp vụ, không chỉ thay đổi dữ liệu).
- Trường `reason` **bắt buộc** với nhóm hành động nhạy cảm.

### 6.2 Hành động bắt buộc ghi audit

| Nhóm | Hành động |
|---|---|
| **Tài chính** | Phát hành hóa đơn · điều chỉnh · hủy · giảm giá · ghi nhận thanh toán · đảo thanh toán · phân bổ lại · mọi bút toán cọc · xóa nợ · duyệt chênh lệch két |
| **Giá** | Sửa bảng giá · giá phòng · giá giường · giá dịch vụ · giá điện nước |
| **Lưu trú** | Check-in · check-out · chuyển giường/phòng/chi nhánh · chấm dứt hợp đồng |
| **Phân quyền** | Tạo/sửa/xóa vai trò · gán/thu hồi quyền · vô hiệu hóa tài khoản |
| **Dữ liệu** | Mọi hành động xóa · import hàng loạt · export dữ liệu khách |
| **Nhạy cảm** | **Mọi lượt xem ảnh CCCD** · đăng nhập thất bại nhiều lần |

### 6.3 Cấu trúc
```js
{
  _id, orgId, branchId,
  actorId, actorName, actorRole,        // snapshot — user có thể bị xóa sau này
  action: 'invoice.adjust',
  entity: 'invoices', entityId,
  before: { grandTotal: 2850000 },      // chỉ field thay đổi
  after:  { grandTotal: 2500000 },
  diff: [{ path: 'grandTotal', from: ..., to: ... }],
  reason: 'Ghi nhầm chỉ số điện...',    // bắt buộc với nhóm nhạy cảm
  ip, userAgent, requestId,
  at: ISODate()
}
```

Lưu `actorName`/`actorRole` dạng snapshot — nếu chỉ lưu `actorId` và user bị xóa, audit log mất ý nghĩa.

### 6.4 Lưu trữ & bảo vệ
- Index: `{entity, entityId, at:-1}`, `{branchId, at:-1}`, `{actorId, at:-1}`
- **Audit tài chính giữ vĩnh viễn.** Audit thao tác thông thường TTL 3 năm
- Cân nhắc bản sao append-only ở nơi khác (S3 object-lock) cho nhóm tài chính — để kể cả DB bị xâm nhập, dấu vết vẫn còn
- Phân quyền xem: Owner/Super Admin toàn bộ, Branch Manager theo chi nhánh, Kế toán nhóm tài chính

---

## 7. Bảo mật

### 7.1 Xác thực
| Mục | Thiết kế |
|---|---|
| Đăng nhập | Email/SĐT + mật khẩu. Hash bằng **argon2id** |
| Token | Access JWT 15 phút + refresh token httpOnly cookie 7 ngày, có xoay vòng (rotation) |
| Phiên nhân viên | Hết hạn sau 8 giờ không hoạt động (ngắn hơn khách thuê) |
| Mật khẩu mặc định | Bắt buộc đổi lần đăng nhập đầu |
| 2FA | Phase 3, cho Owner/Super Admin/Accountant |
| Khóa tài khoản | 5 lần sai → khóa 15 phút, tăng dần |
| Portal khách | Đăng nhập bằng SĐT + OTP (đơn giản hơn cho khách, không phải nhớ mật khẩu) |

### 7.2 Dữ liệu nhạy cảm — Nghị định 13/2023

Ảnh CCCD và thông tin định danh thuộc nhóm dữ liệu cá nhân cần bảo vệ nghiêm ngặt.

| Yêu cầu | Triển khai |
|---|---|
| Không để URL công khai | Object storage private, truy cập qua **presigned URL hết hạn sau 5 phút** |
| Mã hóa khi lưu | Bật server-side encryption trên bucket |
| Ghi log mọi lượt xem | Audit `customer.view_id_doc` |
| Giới hạn theo vai trò | Chỉ Super Admin, Owner, Branch Manager, Receptionist |
| Đồng ý của chủ thể | Điều khoản trong hợp đồng về việc thu thập và sử dụng |
| Chính sách lưu trữ | Xóa/ẩn danh ảnh CCCD sau N năm kể từ khi khách trả phòng |
| Quyền xóa dữ liệu | Quy trình ẩn danh hóa (giữ bản ghi tài chính) |

### 7.3 Các biện pháp khác
| Rủi ro | Biện pháp |
|---|---|
| Lộ dữ liệu qua API | Chỉ trả field cần thiết theo vai trò. Không trả nguyên document |
| Brute force | Rate limit theo IP + theo tài khoản |
| Webhook giả | Verify chữ ký HMAC, kiểm tra IP nguồn, idempotency |
| SQL/NoSQL injection | Mongoose + Zod validation; cấm truyền object thô vào query |
| XSS | React escape mặc định; sanitize nội dung template |
| CSRF | SameSite=Strict cho refresh cookie |
| Upload độc hại | Kiểm tra MIME thật (magic bytes), giới hạn dung lượng, quét virus với file lớn |
| Lộ qua export | Giới hạn quyền, ghi audit, watermark tên người xuất trên PDF |
| Nhân viên cũ | Quy trình offboarding tự động |

---

## 8. Hiệu năng

### 8.1 Thực tế quy mô
Ở 500 giường: ~6.000 hóa đơn/năm, ~30.000 dòng hóa đơn/năm, ~15.000 thanh toán/năm. **Rất nhỏ.** Không có vấn đề hiệu năng ở Phase 1–2.

**Đừng tối ưu sớm.** Đầu tư vào tính đúng đắn và khả năng kiểm toán.

### 8.2 Ba chỗ sẽ chậm trước tiên (khi 10–50 chi nhánh)

| Chỗ | Vấn đề | Giải pháp |
|---|---|---|
| **Sơ đồ giường** | Cần vài trăm giường + trạng thái + người ở | Denormalize `branchId`/`roomId`/`currentAssignmentId` vào `beds` → một truy vấn duy nhất |
| **Báo cáo nhiều tháng × nhiều chi nhánh** | Aggregate trên `invoice_lines` | Collection `report_snapshots` tính sẵn theo ngày (job nightly). Từ Phase 2 |
| **Aging công nợ** | Quét mọi hóa đơn chưa thu | Index `{branchId, status, dueDate}`, lưu sẵn `balance` trên invoice |

### 8.3 Nguyên tắc index
1. `branchId` (hoặc `orgId`) luôn ở **vị trí đầu** compound index
2. Mọi trường dùng để lọc danh sách chính đều có index
3. Trường `deletedAt` đưa vào partial index thay vì index riêng
4. Định kỳ kiểm tra `db.collection.aggregate([{$indexStats:{}}])` để bỏ index không dùng

---

## 9. Backup & khôi phục

| Mục | Yêu cầu |
|---|---|
| **Backup database** | Hằng ngày tự động. Giữ 30 bản ngày + 12 bản cuối tháng |
| **Backup object storage** | Bật versioning + sao chép sang vùng khác. **Hay bị quên nhất** — mất ảnh CCCD và hợp đồng PDF là mất bằng chứng pháp lý |
| **RPO** (mất tối đa bao nhiêu dữ liệu) | ≤ 24 giờ. Nếu dùng Atlas, bật point-in-time recovery → ≤ 1 phút |
| **RTO** (khôi phục trong bao lâu) | ≤ 4 giờ |
| **Diễn tập restore** | **Mỗi quý.** Restore vào môi trường riêng, kiểm tra dữ liệu, ghi lại thời gian thực tế. Backup chưa từng restore = không có backup |
| **Trước migration** | Backup + kịch bản rollback viết sẵn |
| **Audit log tài chính** | Bản sao riêng, append-only (S3 object-lock) |

---

## 10. Triển khai & môi trường

### 10.1 Môi trường
| Môi trường | Mục đích |
|---|---|
| `local` | Dev, MongoDB single-node replica set qua Docker |
| `staging` | Dữ liệu giả, test tính năng và migration |
| `production` | |

### 10.2 Hạ tầng đề xuất (quy mô hiện tại)
| Thành phần | Lựa chọn | Chi phí ước tính |
|---|---|---|
| API | VPS 2–4 vCPU tại VN (Viettel/VNG/BizflyCloud) hoặc Singapore | 500k–1,5tr/tháng |
| MongoDB | Atlas M10 (Singapore) hoặc tự host replica set trên 3 VPS | Atlas ~1,5tr/tháng |
| Redis | Cùng VPS hoặc Upstash | Thấp |
| Object storage | Cloudflare R2 (không tính phí egress) | Rất thấp |
| Web | Vercel/Netlify hoặc nginx cùng VPS | Miễn phí–thấp |
| Zalo ZNS | Theo tin nhắn | ~200–600đ/tin |

**Lưu ý về độ trễ:** đặt server tại VN hoặc Singapore. Đặt ở Mỹ/EU sẽ làm ứng dụng chậm rõ rệt với người dùng VN.

### 10.3 Vận hành
- CI: chạy test + lint + type check trên mọi PR
- CD: deploy tự động lên staging, deploy production cần xác nhận thủ công
- Migration script có phiên bản, chạy tự động khi deploy, có rollback
- Giám sát: health check, cảnh báo lỗi (Sentry), log tập trung
- Cảnh báo nghiệp vụ: job sinh hóa đơn thất bại, webhook thanh toán lỗi, chênh lệch két bất thường

---

## 11. Migration path nếu sau này muốn đổi sang PostgreSQL

Ghi lại để không bị khóa vào một lựa chọn:

| MongoDB | PostgreSQL |
|---|---|
| Collection | Bảng |
| `ObjectId` | `uuid` |
| Document lồng nhau (`snapshot`, `amenities[]`) | `jsonb` |
| Scope guard tầng repository | **Row Level Security** — an toàn hơn |
| Multi-document transaction | Transaction gốc |
| `Int64` tiền | `bigint` |
| Partial unique index | Partial unique index (tương đương) |

Mô hình nghiệp vụ trong bộ tài liệu này **không phụ thuộc MongoDB**. Nếu quy mô tăng và nhu cầu báo cáo phức tạp hơn, việc chuyển đổi là khả thi — tốn công chủ yếu ở tầng repository, không phải ở nghiệp vụ.
