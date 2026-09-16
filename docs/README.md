# Product Blueprint — Hệ thống quản lý KTX Cali

Bộ tài liệu phân tích nghiệp vụ và thiết kế hệ thống quản lý ký túc xá nhiều chi nhánh cho Cali.

> **Trạng thái:** Bản 1.0 — 15/09/2026
> **Phạm vi hiện tại:** 1–3 chi nhánh, <500 giường. Thiết kế để mở rộng tới 50 chi nhánh.
> **Khách thuê chính:** sinh viên và người đi làm/chuyên viên trẻ.
> **Stack:** Vite + React + TypeScript (SPA) · Node.js + TypeScript + Fastify + Drizzle/Prisma (API) · Supabase (PostgreSQL + Auth) · Cloudinary (ảnh) · VietQR/webhook ngân hàng (thanh toán). `be/` và `fe/` là 2 thư mục độc lập, tự cài & deploy riêng.

---

## Cách đọc tài liệu này

| Bạn là | Đọc theo thứ tự |
|---|---|
| **Chủ doanh nghiệp / Owner** | `02` → `05` → `18` → `16` |
| **Quản lý vận hành** | `01` → `03` → `06`–`10` → `17` |
| **Lập trình viên** | `11` → `12` → `13` → `14` → `04` → rồi module liên quan |
| **Người mới vào dự án** | `02` → `01` → `03` → `11` |

