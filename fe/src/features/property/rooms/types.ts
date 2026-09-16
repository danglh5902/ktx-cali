export interface Room {
  id: string;
  branchId: string;
  buildingId: string;
  floorId: string;
  code: string;
  name: string | null;
  roomTypeId: string | null;
  capacity: number;
  actualBedCount: number;
  hasPrivateToilet: boolean;
  amenities: string[] | null;
  priceOverride: string | null;
  /** Ghi đè giá theo vị trí giường tầng — ưu tiên hơn giá mặc định của loại phòng. */
  bunkLowerPriceOverride: string | null;
  bunkUpperPriceOverride: string | null;
  status: "ACTIVE" | "MAINTENANCE" | "RENOVATING" | "INACTIVE";
}

export interface UpdateRoomPriceInput {
  priceOverride?: string;
  bunkLowerPriceOverride?: string;
  bunkUpperPriceOverride?: string;
}

export interface CreateRoomInput {
  branchId: string;
  buildingId: string;
  floorId: string;
  code: string;
  roomTypeId?: string;
  capacity: number;
  hasPrivateToilet: boolean;
}

export interface BulkCreateRoomsInput {
  branchId: string;
  buildingId: string;
  floorId: string;
  roomTypeId?: string;
  capacity: number;
  codePrefix: string;
  codeFrom: number;
  codeTo: number;
  codePad: number;
}
