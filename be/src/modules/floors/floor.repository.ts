import { and, asc, eq, isNull } from "drizzle-orm";
import type { CreateFloorInput, UpdateFloorInput } from "../../shared/index.js";
import { floors } from "../../core/db/schema/index.js";
import type { Tx } from "../../core/db/request-context.js";

export type FloorRow = typeof floors.$inferSelect;

export const floorRepository = {
  async findMany(tx: Tx, buildingId?: string): Promise<FloorRow[]> {
    const conditions = [isNull(floors.deletedAt)];
    if (buildingId) conditions.push(eq(floors.buildingId, buildingId));
    return tx.select().from(floors).where(and(...conditions)).orderBy(asc(floors.sortOrder));
  },

  async findById(tx: Tx, id: string): Promise<FloorRow | null> {
    const [row] = await tx
      .select()
      .from(floors)
      .where(and(eq(floors.id, id), isNull(floors.deletedAt)))
      .limit(1);
    return row ?? null;
  },

  async findByNumber(tx: Tx, buildingId: string, number: string): Promise<FloorRow | null> {
    const [row] = await tx
      .select()
      .from(floors)
      .where(and(eq(floors.buildingId, buildingId), eq(floors.number, number), isNull(floors.deletedAt)))
      .limit(1);
    return row ?? null;
  },

  async create(
    tx: Tx,
    orgId: string,
    branchId: string,
    input: CreateFloorInput,
    actorId: string,
  ): Promise<FloorRow> {
    const [row] = await tx
      .insert(floors)
      .values({
        orgId,
        branchId,
        buildingId: input.buildingId,
        number: input.number,
        sortOrder: input.sortOrder,
        name: input.name,
        genderPolicy: input.genderPolicy,
        createdBy: actorId,
        updatedBy: actorId,
      })
      .returning();
    if (!row) throw new Error("floor insert returned no row");
    return row;
  },

  async update(tx: Tx, id: string, input: UpdateFloorInput, actorId: string): Promise<FloorRow | null> {
    const [row] = await tx
      .update(floors)
      .set({ ...input, updatedBy: actorId, updatedAt: new Date() })
      .where(and(eq(floors.id, id), isNull(floors.deletedAt)))
      .returning();
    return row ?? null;
  },
};
