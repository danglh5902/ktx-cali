# 10 — Module Vận hành: Bảo trì · Tài sản · Vệ sinh · Nội quy · Khách ra vào · Nhân viên · Thông báo · Báo cáo

---

## 1. Bảo trì & Sự cố (Maintenance Tickets)

### 1.1 Mục đích
Chuyển việc báo hỏng từ Zalo (chìm, không truy vết, không SLA) sang quy trình có trách nhiệm và thời hạn.

### 1.2 Dữ liệu
| Nhóm | Trường | Ghi chú |
|---|---|---|
| **Định danh** | `ticketNo`, `branchId` | `TK-TD-2026-0891` |
| **Vị trí** | `buildingId`, `floorId`, `roomId`, `bedId` | Cấp nào cũng được, tùy sự cố |
| | `assetId` | Nếu hỏng tài sản cụ thể (điều hòa số hiệu X) |
| **Nội dung** | `category` | Xem §1.3 |
| | `title`, `description` | |
| | `attachments[]` | **Ảnh/video từ người báo — quan trọng nhất.** Kỹ thuật biết mang gì trước khi đi |
| **Ưu tiên** | `priority` | `URGENT` / `HIGH` / `NORMAL` / `LOW` |
| | `slaDeadline` | Tính tự động từ priority + cấu hình chi nhánh |
| | `slaBreached`, `slaBreachedAt` | |
| **Xử lý** | `reportedBy`, `reportedAt` | Khách hoặc nhân viên |
| | `assignedTo`, `assignedAt`, `assignedBy` | |
| | `startedAt`, `resolvedAt`, `closedAt` | |
| | `resolution` | Đã làm gì |
| | `resolutionAttachments[]` | Ảnh sau khi sửa |
| **Chi phí** | `laborCost`, `partsCost`, `totalCost` | |
| | `chargeToTenant`, `chargedInvoiceId` | Nếu do khách làm hỏng → tính vào hóa đơn |
| | `expenseId` | Nếu Cali chịu → ghi vào chi phí vận hành |
| **Trạng thái** | `status` | Xem [03-org-model.md §3.6](03-org-model.md) |
| | `pausedDuration` | Tổng thời gian ở trạng thái chờ — **trừ khỏi SLA** |

### 1.3 Danh mục sự cố & SLA đề xuất

| Loại | Ví dụ | Ưu tiên mặc định | SLA phản hồi | SLA hoàn thành |
|---|---|---|---|---|
| **Điện** | Mất điện, chập, ổ cắm hỏng | URGENT | 30 phút | 4 giờ |
| **Nước** | Vỡ ống, không có nước, rò rỉ | URGENT | 30 phút | 4 giờ |
| **An ninh** | Hỏng khóa cửa, hỏng cổng | URGENT | 30 phút | 4 giờ |
| **Điều hòa** | Không lạnh, chảy nước, kêu to | HIGH | 2 giờ | 24 giờ |
| **Nóng lạnh** | Không nóng | HIGH | 2 giờ | 24 giờ |
| **Wifi/Internet** | Mất mạng, chậm | HIGH | 2 giờ | 24 giờ |
| **Vệ sinh** | Tắc cống, bẩn khu chung | NORMAL | 4 giờ | 24 giờ |
| **Nội thất** | Giường lung lay, tủ hỏng, bàn gãy | NORMAL | 8 giờ | 72 giờ |
| **Thiết bị chung** | Máy giặt, cây nước | NORMAL | 8 giờ | 72 giờ |
| **Khác** | | LOW | 24 giờ | 7 ngày |

**Quan trọng:** SLA **không đếm** thời gian ở `WAITING_PARTS` / `WAITING_TENANT`. Nếu đếm, kỹ thuật bị phạt oan vì lý do ngoài tầm kiểm soát, và họ sẽ ngừng dùng hệ thống.

### 1.4 Workflow
```
Khách báo qua portal / Zalo / gặp lễ tân
  → Ticket OPEN
  → Hệ thống tự gán priority theo category, tính slaDeadline
  → Thông báo cho Branch Manager + Kỹ thuật trực
  → Phân công (thủ công, hoặc tự động nếu chỉ có 1 kỹ thuật) → ASSIGNED
  → Kỹ thuật nhận trên điện thoại, đến nơi → IN_PROGRESS
  → Xử lý; nếu thiếu vật tư → WAITING_PARTS (dừng đồng hồ SLA)
  → Sửa xong, chụp ảnh → RESOLVED
  → Ghi chi phí → tạo expense (Cali chịu) hoặc invoice line (khách chịu)
  → Khách xác nhận / 48h tự động → CLOSED
```

