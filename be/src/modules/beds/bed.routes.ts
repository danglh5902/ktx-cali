import type { FastifyInstance } from "fastify";
import {
  bulkCreateBedsSchema,
  createBedSchema,
  updateBedStatusSchema,
} from "../../shared/index.js";
import { requirePermission } from "../../core/rbac/permission-guard.js";
import { idParamSchema, zodSchema } from "../../core/swagger/zod-schema.js";
import { bedController } from "./bed.controller.js";

export function registerBedRoutes(app: FastifyInstance): void {
  app.get<{ Querystring: { branchId?: string; roomId?: string } }>(
    "/beds",
    {
      preHandler: requirePermission("bed:view"),
      schema: {
        tags: ["beds"],
        summary: "Sơ đồ giường (lọc theo branchId/roomId) — docs/11 §8.2",
        querystring: {
          type: "object",
          properties: {
            branchId: { type: "string", format: "uuid" },
            roomId: { type: "string", format: "uuid" },
          },
        },
        security: [{ bearerAuth: [] }],
      },
    },
    bedController.list,
  );

  app.get<{ Params: { id: string } }>(
    "/beds/:id",
    {
      preHandler: requirePermission("bed:view"),
      schema: { tags: ["beds"], summary: "Chi tiết giường", params: idParamSchema, security: [{ bearerAuth: [] }] },
    },
    bedController.getById,
  );

  app.post(
    "/beds",
    {
      preHandler: requirePermission("bed:create"),
      schema: {
        tags: ["beds"],
        summary: "Tạo 1 giường",
        body: zodSchema(createBedSchema),
        security: [{ bearerAuth: [] }],
      },
    },
    bedController.create,
  );

  app.post(
    "/beds/bulk",
    {
      preHandler: requirePermission("bed:create"),
      schema: {
        tags: ["beds"],
        summary: "Tạo hàng loạt giường trong 1 phòng (docs/06 §4.5)",
        description: 'Mã sinh theo mẫu `{codePrefix}{n}` — vd codePrefix="A-301-B", count=4 → "A-301-B1".."A-301-B4".',
        body: zodSchema(bulkCreateBedsSchema),
        security: [{ bearerAuth: [] }],
      },
    },
    bedController.bulkCreate,
  );

  app.patch<{ Params: { id: string } }>(
    "/beds/:id/status",
    {
      preHandler: requirePermission("bed:status_update"),
      schema: {
        tags: ["beds"],
        summary: "Đổi trạng thái giường (máy trạng thái — không nhảy tùy ý)",
        description:
          "RESERVED/OCCUPIED/CHECKOUT_PENDING chỉ đạt tới qua booking/check-in/check-out (chưa xây). Endpoint này chỉ cho các chuyển đổi vận hành: dọn dẹp, bảo trì, khóa/mở giường.",
        params: idParamSchema,
        body: zodSchema(updateBedStatusSchema),
        security: [{ bearerAuth: [] }],
      },
    },
    bedController.updateStatus,
  );
}
