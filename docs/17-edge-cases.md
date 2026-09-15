# 17 — Edge Cases

40 tình huống thực tế mà hệ thống phải xử lý. Mỗi case gồm: mô tả → cách xử lý → ghi chú triển khai.

---

## A. Lưu trú & phòng giường (1–12)

### 1. Khách đổi giường giữa tháng
**Xử lý:** Đóng `bed_assignment` cũ (`endDate` = hôm qua, `reason = TRANSFER_BED`), mở assignment mới với `dailyRate` snapshot theo giá giường mới. Hóa đơn kỳ đó tự sinh 2 dòng `RENT` prorate.
**Triển khai:** Trong transaction. **Không sửa assignment cũ.** Xem [14-workflows.md §8](14-workflows.md).

### 2. Hai khách cùng đặt một giường
**Xử lý:** Unique partial index `{bedId}` với `{endDate: null}` chặn ở tầng database. Người thứ hai nhận lỗi rõ ràng: *"Giường A-301-B2 vừa được giữ bởi Linh lúc 14:32. Vui lòng chọn giường khác."*
**Triển khai:** Bắt `E11000 duplicate key` và dịch thành thông báo nghiệp vụ. Không để lộ lỗi kỹ thuật ra giao diện.

### 3. Khách ở quá hạn hợp đồng, không ký hợp đồng mới
**Xử lý:** Nếu `contract.autoRenewMonthly = true` → tự chuyển thuê tháng theo giá hiện hành, cảnh báo quản lý. Nếu không → **cảnh báo đỏ liên tục** trên dashboard: "Khách đang ở không có hợp đồng hiệu lực".
**Triển khai:** Job hằng ngày. Đây là trạng thái không được phép tồn tại quá vài ngày — vừa rủi ro pháp lý vừa không sinh được hóa đơn.

### 4. Khách bỏ đi không báo (abandonment)
**Xử lý:** Quy trình riêng có bằng chứng từng bước:
1. Không liên lạc được N ngày (mặc định 7) → cảnh báo
2. Lập biên bản có người chứng kiến + chụp ảnh phòng và đồ đạc
3. Gửi thông báo bằng văn bản tới địa chỉ thường trú và người liên hệ khẩn cấp
4. Hết thời hạn quy định trong hợp đồng → check-out đơn phương, tịch thu cọc theo điều khoản
5. Lưu kho đồ đạc, ghi nhận danh mục

**Triển khai:** Mọi bước phải có ảnh và audit. Đây là tình huống dễ dẫn tới tranh chấp pháp lý nhất.

### 5. Giường đang bảo trì nhưng có booking cho tháng sau
**Xử lý:** Cho phép đặt. `isAvailableForPeriod(bedId, from, to)` kiểm tra xung đột theo **khoảng thời gian**, không theo `status` hiện tại. Chỉ chặn **check-in** nếu tại ngày đó giường vẫn `MAINTENANCE`.
**Triển khai:** Đây là lý do không được dùng `bed.status` làm điều kiện duy nhất khi bán.

### 6. Khách chuyển chi nhánh giữa kỳ
**Xử lý (khuyến nghị):** Chấm dứt hợp đồng chi nhánh cũ + ký hợp đồng mới ở chi nhánh mới. Cọc chuyển qua bút toán `TRANSFER_OUT` / `TRANSFER_IN` trong sổ cọc. Hai hóa đơn riêng cho hai chi nhánh — doanh thu phân bổ đúng.
**Triển khai:** Cần quyền liên chi nhánh (`assignment:transfer_branch`) + Branch Manager duyệt. Ghi audit ở cả hai chi nhánh.

### 7. Khách thuê nguyên phòng rồi trả bớt một giường
**Xử lý:** Đóng assignment của giường đó. Giá hợp đồng điều chỉnh qua phụ lục (`version` +1), có phê duyệt. Giường trả về `CLEANING` rồi `AVAILABLE`.
**Triển khai:** Không tự động tính lại giá — giá nguyên phòng thường không bằng tổng giá giường.