**Escalate tự động:**
- Quá 50% SLA chưa ai nhận → nhắc lại người được giao
- Quá 100% SLA → thông báo Branch Manager
- Quá 150% SLA → thông báo Owner

### 1.5 Ai chịu chi phí?
| Nguyên nhân | Ai chịu | Xử lý |
|---|---|---|
| Hao mòn tự nhiên | Cali | `expenses` |
| Lỗi thiết bị | Cali (hoặc bảo hành) | `expenses`, kiểm tra `asset.warrantyUntil` |
| Khách làm hỏng | Khách | Dòng hóa đơn `DAMAGE` hoặc trừ cọc |
| Không xác định được | Cali | `expenses`, ghi chú |

Quyết định này cần Branch Manager, không để kỹ thuật tự quyết.

### 1.6 Edge case
| Tình huống | Xử lý |
|---|---|
| **Nhiều khách báo cùng một sự cố** | Gộp ticket (`mergedIntoTicketId`), thông báo tất cả người báo khi xong |
| **Sự cố lặp lại nhiều lần trên cùng tài sản** | Cảnh báo: "Điều hòa P301 đã sửa 4 lần/6 tháng" → gợi ý thay mới. Đây là dữ liệu hữu ích cho quyết định đầu tư |
| **Khách không cho vào phòng** | `WAITING_TENANT`, dừng SLA, nhắc khách hẹn lịch |
| **Sự cố khiến phòng không ở được** | Chuyển khách sang giường khác (assignment mới) + xem xét giảm giá những ngày bất tiện |
| **Kỹ thuật nghỉ việc còn ticket đang xử lý** | Quy trình offboarding tự động gán lại cho người khác |
| **Khách báo sự cố nhưng thực ra do khách dùng sai** | Ticket `RESOLVED` với ghi chú hướng dẫn, không tính phí lần đầu, lần sau tính |

---

## 2. Tài sản (Assets)

### 2.1 Mục đích
Biết mỗi phòng có gì, tình trạng ra sao, ai làm hỏng, khi nào cần thay. Là nền tảng cho biên bản kiểm kê check-in/check-out.

### 2.2 Dữ liệu
| Trường | Ghi chú |
|---|---|
| `assetCode` | `TS-TD-000891` — dán nhãn/QR lên tài sản thật |
| `name`, `category` | Điều hòa / Tủ lạnh / Máy giặt / Giường / Nệm / Tủ / Bàn / Ghế / Quạt / Camera / Router / Bình nóng lạnh |
| `brand`, `model`, `serialNumber` | |
| **Vị trí** `branchId`, `buildingId`, `floorId`, `roomId`, `bedId` | Cấp nào cũng được |
| `locationType` | `ROOM` / `COMMON_AREA` / `STORAGE` |
| `purchaseDate`, `purchasePrice`, `supplier` | |
| `warrantyUntil` | **Cảnh báo trước khi hết bảo hành** — tiết kiệm chi phí thật |
| `depreciationMethod`, `usefulLifeMonths`, `currentBookValue` | Khấu hao đường thẳng là đủ |
| `condition` | `NEW` / `GOOD` / `FAIR` / `POOR` / `BROKEN` |
| `status` | `IN_USE` / `IN_REPAIR` / `IN_STORAGE` / `DISPOSED` / `LOST` |
| `images[]` | |
| `qrCode` | Quét để xem lịch sử ngay tại hiện trường |
| `notes` | |

**`asset_events`** (lịch sử — append only)
| `eventType` | `PURCHASED` / `ASSIGNED` / `MOVED` / `REPAIRED` / `INSPECTED` / `DAMAGED` / `DISPOSED` / `LOST` |
| kèm | `at`, `by`, `fromLocation`, `toLocation`, `cost`, `note`, `ticketId`, `attachments[]` |

### 2.3 Kiểm kê tài sản trong check-in/check-out

