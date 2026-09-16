import type { FastifyInstance } from "fastify";
import { createFloorSchema, updateFloorSchema } from "../../shared/index.js";
import { requirePermission } from "../../core/rbac/permission-guard.js";
import { idParamSchema, zodSchema } from "../../core/swagger/zod-schema.js";
import { floorController } from "./floor.controller.js";

export function registerFloorRoutes(app: FastifyInstance): void {
  app.get<{ Querystring: { buildingId?: string } }>(
    "/floors",
    {
      preHandler: requirePermission("floor:view"),
      schema: {
        tags: ["floors"],
        summary: "Danh sách tầng (lọc theo buildingId nếu có)",
        querystring: {
          type: "object",
          properties: { buildingId: { type: "string", format: "uuid" } },
        },
        security: [{ bearerAuth: [] }],
      },
    },
    floorController.list,
  );

  app.get<{ Params: { id: string } }>(
    "/floors/:id",
    {
      preHandler: requirePermission("floor:view"),
      schema: { tags: ["floors"], summary: "Chi tiết tầng", params: idParamSchema, security: [{ bearerAuth: [] }] },
    },
    floorController.getById,
  );

  app.post(
    "/floors",
    {
      preHandler: requirePermission("floor:create"),
      schema: {
        tags: ["floors"],
        summary: "Tạo tầng mới",
        body: zodSchema(createFloorSchema),
        security: [{ bearerAuth: [] }],
      },
    },
    floorController.create,
  );

  app.patch<{ Params: { id: string } }>(
    "/floors/:id",
    {
      preHandler: requirePermission("floor:update"),
      schema: {
        tags: ["floors"],
        summary: "Cập nhật tầng",
        params: idParamSchema,
        body: zodSchema(updateFloorSchema),
        security: [{ bearerAuth: [] }],
      },
    },
    floorController.update,
  );
}
