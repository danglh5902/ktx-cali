# ktx-cali-fe

Vite + React 19 + TypeScript admin SPA — thư mục độc lập, tự cài dependency riêng và deploy riêng với `be/` (docs/11-architecture.md §1.1, §1.3).

## Setup

```bash
cd fe
pnpm install   # hoặc npm install
cp .env.example .env
# VITE_API_URL trỏ vào be/ đang chạy (mặc định http://localhost:3000)
```

Cần `be/` đang chạy (`cd be && pnpm dev`) và đã có ít nhất 1 user (xem `be/README.md` mục seed) để đăng nhập.

## Chạy dev

```bash
pnpm dev
```

Mở `http://localhost:5173` → đăng nhập bằng tài khoản đã seed ở `be/` (vd `admin@ktxcali.test`).

## Cấu trúc

```
fe/src/
├── components/
│   ├── ui/         # Button, Input, Dialog, DataTable, Badge... (tự viết, không phụ thuộc thư viện UI ngoài)
│   └── layout/      # Sidebar, Topbar, AppLayout — theo docs/15-ux-navigation.md §2–3
├── features/
│   ├── auth/        # login, session (access/refresh token), ProtectedRoute
│   ├── dashboard/   # Tổng quan (rút gọn — chờ module hóa đơn/thanh toán)
│   └── property/    # branches, buildings, floors, room-types, rooms, beds
│       └── branch-context.tsx   # chi nhánh đang chọn ở topbar, dùng lọc mọi trang con
├── lib/             # api-client (fetch + auto refresh token), money format, error format
├── App.tsx          # routes
└── main.tsx
```

## Mapping route ↔ API (be/)

| Trang FE | API be/ |
|---|---|
| `/login` | `POST /auth/login`, `/auth/refresh`, `/auth/logout` |
| `/branches` | `GET/POST /branches`, `PATCH /branches/:id`, `POST /branches/:id/archive` |
| `/buildings` | `GET/POST /buildings`, `PATCH /buildings/:id` |
| `/floors` | `GET/POST /floors`, `PATCH /floors/:id` |
| `/room-types` | `GET/POST /room-types`, `PATCH /room-types/:id` |
| `/rooms` | `GET /rooms`, `POST /rooms/bulk` |
| `/beds` (sơ đồ giường) | `GET /beds`, `POST /beds/bulk`, `PATCH /beds/:id/status` |

## Phạm vi hiện tại — chưa làm

Sidebar hiển thị đầy đủ cấu trúc theo docs/15 §2 (Tác nghiệp, Khách thuê, Hợp đồng, Tài chính...) nhưng phần lớn mục đang mờ/"sắp có" vì **be/ chưa có API cho các module đó** (khách thuê, hợp đồng, hóa đơn, thanh toán, bảo trì...). Chỉ nhóm **Cơ sở vật chất** (chi nhánh → tòa → tầng → phòng → giường) hoạt động thật, khớp với các module BE đã xây.

Chưa làm (do BE hoặc do quy mô câu hỏi này):
- Ẩn menu theo permission thật (đang hiển thị tĩnh, chưa đọc quyền của user đăng nhập — cần BE có endpoint `/auth/me` hoặc decode permission từ đâu đó trước)
- Tìm kiếm toàn cục (docs/15 §4) — chưa có API search
- Responsive/mobile-first cho Kỹ thuật/Tạp vụ (docs/15 §8)
- Toast/thông báo thành công dạng non-blocking (đang dùng `confirm()` cho xác nhận nguy hiểm, tạm ổn cho MVP)