Đây là điểm kết nối quan trọng nhất của module này:

```
CHECK-IN — Biên bản bàn giao phòng A-301
┌────────────────────┬──────────┬────────────┬──────────┐
│ Tài sản            │ Số lượng │ Tình trạng │ Ghi chú  │
├────────────────────┼──────────┼────────────┼──────────┤
│ Điều hòa (TS-0231) │    1     │ Tốt        │          │
│ Giường (TS-0412)   │    1     │ Tốt        │          │
│ Nệm                │    1     │ Khá        │ Ố nhẹ    │
│ Tủ quần áo         │    1     │ Tốt        │          │
│ Bàn học            │    1     │ Khá        │ Xước mặt │
│ Ghế                │    1     │ Tốt        │          │
│ Chìa khóa          │    2     │ —          │ Số 301A/B│
└────────────────────┴──────────┴────────────┴──────────┘
[8 ảnh hiện trạng]   Khách ký: ______  Nhân viên ký: ______
```

Check-out dùng đúng biểu mẫu này, so sánh cột tình trạng, chênh lệch → định giá → trừ cọc.

**Không có bộ ảnh hai chiều thì mọi tranh chấp cọc đều thua.**

### 2.4 Edge case
| Tình huống | Xử lý |
|---|---|
| **Tài sản dùng chung khu vực** | `locationType = COMMON_AREA`, không gắn vào phòng nào |
| **Điều chuyển giữa phòng/chi nhánh** | `asset_events` ghi `MOVED`, cập nhật vị trí. Giữ lịch sử |
| **Tài sản mất không rõ ai** | `LOST` + điều tra. Nếu xác định được người → tính phí |
| **Sửa nhiều lần, chi phí sửa > giá trị còn lại** | Cảnh báo gợi ý thanh lý |
| **Tài sản còn bảo hành** | Cảnh báo khi tạo ticket: "Tài sản còn bảo hành đến 12/2027 — liên hệ NCC trước khi tự sửa" |
| **Kiểm kê định kỳ** | Chức năng kiểm kê theo đợt: quét QR từng tài sản, đánh dấu có/không, sinh báo cáo chênh lệch |

---

## 3. Nội quy & Vi phạm

### 3.1 Mục đích
Chuẩn hóa quy định giữa các chi nhánh, xử lý vi phạm nhất quán, có bằng chứng.

### 3.2 Nội quy (`house_rules`)
| Trường | Ghi chú |
|---|---|
| `branchId` | Nội quy theo chi nhánh (có thể kế thừa từ bộ chung) |
| `version`, `effectiveFrom` | **Có phiên bản.** Khách ký nhận phiên bản nào thì chịu ràng buộc phiên bản đó |
| `sections[]` | Nội dung có cấu trúc theo mục |
| `status` | |

Khi khách check-in, `contracts.houseRulesVersion` ghi phiên bản khách đã ký nhận.

### 3.3 Danh mục vi phạm & mức phạt đề xuất

| Loại vi phạm | Mức độ | Lần 1 | Lần 2 | Lần 3 |
|---|---|---|---|---|
| Gây ồn sau giờ quy định | Nhẹ | Nhắc nhở | 100.000đ | 200.000đ |
| Hút thuốc trong phòng | Trung bình | 200.000đ | 500.000đ | Xem xét chấm dứt HĐ |
| Nấu ăn trong phòng (nếu cấm) | Nhẹ | Nhắc nhở | 100.000đ | 200.000đ |
| Nuôi thú cưng (nếu cấm) | Trung bình | Cảnh cáo + yêu cầu xử lý | 500.000đ | Chấm dứt HĐ |
| Đưa người lạ ở qua đêm | Trung bình | 200.000đ | 500.000đ | Chấm dứt HĐ |
| Làm hỏng tài sản | Tùy mức | Bồi thường theo giá trị | | |
| Vi phạm giờ giới nghiêm | Nhẹ | Nhắc nhở | 100.000đ | 200.000đ |
| Không thanh toán đúng hạn | Trung bình | Phí trễ hạn theo chính sách | | |
| Sử dụng/tàng trữ chất cấm | **Nghiêm trọng** | **Chấm dứt HĐ ngay + báo cơ quan chức năng** | | |
| Gây gổ, bạo lực | **Nghiêm trọng** | **Chấm dứt HĐ + báo cơ quan chức năng** | | |
| Trộm cắp | **Nghiêm trọng** | **Chấm dứt HĐ + báo cơ quan chức năng** | | |
| Cho người khác dùng thẻ/chìa khóa | Trung bình | 200.000đ | 500.000đ | |

