# ktx-cali-be

Fastify + Drizzle (PostgreSQL/Supabase) backend — thư mục độc lập, tự cài dependency riêng và deploy riêng với `fe/`. Đọc [docs/11-architecture.md](../docs/11-architecture.md) trước khi sửa code ở đây — đặc biệt mục "8 quyết định thiết kế cốt lõi".

## Setup

```bash
cd be
pnpm install
cp .env.example .env
# điền SUPABASE_URL, SUPABASE_JWT_SECRET, DATABASE_URL từ Supabase → Project Settings
```

**Lưu ý `DATABASE_URL`:** dùng connection string ở **session pooler (port 5432)** hoặc direct connection, **không dùng transaction pooler (port 6543)**. `core/db/request-context.ts` dùng `SET LOCAL`/`set_config(..., true)` để bơm RLS session variables — cách này chỉ hoạt động khi cả transaction chạy trên cùng một connection, mà transaction-mode pgbouncer không đảm bảo điều đó.

## Khởi tạo database

```bash
pnpm db:generate    # sinh SQL migration từ core/db/schema/*
pnpm db:migrate     # áp migration vào Supabase
pnpm db:apply-rls   # bật RLS + tạo policy cho mọi bảng nghiệp vụ (core/db/rls/policies.ts)
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
