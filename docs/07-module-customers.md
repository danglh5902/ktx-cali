# 07 — Module Khách thuê: Hồ sơ · Đặt chỗ · Check-in · Check-out

---

## 1. Hồ sơ khách thuê (Customer)

### 1.1 Mục đích
Hồ sơ trung tâm của mọi nghiệp vụ. Phải trả lời được tức thì: khách này là ai, đang ở đâu, nợ bao nhiêu, hợp đồng đến khi nào, có vấn đề gì không.

### 1.2 Dữ liệu

| Nhóm | Trường | Bắt buộc | Ghi chú |
|---|---|---|---|
| **Định danh** | `customerCode` | Tự sinh | `KH-TD-00142` |
| | `fullName` | ✅ | |
| | `dateOfBirth` | ✅ | Dùng kiểm tra tuổi vị thành niên |
| | `gender` | ✅ | **Bắt buộc** — dùng để chặn xếp sai tòa/tầng theo quy định giới tính |
| | `idType` | ✅ | `CCCD` / `CMND` / `PASSPORT` / `BIRTH_CERT` |
| | `idNumber` | ✅ | Unique theo `orgId` (cảnh báo nếu trùng) |
| | `idIssueDate`, `idIssuePlace` | | Cần cho đăng ký tạm trú |
| **Liên hệ** | `phone` | ✅ | Chuẩn hóa về `+84...` khi lưu, hiển thị `0...` |
| | `email` | | Cần nếu dùng portal |
| | `zaloPhone` | | Có thể khác số chính |
| **Địa chỉ** | `permanentAddress` | ✅ | Hộ khẩu thường trú — bắt buộc cho tạm trú |
| | `hometown` | | Quê quán |
| **Khẩn cấp** | `emergencyContact: {name, relationship, phone, address}` | ✅ | **Bắt buộc.** Với sinh viên thường là phụ huynh |
| | `secondaryContact` | | Người liên hệ thứ hai |
| **Người trả tiền** | `payer: {name, phone, relationship, bankAccount}` | | **Quan trọng** — người trả tiền thường khác người ở (phụ huynh). Thiếu trường này thì đối soát chuyển khoản sẽ sai |
| **Nghề nghiệp** | `occupation` | | `STUDENT` / `EMPLOYEE` / `OTHER` |
| | `school` / `company` | | Tên trường/công ty — dùng phân tích nguồn khách, quyết định mở chi nhánh mới ở đâu |
| | `studentId` / `employeeId` | | |
| **Giấy tờ** | `photo` | | Ảnh chân dung |
| | `idFrontImage`, `idBackImage` | ✅ | **Dữ liệu nhạy cảm** — mã hóa, URL có hạn, log mọi lượt xem |
| | `otherDocuments[]` | | Giấy xác nhận sinh viên, hợp đồng lao động |
| **Trạng thái** | `status` | | Xem §1.3 |
| | `isBlacklisted`, `blacklistReason` | | |
| | `source` | | Nguồn khách: giới thiệu / Facebook / đi ngang qua / website — dùng đo hiệu quả marketing |
| **Ghi chú** | `internalNotes` | | Chỉ nhân viên thấy |
| | `preferences` | | Yêu cầu ghép phòng, dị ứng, thói quen |

### 1.3 Trạng thái khách

| Trạng thái | Nghĩa | Tính vào "khách đang ở"? |
|---|---|---|
| `PROSPECT` | Đã đăng ký/hỏi thông tin, chưa cọc | ❌ |
| `RESERVED` | Đã cọc, chưa đến ở | ❌ |
| `ACTIVE` | Đang ở | ✅ |
| `EXPIRING` | Đang ở, hợp đồng còn ≤30 ngày | ✅ |
| `CHECKED_OUT` | Đã trả phòng, không còn nợ | ❌ |
| `CHECKED_OUT_WITH_DEBT` | Đã trả phòng, còn nợ | ❌ (nhưng vẫn theo dõi công nợ) |
| `SUSPENDED` | Bị tạm khóa (vi phạm nghiêm trọng, đang xử lý) | ✅ |
| `BLACKLISTED` | Cấm thuê lại | ❌ |

