export type DepositEntryType = "HOLD" | "DEDUCT" | "REFUND" | "FORFEIT";
export type DepositEntryStatus = "PENDING" | "APPROVED" | "EXECUTED" | "REJECTED";

export interface DepositEntry {
  id: string;
  contractId: string;
  customerId: string;
  entryNo: string;
  entryType: DepositEntryType;
  amount: string;
  balanceAfter: string;
  reason: string | null;
  status: DepositEntryStatus;
  createdAt: string;
}
