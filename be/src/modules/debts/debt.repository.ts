import { and, eq, gt, inArray } from "drizzle-orm";
import { customers, invoices } from "../../core/db/schema/index.js";
import type { Tx } from "../../core/db/request-context.js";

export interface OutstandingInvoiceRow {
  customerId: string;
  customerCode: string;
  fullName: string;
  invoiceId: string;
  invoiceNo: string;
  dueDate: string | null;
  balance: bigint;
}

export const debtRepository = {
  async listOutstanding(tx: Tx, branchId?: string): Promise<OutstandingInvoiceRow[]> {
    const conditions = [gt(invoices.balance, 0n), inArray(invoices.status, ["ISSUED", "PARTIAL", "OVERDUE"])];
    if (branchId) conditions.push(eq(invoices.branchId, branchId));

    return tx
      .select({
        customerId: customers.id,
        customerCode: customers.customerCode,
        fullName: customers.fullName,
        invoiceId: invoices.id,
        invoiceNo: invoices.invoiceNo,
        dueDate: invoices.dueDate,
        balance: invoices.balance,
      })
      .from(invoices)
      .innerJoin(customers, eq(customers.id, invoices.customerId))
      .where(and(...conditions));
  },
};
