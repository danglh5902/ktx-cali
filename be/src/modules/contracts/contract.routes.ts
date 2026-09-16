import type { FastifyInstance } from "fastify";
import { checkOutContractSchema, createContractSchema } from "../../shared/index.js";
import { requirePermission } from "../../core/rbac/permission-guard.js";
import { idParamSchema, zodSchema } from "../../core/swagger/zod-schema.js";
import { contractController } from "./contract.controller.js";

export function registerContractRoutes(app: FastifyInstance): void {
  app.get<{ Querystring: { branchId?: string; customerId?: string } }>(
    "/contracts",
    {
      preHandler: requirePermission("contract:view"),
      schema: {
        tags: ["contracts"],
        summary: "Danh sách hợp đồng",
        querystring: {
          type: "object",
          properties: { branchId: { type: "string", format: "uuid" }, customerId: { type: "string", format: "uuid" } },
        },
        security: [{ bearerAuth: [] }],
      },
    },
    contractController.list,
  );

  app.get<{ Params: { id: string } }>(
    "/contracts/:id",
    {
      preHandler: requirePermission("contract:view"),
      schema: { tags: ["contracts"], summary: "Chi tiết hợp đồng", params: idParamSchema, security: [{ bearerAuth: [] }] },
    },
    contractController.getById,
  );

  app.post(
    "/contracts",
    {
      preHandler: requirePermission("contract:create"),
      schema: {
        tags: ["contracts"],
        summary: "Lập hợp đồng (nháp)",
        body: zodSchema(createContractSchema),
        security: [{ bearerAuth: [] }],
      },
    },
    contractController.create,
  );

  app.post<{ Params: { id: string } }>(
    "/contracts/:id/check-in",
    {
      preHandler: requirePermission("checkin:execute"),
      schema: {
        tags: ["contracts"],
        summary: "Check-in — kích hoạt hợp đồng, gắn giường, tạo bút toán cọc",
        params: idParamSchema,
        security: [{ bearerAuth: [] }],
      },
    },
    contractController.checkIn,
  );

  app.post<{ Params: { id: string } }>(
    "/contracts/:id/check-out",
    {
      preHandler: requirePermission("checkout:execute"),
      schema: {
        tags: ["contracts"],
        summary: "Check-out — trả giường, chấm dứt hợp đồng",
        params: idParamSchema,
        body: zodSchema(checkOutContractSchema),
        security: [{ bearerAuth: [] }],
      },
    },
    contractController.checkOut,
  );
}
