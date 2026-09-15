# 06 — Module Tài sản BĐS: Chi nhánh · Tòa nhà · Tầng · Phòng · Giường

---

## 1. Chi nhánh (Branch)

### 1.1 Mục đích
Chi nhánh là **ranh giới phân quyền, ranh giới báo cáo và ranh giới cấu hình** của toàn hệ thống. Mọi dữ liệu nghiệp vụ đều thuộc về đúng một chi nhánh.

### 1.2 Dữ liệu

| Nhóm | Trường | Ghi chú |
|---|---|---|
| **Định danh** | `code` | Mã ngắn, viết hoa, vd `TD`, `BT`, `Q12`. **Bất biến sau khi tạo** — vì dùng làm tiền tố cho mã phòng, số hợp đồng, số hóa đơn |
| | `name` | "Cali Thủ Đức" |
| | `shortName` | Hiển thị trên báo cáo hẹp |
| **Liên hệ** | `address` (số nhà, phường, quận, tỉnh) | Tách trường để lọc theo quận/tỉnh |
| | `geo: {lat, lng}` | Hiển thị bản đồ, tính khoảng cách tới trường/KCN |
| | `phone`, `email`, `zaloOA` | |
| **Quản lý** | `managerId` | Trỏ tới user. Người chịu trách nhiệm chính |
| | `region` | Vùng — **chuẩn bị sẵn dù chưa dùng**, để sau này gom báo cáo theo vùng |
| **Vận hành** | `openingHours` | Giờ tiếp khách của quầy |
| | `curfewTime` | Giờ đóng cổng (nếu có) — đặc thù KTX sinh viên |
| | `genderPolicy` | `MALE` / `FEMALE` / `MIXED` |
| | `status` | `ACTIVE` / `INACTIVE` / `ARCHIVED` |
| | `openedAt`, `closedAt` | |
| **Cấu hình tài chính** | `billingDayOfMonth` | Ngày chốt kỳ (vd 28) |
| | `dueDayOfMonth` | Hạn thanh toán (vd ngày 10) |
| | `lateFeePolicy` | Phí trễ hạn: mức, ngày ân hạn |
| | `depositPolicy` | Số tháng cọc mặc định, thời hạn hoàn cọc sau trả phòng |
| | `approvalLimits` | Hạn mức duyệt giảm giá/hoàn cọc/chi phí |
| | `electricityPrice`, `waterPrice` | Đơn giá, có lịch sử thay đổi |
| | `utilityBillingMode` | Theo đồng hồ / theo đầu người / bao trọn gói |
| **Hiển thị** | `images[]`, `description`, `amenities[]` | Dùng cho trang giới thiệu và tư vấn khách |
| | `notes` | Ghi chú nội bộ |
| **Hệ thống** | `orgId`, `createdAt/By`, `updatedAt/By`, `deletedAt` | |

### 1.3 Thao tác
| Thao tác | Ai | Ghi chú |
|---|---|---|
| Tạo chi nhánh | Super Admin | Bắt buộc tạo kèm ít nhất 1 tòa nhà |
| **Nhân bản cấu hình từ chi nhánh mẫu** | Super Admin | Copy bảng giá, dịch vụ, nội quy, loại phòng. Rút onboarding từ vài ngày xuống vài giờ |
| Sửa thông tin | Super Admin, Branch Manager (chi nhánh mình) | `code` không sửa được |
| Cấu hình giá/dịch vụ/nội quy | Branch Manager (đề xuất) + duyệt | |
| Tạm ngừng hoạt động | Super Admin | Chặn booking mới, giữ nguyên hợp đồng đang chạy |
| Lưu trữ (Archive) | Super Admin | **Không xóa vật lý.** Xem edge case |

### 1.4 Workflow — Mở chi nhánh mới
```
1. Super Admin tạo chi nhánh (mã, tên, địa chỉ)
2. Chọn "Nhân bản cấu hình từ" → chọn chi nhánh mẫu
   → copy: loại phòng, bảng giá, danh mục dịch vụ, nội quy, template hợp đồng, cấu hình SLA
3. Điều chỉnh giá theo vị trí mới
4. Tạo tòa nhà → tầng → phòng → giường (hoặc import Excel)
5. Gán Branch Manager + nhân viên
6. Kiểm tra: bảng giá đã có? dịch vụ đã có? nội quy đã có? → mới cho phép ACTIVE
```