`EXPIRING` do job tự động gán, không phải người bấm.

### 1.4 Các tab trong hồ sơ khách

| Tab | Nội dung |
|---|---|
| **Tổng quan** | Thông tin cơ bản · phòng/giường hiện tại · hợp đồng hiện tại · **số nợ hiện tại** (nổi bật) · cảnh báo (vi phạm, blacklist) |
| **Hợp đồng** | Tất cả hợp đồng theo thời gian, xem nội dung (in trực tiếp từ màn hình khi cần) |
| **Lịch sử lưu trú** | Từ `bed_assignments`: từng ở giường nào, từ ngày nào, lý do chuyển |
| **Hóa đơn** | Danh sách theo kỳ, trạng thái, số dư |
| **Thanh toán** | Lịch sử thu tiền, phương thức, người thu |
| **Cọc** | Sổ cọc: nhận, trừ, hoàn, số dư |
| **Dịch vụ** | Đang dùng dịch vụ gì |
| **Ticket** | Sự cố đã báo và tình trạng xử lý |
| **Vi phạm** | Lịch sử vi phạm và phí phạt |
| **Khách thăm** | Ai từng đến thăm |
| **Giấy tờ** | Ảnh CCCD, hợp đồng, biên bản (xem có ghi log) |
| **Nhật ký** | Ghi chú của nhân viên theo thời gian |

### 1.5 Thao tác
Tạo · sửa · tìm kiếm · gộp hồ sơ trùng · đưa vào/ra danh sách đen · ẩn danh hóa (theo yêu cầu xóa dữ liệu cá nhân) · export (giới hạn quyền).

**Tìm kiếm phải mạnh:** tên (không dấu cũng ra), SĐT (một phần cũng ra), CCCD, mã phòng, mã khách. Đây là thao tác lễ tân dùng nhiều nhất trong ngày.

### 1.6 Edge case
| Tình huống | Xử lý |
|---|---|
| **Trùng CCCD** | Cảnh báo khi nhập, hiển thị hồ sơ đã có, gợi ý "đây có phải cùng một người?" → dùng lại hồ sơ cũ thay vì tạo mới |
| **Trùng CCCD nhưng khác tên** (nhập sai số) | Không chặn cứng — cho phép lưu kèm cờ `needsVerification`, đưa vào danh sách cần kiểm tra |
| **Khách không có CCCD** | Dưới 14 tuổi: giấy khai sinh + CCCD người giám hộ. Khách nước ngoài: hộ chiếu + visa. Trường `idType` xử lý được cả hai |
| **Khách quay lại lần 2** | Tìm theo CCCD → dùng lại hồ sơ, tạo hợp đồng mới. Lịch sử cũ (kể cả vi phạm và nợ cũ) hiển thị ngay — rất quan trọng |
| **Khách yêu cầu xóa dữ liệu cá nhân** | **Ẩn danh hóa**, không xóa: thay tên/CCCD/SĐT/ảnh bằng giá trị mã hóa, giữ nguyên bản ghi tài chính (nghĩa vụ kế toán). Ghi audit |
| **Gộp hai hồ sơ trùng** | Công cụ merge: chọn hồ sơ giữ lại, chuyển toàn bộ hợp đồng/hóa đơn/thanh toán sang, đánh dấu hồ sơ kia `MERGED_INTO`. Không xóa. Ghi audit |
| **Khách vị thành niên** | Bắt buộc có người giám hộ ký hợp đồng. Hệ thống tự kiểm tra tuổi từ `dateOfBirth` và yêu cầu thông tin giám hộ |
| **Khách đổi số điện thoại** | Giữ lịch sử số cũ (mảng `phoneHistory`) — để đối soát chuyển khoản cũ |

---

## 2. Đăng ký & Đặt chỗ (Booking)

