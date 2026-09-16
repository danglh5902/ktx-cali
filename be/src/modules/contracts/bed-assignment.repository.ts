import { and, eq, isNull } from "drizzle-orm";
import { bedAssignments } from "../../core/db/schema/index.js";
import type { Tx } from "../../core/db/request-context.js";

export type BedAssignmentRow = typeof bedAssignments.$inferSelect;

/**
 * ★ Bảng quan trọng nhất hệ thống — docs/11-architecture.md §2 D2. Unique
 * partial index `(bed_id) WHERE end_date IS NULL` (đã có trong migration)
 * là lớp chặn cuối cùng chống bán trùng giường; các hàm dưới đây kiểm tra
 * trước ở tầng ứng dụng để trả lỗi rõ ràng thay vì để constraint ném lỗi thô.
 */
export const bedAssignmentRepository = {
  async findOpenByBedId(tx: Tx, bedId: string): Promise<BedAssignmentRow | null> {
    const [row] = await tx
      .select()
      .from(bedAssignments)
      .where(and(eq(bedAssignments.bedId, bedId), isNull(bedAssignments.endDate)))
      .limit(1);
    return row ?? null;
  },

  async findOpenByContractId(tx: Tx, contractId: string): Promise<BedAssignmentRow[]> {
    return tx
      .select()
      .from(bedAssignments)
      .where(and(eq(bedAssignments.contractId, contractId), isNull(bedAssignments.endDate)));
  },

  async findByContractId(tx: Tx, contractId: string): Promise<BedAssignmentRow[]> {
    return tx.select().from(bedAssignments).where(eq(bedAssignments.contractId, contractId));
  },

  async create(
    tx: Tx,
    entry: {
      orgId: string;
      branchId: string;
      contractId: string;
      customerId: string;
      bedId: string;
      roomId: string;
      floorId: string;
      buildingId: string;
      startDate: string;
      reason: BedAssignmentRow["reason"];
      dailyRate: bigint;
      monthlyRate: bigint;
      transferReason?: string;
      previousAssignmentId?: string;
      createdBy: string;
    },
  ): Promise<BedAssignmentRow> {
    const [row] = await tx.insert(bedAssignments).values(entry).returning();
    if (!row) throw new Error("bed assignment insert returned no row");
    return row;
  },

  async close(tx: Tx, id: string, endDate: string): Promise<BedAssignmentRow | null> {
    const [row] = await tx.update(bedAssignments).set({ endDate }).where(eq(bedAssignments.id, id)).returning();
    return row ?? null;
  },
};