### 8. Khách yêu cầu ghép phòng với người quen
**Xử lý:** `booking.roommatePreferences` lưu yêu cầu. Khi xếp giường, hệ thống hiển thị ghi chú này cho lễ tân. **Không tự động ghép** — con người làm tốt hơn.
**Triển khai:** Hiển thị nổi bật ở bước chọn giường trong luồng check-in.

### 9. Khách quay lại lần thứ hai
**Xử lý:** Tìm theo CCCD → dùng lại hồ sơ cũ, tạo hợp đồng mới. **Lịch sử cũ hiển thị ngay**: nợ cũ chưa trả, vi phạm, có trong blacklist không.
**Triển khai:** Nếu còn nợ cũ hoặc trong blacklist → cảnh báo bắt buộc, cần Branch Manager duyệt mới cho ký.

### 10. Trả phòng nhưng còn người khác ở cùng phòng
**Xử lý:** Chỉ giải phóng giường của khách này, phòng vẫn `ACTIVE`. Chốt điện nước: nếu đồng hồ theo phòng thì không chốt riêng được → **chia theo số ngày ở của từng người trong kỳ**, không chia đều.
**Triển khai:** Hàm chia có trọng số theo ngày. Ghi rõ quy tắc trong `calculationNote` của dòng hóa đơn.

### 11. Giường bị hỏng khi khách đang ở
**Xử lý:** Tạo ticket. Nếu không ở được → chuyển khách sang giường khác (assignment mới, `reason = TRANSFER_BED`). Xem xét giảm giá cho những ngày bất tiện (dòng `DISCOUNT` có lý do, cần duyệt).
**Triển khai:** Giường cũ → `MAINTENANCE`, không phải `AVAILABLE`.

### 12. Trạng thái giường lệch thực tế
**Xử lý:** Job nightly reconcile so `beds.status` với assignment/ticket/booking đang hiệu lực → sinh danh sách lệch gửi Branch Manager mỗi sáng.
**Triển khai:** Không tự động sửa — hiển thị để người xác nhận, vì có thể do thực tế thay đổi mà chưa cập nhật.

---

## B. Tài chính (13–27)

### 13. Khách check-out nhưng còn nợ
**Xử lý:** **Không chặn cứng** — khách sẽ đi dù sao. Thay vào đó: cảnh báo đỏ, yêu cầu Branch Manager duyệt, trừ tối đa vào cọc, phần còn lại thành công nợ sau trả phòng (`CHECKED_OUT_WITH_DEBT`) và đưa vào quy trình thu hồi.
**Triển khai:** Chặn cứng chỉ làm nhân viên tìm cách lách (check-out ngoài hệ thống), khiến dữ liệu sai.

### 14. Webhook thanh toán gửi trùng
**Xử lý:** `idempotencyKey` (unique sparse) + `externalTxnId` (unique sparse). Lần thứ hai → trả `200 OK` kèm payment đã có, **không báo lỗi**.
**Triển khai:** Nếu trả lỗi, ngân hàng/cổng sẽ retry vô hạn.

### 15. Khách chuyển khoản thiếu hoặc thừa
**Xử lý:**
- Thiếu → `PARTIALLY_PAID`, còn dư nợ, vẫn ghi nhận phần đã thu
- Thừa → phần dư vào `customer.creditBalance`, tự động trừ vào hóa đơn kỳ sau

**Triển khai:** `creditBalance` hiển thị rõ trên hồ sơ khách và trên hóa đơn kỳ sau ("Đã trừ số dư trả thừa kỳ trước: 150.000đ").

### 16. Chuyển khoản không ghi nội dung, không biết của ai
**Xử lý:** Đưa vào **hàng chờ đối soát** (suspense). Kế toán liên hệ khách hoặc tra theo số tài khoản người gửi. **Tuyệt đối không gán bừa.**
**Triển khai:** Lưu `payerAccount` của khách sau lần đối soát đầu tiên → lần sau tự khớp được.