### 1.5 Quyền
Xem [04-roles-permissions.md](04-roles-permissions.md) dòng 1–7, 16–19.

### 1.6 Edge case
| Tình huống | Xử lý |
|---|---|
| **Xóa chi nhánh còn dữ liệu** | Chặn. Chỉ cho `ARCHIVED` khi: 0 hợp đồng đang hoạt động, 0 công nợ, 0 cọc chưa hoàn. Dữ liệu lịch sử giữ vĩnh viễn để tra cứu và kiểm toán |
| **Đổi mã chi nhánh** | Không cho. Mã đã đi vào số hóa đơn và mã phòng. Nếu thật sự cần (đổi tên thương hiệu) → tạo chi nhánh mới, chuyển dữ liệu, archive cái cũ |
| **Chuyển tòa nhà từ chi nhánh A sang B** | Nghiệp vụ hiếm nhưng có thật (tách chi nhánh khi mở rộng). Cần công cụ riêng: chuyển tòa + phòng + giường + hợp đồng đang chạy + lịch sử. Ghi audit chi tiết. Không cho làm qua UI thường |
| **Chi nhánh tạm ngừng nhưng còn khách đang ở** | Cho phép trạng thái `INACTIVE`: chặn booking mới, vẫn sinh hóa đơn và thu tiền bình thường |
| **Hai chi nhánh cùng tên khác quận** | Cho phép — `code` mới là khóa duy nhất |

---

## 2. Tòa nhà (Building)

### 2.1 Mục đích
Đơn vị vật lý. **Chi phí thuê mặt bằng và điện tổng gắn ở đây** — đây là lý do quan trọng nhất để tòa nhà là một cấp riêng, vì không có nó thì không tính được lãi lỗ chính xác.

### 2.2 Dữ liệu
| Trường | Ghi chú |
|---|---|
| `code`, `name` | vd `A`, "Tòa A" — unique theo `branchId` |
| `floorCount` | Số tầng (dẫn xuất từ bản ghi `floors`, lưu để hiển thị nhanh) |
| `genderPolicy` | `MALE` / `FEMALE` / `MIXED` — **hệ thống phải chặn xếp sai giới** |
| `status` | `ACTIVE` / `RENOVATING` / `INACTIVE` |
| `amenities[]` | Thang máy · máy giặt chung · bếp chung · phòng sinh hoạt · hầm để xe · camera |
| `hasElevator` | Ảnh hưởng giá tầng cao |
| `monthlyRentCost` | Chi phí thuê mặt bằng/tháng — đầu vào cho P&L |
| `mainMeterId` | Đồng hồ điện tổng, dùng đối chiếu với tổng chỉ số các phòng |
| `address` | Nếu khác địa chỉ chi nhánh |
| `images[]`, `notes` | |

### 2.3 Thao tác
Tạo · sửa · đổi trạng thái · gán chi phí vận hành · xem danh sách tầng · xem tỷ lệ lấp đầy theo tòa.

### 2.4 Workflow — Cải tạo tòa nhà
```
Đặt tòa → RENOVATING
  → Chặn booking mới cho toàn bộ giường trong tòa
  → Giường trống chuyển BLOCKED
  → Giường đang có khách: KHÔNG tự động đuổi, hiển thị cảnh báo để quản lý lên kế hoạch chuyển
  → Khi xong: mở lại, giường về CLEANING (không về AVAILABLE thẳng)
```

### 2.5 Edge case
| Tình huống | Xử lý |
|---|---|
| **Tòa có tầng trệt không có phòng ở** | Cho phép tầng có 0 phòng |
| **Đồng hồ tổng lệch tổng các phòng** | Hiển thị chênh lệch trong báo cáo điện nước. Chênh lệch lớn = rò rỉ hoặc câu trộm điện. Đây là tính năng có giá trị thật nhưng hay bị bỏ qua |
| **Chi nhánh chỉ có 1 tòa** | Vẫn bắt buộc tạo bản ghi tòa. UI có thể ẩn cấp này cho gọn, nhưng dữ liệu phải có |
| **Tòa nhà chung nhiều chủ (thuê 3 tầng của 1 tòa)** | Tạo tòa nhà là 3 tầng đó. Không mô hình hóa phần không thuê |

---

## 3. Tầng (Floor)

