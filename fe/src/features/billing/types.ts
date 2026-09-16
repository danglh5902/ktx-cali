export type BillingPeriodStatus = "OPEN" | "GENERATING" | "ISSUED" | "CLOSED";
export type InvoiceStatus = "DRAFT" | "ISSUED" | "PARTIAL" | "PAID" | "OVERDUE" | "VOID";

export interface BillingPeriod {
  id: string;
  branchId: string;
  code: string;
  periodFrom: string;
  periodTo: string;
  dueDate: string | null;
  status: BillingPeriodStatus;
  invoiceCount: number;
  totalAmount: string;
  generatedAt: string | null;
}

export interface CreateBillingPeriodInput {
  branchId: string;
  code: string;
  periodFrom: string;
  periodTo: string;
  dueDate?: string;
}

export interface InvoiceLine {
  id: string;
  lineType: string;
  description: string;
  unitPrice: string | null;
  amount: string;
}

export interface Invoice {
  id: string;
  branchId: string;
  invoiceNo: string;
  contractId: string;
  customerId: string;
  billingPeriodId: string | null;
  periodFrom: string;
  periodTo: string;
  issueDate: string | null;
  dueDate: string | null;
  subtotal: string;
  grandTotal: string;
  paidAmount: string;
  balance: string;
  status: InvoiceStatus;
  lines?: InvoiceLine[];
}
