# 11 — Kiến trúc hệ thống

---

## 1. Công nghệ

### 1.1 Stack đã chốt
| Lớp | Công nghệ | Ghi chú |
|---|---|---|
| **Web admin** | Vite + React 19 + TypeScript | SPA |
| **Portal khách thuê** | Cùng codebase, route riêng | Phase 3 |
| **API** | Node.js + TypeScript + **Fastify** | Fastify nhanh hơn và có validation schema sẵn; Express cũng chấp nhận được nếu team quen hơn |
| **Database** | **Supabase (PostgreSQL managed)** | Postgres có transaction ACID gốc và Row-Level Security native — không cần replica set/cụm để có transaction, xem §2 |
| **ORM** | Drizzle (hoặc Prisma) | Truy vấn Postgres type-safe, migration có version |
| **Auth** | Supabase Auth | JWT + quản lý session; permission/role riêng vẫn do app tự thiết kế (xem [04-roles-permissions.md](04-roles-permissions.md)) |
| **File/ảnh** | **Cloudinary** | Chỉ lưu ảnh (CCCD, kiểm kê, sự cố, tài sản...). Hệ thống không tạo/lưu file PDF — xem ghi chú cuối §7.2 |
| **Queue/Job** | BullMQ + Redis | Cho cron, gửi thông báo, báo cáo nặng |
| **Cache** | Redis | Session, rate limit, cache báo cáo |
| **Thanh toán** | VietQR + webhook ngân hàng (Casso/SePay hoặc API ngân hàng) | Cổng thanh toán bên thứ 3 chính thức — xem mục 11 |

### 1.2 Thư viện đề xuất
| Mục đích | Thư viện |
|---|---|
| Validation | **Zod** |
| Data fetching | TanStack Query |
| Form | React Hook Form + Zod resolver |
| UI | shadcn/ui + Tailwind (hoặc Ant Design nếu ưu tiên bảng biểu phong phú sẵn có) |
| Bảng dữ liệu | TanStack Table |
| Biểu đồ | Recharts hoặc ECharts |
| Ngày tháng | date-fns + date-fns-tz |
| Ảnh | Cloudinary SDK (upload, transform, signed/private delivery URL) |
| Excel | ExcelJS |
| Test | Vitest + Supertest + Postgres test container (Testcontainers hoặc Supabase local CLI) |

### 1.3 Cấu trúc thư mục dự án
```
ktx-cali/
├── be/                      # Fastify + Drizzle (API) — thư mục độc lập, tự cài & deploy riêng
├── fe/                      # Vite + React (admin + portal) — thư mục độc lập, tự cài & deploy riêng
└── docs/                    # Bộ tài liệu này
```

`be/` và `fe/` là 2 thư mục **hoàn toàn độc lập** ở cấp gốc — mỗi thư mục có `package.json`/`node_modules`/lockfile riêng, không dùng chung workspace (pnpm workspace, packages/shared...). Lý do: `be` và `fe` deploy tách biệt (khác hosting target, khác vòng đời release), dùng chung workspace sẽ tạo phụ thuộc build không cần thiết giữa hai bên. Logic dùng chung cho BE (money, permission catalogue, Zod schema, `RequestContext` type) nằm nội bộ trong `be/src/shared/`; nếu `fe/` sau này cần cùng logic, copy/publish riêng thay vì quay lại mô hình workspace chung.

