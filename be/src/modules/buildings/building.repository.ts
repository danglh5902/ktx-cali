import { and, eq, isNull } from "drizzle-orm";
import type { CreateBuildingInput, UpdateBuildingInput } from "../../shared/index.js";
import { buildings } from "../../core/db/schema/index.js";
import type { Tx } from "../../core/db/request-context.js";

export type BuildingRow = typeof buildings.$inferSelect;

export const buildingRepository = {
  async findMany(tx: Tx, branchId?: string): Promise<BuildingRow[]> {
    const conditions = [isNull(buildings.deletedAt)];
    if (branchId) conditions.push(eq(buildings.branchId, branchId));
    return tx.select().from(buildings).where(and(...conditions));
  },

  async findById(tx: Tx, id: string): Promise<BuildingRow | null> {
    const [row] = await tx
      .select()
      .from(buildings)
      .where(and(eq(buildings.id, id), isNull(buildings.deletedAt)))
      .limit(1);
    return row ?? null;
  },

  async findByCode(tx: Tx, branchId: string, code: string): Promise<BuildingRow | null> {
    const [row] = await tx
      .select()
      .from(buildings)
      .where(and(eq(buildings.branchId, branchId), eq(buildings.code, code), isNull(buildings.deletedAt)))
      .limit(1);
    return row ?? null;
  },

  async create(tx: Tx, orgId: string, input: CreateBuildingInput, actorId: string): Promise<BuildingRow> {
    const [row] = await tx
      .insert(buildings)
      .values({
        orgId,
        branchId: input.branchId,
        code: input.code,
        name: input.name,
        genderPolicy: input.genderPolicy,
        hasElevator: input.hasElevator,
        monthlyRentCost: input.monthlyRentCost ? BigInt(input.monthlyRentCost) : undefined,
        address: input.address,
        createdBy: actorId,
        updatedBy: actorId,
      })
      .returning();
    if (!row) throw new Error("building insert returned no row");
    return row;
  },

  async update(tx: Tx, id: string, input: UpdateBuildingInput, actorId: string): Promise<BuildingRow | null> {
    const [row] = await tx
      .update(buildings)
      .set({
        ...input,
        monthlyRentCost: input.monthlyRentCost !== undefined ? BigInt(input.monthlyRentCost) : undefined,
        updatedBy: actorId,
        updatedAt: new Date(),
      })
      .where(and(eq(buildings.id, id), isNull(buildings.deletedAt)))
      .returning();
    return row ?? null;
  },
};
