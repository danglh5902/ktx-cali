import { api } from "../../lib/api-client";
import type { CreatePaymentInput, Payment } from "./types";

export const paymentsApi = {
  list: (filter: { customerId?: string; branchId?: string } = {}) => {
    const params = new URLSearchParams();
    if (filter.customerId) params.set("customerId", filter.customerId);
    if (filter.branchId) params.set("branchId", filter.branchId);
    const qs = params.toString();
    return api.get<Payment[]>(`/payments${qs ? `?${qs}` : ""}`);
  },
  record: (input: CreatePaymentInput) => api.post<Payment>("/payments", input),
};
