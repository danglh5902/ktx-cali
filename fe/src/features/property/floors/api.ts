import { api } from "../../../lib/api-client";
import type { CreateFloorInput, Floor, UpdateFloorInput } from "./types";

export const floorsApi = {
  list: (buildingId?: string) => api.get<Floor[]>(`/floors${buildingId ? `?buildingId=${buildingId}` : ""}`),
  create: (input: CreateFloorInput) => api.post<Floor>("/floors", input),
  update: (id: string, input: UpdateFloorInput) => api.patch<Floor>(`/floors/${id}`, input),
};
