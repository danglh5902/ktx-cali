import { and, eq, isNull, sql } from "drizzle-orm";
import type { CreateRoomInput } from "../../shared/index.js";
import { rooms } from "../../core/db/schema/index.js";
import type { Tx } from "../../core/db/request-context.js";

export type RoomRow = typeof rooms.$inferSelect;

export const roomRepository = {
  async findMany(tx: Tx, filter: { branchId?: string; floorId?: string } = {}): Promise<RoomRow[]> {
    const conditions = [isNull(rooms.deletedAt)];
    if (filter.branchId) conditions.push(eq(rooms.branchId, filter.branchId));
    if (filter.floorId) conditions.push(eq(rooms.floorId, filter.floorId));
    return tx.select().from(rooms).where(and(...conditions));
  },

  async findById(tx: Tx, id: string): Promise<RoomRow | null> {
    const [row] = await tx
      .select()
      .from(rooms)
      .where(and(eq(rooms.id, id), isNull(rooms.deletedAt)))
      .limit(1);
    return row ?? null;
  },

  async findByCode(tx: Tx, branchId: string, code: string): Promise<RoomRow | null> {
    const [row] = await tx
      .select()
      .from(rooms)
      .where(and(eq(rooms.branchId, branchId), eq(rooms.code, code), isNull(rooms.deletedAt)))
      .limit(1);
    return row ?? null;
  },

  async create(tx: Tx, orgId: string, input: CreateRoomInput, actorId: string): Promise<RoomRow> {
    const [row] = await tx
      .insert(rooms)
      .values({
        orgId,
        branchId: input.branchId,
        buildingId: input.buildingId,
        floorId: input.floorId,
        code: input.code,
        name: input.name,
        roomTypeId: input.roomTypeId,
        capacity: input.capacity,
        hasPrivateToilet: input.hasPrivateToilet,
        amenities: input.amenities,
        priceOverride: input.priceOverride ? BigInt(input.priceOverride) : undefined,
        createdBy: actorId,
        updatedBy: actorId,
      })
      .returning();
    if (!row) throw new Error("room insert returned no row");
    return row;
  },

  async update(
    tx: Tx,
    id: string,
    input: Partial<CreateRoomInput>,
    actorId: string,
  ): Promise<RoomRow | null> {
    const [row] = await tx
      .update(rooms)
      .set({
        ...input,
        priceOverride: input.priceOverride !== undefined ? BigInt(input.priceOverride) : undefined,
        updatedBy: actorId,
        updatedAt: new Date(),
      })
      .where(and(eq(rooms.id, id), isNull(rooms.deletedAt)))
      .returning();
    return row ?? null;
  },

  /** `rooms.actual_bed_count` is a derived cache column — see docs/06 §4.2. */
  async incrementBedCount(tx: Tx, id: string, delta: number): Promise<void> {
    await tx
      .update(rooms)
      .set({ actualBedCount: sql`${rooms.actualBedCount} + ${delta}` })
      .where(eq(rooms.id, id));
  },
};