### 3.1 Mục đích
Đơn vị để: vẽ sơ đồ, phân công vệ sinh, đi ghi chỉ số điện nước, áp quy định giới tính theo tầng.

### 3.2 Dữ liệu
| Trường | Ghi chú |
|---|---|
| `number` | **Kiểu chuỗi**, không phải số nguyên — nhiều tòa VN không có tầng 4/13; có tầng `G`, `L`, `M` |
| `sortOrder` | Số nguyên để sắp xếp đúng |
| `name` | "Tầng 3", "Tầng lửng" |
| `genderPolicy` | Override của tòa |
| `status` | `ACTIVE` / `RENOVATING` / `INACTIVE` |
| `roomCount` | Dẫn xuất |
| `layoutImage` | Ảnh sơ đồ mặt bằng — hữu ích cho nhân viên mới và khách xem phòng |
| `notes` | |

### 3.3 Thao tác
Tạo · sửa · sắp xếp lại · xem sơ đồ · xem tỷ lệ lấp đầy theo tầng · phân công vệ sinh theo tầng.

### 3.4 Edge case
| Tình huống | Xử lý |
|---|---|
| **Tòa không có tầng 4** | `number` là chuỗi nên chỉ cần không tạo. `sortOrder` vẫn liên tục |
| **Tầng lửng / tầng trệt** | Dùng `number = "G"`, `sortOrder = 0` |
| **Đổi quy định giới tính của tầng khi đang có khách** | Cảnh báo danh sách khách không phù hợp, cho phép đặt hiệu lực từ ngày tương lai, không ép chuyển ngay |

---

## 4. Phòng (Room)

### 4.1 Mục đích
Đơn vị vật lý chứa giường. Nơi gắn đồng hồ điện nước, tài sản, tiện ích.

### 4.2 Dữ liệu

| Nhóm | Trường | Ghi chú |
|---|---|---|
| **Định danh** | `code` | `A-301` — unique theo `branchId`, không unique toàn hệ thống |
| | `name` | Tên gọi thân thiện nếu có |
| **Phân loại** | `roomTypeId` | Loại phòng: 4 người có điều hòa, 6 người quạt, phòng đôi... |
| | `capacity` | Sức chứa tối đa cho phép — dùng để **chặn** vượt số người |
| | `actualBedCount` | Số giường thực tế (dẫn xuất từ bản ghi `beds`) |
| | `areaM2` | Diện tích — dùng cho định giá và kiểm tra quy định |
| **Giá** | `priceOverride` | Ghi đè giá của loại phòng. `null` = dùng giá loại phòng |
| | `wholeRoomPrice` | Giá thuê nguyên phòng (thường rẻ hơn tổng giá giường) |
| **Tiện ích** | `amenities[]` | Danh sách có cấu trúc: `AIR_CON`, `PRIVATE_TOILET`, `WATER_HEATER`, `BALCONY`, `WARDROBE`, `DESK`, `FRIDGE`, `WASHING_MACHINE`, `WINDOW`, `FAN`, `TV` |
| | `hasPrivateToilet` | Tách riêng vì đây là yếu tố quyết định giá lớn nhất |
| | `direction` | Hướng phòng — khách VN quan tâm |
| **Trạng thái** | `status` | `ACTIVE` / `MAINTENANCE` / `RENOVATING` / `INACTIVE` |
| **Điện nước** | `electricMeterId`, `waterMeterId` | Có thể `null` nếu dùng đồng hồ chung |
| | `sharedMeterGroupId` | Khi nhiều phòng chung 1 đồng hồ |
| **Hiển thị** | `images[]` | Ảnh phòng — dùng khi tư vấn khách từ xa |
| | `notes` | |

### 4.3 Loại phòng (RoomType) — bảng riêng
| Trường | Ghi chú |
|---|---|
| `branchId` | Loại phòng định nghĩa **theo chi nhánh**, không dùng chung toàn hệ thống |
| `code`, `name` | "P4-DH" — "Phòng 4 người có điều hòa" |
| `capacity` | |
| `basePrice` | Giá giường cơ bản |
| `defaultAmenities[]` | Tiện ích mặc định khi tạo phòng mới |
| `description` | |

