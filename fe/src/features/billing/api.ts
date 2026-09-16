import { api } from "../../lib/api-client";
import type { BillingPeriod, CreateBillingPeriodInput, Invoice } from "./types";

export const billingPeriodsApi = {
  list: (branchId?: string) => api.get<BillingPeriod[]>(`/billing-periods${branchId ? `?branchId=${branchId}` : ""}`),
  create: (input: CreateBillingPeriodInput) => api.post<BillingPeriod>("/billing-periods", input),
  generateInvoices: (id: string) => api.post<{ period: BillingPeriod; invoiceCount: number }>(`/billing-periods/${id}/generate-invoices`),
  close: (id: string) => api.post<BillingPeriod>(`/billing-periods/${id}/close`),
};

export const invoicesApi = {
  list: (filter: { branchId?: string; customerId?: string; status?: string } = {}) => {
    const params = new URLSearchParams();
    if (filter.branchId) params.set("branchId", filter.branchId);
    if (filter.customerId) params.set("customerId", filter.customerId);
    if (filter.status) params.set("status", filter.status);
    const qs = params.toString();
    return api.get<Invoice[]>(`/invoices${qs ? `?${qs}` : ""}`);
  },
  issue: (id: string) => api.post<Invoice>(`/invoices/${id}/issue`),
};