### 1.4 Cấu trúc thư mục API
```
be/src/
├── modules/
│   ├── branches/
│   │   ├── branch.schema.ts       # Drizzle table schema (Postgres) — đặt trong core/db/schema thật ra
│   │   ├── branch.repository.ts   # ★ CHỖ DUY NHẤT truy cập bảng
│   │   ├── branch.service.ts      # Nghiệp vụ
│   │   ├── branch.controller.ts   # HTTP
│   │   ├── branch.routes.ts
│   │   └── branch.test.ts
│   ├── invoices/ ...
│   └── ...
├── shared/                    # money (VND bigint), permission catalogue, RequestContext type, Zod schema
├── core/
│   ├── auth/                  # Supabase Auth, xác thực
│   ├── rbac/                  # permission, RLS policy helper
│   ├── audit/                 # ghi audit log
│   ├── db/                    # kết nối Postgres, transaction helper, RLS policy generator
│   ├── money/                 # re-export shared/money + JSON (de)serialize cho VND
│   ├── payment/                # webhook VietQR/Casso/SePay, xác thực chữ ký, đối soát
│   └── errors/
├── app.ts
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

```sql
-- SAI
amount numeric(15,2)   -- hoặc double precision → sai số tích lũy

-- ĐÚNG
amount bigint          -- đơn vị đồng, không có phần thập phân
```

VNĐ không có phần thập phân nên không cần đơn vị nhỏ hơn. Postgres `bigint` chứa được tới ~9×10¹⁸ đồng — thừa đủ.

Tạo module `shared/money.ts`:
```ts
type VND = bigint
function roundToThousand(v: VND): VND
function splitEvenly(total: VND, weights: number[]): VND[]  // phần dư dồn vào phần tử cuối
function toText(v: VND): string                              // "Hai triệu tám trăm năm mươi nghìn đồng"
```

### D5. Multi-branch: Row-Level Security native ở Postgres

Postgres có RLS built-in — mỗi bảng nghiệp vụ có policy khai báo, database tự chặn truy vấn sai chi nhánh kể cả khi code tầng trên có bug. Đây là điểm khác biệt lớn nhất so với thiết kế MongoDB trước đây (từng phải tự cưỡng chế "scope guard" bằng code).

```sql
-- Bật RLS trên mọi bảng nghiệp vụ
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Policy: chỉ thấy invoice của org mình, và (nếu scope=BRANCH) chỉ chi nhánh được gán
CREATE POLICY invoices_branch_scope ON invoices
  USING (
    org_id = current_setting('app.org_id')::uuid
    AND (
      current_setting('app.scope') = 'ALL'
      OR branch_id = ANY (string_to_array(current_setting('app.allowed_branch_ids'), ',')::uuid[])
    )
  );
```

`app.org_id` / `app.scope` / `app.allowed_branch_ids` được set mỗi request (`SET LOCAL`) ngay sau khi middleware xác thực đọc xong `RequestContext` — trong cùng transaction/connection của request đó, nên không rò rỉ giữa các request đồng thời.

```ts
// core/rbac/context.ts
export interface RequestContext {
  userId: string
  orgId: string
  permissions: Set<string>
  scope: 'ALL' | 'BRANCH'
  allowedBranchIds: string[]
}

