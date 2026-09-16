import type { FastifyInstance } from "fastify";
import { cashSessionCloseSchema, cashSessionOpenSchema } from "../../shared/index.js";
import { requirePermission } from "../../core/rbac/permission-guard.js";
import { idParamSchema, zodSchema } from "../../core/swagger/zod-schema.js";
import { cashSessionController } from "./cash-session.controller.js";

export function registerCashSessionRoutes(app: FastifyInstance): void {
  app.get<{ Querystring: { branchId?: string; status?: string } }>(
    "/cash-sessions",
    {
      preHandler: requirePermission("cash:view"),
      schema: {
        tags: ["cash-sessions"],
        summary: "Danh sách ca quỹ tiền mặt",
        querystring: {
          type: "object",
          properties: { branchId: { type: "string", format: "uuid" }, status: { type: "string" } },
        },
        security: [{ bearerAuth: [] }],
      },
    },
    cashSessionController.list,
  );

  app.get<{ Params: { id: string } }>(
    "/cash-sessions/:id",
    {
      preHandler: requirePermission("cash:view"),
      schema: { tags: ["cash-sessions"], summary: "Chi tiết ca quỹ", params: idParamSchema, security: [{ bearerAuth: [] }] },
    },
    cashSessionController.getById,
  );

  app.post(
    "/cash-sessions",
    {
      preHandler: requirePermission("cash:open_session"),
      schema: {
        tags: ["cash-sessions"],
        summary: "Mở ca quỹ",
        body: zodSchema(cashSessionOpenSchema),
        security: [{ bearerAuth: [] }],
      },
    },
    cashSessionController.open,
  );

  app.post<{ Params: { id: string } }>(
    "/cash-sessions/:id/close",
    {
      preHandler: requirePermission("cash:close_session"),
      schema: {
        tags: ["cash-sessions"],
        summary: "Đóng ca quỹ — đối chiếu và ghi nhận chênh lệch",
        params: idParamSchema,
        body: zodSchema(cashSessionCloseSchema),
        security: [{ bearerAuth: [] }],
      },
    },
    cashSessionController.close,
  );
}