### 2.1 Mục đích
Giữ giường cho khách trong thời gian họ chuẩn bị, mà không làm mất cơ hội cho thuê nếu khách không đến.

### 2.2 Dữ liệu
| Trường | Ghi chú |
|---|---|
| `bookingNo` | `BK-TD-2026-0891` |
| `customerId` | Có thể tạo hồ sơ tối giản trước (tên + SĐT), bổ sung sau |
| `branchId`, `bedId` | `bedId` có thể `null` ở trạng thái `NEW` (chưa xếp giường) |
| `expectedCheckInDate`, `expectedDuration` | |
| `quotedPrice` | Giá đã báo cho khách — snapshot, tránh cãi nhau sau |
| `depositRequired`, `depositPaid` | |
| `holdUntil` | **Bắt buộc.** Hết hạn → tự hủy, trả giường |
| `status` | Xem [03-org-model.md §3.2](03-org-model.md) |
| `source` | Nguồn: tại quầy / điện thoại / Zalo / website / giới thiệu |
| `roommatePreferences` | Yêu cầu ghép phòng (văn bản tự do + vài cờ) |
| `notes` | |
| `cancelReason`, `cancelledBy` | |

### 2.3 Workflow
```
Khách liên hệ
  → Lễ tân tạo booking (NEW), ghi tên + SĐT + nhu cầu
  → Tư vấn, dẫn xem phòng
  → Chọn giường cụ thể → CONFIRMED, giường → RESERVED, đặt holdUntil (mặc định 48h)
  → Khách đặt cọc → DEPOSIT_PAID, ghi vào sổ cọc, holdUntil gia hạn đến ngày hẹn nhận phòng
  → Khách đến → CHECK-IN
```

**Nhánh phụ:**
| Nhánh | Xử lý |
|---|---|
| Hết `holdUntil` chưa cọc | Job tự chuyển `EXPIRED`, giường về `AVAILABLE`, thông báo lễ tân |
| Khách hủy trước khi cọc | `CANCELLED`, giường trả về ngay |
| Khách hủy sau khi cọc | `CANCELLED` + xử lý cọc theo chính sách (xem §2.4) |
| Quá ngày hẹn N ngày không đến | `NO_SHOW` + xử lý cọc theo chính sách |

### 2.4 Chính sách cọc khi hủy — phải cấu hình được theo chi nhánh

| Tình huống | Đề xuất mặc định |
|---|---|
| Hủy trước ngày hẹn ≥7 ngày | Hoàn 100% cọc |
| Hủy trước 1–6 ngày | Hoàn 50% |
| Hủy trong ngày hoặc `NO_SHOW` | Không hoàn (tịch thu) |
| Cali hủy (hết phòng, sửa chữa) | Hoàn 100% + hỗ trợ tìm chỗ khác |

**Quan trọng:** chính sách phải được **hiển thị cho khách và ghi vào phiếu cọc** lúc nhận cọc. Không có thì mọi tranh chấp đều thua.

### 2.5 Danh sách chờ (Waitlist)
Mùa nhập học tháng 8–9 thường hết phòng. Cần:
- Đăng ký chờ: khách + loại phòng mong muốn + ngày cần
- Khi có giường trống phù hợp → thông báo tự động theo thứ tự đăng ký
- Thời hạn phản hồi (vd 24h) rồi chuyển người kế tiếp

Đây là tính năng nhỏ nhưng chuyển hóa doanh thu thật trong mùa cao điểm.

