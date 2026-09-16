export type ContractStatus = "DRAFT" | "PENDING_APPROVAL" | "ACTIVE" | "EXPIRING" | "EXPIRED" | "TERMINATED" | "CANCELLED";

export interface Contract {
  id: string;
  branchId: string;
  contractNo: string;
  customerId: string;
  bookingId: string | null;
  bedIds: string[];
  startDate: string;
  endDate: string;
  durationMonths: number | null;
  monthlyRent: string;
  depositAmount: string;
  depositMonths: number | null;
  billingCycle: "MONTHLY" | "QUARTERLY" | "SEMESTER" | "YEARLY";
  electricityPrice: string | null;
  waterPrice: string | null;
  status: ContractStatus;
  terminatedAt: string | null;
  terminationReason: string | null;
  terminationType: string | null;
}

export interface CreateContractInput {
  branchId: string;
  customerId: string;
  bookingId?: string;
  bedIds: string[];
  startDate: string;
  endDate: string;
  durationMonths?: number;
  monthlyRent: string;
  depositAmount: string;
  depositMonths?: number;
  billingCycle: "MONTHLY" | "QUARTERLY" | "SEMESTER" | "YEARLY";
  termsSnapshot: string;
}

export interface CheckOutContractInput {
  terminationType: "MUTUAL" | "BY_TENANT" | "BY_LANDLORD" | "ABANDONMENT";
  terminationReason?: string;
  checkOutDate: string;
}
