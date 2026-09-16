export interface RoomType {
  id: string;
  branchId: string;
  code: string;
  name: string;
  capacity: number;
  basePrice: string;
  /** Giá mặc định theo vị trí giường tầng — null thì dùng basePrice cho cả trên lẫn dưới. */
  bunkLowerPrice: string | null;
  bunkUpperPrice: string | null;
  wholeRoomPrice: string | null;
  defaultAmenities: string[] | null;
  description: string | null;
  status: "ACTIVE" | "INACTIVE";
}

export interface CreateRoomTypeInput {
  branchId: string;
  code: string;
  name: string;
  capacity: number;
  basePrice: string;
  bunkLowerPrice?: string;
  bunkUpperPrice?: string;
  wholeRoomPrice?: string;
  description?: string;
}

export type UpdateRoomTypeInput = Partial<Omit<CreateRoomTypeInput, "branchId" | "code">>;
