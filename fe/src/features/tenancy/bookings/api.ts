import { api } from "../../../lib/api-client";
import type { Booking, CreateBookingInput } from "./types";

export const bookingsApi = {
  list: (filter: { branchId?: string; customerId?: string } = {}) => {
    const params = new URLSearchParams();
    if (filter.branchId) params.set("branchId", filter.branchId);
    if (filter.customerId) params.set("customerId", filter.customerId);
    const qs = params.toString();
    return api.get<Booking[]>(`/bookings${qs ? `?${qs}` : ""}`);
  },
  create: (input: CreateBookingInput) => api.post<Booking>("/bookings", input),
  cancel: (id: string, reason: string) => api.post<Booking>(`/bookings/${id}/cancel`, { reason }),
};
