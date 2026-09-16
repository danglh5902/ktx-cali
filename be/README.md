# ktx-cali-be

Fastify + Drizzle (PostgreSQL/Supabase) backend — thư mục độc lập, tự cài dependency riêng và deploy riêng với `fe/`. Đọc [docs/11-architecture.md](../docs/11-architecture.md) trước khi sửa code ở đây — đặc biệt mục "8 quyết định thiết kế cốt lõi".

## Setup

```bash
cd be
pnpm install
cp .env.example .env
# điền SUPABASE_URL, SUPABASE_JWT_SECRET, DATABASE_URL, MIGRATE_DATABASE_URL
```

**Bắt buộc dùng 2 connection string khác role — xem [src/core/db/rls/README.md](src/core/db/rls/README.md):**
- `DATABASE_URL` (app runtime) → role `ktx_app` (tự tạo, xem README trên) — **không bao giờ dùng role `postgres`**, vì role đó có `rolbypassrls = true` trên Supabase, bỏ qua RLS vô điều kiện dù policy có đúng hay không.
- `MIGRATE_DATABASE_URL` (chỉ dùng cho `db:generate`/`db:migrate`/`db:apply-rls`) → role `postgres`, vì `CREATE TABLE`/`CREATE POLICY` cần quyền chủ sở hữu.

**Lưu ý connection string:** dùng **Session pooler (port 5432)**, **không dùng Transaction pooler (port 6543)** — `core/db/request-context.ts` dùng `SET LOCAL`/`set_config(..., true)` để bơm RLS session variables, chỉ hoạt động khi cả transaction chạy trên cùng một connection, mà transaction-mode pgbouncer không đảm bảo điều đó. Cũng không dùng "Direct connection" (`db.xxxxxxxx.supabase.co`) — host này ở nhiều project mới chỉ có bản ghi DNS IPv6, sẽ báo lỗi `ENOTFOUND` trên mạng/host chỉ có IPv4. Lấy đúng chuỗi tại Supabase Dashboard → Project Settings → Database → Connection string → tab **Session pooler**.

## Khởi tạo database

```bash
pnpm db:generate    # sinh SQL migration từ core/db/schema/* (dùng MIGRATE_DATABASE_URL)
pnpm db:migrate     # áp migration vào Supabase (dùng MIGRATE_DATABASE_URL)
pnpm db:apply-rls   # bật RLS + tạo policy cho mọi bảng nghiệp vụ (dùng MIGRATE_DATABASE_URL)
```

Chạy lại `db:apply-rls` mỗi khi sửa `core/db/rls/policies.ts` — script này idempotent (`DROP POLICY IF EXISTS` trước khi tạo lại).

Ngoài ra cần tạo thủ công (Supabase chưa có sẵn):
- 1 tổ chức trong `organizations`
- Role hệ thống trong `roles` (ít nhất 1 role có `permissions` phù hợp — xem `src/shared/permissions.ts`)
- 1 user Supabase Auth (Authentication → Users → Add user), sau đó insert một dòng khớp `id` vào bảng `users` (cột `id` = Supabase Auth user id) + một dòng `user_role_assignments`

Không có 3 bước trên thì mọi request sẽ nhận `403 Account not provisioned` (xem `src/core/auth/context-plugin.ts`).

## Chạy dev

```bash
pnpm dev
```

Swagger UI: http://localhost:3000/documentation (đổi cổng theo `PORT` trong `.env`). Xem docs không cần đăng nhập; để gọi thử endpoint ("Try it out") cần dán Supabase access token thật vào nút **Authorize**. Schema request body hiển thị sinh trực tiếp từ Zod schema dùng thật trong controller (`core/swagger/zod-schema.ts`) — sửa Zod schema là docs tự cập nhật theo, không cần khai báo tay hai lần.

## Test

```bash
pnpm test                    # unit test (không cần DB)
RUN_DB_TESTS=1 pnpm test      # + integration test RLS (cần DB đã migrate + apply-rls)
```

Test tích hợp chạy trong một transaction luôn rollback — không bao giờ ghi dữ liệu thật vào DB dù trỏ vào project nào.

## Cấu trúc

```
be/src/
├── shared/       # money (VND bigint), permission catalogue, RequestContext type, Zod schemas
├── core/         # auth, rbac, audit, db (client/transaction/RLS), money, errors
├── modules/      # branches/ là khuôn mẫu (schema → repository → service → controller → routes → test)
├── app.ts
└── server.ts
```

`src/shared/` từng là package `packages/shared` dùng chung FE/BE trong thiết kế ban đầu (docs/11 §1.3); vì `be/` và `fe/` giờ là 2 thư mục độc lập triển khai riêng, phần dùng chung cho BE được giữ nội bộ trong `be/src/shared/`. Nếu sau này `fe/` cần cùng logic (vd. money formatting, Zod schema), copy/publish riêng thay vì quay lại workspace chung.

**Quy tắc bắt buộc:** chỉ `*.repository.ts` được import trực tiếp `core/db/schema/*` — ESLint rule `no-restricted-imports` (xem `.eslintrc.cjs`) chặn import này ở service/controller để đảm bảo mọi query đều đi qua repository → `withRequestContext()` → RLS.
