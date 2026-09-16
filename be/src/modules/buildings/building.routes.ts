import type { FastifyInstance } from "fastify";
import { createBuildingSchema, updateBuildingSchema } from "../../shared/index.js";
import { requirePermission } from "../../core/rbac/permission-guard.js";
import { idParamSchema, zodSchema } from "../../core/swagger/zod-schema.js";
import { buildingController } from "./building.controller.js";

export function registerBuildingRoutes(app: FastifyInstance): void {
  app.get<{ Querystring: { branchId?: string } }>(
    "/buildings",
    {
      preHandler: requirePermission("building:view"),
      schema: {
        tags: ["buildings"],
        summary: "Danh sách tòa nhà (lọc theo branchId nếu có)",
        querystring: {
          type: "object",
          properties: { branchId: { type: "string", format: "uuid" } },
        },
        security: [{ bearerAuth: [] }],
      },
    },
    buildingController.list,
  );

  app.get<{ Params: { id: string } }>(
    "/buildings/:id",
    {
      preHandler: requirePermission("building:view"),
      schema: {
        tags: ["buildings"],
        summary: "Chi tiết tòa nhà",
        params: idParamSchema,
        security: [{ bearerAuth: [] }],
      },
    },
    buildingController.getById,
  );

  app.post(
    "/buildings",
    {
      preHandler: requirePermission("building:create"),
      schema: {
        tags: ["buildings"],
        summary: "Tạo tòa nhà mới",
        body: zodSchema(createBuildingSchema),
        security: [{ bearerAuth: [] }],
      },
    },
    buildingController.create,
  );

  app.patch<{ Params: { id: string } }>(
    "/buildings/:id",
    {
      preHandler: requirePermission("building:update"),
      schema: {
        tags: ["buildings"],
        summary: "Cập nhật tòa nhà",
        params: idParamSchema,
        body: zodSchema(updateBuildingSchema),
        security: [{ bearerAuth: [] }],
      },
    },
    buildingController.update,
  );
}
