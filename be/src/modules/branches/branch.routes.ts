import type { FastifyInstance } from "fastify";
import { requirePermission } from "../../core/rbac/permission-guard.js";
import { branchController } from "./branch.controller.js";

/**
 * Permission mapping follows docs/04-roles-permissions.md rows 2–5:
 * view / create / update / delete(archive).
 */
export function registerBranchRoutes(app: FastifyInstance): void {
  app.get("/branches", { preHandler: requirePermission("branch:view") }, branchController.list);

  app.get<{ Params: { id: string } }>(
    "/branches/:id",
    { preHandler: requirePermission("branch:view") },
    branchController.getById,
  );

  app.post(
    "/branches",
    { preHandler: requirePermission("branch:create") },
    branchController.create,
  );

  app.patch<{ Params: { id: string } }>(
    "/branches/:id",
    { preHandler: requirePermission("branch:update") },
    branchController.update,
  );

  app.post<{ Params: { id: string } }>(
    "/branches/:id/archive",
    { preHandler: requirePermission("branch:delete") },
    branchController.archive,
  );
}
