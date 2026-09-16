import type {
  BulkCreateRoomsInput,
  CreateRoomInput,
  RequestContext,
  UpdateRoomInput,
} from "../../shared/index.js";
import { withRequestContext } from "../../core/db/request-context.js";
import { writeAudit } from "../../core/audit/audit-log.js";
import { ConflictError, NotFoundError } from "../../core/errors/app-error.js";
import { roomRepository, type RoomRow } from "./room.repository.js";

export const roomService = {
  async list(ctx: RequestContext, filter: { branchId?: string; floorId?: string }): Promise<RoomRow[]> {
    return withRequestContext(ctx, (tx) => roomRepository.findMany(tx, filter));
  },

  async getById(ctx: RequestContext, id: string): Promise<RoomRow> {
    const row = await withRequestContext(ctx, (tx) => roomRepository.findById(tx, id));
    if (!row) throw new NotFoundError("Room");
    return row;
  },

  async create(ctx: RequestContext, input: CreateRoomInput): Promise<RoomRow> {
    return withRequestContext(ctx, async (tx) => {
      const existing = await roomRepository.findByCode(tx, input.branchId, input.code);
      if (existing) throw new ConflictError(`Room code "${input.code}" already exists in this branch`);

      const room = await roomRepository.create(tx, ctx.orgId, input, ctx.userId);

      await writeAudit(tx, {
        orgId: ctx.orgId,
        branchId: room.branchId,
        actorId: ctx.userId,
        actorName: ctx.userId,
        actorRole: ctx.scope,
        action: "room.create",
        entity: "rooms",
        entityId: room.id,
        after: { code: room.code, floorId: room.floorId },
      });

      return room;
    });
  },

  async update(ctx: RequestContext, id: string, input: UpdateRoomInput): Promise<RoomRow> {
    return withRequestContext(ctx, async (tx) => {
      const before = await roomRepository.findById(tx, id);
      if (!before) throw new NotFoundError("Room");

      const after = await roomRepository.update(tx, id, input, ctx.userId);
      if (!after) throw new NotFoundError("Room");

      await writeAudit(tx, {
        orgId: ctx.orgId,
        branchId: after.branchId,
        actorId: ctx.userId,
        actorName: ctx.userId,
        actorRole: ctx.scope,
        action: "room.update",
        entity: "rooms",
        entityId: id,
        before: { name: before.name, status: before.status },
        after: { name: after.name, status: after.status },
      });

      return after;
    });
  },

  /**
   * Tạo hàng loạt phòng cùng loại trong 1 tầng — docs/06 §4.5. Mã phòng sinh
   * theo mẫu `{codePrefix}{nn}` với `nn` chạy từ `codeFrom` đến `codeTo`,
   * đệm số 0 theo `codePad` (vd `codePrefix="A-3"`, `codeFrom=1`, `codeTo=10`,
   * `codePad=2` → "A-301".."A-310").
   */
  async bulkCreate(ctx: RequestContext, input: BulkCreateRoomsInput): Promise<RoomRow[]> {
    if (input.codeTo < input.codeFrom) {
      throw new ConflictError("codeTo must be >= codeFrom");
    }

    return withRequestContext(ctx, async (tx) => {
      const created: RoomRow[] = [];
      for (let n = input.codeFrom; n <= input.codeTo; n += 1) {
        const code = `${input.codePrefix}${String(n).padStart(input.codePad, "0")}`;
        const existing = await roomRepository.findByCode(tx, input.branchId, code);
        if (existing) throw new ConflictError(`Room code "${code}" already exists in this branch`);

        const room = await roomRepository.create(
          tx,
          ctx.orgId,
          {
            branchId: input.branchId,
            buildingId: input.buildingId,
            floorId: input.floorId,
            code,
            roomTypeId: input.roomTypeId,
            capacity: input.capacity,
            hasPrivateToilet: false,
          },
          ctx.userId,
        );
        created.push(room);
      }

      await writeAudit(tx, {
        orgId: ctx.orgId,
        branchId: input.branchId,
        actorId: ctx.userId,
        actorName: ctx.userId,
        actorRole: ctx.scope,
        action: "room.bulk_create",
        entity: "rooms",
        after: { count: created.length, codes: created.map((r) => r.code) },
      });

      return created;
    });
  },
};
