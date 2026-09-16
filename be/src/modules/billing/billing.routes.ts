import type { FastifyInstance } from "fastify";
import { createBillingPeriodSchema } from "../../shared/index.js";
import { requirePermission } from "../../core/rbac/permission-guard.js";
import { idParamSchema, zodSchema } from "../../core/swagger/zod-schema.js";
import { billingPeriodController, invoiceController } from "./billing.controller.js";

export function registerBillingRoutes(app: FastifyInstance): void {
  app.get<{ Querystring: { branchId?: string } }>(
    "/billing-periods",
    {
      preHandler: requirePermission("invoice:view"),
      schema: {
        tags: ["billing"],
        summary: "Danh sách kỳ chốt hóa đơn",
        querystring: { type: "object", properties: { branchId: { type: "string", format: "uuid" } } },
        security: [{ bearerAuth: [] }],
      },
    },
    billingPeriodController.list,
  );

  app.get<{ Params: { id: string } }>(
    "/billing-periods/:id",
    {
      preHandler: requirePermission("invoice:view"),
      schema: { tags: ["billing"], summary: "Chi tiết kỳ chốt hóa đơn", params: idParamSchema, security: [{ bearerAuth: [] }] },
    },
    billingPeriodController.getById,
  );

  app.post(
    "/billing-periods",
    {
      preHandler: requirePermission("invoice:generate"),
      schema: {
        tags: ["billing"],
        summary: "Tạo kỳ chốt hóa đơn mới",
        body: zodSchema(createBillingPeriodSchema),
        security: [{ bearerAuth: [] }],
      },
    },
    billingPeriodController.create,
  );

  app.post<{ Params: { id: string } }>(
    "/billing-periods/:id/generate-invoices",
    {
      preHandler: requirePermission("invoice:generate"),
      schema: {
        tags: ["billing"],
        summary: "Sinh hóa đơn cho toàn bộ hợp đồng ACTIVE trong kỳ",
        params: idParamSchema,
        security: [{ bearerAuth: [] }],
      },
    },
    billingPeriodController.generateInvoices,
  );

  app.post<{ Params: { id: string } }>(
    "/billing-periods/:id/close",
    {
      preHandler: requirePermission("invoice:generate"),
      schema: { tags: ["billing"], summary: "Đóng kỳ", params: idParamSchema, security: [{ bearerAuth: [] }] },
    },
    billingPeriodController.close,
  );

  app.get<{ Querystring: { branchId?: string; customerId?: string; status?: string } }>(
    "/invoices",
    {
      preHandler: requirePermission("invoice:view"),
      schema: {
        tags: ["billing"],
        summary: "Danh sách hóa đơn",
        querystring: {
          type: "object",
          properties: {
            branchId: { type: "string", format: "uuid" },
            customerId: { type: "string", format: "uuid" },
            status: { type: "string" },
          },
        },
        security: [{ bearerAuth: [] }],
      },
    },
    invoiceController.list,
  );

  app.get<{ Params: { id: string } }>(
    "/invoices/:id",
    {
      preHandler: requirePermission("invoice:view"),
      schema: { tags: ["billing"], summary: "Chi tiết hóa đơn (kèm dòng)", params: idParamSchema, security: [{ bearerAuth: [] }] },
    },
    invoiceController.getById,
  );

  app.post<{ Params: { id: string } }>(
    "/invoices/:id/issue",
    {
      preHandler: requirePermission("invoice:issue"),
      schema: { tags: ["billing"], summary: "Phát hành hóa đơn", params: idParamSchema, security: [{ bearerAuth: [] }] },
    },
    invoiceController.issue,
  );
}
