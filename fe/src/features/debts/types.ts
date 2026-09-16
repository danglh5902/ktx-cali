export type AgingBucket = "CURRENT" | "1_30" | "31_60" | "61_90" | "OVER_90";

export interface DebtRow {
  customerId: string;
  customerCode: string;
  fullName: string;
  invoiceId: string;
  invoiceNo: string;
  dueDate: string | null;
  balance: string;
  agingBucket: AgingBucket;
}