// core/db/withRequestContext.ts — áp dụng trước mọi truy vấn của request
export async function withRequestContext<T>(ctx: RequestContext, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SET LOCAL app.org_id = ${ctx.orgId}`)
    await tx.execute(sql`SET LOCAL app.scope = ${ctx.scope}`)
    await tx.execute(sql`SET LOCAL app.allowed_branch_ids = ${ctx.allowedBranchIds.join(',')}`)
    return fn(tx)
  })
}
```

**Bốn biện pháp bắt buộc kèm theo (vẫn giữ, nay là defense-in-depth chứ không phải lớp chặn duy nhất):**

1. **`branch_id` có ở mọi bảng nghiệp vụ** — kể cả `invoice_lines`, `payment_allocations`, `audit_logs` — làm khóa ngoại thật (FK), không chỉ để lọc.

2. **Repository là nơi duy nhất chạy câu lệnh SQL/ORM.** ESLint rule cấm import schema/query builder ngoài repository, tương tự trước đây — mục đích để mọi truy vấn đều đi qua `withRequestContext()`.

3. **Test phân quyền cho mọi endpoint vẫn bắt buộc** — xem [04-roles-permissions.md §5](04-roles-permissions.md). RLS là lớp chặn ở database, nhưng test đảm bảo permission/limit ở tầng ứng dụng (lớp 1 và 3 trong mô hình 3 lớp) cũng đúng.

4. **`org_id` có mặt từ đầu**, dù hiện chỉ có 1 tổ chức. Thêm sau này là dự án migration đau đớn.

> **Vì sao đổi từ MongoDB sang Postgres/Supabase:** thiết kế trước đây (scope-guard code + `NumberLong` cho tiền + bắt buộc replica set chỉ để có transaction) là cách "giả lập" các tính năng mà Postgres có sẵn native (RLS, `bigint`, transaction ACID). Ở quy mô hiện tại, đổi ngay từ giai đoạn thiết kế (chưa viết code) là thời điểm rẻ nhất.

### D6. Transaction là mặc định của Postgres — không cần hạ tầng đặc biệt

Postgres hỗ trợ multi-statement transaction ACID ngay trên một instance duy nhất, không cần cụm/replica set như MongoDB. Các nghiệp vụ **bắt buộc** phải atomic:

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
export async function withTransaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => fn(tx))
}
```

**Triển khai:** Supabase project (managed Postgres) — không cần tự vận hành cụm, không cần cấu hình đặc biệt để có transaction. Môi trường dev: Supabase CLI chạy Postgres local qua Docker, hoặc kết nối thẳng project Supabase dev.

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
| **Shared DB + `branch_id` + RLS** ✅ | Một database Postgres, mọi bảng có `branch_id`, chặn ở RLS policy | Đơn giản nhất, báo cáo hợp nhất dễ, chi phí hạ tầng thấp, database tự chặn kể cả khi code sai | Cần thiết kế policy đúng ngay từ đầu | **Khuyến nghị** |
| Database riêng mỗi chi nhánh | Mỗi chi nhánh một DB | Cách ly tuyệt đối | Báo cáo hợp nhất rất khó, migration nhân lên theo số chi nhánh, chi phí cao | Không |
| Schema riêng mỗi chi nhánh | `invoices_td`, `invoices_bt`... | — | Truy vấn động, không mở rộng được | Không |

**Chọn: Shared DB + `branch_id` + Row-Level Security.**

Lý do: ở quy mô 1–50 chi nhánh, báo cáo hợp nhất là yêu cầu cốt lõi (Owner muốn xem toàn hệ thống). Tách DB làm việc đó trở nên rất phức tạp mà không mang lại lợi ích tương xứng. So với thiết kế MongoDB trước đây, RLS loại bỏ hẳn rủi ro "quên áp scope ở một endpoint" vì chặn xảy ra ở database, không phải ở code.

### 3.2 Phân cấp định danh
```
org_id    → luôn có, chuẩn bị cho multi-tenant
branch_id → ranh giới phân quyền
```

Mọi bảng nghiệp vụ có cả hai (làm FK thật). Mọi compound index đặt `branch_id` (hoặc `org_id`) ở vị trí **đầu tiên**.

### 3.3 Luồng xử lý một request
```
HTTP Request
  → Auth middleware: verify Supabase JWT → userId
  → Context middleware: nạp user + role assignments → RequestContext
      { orgId, permissions: Set, scope, allowedBranchIds }
  → Permission guard: route khai báo permission cần có
      route.config = { permission: 'invoice:issue' }
  → Controller: validate input bằng Zod
  → Service: nghiệp vụ + kiểm tra điều kiện (hạn mức, quyền sở hữu)
  → Repository: withRequestContext(ctx) set biến phiên Postgres → RLS tự áp vào mọi query
  → Postgres (Supabase)
  ← Response (chỉ trả field mà vai trò đó được xem)
```

### 3.4 Owner/Super Admin xem toàn hệ thống
`scope = 'ALL'` → policy RLS bỏ qua điều kiện `branch_id`, chỉ còn lọc theo `org_id`. Không có code path riêng — cùng một policy, khác giá trị biến phiên.

---

## 4. Xử lý tiền tệ

```ts
// be/src/shared/money.ts

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

