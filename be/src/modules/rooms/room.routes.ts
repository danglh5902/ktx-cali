import type { FastifyInstance } from "fastify";
import { bulkCreateRoomsSchema, createRoomSchema, updateRoomSchema } from "../../shared/index.js";
import { requirePermission } from "../../core/rbac/permission-guard.js";
import { idParamSchema, zodSchema } from "../../core/swagger/zod-schema.js";
import { roomController } from "./room.controller.js";

export function registerRoomRoutes(app: FastifyInstance): void {
  app.get<{ Querystring: { branchId?: string; floorId?: string } }>(
    "/rooms",
    {
      preHandler: requirePermission("room:view"),
      schema: {
        tags: ["rooms"],
        summary: "Danh sách phòng (lọc theo branchId/floorId)",
        querystring: {
          type: "object",
          properties: {
            branchId: { type: "string", format: "uuid" },
            floorId: { type: "string", format: "uuid" },
          },
        },
        security: [{ bearerAuth: [] }],
      },
    },
    roomController.list,
  );

  app.get<{ Params: { id: string } }>(
    "/rooms/:id",
    {
      preHandler: requirePermission("room:view"),
      schema: { tags: ["rooms"], summary: "Chi tiết phòng", params: idParamSchema, security: [{ bearerAuth: [] }] },
    },
    roomController.getById,
  );

  app.post(
    "/rooms",
    {
      preHandler: requirePermission("room:create"),
      schema: {
        tags: ["rooms"],
        summary: "Tạo 1 phòng",
        body: zodSchema(createRoomSchema),
        security: [{ bearerAuth: [] }],
      },
    },
    roomController.create,
  );

  app.post(
    "/rooms/bulk",
    {
      preHandler: requirePermission("room:create"),
      schema: {
        tags: ["rooms"],
        summary: "Tạo hàng loạt phòng cùng loại trong 1 tầng (docs/06 §4.5)",
        description: 'Mã sinh theo mẫu `{codePrefix}{nn}` — vd codePrefix="A-3", codeFrom=1, codeTo=10 → "A-301".."A-310".',
        body: zodSchema(bulkCreateRoomsSchema),
        security: [{ bearerAuth: [] }],
      },
    },
    roomController.bulkCreate,
  );

  app.patch<{ Params: { id: string } }>(
    "/rooms/:id",
    {
      preHandler: requirePermission("room:update"),
      schema: {
        tags: ["rooms"],
        summary: "Cập nhật phòng",
        params: idParamSchema,
        body: zodSchema(updateRoomSchema),
        security: [{ bearerAuth: [] }],
      },
    },
    roomController.update,
  );
}