### 17. Hóa đơn đã phát hành cần sửa
**Xử lý:** **Không sửa.** Tạo `invoice_adjustment` với `reason` bắt buộc, người duyệt ≠ người đề xuất. In hóa đơn hiển thị cả gốc lẫn điều chỉnh.
**Triển khai:** Không tồn tại API `PATCH /invoices/:id` cho hóa đơn `ISSUED`.

### 18. Đổi giá phòng giữa kỳ hợp đồng
**Xử lý:** Không ảnh hưởng — `contract.monthlyRent` đã snapshot. Giá mới chỉ áp cho hợp đồng ký sau.
**Triển khai:** Nếu muốn tăng giá với khách hiện tại, phải làm phụ lục có chữ ký và thông báo trước theo số ngày quy định.

### 19. Hoàn cọc một phần
**Xử lý:** Các bút toán `DEDUCT_DEBT`, `DEDUCT_DAMAGE`, `DEDUCT_PENALTY` rồi `REFUND` phần còn lại. Sổ cọc luôn khớp.
**Triển khai:** `balanceAfter` trên mỗi bút toán để đối chiếu.

### 20. Cọc không đủ trừ các khoản phải thu
**Xử lý:** Trừ hết cọc, phần chênh sinh hóa đơn thu thêm. Nếu khách không trả → công nợ sau trả phòng.
**Triển khai:** Thứ tự trừ cần cấu hình: đề xuất công nợ → hư hỏng → phạt.

### 21. Chấm dứt hợp đồng giữa tháng
**Xử lý:** Prorate tiền phòng theo `bed_assignments` thực tế. Điện nước chốt theo chỉ số thực. Dịch vụ theo chu kỳ tính đến ngày trả. Phí phạt phá vỡ hợp đồng theo điều khoản (nếu báo trễ hơn `noticePeriodDays`).
**Triển khai:** Sinh hóa đơn `CHECKOUT_SETTLEMENT` ngay, không chờ kỳ chốt.

### 22. Người trả tiền khác người ở (phụ huynh trả)
**Xử lý:** Trường `customers.payer` lưu tên, SĐT, quan hệ, số tài khoản. Payment có `payerName`, `payerAccount` riêng.
**Triển khai:** Không có trường này thì đối soát chuyển khoản mang tên mẹ sẽ không khớp được với khách.

### 23. Khách trả trước nhiều tháng
**Xử lý:** Ghi nhận vào `creditBalance`, tự động phân bổ vào từng hóa đơn kỳ. **Doanh thu ghi nhận theo kỳ dịch vụ, không ghi hết vào tháng thu tiền.**
**Triển khai:** Báo cáo doanh thu lọc theo `invoice.periodFrom`, không theo `payment.receivedAt`. Báo cáo dòng tiền thì ngược lại.

### 24. Nhập sai chỉ số điện, đã phát hành hóa đơn
**Xử lý:** Tạo `invoice_adjustment` + tạo bản `utility_readings` mới với `adjustedFromReadingId` trỏ bản gốc. **Giữ cả hai bản.**
**Triển khai:** Thông báo khách kèm giải thích. Đây là tình huống thường xuyên nên quy trình phải mượt.

### 25. Đồng hồ điện quay vòng về 0
**Xử lý:** Tick cờ `isRollover`. Công thức: `consumption = (meter.maxReading − previousReading) + currentReading`.
**Triển khai:** `maxReading` cấu hình theo từng đồng hồ (thường 99999).

### 26. Thay đồng hồ giữa kỳ
**Xử lý:** Đóng đồng hồ cũ (ghi chỉ số cuối), tạo đồng hồ mới với `replacedByMeterId`. Tiêu thụ kỳ đó = phần cuối đồng hồ cũ + phần đầu đồng hồ mới. Hóa đơn hiển thị **2 dòng riêng** có giải thích.
**Triển khai:** Ảnh cả hai đồng hồ lúc thay là bắt buộc.

