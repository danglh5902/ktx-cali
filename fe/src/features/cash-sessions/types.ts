export type CashSessionStatus = "OPEN" | "CLOSED";

export interface CashSession {
  id: string;
  branchId: string;
  sessionNo: string;
  staffId: string;
  openedAt: string;
  openingBalance: string;
  closedAt: string | null;
  systemTotal: string | null;
  countedTotal: string | null;
  variance: string | null;
  varianceReason: string | null;
  status: CashSessionStatus;
}
