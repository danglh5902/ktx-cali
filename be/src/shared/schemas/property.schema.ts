import { z } from "zod";
import { vndString } from "./branch.schema.js";

const uuidField = z.string().uuid();

// ---------------------------------------------------------------------------
// Buildings — docs/06-module-property.md §2
// ---------------------------------------------------------------------------

export const createBuildingSchema = z.object({
  branchId: uuidField,
  code: z.string().min(1),
  name: z.string().min(1),
  genderPolicy: z.enum(["MALE", "FEMALE", "MIXED"]).optional(),
  hasElevator: z.boolean().default(false),
  monthlyRentCost: vndString.optional(),
  address: z.string().optional(),
});
export type CreateBuildingInput = z.infer<typeof createBuildingSchema>;

export const updateBuildingSchema = createBuildingSchema
  .omit({ branchId: true, code: true })
  .partial();
export type UpdateBuildingInput = z.infer<typeof updateBuildingSchema>;

// ---------------------------------------------------------------------------
// Floors — docs/06-module-property.md §3
// ---------------------------------------------------------------------------

export const createFloorSchema = z.object({
  buildingId: uuidField,
  // "1", "G", "L"... — chuỗi, không phải số nguyên, xem docs/06 §3.2
  number: z.string().min(1),
  sortOrder: z.number().int().default(0),
  name: z.string().optional(),
  genderPolicy: z.enum(["MALE", "FEMALE", "MIXED"]).optional(),
});
export type CreateFloorInput = z.infer<typeof createFloorSchema>;

export const updateFloorSchema = createFloorSchema.omit({ buildingId: true }).partial();
export type UpdateFloorInput = z.infer<typeof updateFloorSchema>;

// ---------------------------------------------------------------------------
// Room types — docs/06-module-property.md §4.3
// ---------------------------------------------------------------------------

export const createRoomTypeSchema = z.object({
  branchId: uuidField,
  code: z.string().min(1),
  name: z.string().min(1),
  capacity: z.number().int().min(1),
  basePrice: vndString,
  /** Giá mặc định cho giường tầng dưới/trên thuộc loại phòng này — bỏ trống thì dùng basePrice cho cả 2. */
  bunkLowerPrice: vndString.optional(),
  bunkUpperPrice: vndString.optional(),
  wholeRoomPrice: vndString.optional(),
  defaultAmenities: z.array(z.string()).optional(),
  description: z.string().optional(),
});
export type CreateRoomTypeInput = z.infer<typeof createRoomTypeSchema>;

export const updateRoomTypeSchema = createRoomTypeSchema
  .omit({ branchId: true, code: true })
  .partial();
export type UpdateRoomTypeInput = z.infer<typeof updateRoomTypeSchema>;

// ---------------------------------------------------------------------------
// Rooms — docs/06-module-property.md §4
// ---------------------------------------------------------------------------

export const createRoomSchema = z.object({
  branchId: uuidField,
  buildingId: uuidField,
  floorId: uuidField,
  code: z.string().min(1),
  name: z.string().optional(),
  roomTypeId: uuidField.optional(),
  capacity: z.number().int().min(1),
  hasPrivateToilet: z.boolean().default(false),
  amenities: z.array(z.string()).optional(),
  priceOverride: vndString.optional(),
  /** Ghi đè giá giường tầng dưới/trên chỉ cho riêng phòng này — ưu tiên hơn giá mặc định của loại phòng. */
  bunkLowerPriceOverride: vndString.optional(),
  bunkUpperPriceOverride: vndString.optional(),
});
export type CreateRoomInput = z.infer<typeof createRoomSchema>;

export const updateRoomSchema = createRoomSchema
  .omit({ branchId: true, buildingId: true, floorId: true })
  .partial();
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;

/** Tạo hàng loạt phòng cùng loại trong 1 tầng — docs/06 §4.5. */
export const bulkCreateRoomsSchema = z.object({
  branchId: uuidField,
  buildingId: uuidField,
  floorId: uuidField,
  roomTypeId: uuidField.optional(),
  capacity: z.number().int().min(1),
  /** vd "A-3{nn}" với nn chạy từ codeFrom đến codeTo */
  codePrefix: z.string().min(1),
  codeFrom: z.number().int().min(0),
  codeTo: z.number().int().min(0),
  codePad: z.number().int().min(0).default(2),
});
export type BulkCreateRoomsInput = z.infer<typeof bulkCreateRoomsSchema>;

// ---------------------------------------------------------------------------
// Beds — docs/06-module-property.md §5 (đơn vị bán — D1)
// ---------------------------------------------------------------------------

export const bedStatusSchema = z.enum([
  "AVAILABLE",
  "RESERVED",
  "OCCUPIED",
  "CHECKOUT_PENDING",
  "CLEANING",
  "MAINTENANCE",
  "BLOCKED",
]);

export const createBedSchema = z.object({
  branchId: uuidField,
  buildingId: uuidField,
  floorId: uuidField,
  roomId: uuidField,
  code: z.string().min(1),
  label: z.string().optional(),
  bedType: z.enum(["SINGLE", "BUNK_LOWER", "BUNK_UPPER", "DOUBLE"]).default("SINGLE"),
  priceOverride: vndString.optional(),
});
export type CreateBedInput = z.infer<typeof createBedSchema>;

export const updateBedSchema = createBedSchema
  .omit({ branchId: true, buildingId: true, floorId: true, roomId: true })
  .partial();
export type UpdateBedInput = z.infer<typeof updateBedSchema>;

/** Đổi trạng thái theo máy trạng thái — không cho nhảy tùy ý (docs/06 §5.3). */
export const updateBedStatusSchema = z.object({
  status: bedStatusSchema,
  blockedReason: z.string().optional(),
  blockedUntil: z.string().datetime().optional(),
});
export type UpdateBedStatusInput = z.infer<typeof updateBedStatusSchema>;

/**
 * Tạo hàng loạt giường trong 1 phòng — docs/06 §4.5.
 *
 * `bedType: "BUNK_PAIR"` là chế độ nhập liệu riêng cho giường tầng có giá
 * trên/dưới khác nhau (không phải giá trị lưu thật vào cột `bed_type`):
 * mỗi đơn vị trong `count` sinh ra ĐÚNG 2 giường — 1 `BUNK_LOWER` giá
 * `lowerPriceOverride`, 1 `BUNK_UPPER` giá `upperPriceOverride`. Các chế độ
 * còn lại giữ hành vi cũ (1 giường/đơn vị, giá chung `priceOverride` nếu có).
 */
export const bulkCreateBedsSchema = z.object({
  branchId: uuidField,
  buildingId: uuidField,
  floorId: uuidField,
  roomId: uuidField,
  bedType: z.enum(["SINGLE", "BUNK_LOWER", "BUNK_UPPER", "DOUBLE", "BUNK_PAIR"]).default("SINGLE"),
  /** vd "{room}-B{n}" — n chạy từ 1 đến count (mode BUNK_PAIR: hậu tố "D"/"T" tự thêm vào sau n) */
  codePrefix: z.string().min(1),
  count: z.number().int().min(1).max(20),
  /** Dùng cho SINGLE/BUNK_LOWER/BUNK_UPPER/DOUBLE — bỏ trống thì rơi về giá mặc định của phòng/loại phòng. */
  priceOverride: vndString.optional(),
  /** Chỉ dùng khi bedType = "BUNK_PAIR". */
  lowerPriceOverride: vndString.optional(),
  upperPriceOverride: vndString.optional(),
});
export type BulkCreateBedsInput = z.infer<typeof bulkCreateBedsSchema>;
