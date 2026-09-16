import { api } from "../../../lib/api-client";
import type { CreateRoomTypeInput, RoomType, UpdateRoomTypeInput } from "./types";

export const roomTypesApi = {
  list: (branchId?: string) => api.get<RoomType[]>(`/room-types${branchId ? `?branchId=${branchId}` : ""}`),
  create: (input: CreateRoomTypeInput) => api.post<RoomType>("/room-types", input),
  update: (id: string, input: UpdateRoomTypeInput) => api.patch<RoomType>(`/room-types/${id}`, input),
};
