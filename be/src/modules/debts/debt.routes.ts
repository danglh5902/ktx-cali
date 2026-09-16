import type { FastifyInstance } from "fastify";
import { requirePermission } from "../../core/rbac/permission-guard.js";
import { debtController } from "./debt.controller.js";

export function registerDebtRoutes(app: FastifyInstance): void {
  app.get<{ Querystring: { branchId?: string } }>(
    "/debts/aging",
    {
      preHandler: requirePermission("debt:view"),
      schema: {
        tags: ["debts"],
        summary: "Báo cáo tuổi nợ (aging) — tính trực tiếp từ hóa đơn còn nợ",
        querystring: { type: "object", properties: { branchId: { type: "string", format: "uuid" } } },
        security: [{ bearerAuth: [] }],
      },
    },
    debtController.agingReport,
  );
}