### 2.6 Edge case
| Tình huống | Xử lý |
|---|---|
| **Hai khách cùng đặt một giường** | Unique index chặn ở tầng DB. Thông báo rõ cho người thứ hai |
| **Khách đặt cọc rồi muốn đổi giường trước khi vào** | Cho phép: đổi `bedId` trên booking, giường cũ trả về `AVAILABLE`, giường mới → `RESERVED`. Nếu giá khác → điều chỉnh, có xác nhận của khách |
| **Khách cọc rồi muốn đổi chi nhánh** | Chuyển booking sang chi nhánh khác. Cọc chuyển theo (ghi nhận `TRANSFER` trong sổ cọc). Cần quyền liên chi nhánh |
| **Khách đến sớm hơn ngày hẹn** | Cho check-in sớm nếu giường sẵn sàng. Ngày bắt đầu tính tiền = ngày thực tế vào ở |
| **Khách đến trễ hơn ngày hẹn** | Theo chính sách: tính tiền từ ngày hẹn (giữ chỗ) hoặc từ ngày thực tế. Mặc định đề xuất: tính từ ngày hẹn vì giường đã bị giữ |
| **Đặt chỗ cho giường đang có người ở, sẽ trống tháng sau** | Cho phép — `isAvailableForPeriod` kiểm tra theo khoảng thời gian, không theo trạng thái hiện tại |
| **Giường đặt trước bị hỏng trước ngày khách đến** | Cảnh báo cho lễ tân → chủ động liên hệ khách, đổi giường tương đương, hoặc hoàn cọc 100% |
| **Khách đặt qua website ngoài giờ** | Booking `NEW` chờ xác nhận, **không tự giữ giường** (tránh người lạ khóa giường ảo). Lễ tân xác nhận trong giờ làm việc |

---

## 3. Check-in

### 3.1 Mục đích
Chuyển từ "khách trên giấy" thành "khách đang ở", đồng thời xác lập bằng chứng về hiện trạng để tránh tranh chấp khi trả phòng.

### 3.2 Checklist bắt buộc

| # | Bước | Chặn nếu chưa xong? |
|---|---|---|
| 1 | Xác nhận danh tính (đối chiếu CCCD với người thật) | ✅ |
| 2 | Hồ sơ đầy đủ: CCCD 2 mặt, SĐT, liên hệ khẩn cấp | ✅ |
| 3 | Kiểm tra danh sách đen | ✅ (nếu có → cần quản lý duyệt) |
| 4 | Kiểm tra quy định giới tính của tòa/tầng | ✅ |
| 5 | Hợp đồng đã ký (giấy hoặc điện tử) | ✅ |
| 6 | Tiền cọc đã nhận đủ | ✅ (thiếu → cần quản lý duyệt) |
| 7 | Chọn/xác nhận giường | ✅ |
| 8 | **Kiểm kê tài sản trong phòng** (đủ/thiếu/tình trạng) | ✅ |
| 9 | **Chụp ảnh hiện trạng** phòng và giường | ✅ |
| 10 | Ghi chỉ số điện nước đầu kỳ (nếu là người đầu tiên vào phòng trống) | |
| 11 | Bàn giao chìa khóa/thẻ từ (ghi số) | ✅ |
| 12 | Phổ biến nội quy + khách ký xác nhận đã đọc | ✅ |
| 13 | Đăng ký tạm trú | Không chặn nhưng đưa vào hàng chờ khai báo |

### 3.3 Điều gì xảy ra trong hệ thống (một transaction)
```
BEGIN TRANSACTION
  1. Tạo bed_assignments (bedId, customerId, contractId, startDate = hôm nay, dailyRate snapshot)
  2. Cập nhật beds: status = OCCUPIED, currentAssignmentId
  3. Cập nhật contracts: status = ACTIVE
  4. Cập nhật bookings: status = CHECKED_IN
  5. Cập nhật customers: status = ACTIVE
  6. Ghi deposit_ledger: HOLD (nếu nhận cọc lúc này)
  7. Tạo checkin_checkout_records: checklist + ảnh + danh sách tài sản + chữ ký
  8. Tạo utility_readings đầu kỳ (nếu cần)
  9. Ghi audit_logs
COMMIT
```
**Bắt buộc transaction** — nếu bước 3 lỗi mà bước 1–2 đã ghi, sẽ có khách đang ở mà không có hợp đồng. Loại dữ liệu rác này rất khó phát hiện và sửa.

