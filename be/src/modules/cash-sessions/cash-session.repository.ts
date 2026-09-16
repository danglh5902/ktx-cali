import { and, eq } from "drizzle-orm";
import { cashSessions } from "../../core/db/schema/index.js";
import type { Tx } from "../../core/db/request-context.js";

export type CashSessionRow = typeof cashSessions.$inferSelect;

export const cashSessionRepository = {
  async findMany(tx: Tx, filter: { branchId?: string; status?: string } = {}): Promise<CashSessionRow[]> {
    const conditions = [];
    if (filter.branchId) conditions.push(eq(cashSessions.branchId, filter.branchId));
    if (filter.status) conditions.push(eq(cashSessions.status, filter.status));
    return tx.select().from(cashSessions).where(conditions.length ? and(...conditions) : undefined);
  },

  async findById(tx: Tx, id: string): Promise<CashSessionRow | null> {
    const [row] = await tx.select().from(cashSessions).where(eq(cashSessions.id, id)).limit(1);
    return row ?? null;
  },

  async findOpenByStaff(tx: Tx, staffId: string): Promise<CashSessionRow | null> {
    const [row] = await tx
      .select()
      .from(cashSessions)
      .where(and(eq(cashSessions.staffId, staffId), eq(cashSessions.status, "OPEN")))
      .limit(1);
    return row ?? null;
  },

  async create(
    tx: Tx,
    entry: { orgId: string; branchId: string; sessionNo: string; staffId: string; openingBalance: bigint },
  ): Promise<CashSessionRow> {
    const [row] = await tx
      .insert(cashSessions)
      .values({
        orgId: entry.orgId,
        branchId: entry.branchId,
        sessionNo: entry.sessionNo,
        staffId: entry.staffId,
        openingBalance: entry.openingBalance,
        status: "OPEN",
      })
      .returning();
    if (!row) throw new Error("cash session insert returned no row");
    return row;
  },

  async close(
    tx: Tx,
    id: string,
    fields: { systemTotal: bigint; countedTotal: bigint; variance: bigint; varianceReason?: string; handoverNote?: string },
  ): Promise<CashSessionRow | null> {
    const [row] = await tx
      .update(cashSessions)
      .set({
        status: "CLOSED",
        closedAt: new Date(),
        systemTotal: fields.systemTotal,
        countedTotal: fields.countedTotal,
        variance: fields.variance,
        varianceReason: fields.varianceReason,
        handoverNote: fields.handoverNote,
      })
      .where(eq(cashSessions.id, id))
      .returning();
    return row ?? null;
  },
};
