import { api } from "../../../lib/api-client";
import type { Building, CreateBuildingInput, UpdateBuildingInput } from "./types";

export const buildingsApi = {
  list: (branchId?: string) =>
    api.get<Building[]>(`/buildings${branchId ? `?branchId=${branchId}` : ""}`),
  create: (input: CreateBuildingInput) => api.post<Building>("/buildings", input),
  update: (id: string, input: UpdateBuildingInput) => api.patch<Building>(`/buildings/${id}`, input),
};
