import type { CreateBuildingInput, RequestContext, UpdateBuildingInput } from "../../shared/index.js";
import { withRequestContext } from "../../core/db/request-context.js";
import { writeAudit } from "../../core/audit/audit-log.js";
import { ConflictError, NotFoundError } from "../../core/errors/app-error.js";
import { buildingRepository, type BuildingRow } from "./building.repository.js";

export const buildingService = {
  async list(ctx: RequestContext, branchId?: string): Promise<BuildingRow[]> {
    return withRequestContext(ctx, (tx) => buildingRepository.findMany(tx, branchId));
  },

  async getById(ctx: RequestContext, id: string): Promise<BuildingRow> {
    const row = await withRequestContext(ctx, (tx) => buildingRepository.findById(tx, id));
    if (!row) throw new NotFoundError("Building");
    return row;
  },

  async create(ctx: RequestContext, input: CreateBuildingInput): Promise<BuildingRow> {
    return withRequestContext(ctx, async (tx) => {
      const existing = await buildingRepository.findByCode(tx, input.branchId, input.code);
      if (existing) throw new ConflictError(`Building code "${input.code}" already exists in this branch`);

      const building = await buildingRepository.create(tx, ctx.orgId, input, ctx.userId);

      await writeAudit(tx, {
        orgId: ctx.orgId,
        branchId: building.branchId,
        actorId: ctx.userId,
        actorName: ctx.userId,
        actorRole: ctx.scope,
        action: "building.create",
        entity: "buildings",
        entityId: building.id,
        after: { code: building.code, name: building.name },
      });

      return building;
    });
  },

  async update(ctx: RequestContext, id: string, input: UpdateBuildingInput): Promise<BuildingRow> {
    return withRequestContext(ctx, async (tx) => {
      const before = await buildingRepository.findById(tx, id);
      if (!before) throw new NotFoundError("Building");

      const after = await buildingRepository.update(tx, id, input, ctx.userId);
      if (!after) throw new NotFoundError("Building");

      await writeAudit(tx, {
        orgId: ctx.orgId,
        branchId: after.branchId,
        actorId: ctx.userId,
        actorName: ctx.userId,
        actorRole: ctx.scope,
        action: "building.update",
        entity: "buildings",
        entityId: id,
        before: { name: before.name, status: before.status },
        after: { name: after.name, status: after.status },
      });

      return after;
    });
  },
};
