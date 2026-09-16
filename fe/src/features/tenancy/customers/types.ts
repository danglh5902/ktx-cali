export type CustomerStatus =
  | "PROSPECT"
  | "RESERVED"
  | "ACTIVE"
  | "EXPIRING"
  | "CHECKED_OUT"
  | "CHECKED_OUT_WITH_DEBT"
  | "SUSPENDED"
  | "BLACKLISTED";

export interface EmergencyContact {
  name: string;
  relationship?: string;
  phone: string;
  address?: string;
}

export interface Customer {
  id: string;
  customerCode: string;
  fullName: string;
  dateOfBirth: string | null;
  gender: "MALE" | "FEMALE" | "OTHER";
  idNumber: string | null;
  phone: string;
  email: string | null;
  emergencyContact: EmergencyContact | null;
  occupation: string | null;
  school: string | null;
  company: string | null;
  currentBranchId: string | null;
  currentRoomId: string | null;
  currentBedId: string | null;
  currentContractId: string | null;
  creditBalance: string;
  status: CustomerStatus;
  isBlacklisted: boolean;
  blacklistReason: string | null;
  createdAt: string;
}

export interface CreateCustomerInput {
  branchId: string;
  fullName: string;
  dateOfBirth?: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  idType?: "CCCD" | "CMND" | "PASSPORT" | "BIRTH_CERT";
  idNumber?: string;
  phone: string;
  email?: string;
  emergencyContact: EmergencyContact;
  occupation?: "STUDENT" | "EMPLOYEE" | "OTHER";
  school?: string;
  company?: string;
  source?: string;
}