### 3.4 Sản phẩm đầu ra
- Phiếu check-in in được (có chữ ký 2 bên)
- Biên bản bàn giao tài sản kèm ảnh
- Bản sao hợp đồng
- Phiếu thu cọc

### 3.5 Edge case
| Tình huống | Xử lý |
|---|---|
| **Khách đến mà chưa có booking** (walk-in) | Cho phép tạo booking + hợp đồng + check-in liền mạch trong một luồng |
| **Cọc chưa đủ** | Chặn, nhưng quản lý chi nhánh duyệt được (ghi lý do, ghi audit, tạo khoản phải thu cọc) |
| **Chưa có CCCD (quên mang)** | Cho check-in với cờ `documentsPending` + hạn bổ sung. Đưa vào danh sách nhắc. Không để trôi |
| **Khách vị thành niên** | Bắt buộc người giám hộ có mặt và ký |
| **Mất mạng giữa chừng** | Transaction rollback. Lưu bản nháp checklist ở client để nhập lại nhanh |
| **Check-in ngược ngày (khách đã ở từ tuần trước mới nhập hệ thống)** | Cho phép `startDate` quá khứ, nhưng cần quyền quản lý và ghi audit — vì ảnh hưởng tiền phòng |
| **Không đủ tài sản trong phòng** | Ghi nhận trong biên bản kiểm kê + tạo ticket bổ sung, không chặn check-in |

---

## 4. Check-out

### 4.1 Mục đích
Kết thúc lưu trú, quyết toán toàn bộ nghĩa vụ tài chính, giải phóng giường đúng cách.

Đây là **nghiệp vụ dễ mất tiền nhất** — vì tiền cọc đang trong tay Cali, và mọi khoản chưa thu mà để khách đi là mất luôn.

### 4.2 Checklist bắt buộc (theo thứ tự)

| # | Bước | Chặn? |
|---|---|---|
| 1 | Xác nhận yêu cầu trả phòng (có báo trước đúng hạn không?) | |
| 2 | **Chốt chỉ số điện nước** tại thời điểm trả | ✅ |
| 3 | **Kiểm kê tài sản** — đối chiếu với biên bản check-in | ✅ |
| 4 | Chụp ảnh hiện trạng | ✅ |
| 5 | Ghi nhận hư hỏng/mất mát + định giá | |
| 6 | Thu chìa khóa/thẻ (thiếu → phí thay) | ✅ |
| 7 | **Sinh hóa đơn quyết toán**: tiền phòng prorate + điện nước + dịch vụ + phí phát sinh + phạt vi phạm chưa thu | ✅ |
| 8 | **Kiểm tra tổng công nợ** (gồm cả các kỳ trước) | ✅ |
| 9 | **Quyết toán cọc** (xem §4.3) | ✅ |
| 10 | Thu thêm hoặc hoàn trả | |
| 11 | Hủy các đăng ký dịch vụ đang chạy | ✅ |
| 12 | Kết thúc assignment, giường → `CLEANING` | ✅ |
| 13 | Chấm dứt hợp đồng | ✅ |
| 14 | Xóa đăng ký tạm trú | |
| 15 | In biên bản thanh lý, 2 bên ký | ✅ |

### 4.3 Quyết toán cọc — logic

```
Cọc đang giữ:                            4.000.000
─────────────────────────────────────────────────
Trừ: Công nợ các kỳ trước                −1.200.000
Trừ: Hóa đơn quyết toán kỳ cuối            −850.000
Trừ: Hư hỏng (vỡ kính tủ)                  −300.000
Trừ: Mất 1 thẻ từ                          −100.000
Trừ: Phạt vi phạm chưa thu                       0
Cộng: Số dư trả thừa của khách             +150.000
─────────────────────────────────────────────────
SỐ HOÀN TRẢ KHÁCH:                        1.700.000
```

