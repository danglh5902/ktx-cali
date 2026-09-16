import type { CreateRoomTypeInput, RequestContext, UpdateRoomTypeInput } from "../../shared/index.js";
import { withRequestContext } from "../../core/db/request-context.js";
import { writeAudit } from "../../core/audit/audit-log.js";
import { ConflictError, NotFoundError } from "../../core/errors/app-error.js";
import { roomTypeRepository, type RoomTypeRow } from "./room-type.repository.js";

export const roomTypeService = {
  async list(ctx: RequestContext, branchId?: string): Promise<RoomTypeRow[]> {
    return withRequestContext(ctx, (tx) => roomTypeRepository.findMany(tx, branchId));
  },

  async getById(ctx: RequestContext, id: string): Promise<RoomTypeRow> {
    const row = await withRequestContext(ctx, (tx) => roomTypeRepository.findById(tx, id));
    if (!row) throw new NotFoundError("Room type");
    return row;
  },

  async create(ctx: RequestContext, input: CreateRoomTypeInput): Promise<RoomTypeRow> {
    return withRequestContext(ctx, async (tx) => {
      const existing = await roomTypeRepository.findByCode(tx, input.branchId, input.code);
      if (existing) throw new ConflictError(`Room type code "${input.code}" already exists in this branch`);

      const row = await roomTypeRepository.create(tx, ctx.orgId, input, ctx.userId);

      await writeAudit(tx, {
        orgId: ctx.orgId,
        branchId: row.branchId,
        actorId: ctx.userId,
        actorName: ctx.userId,
        actorRole: ctx.scope,
        action: "room_type.create",
        entity: "room_types",
        entityId: row.id,
        after: { code: row.code, basePrice: row.basePrice?.toString() },
      });

      return row;
    });
  },

  /**
   * TODO(docs/11 §6.2 nhóm "Giá"): thay đổi `basePrice`/`wholeRoomPrice` nên
   * bắt buộc `reason` giống nhóm invoice/pricing khác — hiện đang dùng action
   * chung "room_type.update" để tránh chặn các sửa đổi phi giá (tên, mô tả).
   */
  async update(ctx: RequestContext, id: string, input: UpdateRoomTypeInput): Promise<RoomTypeRow> {
    return withRequestContext(ctx, async (tx) => {
      const before = await roomTypeRepository.findById(tx, id);
      if (!before) throw new NotFoundError("Room type");

      const after = await roomTypeRepository.update(tx, id, input, ctx.userId);
      if (!after) throw new NotFoundError("Room type");

      await writeAudit(tx, {
        orgId: ctx.orgId,
        branchId: after.branchId,
        actorId: ctx.userId,
        actorName: ctx.userId,
        actorRole: ctx.scope,
        action: "room_type.update",
        entity: "room_types",
        entityId: id,
        before: { basePrice: before.basePrice?.toString(), name: before.name },
        after: { basePrice: after.basePrice?.toString(), name: after.name },
      });

      return after;
    });
  },
};
