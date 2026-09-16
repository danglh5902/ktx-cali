import { api } from "../../../lib/api-client";
import type { Customer, CreateCustomerInput } from "./types";

export const customersApi = {
  list: (filter: { search?: string; bedId?: string } = {}) => {
    const params = new URLSearchParams();
    if (filter.search) params.set("search", filter.search);
    if (filter.bedId) params.set("bedId", filter.bedId);
    const qs = params.toString();
    return api.get<Customer[]>(`/customers${qs ? `?${qs}` : ""}`);
  },
  getById: (id: string) => api.get<Customer>(`/customers/${id}`),
  create: (input: CreateCustomerInput) => api.post<Customer>("/customers", input),
  blacklist: (id: string, reason: string) => api.post<Customer>(`/customers/${id}/blacklist`, { reason }),
};
