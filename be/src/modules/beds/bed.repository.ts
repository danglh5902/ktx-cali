import { and, eq, isNull } from "drizzle-orm";
import type { CreateBedInput, UpdateBedStatusInput } from "../../shared/index.js";
import { beds } from "../../core/db/schema/index.js";
import type { Tx } from "../../core/db/request-context.js";

export type BedRow = typeof beds.$inferSelect;

export const bedRepository = {
  async findMany(tx: Tx, filter: { branchId?: string; roomId?: string } = {}): Promise<BedRow[]> {
    const conditions = [isNull(beds.deletedAt)];
    if (filter.branchId) conditions.push(eq(beds.branchId, filter.branchId));
    if (filter.roomId) conditions.push(eq(beds.roomId, filter.roomId));
    return tx.select().from(beds).where(and(...conditions));
  },

  async findById(tx: Tx, id: string): Promise<BedRow | null> {
    const [row] = await tx
      .select()
      .from(beds)
      .where(and(eq(beds.id, id), isNull(beds.deletedAt)))
      .limit(1);
    return row ?? null;
  },

  async findByCode(tx: Tx, branchId: string, code: string): Promise<BedRow | null> {
    const [row] = await tx
      .select()
      .from(beds)
      .where(and(eq(beds.branchId, branchId), eq(beds.code, code), isNull(beds.deletedAt)))
      .limit(1);
    return row ?? null;
  },

  async create(tx: Tx, orgId: string, input: CreateBedInput, actorId: string): Promise<BedRow> {
    const [row] = await tx
      .insert(beds)
      .values({
        orgId,
        branchId: input.branchId,
        buildingId: input.buildingId,
        floorId: input.floorId,
        roomId: input.roomId,
        code: input.code,
        label: input.label,
        bedType: input.bedType,
        priceOverride: input.priceOverride ? BigInt(input.priceOverride) : undefined,
        createdBy: actorId,
        updatedBy: actorId,
      })
      .returning();
    if (!row) throw new Error("bed insert returned no row");
    return row;
  },

  async updateStatus(tx: Tx, id: string, input: UpdateBedStatusInput, actorId: string): Promise<BedRow | null> {
    const [row] = await tx
      .update(beds)
      .set({
        status: input.status,
        blockedReason: input.blockedReason,
        blockedUntil: input.blockedUntil ? new Date(input.blockedUntil) : null,
        updatedBy: actorId,
        updatedAt: new Date(),
      })
      .where(and(eq(beds.id, id), isNull(beds.deletedAt)))
      .returning();
    return row ?? null;
  },

  /** Check-in/check-out gọi hàm này để đổi status + gắn/gỡ bed_assignment hiện hành cùng lúc. */
  async attachAssignment(
    tx: Tx,
    id: string,
    status: BedRow["status"],
    currentAssignmentId: string | null,
    actorId: string,
  ): Promise<BedRow | null> {
    const [row] = await tx
      .update(beds)
      .set({ status, currentAssignmentId, updatedBy: actorId, updatedAt: new Date() })
      .where(and(eq(beds.id, id), isNull(beds.deletedAt)))
      .returning();
    return row ?? null;
  },
};
