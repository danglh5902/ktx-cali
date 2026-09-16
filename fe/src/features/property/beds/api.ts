import { api } from "../../../lib/api-client";
import type { Bed, BulkCreateBedsInput, UpdateBedStatusInput } from "./types";

export const bedsApi = {
  list: (filter: { branchId?: string; roomId?: string }) => {
    const params = new URLSearchParams();
    if (filter.branchId) params.set("branchId", filter.branchId);
    if (filter.roomId) params.set("roomId", filter.roomId);
    const qs = params.toString();
    return api.get<Bed[]>(`/beds${qs ? `?${qs}` : ""}`);
  },
  bulkCreate: (input: BulkCreateBedsInput) => api.post<Bed[]>("/beds/bulk", input),
  updateStatus: (id: string, input: UpdateBedStatusInput) => api.patch<Bed>(`/beds/${id}/status`, input),
};
