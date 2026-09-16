import type { FastifyInstance } from "fastify";
import { depositRefundRequestSchema } from "../../shared/index.js";
import { requirePermission } from "../../core/rbac/permission-guard.js";
import { zodSchema } from "../../core/swagger/zod-schema.js";
import { depositController } from "./deposit.controller.js";

export function registerDepositRoutes(app: FastifyInstance): void {
  app.get<{ Params: { contractId: string } }>(
    "/contracts/:contractId/deposit-ledger",
    {
      preHandler: requirePermission("deposit:view"),
      schema: {
        tags: ["deposits"],
        summary: "Sổ cọc của hợp đồng",
        params: { type: "object", properties: { contractId: { type: "string", format: "uuid" } }, required: ["contractId"] },
        security: [{ bearerAuth: [] }],
      },
    },
    depositController.listByContract,
  );

  app.get<{ Querystring: { branchId?: string } }>(
    "/deposit-refunds/pending",
    {
      preHandler: requirePermission("deposit:refund_approve"),
      schema: {
        tags: ["deposits"],
        summary: "Danh sách yêu cầu hoàn cọc đang chờ duyệt",
        querystring: { type: "object", properties: { branchId: { type: "string", format: "uuid" } } },
        security: [{ bearerAuth: [] }],
      },
    },
    depositController.listPendingRefunds,
  );

  app.post<{ Params: { contractId: string } }>(
    "/contracts/:contractId/deposit-refund-requests",
    {
      preHandler: requirePermission("deposit:refund_request"),
      schema: {
        tags: ["deposits"],
        summary: "Đề nghị hoàn/khấu trừ cọc",
        params: { type: "object", properties: { contractId: { type: "string", format: "uuid" } }, required: ["contractId"] },
        body: zodSchema(depositRefundRequestSchema),
        security: [{ bearerAuth: [] }],
      },
    },
    depositController.requestRefund,
  );

  app.post<{ Params: { id: string } }>(
    "/deposit-refunds/:id/approve",
    {
      preHandler: requirePermission("deposit:refund_approve"),
      schema: {
        tags: ["deposits"],
        summary: "Duyệt yêu cầu hoàn cọc",
        params: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"] },
        security: [{ bearerAuth: [] }],
      },
    },
    depositController.approveRefund,
  );

  app.post<{ Params: { id: string } }>(
    "/deposit-refunds/:id/execute",
    {
      preHandler: requirePermission("deposit:refund_execute"),
      schema: {
        tags: ["deposits"],
        summary: "Xác nhận đã chi tiền hoàn cọc",
        params: { type: "object", properties: { id: { type: "string", format: "uuid" } }, required: ["id"] },
        security: [{ bearerAuth: [] }],
      },
    },
    depositController.executeRefund,
  );
}
