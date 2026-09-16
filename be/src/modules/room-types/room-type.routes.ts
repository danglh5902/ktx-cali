import type { FastifyInstance } from "fastify";
import { createRoomTypeSchema, updateRoomTypeSchema } from "../../shared/index.js";
import { requirePermission } from "../../core/rbac/permission-guard.js";
import { idParamSchema, zodSchema } from "../../core/swagger/zod-schema.js";
import { roomTypeController } from "./room-type.controller.js";

export function registerRoomTypeRoutes(app: FastifyInstance): void {
  app.get<{ Querystring: { branchId?: string } }>(
    "/room-types",
    {
      preHandler: requirePermission("pricing:view"),
      schema: {
        tags: ["room-types"],
        summary: "Danh sách loại phòng (lọc theo branchId nếu có)",
        querystring: { type: "object", properties: { branchId: { type: "string", format: "uuid" } } },
        security: [{ bearerAuth: [] }],
      },
    },
    roomTypeController.list,
  );

  app.get<{ Params: { id: string } }>(
    "/room-types/:id",
    {
      preHandler: requirePermission("pricing:view"),
      schema: {
        tags: ["room-types"],
        summary: "Chi tiết loại phòng",
        params: idParamSchema,
        security: [{ bearerAuth: [] }],
      },
    },
    roomTypeController.getById,
  );

  app.post(
    "/room-types",
    {
      preHandler: requirePermission("pricing:update"),
      schema: {
        tags: ["room-types"],
        summary: "Tạo loại phòng mới (giá giường cơ bản)",
        body: zodSchema(createRoomTypeSchema),
        security: [{ bearerAuth: [] }],
      },
    },
    roomTypeController.create,
  );

  app.patch<{ Params: { id: string } }>(
    "/room-types/:id",
    {
      preHandler: requirePermission("pricing:update"),
      schema: {
        tags: ["room-types"],
        summary: "Cập nhật loại phòng",
        params: idParamSchema,
        body: zodSchema(updateRoomTypeSchema),
        security: [{ bearerAuth: [] }],
      },
    },
    roomTypeController.update,
  );
}
