import type { FastifyInstance } from "fastify";
import { blacklistCustomerSchema, createCustomerSchema, updateCustomerSchema } from "../../shared/index.js";
import { requirePermission } from "../../core/rbac/permission-guard.js";
import { idParamSchema, zodSchema } from "../../core/swagger/zod-schema.js";
import { customerController } from "./customer.controller.js";

export function registerCustomerRoutes(app: FastifyInstance): void {
  app.get<{ Querystring: { search?: string; bedId?: string } }>(
    "/customers",
    {
      preHandler: requirePermission("customer:view"),
      schema: {
        tags: ["customers"],
        summary: "Danh sách khách thuê (tìm theo tên/SĐT, hoặc lọc theo giường đang ở)",
        querystring: {
          type: "object",
          properties: { search: { type: "string" }, bedId: { type: "string", format: "uuid" } },
        },
        security: [{ bearerAuth: [] }],
      },
    },
    customerController.list,
  );

  app.get<{ Params: { id: string } }>(
    "/customers/:id",
    {
      preHandler: requirePermission("customer:view"),
      schema: { tags: ["customers"], summary: "Chi tiết khách thuê", params: idParamSchema, security: [{ bearerAuth: [] }] },
    },
    customerController.getById,
  );

  app.post(
    "/customers",
    {
      preHandler: requirePermission("customer:create"),
      schema: {
        tags: ["customers"],
        summary: "Tạo hồ sơ khách thuê",
        body: zodSchema(createCustomerSchema),
        security: [{ bearerAuth: [] }],
      },
    },
    customerController.create,
  );

  app.patch<{ Params: { id: string } }>(
    "/customers/:id",
    {
      preHandler: requirePermission("customer:update"),
      schema: {
        tags: ["customers"],
        summary: "Cập nhật hồ sơ khách thuê",
        params: idParamSchema,
        body: zodSchema(updateCustomerSchema),
        security: [{ bearerAuth: [] }],
      },
    },
    customerController.update,
  );

  app.post<{ Params: { id: string } }>(
    "/customers/:id/blacklist",
    {
      preHandler: requirePermission("customer:blacklist"),
      schema: {
        tags: ["customers"],
        summary: "Đưa vào danh sách đen",
        params: idParamSchema,
        body: zodSchema(blacklistCustomerSchema),
        security: [{ bearerAuth: [] }],
      },
    },
    customerController.blacklist,
  );
}
