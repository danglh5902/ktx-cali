import { and, eq, isNull } from "drizzle-orm";
import type { CreateRoomTypeInput, UpdateRoomTypeInput } from "../../shared/index.js";
import { roomTypes } from "../../core/db/schema/index.js";
import type { Tx } from "../../core/db/request-context.js";

export type RoomTypeRow = typeof roomTypes.$inferSelect;

export const roomTypeRepository = {
  async findMany(tx: Tx, branchId?: string): Promise<RoomTypeRow[]> {
    const conditions = [isNull(roomTypes.deletedAt)];
    if (branchId) conditions.push(eq(roomTypes.branchId, branchId));
    return tx.select().from(roomTypes).where(and(...conditions));
  },

  async findById(tx: Tx, id: string): Promise<RoomTypeRow | null> {
    const [row] = await tx
      .select()
      .from(roomTypes)
      .where(and(eq(roomTypes.id, id), isNull(roomTypes.deletedAt)))
      .limit(1);
    return row ?? null;
  },

  async findByCode(tx: Tx, branchId: string, code: string): Promise<RoomTypeRow | null> {
    const [row] = await tx
      .select()
      .from(roomTypes)
      .where(and(eq(roomTypes.branchId, branchId), eq(roomTypes.code, code), isNull(roomTypes.deletedAt)))
      .limit(1);
    return row ?? null;
  },

  async create(tx: Tx, orgId: string, input: CreateRoomTypeInput, actorId: string): Promise<RoomTypeRow> {
    const [row] = await tx
      .insert(roomTypes)
      .values({
        orgId,
        branchId: input.branchId,
        code: input.code,
        name: input.name,
        capacity: input.capacity,
        basePrice: BigInt(input.basePrice),
        wholeRoomPrice: input.wholeRoomPrice ? BigInt(input.wholeRoomPrice) : undefined,
        defaultAmenities: input.defaultAmenities,
        description: input.description,
        createdBy: actorId,
        updatedBy: actorId,
      })
      .returning();
    if (!row) throw new Error("room type insert returned no row");
    return row;
  },

  async update(tx: Tx, id: string, input: UpdateRoomTypeInput, actorId: string): Promise<RoomTypeRow | null> {
    const [row] = await tx
      .update(roomTypes)
      .set({
        ...input,
        basePrice: input.basePrice !== undefined ? BigInt(input.basePrice) : undefined,
        wholeRoomPrice: input.wholeRoomPrice !== undefined ? BigInt(input.wholeRoomPrice) : undefined,
        updatedBy: actorId,
        updatedAt: new Date(),
      })
      .where(and(eq(roomTypes.id, id), isNull(roomTypes.deletedAt)))
      .returning();
    return row ?? null;
  },
};