### 4.4 Thao tác
| Thao tác | Ghi chú |
|---|---|
| Tạo phòng | Có thể tạo hàng loạt: "tạo phòng 301–310 thuộc tầng 3, loại P4-DH" — **tính năng tiết kiệm rất nhiều thời gian khi onboard** |
| Sửa thông tin/tiện ích | |
| Đổi trạng thái | `MAINTENANCE` tự động chặn booking mới |
| Thêm/bớt giường | Không giảm dưới số giường đang có người ở |
| Gán đồng hồ | |
| Xem lịch sử | Ai từng ở, sự cố đã xảy ra, tài sản trong phòng |

### 4.5 Workflow — Tạo hàng loạt khi onboard chi nhánh
```
Chọn tầng → "Tạo phòng hàng loạt"
  Mẫu mã phòng: A-3{nn}       (nn = 01..10)
  Loại phòng:   P4-DH
  Số giường/phòng: 4
  Mẫu mã giường: {room}-B{n}  (n = 1..4)
→ Xem trước danh sách 10 phòng, 40 giường
→ Xác nhận → tạo
```

### 4.6 Edge case
| Tình huống | Xử lý |
|---|---|
| **Giảm số giường khi đang có khách** | Chặn. Phải chuyển khách đi trước |
| **Đổi loại phòng khi đang có hợp đồng** | Cho phép (để sửa dữ liệu nhập sai), nhưng **không ảnh hưởng giá hợp đồng đang chạy** vì giá đã snapshot |
| **Phòng chung đồng hồ với phòng khác** | `sharedMeterGroupId` + quy tắc chia: theo đầu người hoặc theo tỷ lệ cố định. Quy tắc phải ghi rõ trên hóa đơn |
| **Đổi mã phòng** | Cho phép (sửa lỗi nhập), nhưng hóa đơn cũ giữ mã cũ nhờ snapshot. Ghi audit |
| **Phòng có số giường khác `capacity`** | Hợp lệ. `capacity` là trần, số bản ghi `beds` là thực tế |
| **Phòng đang bảo trì nhưng có booking cho tháng sau** | Cho phép. Chỉ chặn **check-in** khi vẫn còn `MAINTENANCE` tại ngày đó |

---

## 5. Giường (Bed) — đơn vị bán

### 5.1 Mục đích
Đơn vị tồn kho. Mọi hợp đồng, mọi tính toán lấp đầy, mọi doanh thu tiền phòng đều quy về giường.

### 5.2 Dữ liệu
| Trường | Ghi chú |
|---|---|
| `code` | `A-301-B2` — unique theo `branchId` |
| `label` | "Giường tầng dưới, cạnh cửa sổ" — giúp lễ tân tư vấn |
| `bedType` | `SINGLE` / `BUNK_LOWER` / `BUNK_UPPER` / `DOUBLE` |
| `priceOverride` | Giường tầng dưới thường đắt hơn 100–200k. `null` = dùng giá phòng |
| `status` | 7 trạng thái, xem [03-org-model.md §3.1](03-org-model.md) |
| `currentAssignmentId` | Trỏ tới assignment đang hiệu lực — denormalize để hiển thị sơ đồ nhanh |
| `branchId`, `buildingId`, `floorId`, `roomId` | **Tất cả denormalized** — để vẽ sơ đồ và kiểm tra phân quyền bằng 1 truy vấn |
| `blockedReason`, `blockedUntil` | Khi `BLOCKED` |
| `notes` | |

### 5.3 Thao tác
| Thao tác | Ghi chú |
|---|---|
| Tạo giường (đơn lẻ / hàng loạt) | |
| Đặt giá riêng | Ghi audit (thuộc nhóm thay đổi giá) |
| Đổi trạng thái | Theo máy trạng thái, không cho nhảy tùy ý |
| Khóa giường (`BLOCKED`) | Bắt buộc nhập lý do và thời hạn dự kiến |
| **Xem lịch sử người ở** | Từ `bed_assignments` — ai, từ ngày nào đến ngày nào, hợp đồng nào |
| Kiểm tra khả dụng trong khoảng thời gian | `isAvailableForPeriod(bedId, from, to)` |

### 5.4 Hàm khả dụng — thiết kế quan trọng

```ts
// SAI: chỉ nhìn trạng thái hiện tại
if (bed.status === 'AVAILABLE') { /* cho đặt */ }

// ĐÚNG: kiểm tra xung đột trong khoảng thời gian cần
async function isAvailableForPeriod(bedId, from, to) {
  // 1. Có assignment nào giao với khoảng này không?
  // 2. Có booking đang giữ chỗ nào giao với khoảng này không?
  // 3. Có lịch bảo trì/khóa nào giao với khoảng này không?
  // Chỉ khi cả 3 đều không → khả dụng
}
```

