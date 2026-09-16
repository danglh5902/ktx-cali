export interface Building {
  id: string;
  orgId: string;
  branchId: string;
  code: string;
  name: string;
  genderPolicy: "MALE" | "FEMALE" | "MIXED" | null;
  hasElevator: boolean;
  monthlyRentCost: string | null;
  address: string | null;
  status: "ACTIVE" | "RENOVATING" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

export interface CreateBuildingInput {
  branchId: string;
  code: string;
  name: string;
  genderPolicy?: "MALE" | "FEMALE" | "MIXED";
  hasElevator: boolean;
  monthlyRentCost?: string;
  address?: string;
}

export type UpdateBuildingInput = Partial<Omit<CreateBuildingInput, "branchId" | "code">>;
