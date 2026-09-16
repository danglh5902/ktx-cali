import { api } from "../../../lib/api-client";
import type { BulkCreateRoomsInput, CreateRoomInput, Room, UpdateRoomPriceInput } from "./types";

export const roomsApi = {
  list: (filter: { branchId?: string; floorId?: string }) => {
    const params = new URLSearchParams();
    if (filter.branchId) params.set("branchId", filter.branchId);
    if (filter.floorId) params.set("floorId", filter.floorId);
    const qs = params.toString();
    return api.get<Room[]>(`/rooms${qs ? `?${qs}` : ""}`);
  },
  create: (input: CreateRoomInput) => api.post<Room>("/rooms", input),
  bulkCreate: (input: BulkCreateRoomsInput) => api.post<Room[]>("/rooms/bulk", input),
  updatePrice: (id: string, input: UpdateRoomPriceInput) => api.patch<Room>(`/rooms/${id}`, input),
};
