import type { FastifyInstance } from "fastify";
import { createBranchSchema, updateBranchSchema } from "../../shared/index.js";
import { requirePermission } from "../../core/rbac/permission-guard.js";
import { idParamSchema, zodSchema } from "../../core/swagger/zod-schema.js";
import { branchController } from "./branch.controller.js";

/**
 * Permission mapping follows docs/04-roles-permissions.md rows 2–5:
 * view / create / update / delete(archive).
 *
 * `schema.body` here is generated from the SAME Zod schema the controller
 * calls `.parse()` with (see zod-schema.ts) — one source of truth for both
 * the real validation and the Swagger UI docs at GET /documentation.
 */
export function registerBranchRoutes(app: FastifyInstance): void {
  app.get(
    "/branches",
    {
      preHandler: requirePermission("branch:view"),
      schema: {
        tags: ["branches"],
        summary: "Danh sách chi nhánh trong phạm vi quyền của người gọi",
        security: [{ bearerAuth: [] }],
      },
    },
    branchController.list,
  );

  app.get<{ Params: { id: string } }>(
    "/branches/:id",
    {
      preHandler: requirePermission("branch:view"),
      schema: {
        tags: ["branches"],
        summary: "Chi tiết một chi nhánh",
        params: idParamSchema,
        security: [{ bearerAuth: [] }],
      },
    },
    branchController.getById,
  );

  app.post(
    "/branches",
    {
      preHandler: requirePermission("branch:create"),
      schema: {
        tags: ["branches"],
        summary: "Tạo chi nhánh mới",
        description: "`code` bất biến sau khi tạo — xem docs/06-module-property.md §1.",
        body: zodSchema(createBranchSchema),
        security: [{ bearerAuth: [] }],
      },
    },
    branchController.create,
  );

  app.patch<{ Params: { id: string } }>(
    "/branches/:id",
    {
      preHandler: requirePermission("branch:update"),
      schema: {
        tags: ["branches"],
        summary: "Cập nhật thông tin chi nhánh (không đổi được `code`)",
        params: idParamSchema,
        body: zodSchema(updateBranchSchema),
        security: [{ bearerAuth: [] }],
      },
    },
    branchController.update,
  );

  app.post<{ Params: { id: string } }>(
    "/branches/:id/archive",
    {
      preHandler: requirePermission("branch:delete"),
      schema: {
        tags: ["branches"],
        summary: "Lưu trữ chi nhánh (không xóa vật lý)",
        description: "Xem TODO docs/06 §1.6 — chưa chặn archive khi còn hợp đồng/công nợ/cọc.",
        params: idParamSchema,
        security: [{ bearerAuth: [] }],
      },
    },
    branchController.archive,
  );
}