### 27. Nhiều phòng dùng chung một đồng hồ
**Xử lý:** `sharedMeterGroupId` + `sharingRule`: chia theo đầu người, theo phòng, hoặc tỷ lệ cố định. Quy tắc chia ghi rõ trong `calculationNote`.
**Triển khai:** Khi có người vào/ra giữa kỳ, trọng số tính theo **người-ngày**, không theo đầu người đơn thuần.

---

## C. Vận hành & tổ chức (28–34)

### 28. Xóa chi nhánh còn dữ liệu
**Xử lý:** Chặn. Chỉ cho `ARCHIVED` khi: 0 hợp đồng hoạt động, 0 công nợ, 0 cọc chưa hoàn. Dữ liệu lịch sử giữ vĩnh viễn.
**Triển khai:** Hiển thị rõ còn vướng gì: "Không thể lưu trữ: còn 12 hợp đồng đang hoạt động, 3 khoản cọc chưa hoàn."

### 29. Nhân viên chuyển chi nhánh
**Xử lý:** Cập nhật `staff.branchIds` và `user_role_assignments.branchIds`. **Lịch sử thao tác cũ giữ nguyên** — vẫn xem được trong audit của chi nhánh cũ.
**Triển khai:** `audit_logs` lưu `branchId` của thời điểm thao tác, không join ngược qua user.

### 30. Nhân viên nghỉ việc
**Xử lý:** Quy trình offboarding bắt buộc:
1. Vô hiệu hóa tài khoản **ngay**, không chờ ngày cuối
2. Thu hồi toàn bộ role assignment
3. Đóng ca két đang mở, quyết toán tiền mặt
4. Chuyển giao ticket đang xử lý
5. Chuyển giao đề xuất đang chờ duyệt
6. Thu hồi chìa khóa, thẻ
7. Giữ nguyên lịch sử thao tác

**Triển khai:** Chặn vô hiệu hóa nếu còn ca két chưa chốt, trừ khi quản lý chốt thay (có audit).

### 31. Khách yêu cầu xóa dữ liệu cá nhân
**Xử lý:** **Ẩn danh hóa**, không xóa. Thay tên/CCCD/SĐT/email/ảnh bằng giá trị mã hóa; giữ nguyên bản ghi tài chính (nghĩa vụ kế toán và kiểm toán). Đặt `anonymizedAt`.
**Triển khai:** Cần quyền Super Admin + ghi audit. Giải thích cho khách rằng bản ghi tài chính phải lưu theo quy định.

### 32. Hai người dùng cùng sửa một bản ghi
**Xử lý:** Khóa lạc quan (optimistic locking) — mỗi document có `version`; update kèm điều kiện `version` khớp. Không khớp → báo *"Bản ghi đã được [tên] cập nhật lúc [giờ]. Tải lại để xem thay đổi."*
**Triển khai:** Áp dụng cho: hóa đơn nháp, hồ sơ khách, hợp đồng, cấu hình.

### 33. Mất mạng giữa chừng khi check-in
**Xử lý:** Transaction rollback — không để lại dữ liệu dở dang. Client lưu bản nháp checklist vào `localStorage` để nhập lại nhanh.
**Triển khai:** Hiển thị rõ "chưa hoàn tất, dữ liệu đã lưu nháp", không để nhân viên tưởng đã xong.

### 34. Trùng CCCD nhưng khác tên
**Xử lý:** Không chặn cứng (có thể do nhập sai). Lưu kèm cờ `needsVerification`, đưa vào danh sách cần kiểm tra. Nếu xác định là cùng người → dùng công cụ gộp hồ sơ.
**Triển khai:** Công cụ gộp: chọn hồ sơ giữ lại, chuyển toàn bộ hợp đồng/hóa đơn/thanh toán sang, hồ sơ kia đánh dấu `mergedIntoCustomerId`. **Không xóa.**

