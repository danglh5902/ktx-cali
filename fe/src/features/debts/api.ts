import { api } from "../../lib/api-client";
import type { DebtRow } from "./types";

export const debtsApi = {
  agingReport: (branchId?: string) => api.get<DebtRow[]>(`/debts/aging${branchId ? `?branchId=${branchId}` : ""}`),
};
