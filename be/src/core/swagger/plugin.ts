import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import type { FastifyInstance } from "fastify";
import { env } from "../../env.js";

/**
 * OpenAPI docs — chủ yếu để trực quan hóa API khi build module mới, không
 * thay thế test/permission-guard. `securitySchemes.bearerAuth` khớp với
 * cách xác thực thật: Supabase Auth access token qua header
 * `Authorization: Bearer <token>` (xem core/auth/context-plugin.ts).
 *
 * Đăng ký TRƯỚC khi các module route được register, để @fastify/swagger kịp
 * thu thập `schema` khai báo trên từng route.
 */
export async function registerSwagger(app: FastifyInstance): Promise<void> {
  await app.register(swagger, {
    openapi: {
      openapi: "3.0.3",
      info: {
        title: "KTX Cali API",
        description:
          "API quản lý ký túc xá nhiều chi nhánh. Xem docs/11-architecture.md ở repo gốc để hiểu kiến trúc scope/RLS trước khi thêm endpoint mới.",
        version: "0.1.0",
      },
      servers: [{ url: `http://localhost:${env.PORT}`, description: "Local dev" }],
      tags: [
        { name: "auth", description: "Đăng nhập/đăng xuất — proxy tới Supabase Auth" },
        { name: "branches", description: "Quản lý chi nhánh — docs/06-module-property.md §1" },
        { name: "buildings", description: "Tòa nhà — docs/06-module-property.md §2" },
        { name: "floors", description: "Tầng — docs/06-module-property.md §3" },
        { name: "room-types", description: "Loại phòng / bảng giá — docs/06-module-property.md §4.3" },
        { name: "rooms", description: "Phòng — docs/06-module-property.md §4" },
        { name: "beds", description: "Giường (đơn vị bán, D1) — docs/06-module-property.md §5" },
        { name: "customers", description: "Khách thuê — docs/07-module-customers.md" },
        { name: "bookings", description: "Đặt chỗ / giữ giường tạm thời — docs/08-module-contracts.md §2" },
        { name: "contracts", description: "Hợp đồng, check-in/check-out — docs/08-module-contracts.md §3-4" },
        { name: "billing", description: "Kỳ chốt & hóa đơn — docs/09-module-billing.md §2" },
        { name: "payments", description: "Thanh toán, phân bổ FIFO — docs/09-module-billing.md §4" },
        { name: "deposits", description: "Sổ cọc & hoàn cọc — docs/09-module-billing.md §6" },
        { name: "cash-sessions", description: "Ca quỹ tiền mặt — docs/09-module-billing.md §7, D8" },
        { name: "debts", description: "Báo cáo công nợ (aging) — docs/09-module-billing.md §5.2" },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "Supabase Auth access token",
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  });
}

/**
 * Swagger UI tại `/documentation` — route này được đánh dấu public (bỏ qua
 * auth middleware) trong core/auth/context-plugin.ts, vì bản thân trang UI
 * cần xem được trước khi đăng nhập; gọi thử API ("Try it out") vẫn cần dán
 * bearer token thật vào nút Authorize.
 */
export async function registerSwaggerUi(app: FastifyInstance): Promise<void> {
  await app.register(swaggerUi, {
    routePrefix: "/documentation",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
    },
  });
}
