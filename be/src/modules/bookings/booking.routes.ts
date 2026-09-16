import type { FastifyInstance } from "fastify";
import { cancelBookingSchema, createBookingSchema } from "../../shared/index.js";
import { requirePermission } from "../../core/rbac/permission-guard.js";
import { idParamSchema, zodSchema } from "../../core/swagger/zod-schema.js";
import { bookingController } from "./booking.controller.js";

export function registerBookingRoutes(app: FastifyInstance): void {
  app.get<{ Querystring: { branchId?: string; customerId?: string } }>(
    "/bookings",
    {
      preHandler: requirePermission("booking:view"),
      schema: {
        tags: ["bookings"],
        summary: "Danh sách đặt chỗ",
        querystring: {
          type: "object",
          properties: { branchId: { type: "string", format: "uuid" }, customerId: { type: "string", format: "uuid" } },
        },
        security: [{ bearerAuth: [] }],
      },
    },
    bookingController.list,
  );

  app.get<{ Params: { id: string } }>(
    "/bookings/:id",
    {
      preHandler: requirePermission("booking:view"),
      schema: { tags: ["bookings"], summary: "Chi tiết đặt chỗ", params: idParamSchema, security: [{ bearerAuth: [] }] },
    },
    bookingController.getById,
  );

  app.post(
    "/bookings",
    {
      preHandler: requirePermission("booking:create"),
      schema: {
        tags: ["bookings"],
        summary: "Tạo đặt chỗ (giữ giường tạm thời)",
        body: zodSchema(createBookingSchema),
        security: [{ bearerAuth: [] }],
      },
    },
    bookingController.create,
  );

  app.post<{ Params: { id: string } }>(
    "/bookings/:id/cancel",
    {
      preHandler: requirePermission("booking:cancel"),
      schema: {
        tags: ["bookings"],
        summary: "Hủy đặt chỗ",
        params: idParamSchema,
        body: zodSchema(cancelBookingSchema),
        security: [{ bearerAuth: [] }],
      },
    },
    bookingController.cancel,
  );
}
