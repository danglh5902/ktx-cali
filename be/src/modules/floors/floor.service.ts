import type { CreateFloorInput, RequestContext, UpdateFloorInput } from "../../shared/index.js";
import { withRequestContext } from "../../core/db/request-context.js";
import { writeAudit } from "../../core/audit/audit-log.js";
import { ConflictError, NotFoundError } from "../../core/errors/app-error.js";
import { buildingRepository } from "../buildings/building.repository.js";
import { floorRepository, type FloorRow } from "./floor.repository.js";

export const floorService = {
  async list(ctx: RequestContext, buildingId?: string): Promise<FloorRow[]> {
    return withRequestContext(ctx, (tx) => floorRepository.findMany(tx, buildingId));
  },

  async getById(ctx: RequestContext, id: string): Promise<FloorRow> {
    const row = await withRequestContext(ctx, (tx) => floorRepository.findById(tx, id));
    if (!row) throw new NotFoundError("Floor");
    return row;
  },

  async create(ctx: RequestContext, input: CreateFloorInput): Promise<FloorRow> {
    return withRequestContext(ctx, async (tx) => {
      const building = await buildingRepository.findById(tx, input.buildingId);
      if (!building) throw new NotFoundError("Building");

      const existing = await floorRepository.findByNumber(tx, input.buildingId, input.number);
      if (existing) throw new ConflictError(`Floor "${input.number}" already exists in this building`);

      const floor = await floorRepository.create(tx, ctx.orgId, building.branchId, input, ctx.userId);

      await writeAudit(tx, {
        orgId: ctx.orgId,
        branchId: building.branchId,
        actorId: ctx.userId,
        actorName: ctx.userId,
        actorRole: ctx.scope,
        action: "floor.create",
        entity: "floors",
        entityId: floor.id,
        after: { number: floor.number, buildingId: floor.buildingId },
      });

      return floor;
    });
  },

  async update(ctx: RequestContext, id: string, input: UpdateFloorInput): Promise<FloorRow> {
    return withRequestContext(ctx, async (tx) => {
      const before = await floorRepository.findById(tx, id);
      if (!before) throw new NotFoundError("Floor");

      const after = await floorRepository.update(tx, id, input, ctx.userId);
      if (!after) throw new NotFoundError("Floor");

      await writeAudit(tx, {
        orgId: ctx.orgId,
        branchId: after.branchId,
        actorId: ctx.userId,
        actorName: ctx.userId,
        actorRole: ctx.scope,
        action: "floor.update",
        entity: "floors",
        entityId: id,
        before: { name: before.name, status: before.status },
        after: { name: after.name, status: after.status },
      });

      return after;
    });
  },
};
