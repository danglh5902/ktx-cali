export interface Floor {
  id: string;
  branchId: string;
  buildingId: string;
  number: string;
  sortOrder: number;
  name: string | null;
  genderPolicy: "MALE" | "FEMALE" | "MIXED" | null;
  status: "ACTIVE" | "RENOVATING" | "INACTIVE";
}

export interface CreateFloorInput {
  buildingId: string;
  number: string;
  sortOrder: number;
  name?: string;
  genderPolicy?: "MALE" | "FEMALE" | "MIXED";
}

export type UpdateFloorInput = Partial<Omit<CreateFloorInput, "buildingId">>;
