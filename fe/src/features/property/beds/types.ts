export type BedStatus =
  | "AVAILABLE"
  | "RESERVED"
  | "OCCUPIED"
  | "CHECKOUT_PENDING"
  | "CLEANING"
  | "MAINTENANCE"
  | "BLOCKED";

export interface Bed {
  id: string;
  branchId: string;
  buildingId: string;
  floorId: string;
  roomId: string;
  code: string;
  label: string | null;
  bedType: "SINGLE" | "BUNK_LOWER" | "BUNK_UPPER" | "DOUBLE";
  priceOverride: string | null;
  /** Giá đã tính theo thứ tự ưu tiên bed > phòng > loại phòng — xem be/src/modules/beds/bed-price.ts. */
  effectivePrice?: string | null;
  status: BedStatus;
  currentAssignmentId: string | null;
  blockedReason: string | null;
  blockedUntil: string | null;
}

export interface BulkCreateBedsInput {
  branchId: string;
  buildingId: string;
  floorId: string;
  roomId: string;
  bedType: Bed["bedType"] | "BUNK_PAIR";
  codePrefix: string;
  count: number;
  priceOverride?: string;
  lowerPriceOverride?: string;
  upperPriceOverride?: string;
}

export interface UpdateBedStatusInput {
  status: BedStatus;
  blockedReason?: string;
}