**Đọc trước khi viết dòng code đầu tiên:** mục *"8 quyết định thiết kế cốt lõi"* trong [11-architecture.md](11-architecture.md#8-quyết-định-thiết-kế-cốt-lõi). Nếu làm sai những điểm đó, chi phí sửa về sau rất lớn.

---

## Mục lục

### Nền tảng
| File | Nội dung |
|---|---|
| [01-business-analysis.md](01-business-analysis.md) | Phân tích bài toán thực tế: KTX nhiều chi nhánh vận hành ra sao, vấn đề của Excel/Zalo, đối tượng quản lý, dữ liệu phát sinh, rủi ro vận hành |
| [02-vision-personas.md](02-vision-personas.md) | Vision, 8 personas, business model, phạm vi in/out |
| [03-org-model.md](03-org-model.md) | Mô hình tổ chức 6 cấp, các trường hợp đặc biệt, toàn bộ máy trạng thái |
| [04-roles-permissions.md](04-roles-permissions.md) | Permission matrix đầy đủ, quy tắc phê duyệt, hạn mức |
| [05-dashboards.md](05-dashboards.md) | Dashboard cho từng cấp quản lý, KPI, biểu đồ, drill-down |

### Module nghiệp vụ
*(mỗi module theo cấu trúc: Mục đích → Dữ liệu → Thao tác → Workflow → Quyền → Edge case)*

| File | Nội dung |
|---|---|
| [06-module-property.md](06-module-property.md) | Chi nhánh · Tòa nhà · Tầng · Phòng · Giường |
| [07-module-customers.md](07-module-customers.md) | Khách thuê · Đăng ký · Đặt chỗ · Check-in/Check-out |
| [08-module-contracts.md](08-module-contracts.md) | Hợp đồng · Template · Gia hạn · Chấm dứt |
| [09-module-billing.md](09-module-billing.md) | Hóa đơn · Điện nước · Dịch vụ · Thanh toán · Công nợ · Cọc · Két tiền mặt · Chi phí |
| [10-module-operations.md](10-module-operations.md) | Bảo trì · Tài sản · Vệ sinh · Nội quy & vi phạm · Khách thăm · Nhân viên · Thông báo · Báo cáo |

### Kỹ thuật
| File | Nội dung |
|---|---|
| [11-architecture.md](11-architecture.md) | Kiến trúc multi-branch, scope guard, transaction, bảo mật, backup, hiệu năng |
| [12-database-schema.md](12-database-schema.md) | Toàn bộ collection: field, kiểu dữ liệu, index, ràng buộc |
| [13-erd.md](13-erd.md) | ERD (Mermaid) + giải thích quan hệ |
| [14-workflows.md](14-workflows.md) | 12 sequence diagram nghiệp vụ chính |
| [15-ux-navigation.md](15-ux-navigation.md) | Sidebar, luồng thao tác nhanh cho lễ tân, wireframe |

### Kế hoạch
| File | Nội dung |
|---|---|
| [16-automation-ai.md](16-automation-ai.md) | Automation phân loại Must/Should/Nice · AI có ROI thật |
| [17-edge-cases.md](17-edge-cases.md) | 40 edge case + cách xử lý cụ thể |
| [18-roadmap.md](18-roadmap.md) | 5 phase, ước lượng, tiêu chí hoàn thành |

---

## Tóm tắt 10 quyết định quan trọng nhất

1. **Đơn vị tồn kho là giường**, không phải phòng. → [03](03-org-model.md)
2. **Tách `contracts` khỏi `bed_assignments`.** Hợp đồng là quan hệ pháp lý; assignment là đoạn ở thực tế. Đây là quyết định quan trọng nhất của toàn hệ thống. → [11](11-architecture.md), [12](12-database-schema.md)
3. **Tiền cọc là công nợ phải trả, không phải doanh thu.** Có sổ cọc riêng. → [09](09-module-billing.md)
4. **Tiền lưu dạng số nguyên VNĐ (Int64).** Không bao giờ dùng float. → [11](11-architecture.md)
5. **Postgres/Supabase có Row-Level Security native** → phân quyền chi nhánh cưỡng chế ở tầng database, kèm test phân quyền bắt buộc (defense in depth). → [11](11-architecture.md)
6. **Transaction là mặc định của Postgres** — không cần cụm/replica set để đảm bảo atomic cho check-in, check-out, sinh hóa đơn... → [11](11-architecture.md)
7. **Không ai được sửa hóa đơn đã phát hành** — chỉ tạo bút toán điều chỉnh có phê duyệt. → [04](04-roles-permissions.md), [09](09-module-billing.md)
8. **Owner là read-only.** → [04](04-roles-permissions.md)
9. **Két tiền mặt theo ca lễ tân** — không có thì không kiểm soát được tiền mặt. → [09](09-module-billing.md)
10. **MVP không có AI.** → [16](16-automation-ai.md)

---

## Bảng đối chiếu với yêu cầu gốc

| Mục yêu cầu | Tài liệu |
|---|---|
| 1. Phân tích tổng quan bài toán | [01](01-business-analysis.md) |
| 2. Mô hình tổ chức | [03](03-org-model.md) |
| 3. Vai trò & phân quyền | [04](04-roles-permissions.md) |
| 4. Dashboard quản trị | [05](05-dashboards.md) |
| 5. Quản lý chi nhánh | [06](06-module-property.md) §1 |
| 6. Tòa nhà / tầng / phòng / giường | [06](06-module-property.md) §2–5 |
| 7. Quản lý khách thuê | [07](07-module-customers.md) §1 |
| 8. Đăng ký và đặt chỗ | [07](07-module-customers.md) §2 |
| 9. Quản lý hợp đồng | [08](08-module-contracts.md) |
| 10. Tiền phòng và hóa đơn | [09](09-module-billing.md) §1–3 |
| 11. Quản lý điện nước | [09](09-module-billing.md) §4 |
| 12. Quản lý dịch vụ | [09](09-module-billing.md) §5 |
| 13. Quản lý thanh toán | [09](09-module-billing.md) §6 |
| 14. Quản lý công nợ | [09](09-module-billing.md) §7 |
| 15. Bảo trì / sự cố | [10](10-module-operations.md) §1 |
| 16. Quản lý tài sản | [10](10-module-operations.md) §2 |
| 17. Quản lý nhân viên | [10](10-module-operations.md) §5 |
| 18. Nội quy và vi phạm | [10](10-module-operations.md) §3 |
| 19. Check-in / Check-out | [07](07-module-customers.md) §3–4 |
| 20. Khách vãng lai / ra vào | [10](10-module-operations.md) §4 |
| 21. Camera / an ninh | [10](10-module-operations.md) §4.4, [18](18-roadmap.md) |
| 22. Thông báo | [10](10-module-operations.md) §6 |
| 23. Báo cáo | [10](10-module-operations.md) §7 |
| 24. Audit Log | [11](11-architecture.md) §6 |
| 25. Multi-branch architecture | [11](11-architecture.md) §3 |
| 26. Tự động hóa | [16](16-automation-ai.md) §1 |
| 27. AI | [16](16-automation-ai.md) §2 |
| 28. UX/UI | [15](15-ux-navigation.md) |
| 29. Database design | [12](12-database-schema.md) |
| 30. Workflow | [14](14-workflows.md) |
| 31. Phân loại MVP | [18](18-roadmap.md) |
| 32. Edge case | [17](17-edge-cases.md) |
| 33. Những thứ thường bị bỏ sót | [01](01-business-analysis.md) §7 |
| 34. Product Blueprint | Chính file này + toàn bộ `docs/` |
