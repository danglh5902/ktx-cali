import type {
  BulkCreateBedsInput,
  CreateBedInput,
  RequestContext,
  UpdateBedStatusInput,
} from "../../shared/index.js";
import { withRequestContext } from "../../core/db/request-context.js";
import { writeAudit } from "../../core/audit/audit-log.js";
import { ConflictError, NotFoundError } from "../../core/errors/app-error.js";
import { roomRepository } from "../rooms/room.repository.js";
import { bedRepository, type BedRow } from "./bed.repository.js";

/**
 * Máy trạng thái giường — docs/03-org-model.md §3.1: "không cho nhảy tùy ý".
 * `OCCUPIED`/`RESERVED`/`CHECKOUT_PENDING` chỉ nên đạt tới qua nghiệp vụ thật
 * (booking/check-in/check-out — chưa xây ở lần này), nên endpoint đổi trạng
 * thái thủ công ở đây chỉ cho phép các chuyển đổi vận hành thường gặp
 * (dọn dẹp, bảo trì, khóa/mở giường). D7 (docs/11 §2): trạng thái này là dữ
 * liệu dẫn xuất, nguồn sự thật thật sự là bed_assignments — job reconcile
 * nightly (chưa xây) sẽ là nơi tự động sửa các trường hợp lệch.
 */
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  AVAILABLE: ["MAINTENANCE", "BLOCKED", "CLEANING"],
  CLEANING: ["AVAILABLE", "MAINTENANCE", "BLOCKED"],
  MAINTENANCE: ["AVAILABLE", "CLEANING", "BLOCKED"],
  BLOCKED: ["AVAILABLE", "MAINTENANCE"],
  CHECKOUT_PENDING: ["CLEANING"],
  // RESERVED/OCCUPIED chỉ đổi được qua nghiệp vụ booking/check-in (chưa xây).
};

export const bedService = {
  async list(ctx: RequestContext, filter: { branchId?: string; roomId?: string }): Promise<BedRow[]> {
    return withRequestContext(ctx, (tx) => bedRepository.findMany(tx, filter));
  },

  async getById(ctx: RequestContext, id: string): Promise<BedRow> {
    const row = await withRequestContext(ctx, (tx) => bedRepository.findById(tx, id));
    if (!row) throw new NotFoundError("Bed");
    return row;
  },

  async create(ctx: RequestContext, input: CreateBedInput): Promise<BedRow> {
    return withRequestContext(ctx, async (tx) => {
      const existing = await bedRepository.findByCode(tx, input.branchId, input.code);
      if (existing) throw new ConflictError(`Bed code "${input.code}" already exists in this branch`);

      const bed = await bedRepository.create(tx, ctx.orgId, input, ctx.userId);
      await roomRepository.incrementBedCount(tx, input.roomId, 1);

      await writeAudit(tx, {
        orgId: ctx.orgId,
        branchId: bed.branchId,
        actorId: ctx.userId,
        actorName: ctx.userId,
        actorRole: ctx.scope,
        action: "bed.create",
        entity: "beds",
        entityId: bed.id,
        after: { code: bed.code, roomId: bed.roomId },
      });

      return bed;
    });
  },

  async bulkCreate(ctx: RequestContext, input: BulkCreateBedsInput): Promise<BedRow[]> {
    return withRequestContext(ctx, async (tx) => {
      const created: BedRow[] = [];
      for (let n = 1; n <= input.count; n += 1) {
        const code = `${input.codePrefix}${n}`;
        const existing = await bedRepository.findByCode(tx, input.branchId, code);
        if (existing) throw new ConflictError(`Bed code "${code}" already exists in this branch`);

        const bed = await bedRepository.create(
          tx,
          ctx.orgId,
          {
            branchId: input.branchId,
            buildingId: input.buildingId,
            floorId: input.floorId,
            roomId: input.roomId,
            code,
            bedType: input.bedType,
          },
          ctx.userId,
        );
        created.push(bed);
      }
      await roomRepository.incrementBedCount(tx, input.roomId, created.length);

      await writeAudit(tx, {
        orgId: ctx.orgId,
        branchId: input.branchId,
        actorId: ctx.userId,
        actorName: ctx.userId,
        actorRole: ctx.scope,
        action: "bed.bulk_create",
        entity: "beds",
        after: { count: created.length, codes: created.map((b) => b.code) },
      });

      return created;
    });
  },

  async updateStatus(ctx: RequestContext, id: string, input: UpdateBedStatusInput): Promise<BedRow> {
    return withRequestContext(ctx, async (tx) => {
      const before = await bedRepository.findById(tx, id);
      if (!before) throw new NotFoundError("Bed");

      const allowed = ALLOWED_TRANSITIONS[before.status] ?? [];
      if (before.status !== input.status && !allowed.includes(input.status)) {
        throw new ConflictError(
          `Cannot transition bed from ${before.status} to ${input.status}. Allowed: ${allowed.join(", ") || "(none — requires booking/check-in flow)"}`,
        );
      }
      if (input.status === "BLOCKED" && !input.blockedReason) {
        throw new ConflictError("blockedReason is required when blocking a bed");
      }

      const after = await bedRepository.updateStatus(tx, id, input, ctx.userId);
      if (!after) throw new NotFoundError("Bed");

      await writeAudit(tx, {
        orgId: ctx.orgId,
        branchId: after.branchId,
        actorId: ctx.userId,
        actorName: ctx.userId,
        actorRole: ctx.scope,
        action: "bed.status_update",
        entity: "beds",
        entityId: id,
        before: { status: before.status },
        after: { status: after.status },
        reason: input.blockedReason,
      });

      return after;
    });
  },
};
