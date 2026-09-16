import { api } from "../../lib/api-client";
import type { DepositEntry } from "./types";

export const depositsApi = {
  listPendingRefunds: (branchId?: string) => api.get<DepositEntry[]>(`/deposit-refunds/pending${branchId ? `?branchId=${branchId}` : ""}`),
  listByContract: (contractId: string) => api.get<{ entries: DepositEntry[]; balance: string }>(`/contracts/${contractId}/deposit-ledger`),
  requestRefund: (contractId: string, input: { amount: string; reason: string }) =>
    api.post<DepositEntry>(`/contracts/${contractId}/deposit-refund-requests`, input),
  approve: (id: string) => api.post<DepositEntry>(`/deposit-refunds/${id}/approve`),
  execute: (id: string) => api.post<DepositEntry>(`/deposit-refunds/${id}/execute`),
};
