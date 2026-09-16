import { api } from "../../../lib/api-client";
import type { Branch, CreateBranchInput, UpdateBranchInput } from "./types";

export const branchesApi = {
  list: () => api.get<Branch[]>("/branches"),
  getById: (id: string) => api.get<Branch>(`/branches/${id}`),
  create: (input: CreateBranchInput) => api.post<Branch>("/branches", input),
  update: (id: string, input: UpdateBranchInput) => api.patch<Branch>(`/branches/${id}`, input),
  archive: (id: string) => api.post<Branch>(`/branches/${id}/archive`),
};
