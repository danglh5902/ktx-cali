# RLS — thiết lập role ứng dụng

`policies.ts` sinh RLS policy cho mọi bảng nghiệp vụ, nhưng **policy chỉ có tác dụng nếu app không kết nối bằng một role có quyền vượt qua RLS**.

Supabase role mặc định `postgres` có thuộc tính `rolbypassrls = true` — bỏ qua toàn bộ RLS vô điều kiện, bất kể policy đúng hay sai. Vì vậy **không bao giờ dùng role `postgres` cho `DATABASE_URL` (app runtime)** — chỉ dùng nó cho migration (`MIGRATE_DATABASE_URL`).

## Tạo role ứng dụng (chạy 1 lần, trong Supabase SQL Editor)

```sql
CREATE ROLE ktx_app WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS
  PASSWORD 'đặt-mật-khẩu-mạnh-ở-đây';

GRANT USAGE ON SCHEMA public TO ktx_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ktx_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ktx_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ktx_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ktx_app;
```

`ALTER DEFAULT PRIVILEGES` chỉ áp dụng cho bảng **tạo sau này bởi role đang chạy lệnh này** — chạy đoạn trên khi đăng nhập SQL Editor bằng `postgres` (mặc định), vì `postgres` chính là role sẽ tạo bảng qua `db:migrate`.

## Cấu hình `.env`

```bash
DATABASE_URL=postgresql://ktx_app.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
MIGRATE_DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
```

Xem `.env.example` để biết định dạng đầy đủ.

## Sau khi thêm bảng mới

`ALTER DEFAULT PRIVILEGES` đã lo việc cấp quyền tự động cho bảng mới do `postgres` tạo — không cần chạy lại GRANT thủ công sau mỗi migration. Chỉ cần chạy `pnpm db:apply-rls` để bật RLS + tạo policy cho bảng mới đó (xem `policies.ts`).

## Cách kiểm tra role đang dùng có an toàn không

```sql
SELECT rolname, rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user;
```

`rolbypassrls` phải là `false` khi kết nối bằng `DATABASE_URL` (app runtime). Nếu là `true`, RLS không có tác dụng thật dù đã tạo bao nhiêu policy.
