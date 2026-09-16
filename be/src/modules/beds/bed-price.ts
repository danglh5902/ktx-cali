import type { RoomRow } from "../rooms/room.repository.js";
import type { RoomTypeRow } from "../room-types/room-type.repository.js";
import type { BedRow } from "./bed.repository.js";

/**
 * Giá hiệu lực của 1 giường — thứ tự ưu tiên (cao → thấp):
 *   1. `bed.priceOverride` — ghi đè riêng cho đúng giường này.
 *   2. Với giường tầng (BUNK_LOWER/BUNK_UPPER): `room.bunkLower/UpperPriceOverride`
 *      rồi tới `roomType.bunkLower/UpperPrice`.
 *   3. Với giường thường (SINGLE/DOUBLE): `room.priceOverride`.
 *   4. `roomType.basePrice` — mặc định cuối cùng.
 * Trả về `null` nếu không có giá nào áp dụng được (chưa gắn loại phòng và
 * chưa override gì cả) — người tạo hợp đồng vẫn phải tự nhập giá thủ công.
 */
export function resolveBedPrice(bed: BedRow, room: RoomRow | null, roomType: RoomTypeRow | null): bigint | null {
  if (bed.priceOverride !== null) return bed.priceOverride;

  if (bed.bedType === "BUNK_LOWER") {
    if (room?.bunkLowerPriceOverride != null) return room.bunkLowerPriceOverride;
    if (roomType?.bunkLowerPrice != null) return roomType.bunkLowerPrice;
  } else if (bed.bedType === "BUNK_UPPER") {
    if (room?.bunkUpperPriceOverride != null) return room.bunkUpperPriceOverride;
    if (roomType?.bunkUpperPrice != null) return roomType.bunkUpperPrice;
  } else if (room?.priceOverride != null) {
    return room.priceOverride;
  }

  return roomType?.basePrice ?? null;
}
