import { api } from "../../lib/api-client";
import type { CashSession } from "./types";

export const cashSessionsApi = {
  list: (branchId?: string) => api.get<CashSession[]>(`/cash-sessions${branchId ? `?branchId=${branchId}` : ""}`),
  open: (branchId: string, openingBalance: string) => api.post<CashSession>("/cash-sessions", { branchId, openingBalance }),
  close: (id: string, input: { countedTotal: string; varianceReason?: string; handoverNote?: string }) =>
    api.post<CashSession>(`/cash-sessions/${id}/close`, input),
};