Mức phạt cấu hình theo chi nhánh. Hệ thống tự đếm số lần vi phạm cùng loại trong 12 tháng để áp đúng bậc.

### 3.4 Dữ liệu vi phạm (`violations`)
| Trường | Ghi chú |
|---|---|
| `violationNo`, `branchId`, `customerId`, `roomId` | |
| `ruleId`, `ruleVersion` | Vi phạm điều nào, phiên bản nội quy nào |
| `occurredAt`, `reportedBy` | |
| `description`, `evidence[]` | **Ảnh/video bằng chứng — bắt buộc với mức phạt tiền** |
| `severity`, `occurrenceCount` | Lần thứ mấy |
| `penaltyType` | `WARNING` / `FINE` / `COMPENSATION` / `SUSPENSION` / `TERMINATION` |
| `penaltyAmount` | |
| `status` | `DRAFT` / `PENDING_APPROVAL` / `APPROVED` / `APPEALED` / `WAIVED` / `CHARGED` |
| `approvedBy`, `approvedAt` | |
| `chargedInvoiceId` | Hóa đơn đã tính phí phạt |
| `tenantAcknowledgedAt` | Khách đã xác nhận biết |
| `appealReason`, `appealResolution` | |

### 3.5 Workflow
```
Nhân viên/bảo vệ ghi nhận vi phạm + chụp bằng chứng
  → DRAFT
  → Gửi duyệt (PENDING_APPROVAL)
  → Branch Manager xem xét bằng chứng, xác định mức phạt
  → APPROVED
  → Thông báo khách (Zalo + portal), khách xác nhận hoặc khiếu nại
      Khiếu nại → APPEALED → xem xét lại → APPROVED hoặc WAIVED
  → Kỳ hóa đơn kế tiếp: tự động thêm dòng PENALTY → CHARGED
```

**Quy tắc:** vi phạm chỉ vào hóa đơn khi đã `APPROVED`. Không để nhân viên tự thêm phí phạt vào hóa đơn.

### 3.6 Edge case
| Tình huống | Xử lý |
|---|---|
| **Vi phạm tập thể (cả phòng gây ồn)** | Tạo vi phạm cho từng khách, hoặc một vi phạm gắn nhiều `customerIds` và chia phí phạt |
| **Không xác định được ai vi phạm** | Ghi nhận ở cấp phòng, cảnh cáo chung, không phạt tiền cá nhân |
| **Khách khiếu nại và đúng** | `WAIVED` + lý do. Nếu đã tính vào hóa đơn → bút toán điều chỉnh |
| **Khách trả phòng khi chưa thu phí phạt** | Trừ vào cọc lúc quyết toán |
| **Vi phạm nghiêm trọng cần chấm dứt ngay** | Quy trình riêng: lập biên bản có người chứng kiến → quyết định bằng văn bản → thông báo → thực hiện. Mọi bước lưu bằng chứng vì có thể dẫn tới tranh chấp pháp lý |

---

## 4. Khách ra vào & An ninh

### 4.1 Mục đích
Biết ai đang ở trong tòa nhà — cần cho an ninh và cho PCCC.

### 4.2 Dữ liệu (`visitor_logs`)
| Trường | Ghi chú |
|---|---|
| `branchId`, `visitorType` | `GUEST` (khách thăm) / `FAMILY` / `SHIPPER` / `VENDOR` / `CONTRACTOR` / `OTHER` |
| `visitorName`, `visitorPhone`, `visitorIdNumber` | CCCD chỉ bắt buộc với khách ở lại lâu / qua đêm |
| `hostCustomerId`, `roomId` | Đến thăm ai |
| `purpose` | |
| `checkInAt`, `checkOutAt` | |
| `recordedBy` | Bảo vệ hoặc lễ tân |
| `approvedByHost` | Người được thăm đã xác nhận |
| `vehiclePlate` | |
| `overnightStay` | **Quan trọng** — ở qua đêm thường là vi phạm hoặc cần đăng ký |
| `notes` | |

