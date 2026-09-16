export interface BranchAddress {
  street: string;
  ward?: string;
  district?: string;
  province: string;
}

export interface Branch {
  id: string;
  orgId: string;
  code: string;
  name: string;
  shortName: string | null;
  address: BranchAddress | null;
  region: string | null;
  phone: string | null;
  email: string | null;
  genderPolicy: "MALE" | "FEMALE" | "MIXED";
  billingDayOfMonth: number;
  dueDayOfMonth: number;
  electricityPrice: string | null;
  waterPrice: string | null;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
}

export interface CreateBranchInput {
  code: string;
  name: string;
  shortName?: string;
  address: BranchAddress;
  region?: string;
  phone?: string;
  email?: string;
  genderPolicy: "MALE" | "FEMALE" | "MIXED";
  billingDayOfMonth: number;
  dueDayOfMonth: number;
}

export type UpdateBranchInput = Partial<Omit<CreateBranchInput, "code">>;