**Lưu trong Postgres:** cột kiểu `bigint` (kiểu gốc của Postgres, không cần custom type như Mongoose). Đọc ra qua Drizzle/driver về `bigint` JS. **Tuyệt đối không dùng `numeric`/`float`/`Number` cho tiền.**

**Truyền qua JSON:** `bigint` không serialize được sang JSON → truyền dạng **chuỗi** (`"2850000"`), FE parse lại. Đặt quy ước này ngay từ đầu, thống nhất trong Zod schema.

---

## 5. Thời gian & múi giờ

| Quy tắc | Chi tiết |
|---|---|
| **Lưu trữ** | Luôn UTC (`timestamptz` của Postgres) |
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
  id, orgId, branchId,
  actorId, actorName, actorRole,        // snapshot — user có thể bị xóa sau này
  action: 'invoice.adjust',
  entity: 'invoices', entityId,
  before: { grandTotal: 2850000 },      // chỉ field thay đổi
  after:  { grandTotal: 2500000 },
  diff: [{ path: 'grandTotal', from: ..., to: ... }],
  reason: 'Ghi nhầm chỉ số điện...',    // bắt buộc với nhóm nhạy cảm
  ip, userAgent, requestId,
  at: timestamptz
}
```

Lưu `actorName`/`actorRole` dạng snapshot — nếu chỉ lưu `actorId` và user bị xóa, audit log mất ý nghĩa.

### 6.4 Lưu trữ & bảo vệ
- Index: `(entity, entity_id, at desc)`, `(branch_id, at desc)`, `(actor_id, at desc)`
- **Audit tài chính giữ vĩnh viễn.** Audit thao tác thông thường xóa sau 3 năm (job dọn định kỳ, Postgres không có TTL index sẵn như MongoDB)
- Cân nhắc bản sao append-only ở nơi khác cho nhóm tài chính (vd: export định kỳ sang object storage có object-lock) — để kể cả DB chính bị xâm nhập, dấu vết vẫn còn
- Phân quyền xem: RLS + policy riêng cho bảng `audit_logs` — Owner/Super Admin toàn bộ, Branch Manager theo chi nhánh, Kế toán nhóm tài chính

---

## 7. Bảo mật

### 7.1 Xác thực
| Mục | Thiết kế |
|---|---|
| Đăng nhập | Email/SĐT + mật khẩu qua **Supabase Auth**. Hash bằng argon2id (Supabase Auth quản lý sẵn) |
| Token | Access JWT (Supabase) + refresh token, có xoay vòng (rotation) |
| Phiên nhân viên | Hết hạn sau 8 giờ không hoạt động (ngắn hơn khách thuê) — cấu hình session timeout trong Supabase Auth |
| Mật khẩu mặc định | Bắt buộc đổi lần đăng nhập đầu |
| 2FA | Phase 3, cho Owner/Super Admin/Accountant — Supabase Auth hỗ trợ MFA sẵn |
| Khóa tài khoản | 5 lần sai → khóa 15 phút, tăng dần |
| Portal khách | Đăng nhập bằng SĐT + OTP (Supabase Auth hỗ trợ Phone OTP) |

### 7.2 Dữ liệu nhạy cảm — Nghị định 13/2023

Ảnh CCCD và thông tin định danh thuộc nhóm dữ liệu cá nhân cần bảo vệ nghiêm ngặt.

| Yêu cầu | Triển khai |
|---|---|
| Không để URL công khai | Cloudinary **private/authenticated delivery**, truy cập qua **signed URL hết hạn sau 5 phút** |
| Mã hóa khi lưu | Bật mã hóa at-rest trên Cloudinary (theo gói dịch vụ) |
| Ghi log mọi lượt xem | Audit `customer.view_id_doc` |
| Giới hạn theo vai trò | Chỉ Super Admin, Owner, Branch Manager, Receptionist |
| Đồng ý của chủ thể | Điều khoản trong hợp đồng về việc thu thập và sử dụng |
| Chính sách lưu trữ | Xóa/ẩn danh ảnh CCCD sau N năm kể từ khi khách trả phòng |
| Quyền xóa dữ liệu | Quy trình ẩn danh hóa (giữ bản ghi tài chính) |

> **Ghi chú phạm vi lưu trữ:** Hệ thống chỉ lưu **ảnh** (CCCD, kiểm kê check-in/out, sự cố bảo trì, hóa đơn chi phí...) qua Cloudinary — không tạo/lưu file PDF cho hợp đồng hay hóa đơn. Đây là quyết định sản phẩm đã cân nhắc: hợp đồng/hóa đơn tồn tại dạng dữ liệu có thể xem trong hệ thống; khi cần bản cứng để ký/lưu hồ sơ theo quy định pháp luật, in trực tiếp từ màn hình xem (in trình duyệt) thay vì hệ thống generate và lưu trữ PDF. Xem thêm [08-module-contracts.md](08-module-contracts.md).

### 7.3 Các biện pháp khác
| Rủi ro | Biện pháp |
|---|---|
| Lộ dữ liệu qua API | Chỉ trả field cần thiết theo vai trò. Không trả nguyên row |
| Brute force | Rate limit theo IP + theo tài khoản |
| Webhook giả (VietQR/Casso/SePay) | Verify chữ ký HMAC, kiểm tra IP nguồn, idempotency key trên `payments.idempotencyKey`/`externalTxnId` |
| SQL injection | ORM (Drizzle/Prisma) tham số hóa câu lệnh + Zod validation; cấm ghép chuỗi SQL thô |
| XSS | React escape mặc định; sanitize nội dung template |
| CSRF | SameSite=Strict cho refresh cookie |
| Upload độc hại | Kiểm tra MIME thật (magic bytes) trước khi đẩy lên Cloudinary, giới hạn dung lượng |
| Lộ qua export | Giới hạn quyền, ghi audit, watermark tên người xuất trên file export (Excel) |
| Nhân viên cũ | Quy trình offboarding tự động |

---

## 8. Hiệu năng

### 8.1 Thực tế quy mô
Ở 500 giường: ~6.000 hóa đơn/năm, ~30.000 dòng hóa đơn/năm, ~15.000 thanh toán/năm. **Rất nhỏ.** Không có vấn đề hiệu năng ở Phase 1–2.

**Đừng tối ưu sớm.** Đầu tư vào tính đúng đắn và khả năng kiểm toán.

### 8.2 Ba chỗ sẽ chậm trước tiên (khi 10–50 chi nhánh)

| Chỗ | Vấn đề | Giải pháp |
|---|---|---|
| **Sơ đồ giường** | Cần vài trăm giường + trạng thái + người ở | Denormalize `branch_id`/`room_id`/`current_assignment_id` vào bảng `beds` → một truy vấn (JOIN đơn giản) duy nhất |
| **Báo cáo nhiều tháng × nhiều chi nhánh** | Aggregate trên `invoice_lines` | Bảng `report_snapshots` tính sẵn theo ngày (job nightly), hoặc materialized view Postgres. Từ Phase 2 |
| **Aging công nợ** | Quét mọi hóa đơn chưa thu | Index `(branch_id, status, due_date)`, lưu sẵn `balance` trên invoice |

### 8.3 Nguyên tắc index
1. `branch_id` (hoặc `org_id`) luôn ở **vị trí đầu** compound index
2. Mọi trường dùng để lọc danh sách chính đều có index
3. Trường `deleted_at` dùng **partial index** (`WHERE deleted_at IS NULL`) thay vì index riêng
4. Định kỳ kiểm tra `pg_stat_user_indexes` để bỏ index không dùng

---

## 9. Backup & khôi phục

| Mục | Yêu cầu |
|---|---|
| **Backup database** | Supabase tự động backup hằng ngày (theo gói); Pro plan trở lên có Point-in-Time Recovery |
| **Backup ảnh (Cloudinary)** | Bật backup/versioning theo gói Cloudinary. **Hay bị quên nhất** — mất ảnh CCCD và ảnh kiểm kê là mất bằng chứng pháp lý |
| **RPO** (mất tối đa bao nhiêu dữ liệu) | ≤ 24 giờ ở gói cơ bản; bật PITR (Supabase Pro+) → ≤ vài phút |
| **RTO** (khôi phục trong bao lâu) | ≤ 4 giờ |
| **Diễn tập restore** | **Mỗi quý.** Restore vào môi trường riêng, kiểm tra dữ liệu, ghi lại thời gian thực tế. Backup chưa từng restore = không có backup |
| **Trước migration schema** | Backup + kịch bản rollback (migration Drizzle/Prisma có version) viết sẵn |
| **Audit log tài chính** | Bản sao riêng, append-only (export định kỳ sang object storage có object-lock) |

---

## 10. Triển khai & môi trường

### 10.1 Môi trường
| Môi trường | Mục đích |
|---|---|
| `local` | Dev, Supabase CLI chạy Postgres local qua Docker |
| `staging` | Supabase project riêng, dữ liệu giả, test tính năng và migration |
| `production` | Supabase project riêng |

### 10.2 Hạ tầng đề xuất (quy mô hiện tại)
| Thành phần | Lựa chọn | Chi phí ước tính |
|---|---|---|
| API | VPS 2–4 vCPU tại VN (Viettel/VNG/BizflyCloud) hoặc Singapore | 500k–1,5tr/tháng |
| Database + Auth | Supabase (Singapore region) — Free tier cho pilot, Pro ~$25/tháng khi cần PITR/tăng quota | 0–600k/tháng |
| Redis | Cùng VPS hoặc Upstash | Thấp |
| Lưu trữ ảnh | Cloudinary (free tier cho pilot, trả phí theo băng thông/lưu trữ khi tăng quy mô) | Thấp–trung bình |
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

## 11. Thanh toán bên thứ 3 (VietQR + webhook ngân hàng)

Cổng thanh toán chính thức của hệ thống: **VietQR động** (QR sinh riêng cho từng hóa đơn) + **webhook đối soát ngân hàng** qua trung gian (Casso, SePay) hoặc API ngân hàng trực tiếp. Chi tiết luồng nghiệp vụ và màn hình đối soát: [09-module-billing.md](09-module-billing.md).

### 11.1 Kiến trúc webhook
```
Ngân hàng ghi có → Casso/SePay phát hiện → gọi webhook → be/src/core/payment
  1. Verify chữ ký HMAC (secret riêng theo nhà cung cấp)
  2. Kiểm tra idempotency: lookup payments.externalTxnId trước khi insert
  3. Ghi payments (method='VIETQR', status='CONFIRMED', externalTxnId, bankRef)
  4. Đối soát tự động theo mã hóa đơn trong nội dung chuyển khoản (VietQR nhúng sẵn)
  5. Không khớp tự động → vào hàng chờ đối soát thủ công (payments.status='PENDING')
```

### 11.2 Nguyên tắc bắt buộc
- **Idempotency là bắt buộc** — webhook có thể gọi lại nhiều lần cho cùng một giao dịch; `payments.externalTxnId` unique nullable chặn ghi trùng (đã có ở [12-database-schema.md](12-database-schema.md)).
- **Không tin payload webhook** — luôn verify chữ ký trước khi xử lý; log mọi request đến kể cả khi verify thất bại (phát hiện tấn công giả webhook).
- **Đối soát thủ công vẫn giữ song song** — webhook có thể lỗi/downtime, lễ tân/kế toán vẫn ghi nhận thanh toán tay được (`method='CASH'`/`BANK_TRANSFER`) như phương án dự phòng.
- Theo roadmap ([18-roadmap.md](18-roadmap.md)), tích hợp VietQR/webhook triển khai ở **Phase 3** — Phase 1 dùng ghi nhận thủ công để kiểm chứng logic công nợ/hóa đơn trước khi tự động hóa đối soát.