**Ba trường hợp:**
| Kết quả | Xử lý |
|---|---|
| Cọc > nghĩa vụ | Hoàn phần dư. Tạo `deposit_refund_request` → duyệt → chi trả. Theo chính sách chi nhánh, thường hoàn sau 7–15 ngày |
| Cọc = nghĩa vụ | Khớp, đóng sổ cọc |
| Cọc < nghĩa vụ | **Sinh hóa đơn thu thêm.** Nếu khách không trả → công nợ sau trả phòng, trạng thái `CHECKED_OUT_WITH_DEBT`, đưa vào quy trình thu hồi |

### 4.4 Điều gì xảy ra trong hệ thống (một transaction)
```
BEGIN TRANSACTION
  1. Đóng bed_assignments: endDate = ngày trả, reason = CHECK_OUT
  2. Cập nhật beds: status = CLEANING, currentAssignmentId = null
  3. Tạo housekeeping_tasks cho giường/phòng
  4. Cập nhật contracts: status = TERMINATED hoặc EXPIRED
  5. Sinh invoice quyết toán + invoice_lines
  6. Ghi deposit_ledger: các bút toán DEDUCT
  7. Tạo deposit_refund_request (nếu còn dư)
  8. Hủy service_subscriptions đang chạy
  9. Cập nhật customers: CHECKED_OUT hoặc CHECKED_OUT_WITH_DEBT
 10. Tạo checkin_checkout_records (bản check-out)
 11. Ghi audit_logs
COMMIT
```

### 4.5 Edge case
| Tình huống | Xử lý |
|---|---|
| **Khách trả phòng nhưng còn nợ** | **Không chặn cứng** — khách sẽ đi dù sao. Thay vào đó: cảnh báo đỏ, yêu cầu quản lý duyệt, trừ tối đa vào cọc, ghi nhận phần còn lại thành công nợ sau trả phòng và đưa vào quy trình thu hồi |
| **Khách bỏ đi không báo** (abandonment) | Quy trình riêng: (1) không liên lạc được N ngày (mặc định 7) → cảnh báo; (2) lập biên bản có người chứng kiến + chụp ảnh đồ đạc; (3) thông báo bằng văn bản tới địa chỉ thường trú và người liên hệ khẩn cấp; (4) sau thời hạn quy định trong hợp đồng → check-out đơn phương, tịch thu cọc theo điều khoản, lưu kho đồ đạc. **Mọi bước phải có bằng chứng ảnh và audit** |
| **Trả phòng giữa tháng** | Prorate tiền phòng theo ngày thực ở (từ `bed_assignments`). Điện nước chốt theo chỉ số thực. Dịch vụ theo chu kỳ tính đến ngày trả |
| **Trả phòng sớm hơn hợp đồng** | Áp phí phạt phá vỡ hợp đồng theo điều khoản (thường mất cọc hoặc 1 tháng tiền phòng). Điều khoản này phải có trong hợp đồng, không được tự nghĩ ra lúc trả phòng |
| **Hư hỏng nhưng khách không nhận** | Đối chiếu ảnh check-in và check-out. Đây là lý do bước chụp ảnh là bắt buộc ở cả hai chiều |
| **Hoàn cọc sau khi khách đã đi** | Theo dõi trạng thái "cọc đến hạn hoàn". Dashboard kế toán có danh sách riêng. Không để khách phải đòi |
| **Khách muốn hoàn cọc tiền mặt ngay** | Cần quyền + trong hạn mức + có sẵn tiền trong két. Nếu không → chuyển khoản trong N ngày |
| **Trả phòng nhưng còn người ở cùng phòng** | Chỉ giải phóng giường của khách này. Chốt điện nước: nếu đồng hồ theo phòng thì không chốt được riêng → chia theo số ngày ở của từng người trong kỳ. Quy tắc chia phải ghi rõ trong hóa đơn |
| **Khách trả phòng rồi quay lại trong tháng** | Hợp đồng mới, assignment mới. Hóa đơn kỳ đó có 2 đoạn prorate riêng biệt |