### 4.3 Quy trình
```
Khách đến quầy → bảo vệ ghi nhận (tên, SĐT, đến phòng nào)
  → Hệ thống thông báo cho người được thăm (Zalo/portal) → xác nhận
  → Cho vào
  → Khi ra: ghi nhận giờ ra

Cuối ngày: danh sách khách chưa ghi nhận ra → bảo vệ kiểm tra
```

**QR check-in (Phase 3):** khách thuê tạo mã mời trước, người thăm quét mã tại cổng → nhanh hơn, có dữ liệu chuẩn.

### 4.4 Tích hợp an ninh — phân tích có nên làm không

| Công nghệ | Giá trị | Chi phí | Rủi ro pháp lý | Khuyến nghị |
|---|---|---|---|---|
| **Thẻ từ / RFID** | Cao — thay chìa khóa cơ, biết ai ra vào, khóa thẻ ngay khi khách trả phòng | Trung bình (đầu đọc + thẻ) | Thấp | **Nên làm, Phase 4** nếu số chi nhánh tăng |
| **QR check-in khách thăm** | Trung bình — giảm việc ghi tay | Rất thấp (chỉ phần mềm) | Thấp | **Nên làm, Phase 3** |
| **Khóa cửa thông minh** | Trung bình — không cần chìa, cấp mã tạm cho khách | Cao (mỗi cửa một khóa) | Thấp | Chỉ khi cải tạo lớn |
| **Camera tích hợp hệ thống** | **Thấp** — camera dùng riêng đã đủ. Tích hợp không giảm việc thủ công nào | Cao | Trung bình (lưu trữ hình ảnh) | **Không làm** |
| **Nhận diện khuôn mặt** | Thấp ở quy mô này | Cao | **Cao** — dữ liệu sinh trắc học thuộc nhóm nhạy cảm theo Nghị định 13/2023, cần sự đồng ý riêng và biện pháp bảo vệ nghiêm ngặt | **Không làm** |

**Kết luận:** chỉ QR khách thăm (Phase 3) và cân nhắc thẻ từ (Phase 4). Không đưa camera và sinh trắc học vào hệ thống — chi phí và rủi ro pháp lý vượt giá trị mang lại.

### 4.5 Đăng ký tạm trú — nghĩa vụ pháp lý

Cơ sở lưu trú có nghĩa vụ thông báo lưu trú cho công an. Hệ thống cần:
- Cờ `temporaryResidenceStatus` trên khách: `NOT_REGISTERED` / `PENDING` / `REGISTERED`
- Danh sách khách chưa khai báo (cảnh báo sau N ngày kể từ check-in)
- **Export danh sách theo biểu mẫu** — họ tên, ngày sinh, giới tính, CCCD, nơi thường trú, ngày đến, ngày đi dự kiến, phòng
- Lưu chứng từ đã khai báo

Đây là nghiệp vụ bắt buộc mà hệ thống tự làm thường bỏ quên hoàn toàn.

---

## 5. Nhân viên (Staff)

### 5.1 Dữ liệu
| Trường | Ghi chú |
|---|---|
| `employeeCode`, `fullName`, `dateOfBirth`, `idNumber` | |
| `phone`, `email` | Email là tài khoản đăng nhập |
| `position`, `department` | |
| `branchIds[]` | Có thể làm nhiều chi nhánh |
| `primaryBranchId` | |
| `hireDate`, `terminationDate` | |
| `status` | `ACTIVE` / `ON_LEAVE` / `SUSPENDED` / `TERMINATED` |
| `emergencyContact` | |
| `documents[]` | Hợp đồng lao động, CCCD |

Tài khoản đăng nhập nằm ở `users`, liên kết `staffId`.

### 5.2 Ca làm việc (Phase 2)
| Trường | Ghi chú |
|---|---|
| `shiftId`, `staffId`, `branchId`, `date` | |
| `shiftType` | `MORNING` / `AFTERNOON` / `NIGHT` |
| `startTime`, `endTime` | |
| `status` | `SCHEDULED` / `CHECKED_IN` / `COMPLETED` / `ABSENT` |

Liên kết với `cash_sessions` — mở ca két gắn với ca làm việc.

