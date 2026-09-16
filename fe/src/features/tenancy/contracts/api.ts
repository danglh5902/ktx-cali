import { api } from "../../../lib/api-client";
import type { CheckOutContractInput, Contract, CreateContractInput } from "./types";

export const contractsApi = {
  list: (filter: { branchId?: string; customerId?: string } = {}) => {
    const params = new URLSearchParams();
    if (filter.branchId) params.set("branchId", filter.branchId);
    if (filter.customerId) params.set("customerId", filter.customerId);
    const qs = params.toString();
    return api.get<Contract[]>(`/contracts${qs ? `?${qs}` : ""}`);
  },
  create: (input: CreateContractInput) => api.post<Contract>("/contracts", input),
  checkIn: (id: string) => api.post<Contract>(`/contracts/${id}/check-in`),
  checkOut: (id: string, input: CheckOutContractInput) => api.post<Contract>(`/contracts/${id}/check-out`, input),
};