---

## D. Dữ liệu, thời gian & hệ thống (35–40)

### 35. Khách không có CCCD
**Xử lý:** `idType` hỗ trợ `CMND`, `PASSPORT`, `BIRTH_CERT`. Dưới 14 tuổi: giấy khai sinh + CCCD người giám hộ, và giám hộ phải ký hợp đồng. Khách nước ngoài: hộ chiếu + visa/thẻ tạm trú.
**Triển khai:** Hệ thống tự tính tuổi từ `dateOfBirth` và yêu cầu thông tin giám hộ nếu <18.

### 36. Đổi chu kỳ thanh toán giữa chừng (tháng → quý)
**Xử lý:** Phụ lục hợp đồng (`version` +1). Áp dụng từ kỳ kế tiếp, **không hồi tố** kỳ đang chạy.
**Triển khai:** Nếu khách đã trả trước theo chu kỳ cũ → phần dư vào `creditBalance`.

### 37. Đăng ký tạm trú với công an
**Xử lý:** Cờ `temporaryResidenceStatus` trên khách. Danh sách khách chưa khai báo, cảnh báo sau N ngày kể từ check-in. **Export danh sách theo biểu mẫu**: họ tên, ngày sinh, giới tính, CCCD, nơi thường trú, ngày đến, ngày đi dự kiến, phòng.
**Triển khai:** Nghĩa vụ pháp lý bắt buộc, hệ thống tự làm thường bỏ quên hoàn toàn.

### 38. Backup database nhưng thiếu file ảnh
**Xử lý:** Backup **cả hai**: database và object storage (ảnh CCCD, hợp đồng PDF, ảnh hiện trạng, ảnh đồng hồ). Bật versioning + sao chép sang vùng khác.
**Triển khai:** Mất ảnh CCCD và hợp đồng PDF là mất bằng chứng pháp lý. Đây là lỗ hổng backup phổ biến nhất.

### 39. Múi giờ và mốc chốt kỳ nửa đêm
**Xử lý:** Lưu UTC, hiển thị `Asia/Ho_Chi_Minh`. `startDate`/`endDate` là **ngày thuần**, đặt tại 00:00 giờ VN. Job cron chạy theo giờ VN.
**Triển khai:** Viết test cho ranh giới tháng: hợp đồng bắt đầu 01/09 phải hiển thị 01/09, không phải 31/08.

### 40. Tổng chỉ số các phòng lệch đồng hồ tổng tòa nhà
**Xử lý:** Báo cáo chênh lệch mỗi kỳ. Chênh >10% → cảnh báo. Nguyên nhân thường gặp: rò rỉ, câu trộm điện/nước, đọc sai chỉ số, hoặc tiêu thụ khu vực chung chưa được tính.
**Triển khai:** Tính năng phát hiện thất thoát thật sự, thường bị bỏ qua hoàn toàn. Chi phí triển khai rất thấp (chỉ cần một dòng so sánh trong báo cáo).

---

## Bảng ưu tiên xử lý

| Mức | Case | Lý do |
|---|---|---|
| **Phải có ở Phase 1** | 1, 2, 3, 5, 13, 14, 15, 17, 18, 22, 25, 28, 32, 34, 39 | Không có thì dữ liệu sai hoặc mất tiền |
| **Phase 1–2** | 4, 6, 7, 9, 10, 11, 12, 16, 19, 20, 21, 23, 24, 26, 27, 30, 37, 38 | Xảy ra thường xuyên trong vận hành thật |
| **Phase 2–3** | 8, 29, 31, 33, 35, 36, 40 | Ít gặp hơn nhưng vẫn cần xử lý đúng |

**Lưu ý:** mỗi case ở nhóm "Phải có ở Phase 1" nên có ít nhất một test tự động. Đây là những chỗ mà lỗi rất khó phát hiện bằng mắt và rất tốn kém để sửa sau.
