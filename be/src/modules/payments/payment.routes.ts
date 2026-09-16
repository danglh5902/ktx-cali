import type { FastifyInstance } from "fastify";
import { createPaymentSchema } from "../../shared/index.js";
import { requirePermission } from "../../core/rbac/permission-guard.js";
import { idParamSchema, zodSchema } from "../../core/swagger/zod-schema.js";
import { paymentController } from "./payment.controller.js";

export function registerPaymentRoutes(app: FastifyInstance): void {
  app.get<{ Querystring: { customerId?: string; branchId?: string } }>(
    "/payments",
    {
      preHandler: requirePermission("payment:view"),
      schema: {
        tags: ["payments"],
        summary: "Danh sách phiếu thu",
        querystring: {
          type: "object",
          properties: { customerId: { type: "string", format: "uuid" }, branchId: { type: "string", format: "uuid" } },
        },
        security: [{ bearerAuth: [] }],
      },
    },
    paymentController.list,
  );

  app.get<{ Params: { id: string } }>(
    "/payments/:id",
    {
      preHandler: requirePermission("payment:view"),
      schema: { tags: ["payments"], summary: "Chi tiết phiếu thu (kèm phân bổ)", params: idParamSchema, security: [{ bearerAuth: [] }] },
    },
    paymentController.getById,
  );

  app.post(
    "/payments",
    {
      preHandler: requirePermission("payment:create"),
      schema: {
        tags: ["payments"],
        summary: "Ghi nhận thanh toán — tự động phân bổ FIFO vào hóa đơn còn nợ",
        body: zodSchema(createPaymentSchema),
        security: [{ bearerAuth: [] }],
      },
    },
    paymentController.record,
  );
}
