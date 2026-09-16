import { and, eq, gt, inArray } from "drizzle-orm";
import { invoiceLines, invoices } from "../../core/db/schema/index.js";
import type { Tx } from "../../core/db/request-context.js";

export type InvoiceRow = typeof invoices.$inferSelect;
export type InvoiceLineRow = typeof invoiceLines.$inferSelect;

export const invoiceRepository = {
  async findMany(tx: Tx, filter: { branchId?: string; customerId?: string; status?: string } = {}): Promise<InvoiceRow[]> {
    const conditions = [];
    if (filter.branchId) conditions.push(eq(invoices.branchId, filter.branchId));
    if (filter.customerId) conditions.push(eq(invoices.customerId, filter.customerId));
    if (filter.status) conditions.push(eq(invoices.status, filter.status));
    return tx.select().from(invoices).where(conditions.length ? and(...conditions) : undefined);
  },

  async findById(tx: Tx, id: string): Promise<InvoiceRow | null> {
    const [row] = await tx.select().from(invoices).where(eq(invoices.id, id)).limit(1);
    return row ?? null;
  },

  /** Chưa xử lý hết (PAID/VOID) — dùng cho FIFO allocation & aging debt. */
  async findOutstandingByCustomer(tx: Tx, customerId: string): Promise<InvoiceRow[]> {
    return tx
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.customerId, customerId),
          gt(invoices.balance, 0n),
          inArray(invoices.status, ["ISSUED", "PARTIAL", "OVERDUE"]),
        ),
      )
      .orderBy(invoices.dueDate);
  },

  async listLines(tx: Tx, invoiceId: string): Promise<InvoiceLineRow[]> {
    return tx.select().from(invoiceLines).where(eq(invoiceLines.invoiceId, invoiceId)).orderBy(invoiceLines.sortOrder);
  },

  async create(
    tx: Tx,
    entry: {
      orgId: string;
      branchId: string;
      invoiceNo: string;
      contractId: string;
      customerId: string;
      billingPeriodId?: string;
      periodFrom: string;
      periodTo: string;
      dueDate?: string;
      subtotal: bigint;
      grandTotal: bigint;
      lines: Array<{ lineType: string; description: string; amount: bigint; unitPrice?: bigint }>;
    },
  ): Promise<InvoiceRow> {
    const [row] = await tx
      .insert(invoices)
      .values({
        orgId: entry.orgId,
        branchId: entry.branchId,
        invoiceNo: entry.invoiceNo,
        invoiceType: "PERIODIC",
        contractId: entry.contractId,
        customerId: entry.customerId,
        billingPeriodId: entry.billingPeriodId,
        periodFrom: entry.periodFrom,
        periodTo: entry.periodTo,
        dueDate: entry.dueDate,
        subtotal: entry.subtotal,
        grandTotal: entry.grandTotal,
        balance: entry.grandTotal,
        status: "DRAFT",
      })
      .returning();
    if (!row) throw new Error("invoice insert returned no row");

    if (entry.lines.length > 0) {
      await tx.insert(invoiceLines).values(
        entry.lines.map((line, index) => ({
          orgId: entry.orgId,
          branchId: entry.branchId,
          invoiceId: row.id,
          lineType: line.lineType,
          description: line.description,
          unitPrice: line.unitPrice,
          amount: line.amount,
          periodFrom: entry.periodFrom,
          periodTo: entry.periodTo,
          sortOrder: index,
        })),
      );
    }

    return row;
  },

  async issue(tx: Tx, id: string, actorId: string): Promise<InvoiceRow | null> {
    const [row] = await tx
      .update(invoices)
      .set({ status: "ISSUED", issueDate: new Date().toISOString().slice(0, 10), issuedAt: new Date(), issuedBy: actorId })
      .where(eq(invoices.id, id))
      .returning();
    return row ?? null;
  },

  async applyPayment(tx: Tx, id: string, paidAmount: bigint, balance: bigint): Promise<InvoiceRow | null> {
    const status = balance <= 0n ? "PAID" : "PARTIAL";
    const [row] = await tx.update(invoices).set({ paidAmount, balance, status }).where(eq(invoices.id, id)).returning();
    return row ?? null;
  },
};