### 5.3 Quy trình offboarding — quan trọng và hay bị bỏ qua
```
Nhân viên nghỉ việc:
  1. Vô hiệu hóa tài khoản NGAY (không chờ ngày cuối)
  2. Thu hồi mọi user_role_assignments
  3. Đóng ca két đang mở, quyết toán tiền mặt
  4. Chuyển giao ticket đang xử lý cho người khác
  5. Chuyển giao các đề xuất đang chờ duyệt
  6. Thu hồi chìa khóa, thẻ
  7. Ghi audit
  8. Giữ nguyên lịch sử thao tác (KHÔNG xóa) — cần cho kiểm toán
```

### 5.4 Edge case
| Tình huống | Xử lý |
|---|---|
| **Nhân viên chuyển chi nhánh** | Cập nhật `branchIds`, đổi scope quyền. **Lịch sử thao tác cũ giữ nguyên**, vẫn xem được trong audit của chi nhánh cũ |
| **Nhân viên hỗ trợ chi nhánh khác tạm thời** | Gán quyền có `validUntil`, tự hết hạn |
| **Nhân viên cũng là khách thuê** | Hai bản ghi riêng (`staff` và `customer`), liên kết bằng CCCD. Tránh xung đột quyền |
| **Nhân viên nghỉ việc còn ca két chưa chốt** | Chặn vô hiệu hóa cho đến khi chốt xong, hoặc quản lý chốt thay có ghi audit |

---

## 6. Thông báo (Notifications)

### 6.1 Kênh & khuyến nghị

| Kênh | Chi phí | Tỷ lệ đọc | Phù hợp với | Phase |
|---|---|---|---|---|
| **Thông báo trong web/app** | Miễn phí | Thấp (phải mở app) | Nhân viên | 1 |
| **Email** | Rất thấp | Trung bình | Hóa đơn, hợp đồng (có đính kèm) | 1 |
| **Zalo ZNS** | ~200–600đ/tin | **Cao nhất tại VN** | Nhắc thanh toán, thông báo quan trọng | 2 |
| **SMS** | ~300–800đ/tin | Cao | Dự phòng khi Zalo lỗi, OTP | 2 |
| **Push notification** | Miễn phí | Trung bình | Khi có app native (chưa cần) | 4 |

**Khuyến nghị:** Zalo ZNS là kênh chính với khách thuê VN. Email cho chứng từ. Thông báo trong hệ thống cho nhân viên.

### 6.2 Danh mục thông báo

| Sự kiện | Người nhận | Kênh | Phase |
|---|---|---|---|
| Hóa đơn mới phát hành | Khách + người trả tiền | Zalo + Email | 1 |
| Sắp đến hạn thanh toán (D-3) | Khách | Zalo | 2 |
| Quá hạn thanh toán (theo bậc) | Khách, rồi người liên hệ khẩn cấp | Zalo + Email | 2 |
| Xác nhận đã nhận thanh toán | Khách | Zalo | 2 |
| Hợp đồng sắp hết hạn (D-30/15/7) | Khách + lễ tân | Zalo + trong app | 2 |
| Booking được xác nhận | Khách | Zalo | 2 |
| Booking sắp hết hạn giữ chỗ | Khách + lễ tân | Zalo | 2 |
| Ticket mới | Quản lý + kỹ thuật | Trong app | 1 |
| Ticket được phân công | Kỹ thuật | Trong app + Zalo | 2 |
| Ticket quá SLA | Quản lý → Owner | Trong app | 2 |
| Ticket đã xử lý xong | Khách báo | Zalo | 2 |
| Vi phạm được ghi nhận | Khách | Zalo + portal | 2 |
| Cọc đã hoàn | Khách | Zalo | 2 |
| Thông báo chung từ ban quản lý | Toàn chi nhánh | Zalo + portal | 2 |
| Nội quy cập nhật | Toàn chi nhánh | Portal + Zalo | 2 |
| Chỉ số điện nước chưa nhập | Lễ tân + quản lý | Trong app | 1 |
| Chênh lệch két | Quản lý | Trong app | 1 |
| Khách thăm đang chờ | Khách thuê | Zalo | 3 |