Lý do: giường đang `MAINTENANCE` hôm nay vẫn nhận được booking cho tháng sau. Giường `OCCUPIED` có hợp đồng hết ngày 31/10 thì từ 01/11 bán được. Nếu chỉ nhìn `status`, hệ thống sẽ từ chối những giao dịch hoàn toàn hợp lệ và làm mất doanh thu.

### 5.5 Quy tắc chống bán trùng

Ba lớp bảo vệ:
1. **Kiểm tra logic** — `isAvailableForPeriod` trước khi tạo booking/assignment
2. **Transaction** — tạo assignment và đổi trạng thái giường trong cùng transaction
3. **Ràng buộc dữ liệu** — unique partial index đảm bảo một giường chỉ có tối đa 1 assignment đang mở:
   ```
   db.bed_assignments.createIndex(
     { bedId: 1 },
     { unique: true, partialFilterExpression: { endDate: null } }
   )
   ```
   Lớp này bắt được cả trường hợp race condition mà logic bỏ sót.

### 5.6 Edge case
| Tình huống | Xử lý |
|---|---|
| **Hai lễ tân cùng nhận cọc một giường** | Unique index chặn. Người thứ hai nhận lỗi rõ ràng: "Giường vừa được giữ bởi [tên], lúc [giờ]" |
| **Xóa giường đang có người ở** | Chặn |
| **Giường `CLEANING` quá 24h** | Cảnh báo trên dashboard quản lý |
| **Giường `MAINTENANCE` quá thời hạn dự kiến** | Cảnh báo — đây là doanh thu đang mất |
| **Trạng thái giường lệch thực tế** | Job nightly reconcile: so `beds.status` với `bed_assignments` + `maintenance_tickets` + `bookings`, báo cáo danh sách lệch cho quản lý chi nhánh |
| **Đổi giá giường khi khách đang ở** | Cho phép — nhưng chỉ áp cho hợp đồng ký **sau** thời điểm đổi. Hợp đồng hiện tại giữ giá snapshot |
| **Khách muốn đổi từ giường tầng trên xuống tầng dưới (đắt hơn) giữa tháng** | Đóng assignment cũ, mở assignment mới với giá mới. Hóa đơn kỳ đó tự prorate 2 mức giá |
| **Giường bị hỏng khi khách đang ở** | Tạo ticket. Nếu không ở được → chuyển khách sang giường khác (assignment mới) và xem xét giảm giá cho những ngày bất tiện |

---

## 6. Import dữ liệu ban đầu

**Đây là tính năng quyết định hệ thống có được dùng thật hay không.** Nếu nhân viên phải nhập tay 500 giường và 400 khách, họ sẽ bỏ cuộc và quay lại Excel.

### 6.1 Các file import cần hỗ trợ
| File | Nội dung | Thứ tự |
|---|---|---|
| 1. Cấu trúc BĐS | Tòa, tầng, phòng, giường | Trước tiên |
| 2. Khách thuê | Hồ sơ cá nhân | Thứ hai |
| 3. Hợp đồng đang chạy | Khách + giường + giá + ngày + cọc | Thứ ba |
| 4. Công nợ hiện tại | Số dư nợ theo khách tại ngày chuyển đổi | Thứ tư |
| 5. Chỉ số điện nước kỳ gần nhất | Làm chỉ số đầu kỳ cho kỳ đầu tiên | Thứ năm |

### 6.2 Quy trình import
```
Tải file mẫu Excel (có sẵn cột đúng, có ghi chú giải thích)
  → Người dùng điền / dán dữ liệu từ file hiện tại
  → Upload
  → Hệ thống kiểm tra: định dạng, trùng lặp, tham chiếu không tồn tại, logic sai
  → Hiển thị bảng kết quả: N dòng hợp lệ · M dòng lỗi (kèm lý do từng dòng)
  → Cho phép tải về file lỗi để sửa và upload lại
  → Xác nhận → import trong transaction
  → Sinh báo cáo đối chiếu: tổng số giường, tổng hợp đồng, tổng công nợ
```

**Bắt buộc:** báo cáo đối chiếu sau import để người dùng so với số liệu cũ của họ. Không có bước này thì không ai dám tin hệ thống.