### 6.3 Thiết kế kỹ thuật
- **Template có biến**, quản lý tập trung, có phiên bản
- **Hàng đợi (queue)** — không gửi đồng bộ trong request
- **Ghi nhận trạng thái gửi**: `PENDING` / `SENT` / `DELIVERED` / `FAILED` / `READ`
- **Retry có backoff** khi lỗi
- **Tùy chọn của người nhận**: khách tắt được loại thông báo không bắt buộc (nhưng không tắt được thông báo hóa đơn/nợ)
- **Chống spam**: gộp nhiều thông báo cùng loại trong ngày thành một
- **Giới hạn giờ gửi**: không gửi Zalo/SMS sau 21h và trước 7h (trừ khẩn cấp)

---

## 7. Báo cáo

### 7.1 Danh mục báo cáo

| # | Báo cáo | Nội dung | Người dùng chính | Phase |
|---|---|---|---|---|
| 1 | **Lấp đầy (Occupancy)** | Tỷ lệ theo chi nhánh/tòa/tầng/loại phòng, theo thời gian; giường trống; số ngày trống trung bình giữa 2 khách | Owner, BM | 1 |
| 2 | **Doanh thu** | Theo ngày/tháng/năm, theo chi nhánh, theo nguồn (phòng/điện nước/dịch vụ), **phân biệt đã phát hành vs đã thu** | Owner, KT | 1 |
| 3 | **Chi phí** | Theo danh mục, theo chi nhánh, so sánh kỳ | Owner, KT | 2 |
| 4 | **Lãi lỗ (P&L)** | Doanh thu − chi phí theo chi nhánh, có phân bổ chi phí chung | **Owner** | 2 |
| 5 | **Công nợ** | Aging 4 mốc, theo chi nhánh/khách, xu hướng | KT, BM | 1 |
| 6 | **Dòng tiền** | Thu vs chi theo tuần/tháng, số dư tiền mặt và ngân hàng | Owner, KT | 2 |
| 7 | **Khách thuê** | Khách mới, đã trả phòng, đang ở, theo nguồn/trường/công ty, thời gian ở trung bình | Owner, BM | 1 |
| 8 | **Hợp đồng** | Ký mới, gia hạn, hết hạn, chấm dứt sớm; **tỷ lệ gia hạn** | Owner, BM | 1 |
| 9 | **Bảo trì** | Số ticket theo loại, thời gian xử lý trung bình, tỷ lệ đạt SLA, chi phí | BM | 2 |
| 10 | **Tài sản** | Danh mục, giá trị còn lại, sắp hết bảo hành, tần suất hỏng | BM, KT | 2 |
| 11 | **Điện nước** | Tiêu thụ theo phòng/tòa, chênh lệch đồng hồ tổng, phòng bất thường | BM | 2 |
| 12 | **Két tiền mặt** | Chênh lệch theo nhân viên, tiền chưa nộp ngân hàng | BM, KT | 1 |
| 13 | **Vi phạm** | Theo loại, theo khách, phí phạt đã thu | BM | 2 |
| 14 | **Tạm trú** | Danh sách theo mẫu công an, trạng thái khai báo | BM | 1 |

### 7.2 Yêu cầu chung cho mọi báo cáo
- Lọc theo: khoảng thời gian, chi nhánh (trong phạm vi quyền), tòa/tầng/loại phòng
- **So sánh kỳ**: kỳ trước, cùng kỳ năm trước
- Export: **Excel** (quan trọng nhất — người VN làm vận hành sẽ muốn xử lý tiếp), CSV — không xuất PDF, cần bản in thì in trực tiếp từ màn hình báo cáo
- Mọi báo cáo áp dụng phạm vi chi nhánh ở backend
- Ghi audit khi export (ai, báo cáo gì, lúc nào)
- Báo cáo nặng chạy nền, gửi link khi xong

### 7.3 Báo cáo tự động gửi định kỳ (Phase 2)
| Báo cáo | Tần suất | Người nhận |
|---|---|---|
| Tổng quan hệ thống | Thứ Hai hằng tuần | Owner |
| Tổng quan chi nhánh | Thứ Hai hằng tuần | Branch Manager |
| Công nợ quá hạn | Hằng tuần | KT + BM |
| P&L tháng | Ngày 5 tháng sau | Owner |
| Ticket quá SLA | Hằng ngày | BM |
