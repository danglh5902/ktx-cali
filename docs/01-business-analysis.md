# 01 — Phân tích bài toán thực tế

## 1. KTX nhiều chi nhánh vận hành như thế nào?

### 1.1 Nhịp vận hành thực tế trong tháng

KTX không phải khách sạn. Nhịp của nó xoay quanh **chu kỳ tháng**, không phải chu kỳ đêm.

| Thời điểm | Việc gì diễn ra |
|---|---|
| **Ngày 25–28 tháng trước** | Đi ghi chỉ số điện nước từng phòng. Đây là việc tốn thời gian và dễ sai nhất. |
| **Ngày 28–30** | Tính tiền, lập hóa đơn từng phòng/từng người. Ở Excel việc này mất 1–2 ngày/chi nhánh. |
| **Ngày 1–5** | Gửi hóa đơn (dán bảng tin, gửi Zalo nhóm, nhắn riêng). Bắt đầu thu tiền. |
| **Ngày 5–10** | Cao điểm thu tiền. Lễ tân thu tiền mặt liên tục, ghi sổ tay hoặc Excel. |
| **Ngày 10–15** | Đòi nợ người chưa đóng. Gọi điện, nhắn Zalo, dán thông báo. |
| **Cuối tháng** | Chốt sổ, báo cáo cho chủ. Thường trễ 5–10 ngày và số liệu không khớp. |
| **Rải rác cả tháng** | Khách mới đến xem phòng, đặt cọc, check-in; khách cũ báo trả phòng; sự cố hỏng hóc; khách chuyển phòng. |

### 1.2 Tính mùa vụ — đặc thù Việt Nam

Với tệp **sinh viên + người đi làm** như Cali:

- **Tháng 8–9:** cao điểm tuyệt đối. Nhập học. Lấp đầy có thể chạm 100%, danh sách chờ dài.
- **Tháng 1–2 (Tết):** sinh viên về quê 3–4 tuần. Nhiều bạn vẫn giữ giường và trả tiền (không muốn mất chỗ), nhưng một số muốn "tạm ngưng". **Chính sách giữ chỗ dịp Tết phải rõ ràng và có trong hệ thống**, nếu không lễ tân mỗi người xử lý một kiểu.
- **Tháng 6–7:** nghỉ hè, tỷ lệ trống cao nhất năm. Đây là lúc cần biết chính xác giường trống để chạy khuyến mãi.
- **Người đi làm:** ít mùa vụ hơn, nhưng biến động theo đợt tuyển dụng của doanh nghiệp lân cận.

→ **Hệ quả thiết kế:** báo cáo lấp đầy phải xem được theo tháng và **so sánh cùng kỳ năm trước**, không chỉ xem tháng hiện tại.

### 1.3 Điều gì thay đổi khi có nhiều chi nhánh

Một chi nhánh: chủ nhớ hết trong đầu. Từ chi nhánh thứ 2 trở đi, xuất hiện các vấn đề mới:

1. **Không so sánh được.** Chi nhánh A lấp đầy 95%, chi nhánh B 70% — vì sao? Do giá, do vị trí, do quản lý? Không có số liệu chuẩn hóa thì không trả lời được.
2. **Quy trình phân kỳ.** Mỗi quản lý tự nghĩ ra cách làm. Chi nhánh A thu cọc 1 tháng, chi nhánh B thu 2 tháng. Khách so sánh với nhau và khiếu nại.
3. **Chủ mất khả năng kiểm soát tiền mặt.** Tiền thu tại quầy ở 3 nơi khác nhau. Không biết ai thu bao nhiêu, nộp về khi nào.
4. **Khách muốn chuyển chi nhánh.** Sinh viên đổi trường, người đi làm đổi công ty. Cần chuyển nội bộ mà giữ nguyên lịch sử và cọc.
5. **Nhân viên luân chuyển.** Quản lý chi nhánh A sang hỗ trợ chi nhánh B — quyền truy cập phải đổi theo, nhưng lịch sử thao tác cũ phải giữ nguyên.
6. **Chuẩn hóa vs linh hoạt.** Không thể ép mọi chi nhánh dùng chung một bảng giá (khác vị trí, khác chất lượng). Nhưng cũng không thể để mỗi nơi một chính sách. → **Cấu hình theo chi nhánh, nhưng khuôn mẫu chung từ hệ thống.**

---

## 2. Vấn đề khi quản lý bằng Excel / Google Sheet / Zalo

Đây không phải liệt kê lý thuyết — đây là những gì thực sự xảy ra.

### 2.1 Excel / Google Sheet

| Vấn đề | Hậu quả thực tế |
|---|---|
| **Không có nguồn sự thật duy nhất** | File "DanhSachKhach_final_v3_moinhat.xlsx". Hai người sửa hai bản khác nhau. |
| **Không có lịch sử** | Ai sửa ô tiền phòng từ 1.8tr thành 1.5tr? Khi nào? Không ai biết. |
| **Công thức bị gãy** | Chèn thêm dòng làm lệch công thức tính tiền điện. Sai cả tháng mới phát hiện. |
| **Không kiểm soát được trạng thái giường realtime** | Lễ tân nhận cọc cho giường mà người khác vừa nhận cọc 10 phút trước. |
| **Tính tiền thủ công** | 500 giường × (tiền phòng + điện + nước + dịch vụ + phạt + giảm) = hàng nghìn phép tính/tháng. Sai số là chắc chắn. |
| **Không tra cứu được lịch sử khách** | Khách quay lại lần 2, không biết trước đây có nợ hay vi phạm gì. |
| **Không tổng hợp nhiều chi nhánh** | Chủ phải mở 3 file, copy vào file thứ 4. Mất 1 ngày, số vẫn lệch. |
| **Không phân quyền** | Cho lễ tân xem file thì thấy luôn doanh thu, giá vốn, lương nhân viên. |
| **Rủi ro mất dữ liệu** | Xóa nhầm sheet. Google Sheet có history nhưng không ai biết dùng. |

### 2.2 Zalo

Zalo là công cụ liên lạc tốt nhưng là công cụ quản lý tệ:

- **Thông tin chìm.** Khách báo hỏng điều hòa lúc 22h trong nhóm 80 người → trôi mất → 3 ngày sau khách bức xúc.
- **Không truy vết.** "Em đã báo rồi mà!" — không ai chứng minh được.
- **Không có SLA.** Không biết sự cố nào đã quá hạn.
- **Ảnh chuyển khoản trong chat.** Lễ tân phải tự đối chiếu với sao kê. Rất dễ bỏ sót hoặc ghi nhận 2 lần.
- **Nhân viên nghỉ việc mang theo cả nhóm chat và dữ liệu khách.**
- **Không phân biệt thông báo chính thức và tán gẫu.**

### 2.3 Phần mềm rời rạc

Một số KTX dùng: phần mềm kế toán riêng + Google Form đăng ký + Sheet quản lý phòng + Zalo hỗ trợ.

Vấn đề: **dữ liệu không nối nhau.** Khách đăng ký trên Form → nhập tay vào Sheet → nhập tay vào phần mềm kế toán. Nhập 3 lần, sai ở 1 chỗ là lệch toàn bộ. Không ai muốn làm việc đối chiếu nên không ai đối chiếu.

### 2.4 Chi phí ẩn — con số để thuyết phục đầu tư

Ước tính cho 1 chi nhánh ~200 giường:

| Việc | Thời gian/tháng (thủ công) | Sau khi có hệ thống |
|---|---|---|
| Ghi & nhập chỉ số điện nước | 6–8 giờ | 2–3 giờ |
| Lập hóa đơn | 10–16 giờ | 15 phút (review bản nháp) |
| Gửi hóa đơn | 4–6 giờ | Tự động |
| Ghi nhận & đối soát thanh toán | 10–15 giờ | 2–3 giờ |
| Nhắc nợ | 5–8 giờ | Tự động + 1 giờ xử lý ca khó |
| Lập báo cáo cho chủ | 4–8 giờ | Realtime |
| **Tổng** | **~40–60 giờ/tháng/chi nhánh** | **~7–10 giờ** |

Chưa kể **thất thoát**: sai sót tính tiền, quên thu, tiền mặt chênh lệch, giường trống không ai biết. Ở quy mô 500 giường, chỉ cần thất thoát 1% doanh thu đã là con số đáng kể mỗi tháng.

---

## 3. Những đối tượng cần được quản lý

### 3.1 Đối tượng vật lý (tài sản cố định)
- Chi nhánh, tòa nhà, tầng, phòng, **giường** (đơn vị bán)
- Đồng hồ điện/nước (có thể theo phòng, theo tầng, hoặc chung)
- Tài sản trong phòng: điều hòa, tủ lạnh, giường, nệm, tủ, bàn, ghế, quạt
- Tài sản khu chung: máy giặt, cây nước, camera, router wifi, thang máy

### 3.2 Đối tượng con người
- **Khách thuê** (tenant) — trung tâm của hệ thống
- **Người liên hệ khẩn cấp / phụ huynh** — với sinh viên, phụ huynh thường là người trả tiền
- **Nhân viên**: quản lý chi nhánh, lễ tân, kế toán, kỹ thuật, tạp vụ, bảo vệ
- **Chủ doanh nghiệp**
- **Khách vãng lai**: người thăm, shipper, nhà cung cấp, thợ ngoài

### 3.3 Đối tượng nghiệp vụ (chứng từ)
- Đăng ký / đặt chỗ (booking)
- Hợp đồng
- Phiếu check-in / check-out (có biên bản kiểm kê)
- Hóa đơn + dòng hóa đơn
- Phiếu thu / thanh toán
- Sổ cọc
- Chỉ số điện nước
- Ticket bảo trì
- Biên bản vi phạm
- Phiếu chi (chi phí vận hành)
- Phiếu chốt két

### 3.4 Đối tượng cấu hình
- Bảng giá (theo chi nhánh, theo loại phòng, theo giường)
- Danh mục dịch vụ (theo chi nhánh)
- Nội quy & mức phạt (theo chi nhánh)
- Template hợp đồng
- Template thông báo
- Vai trò & quyền

---

## 4. Dữ liệu phát sinh hằng ngày / hằng tháng

### Hằng ngày
| Dữ liệu | Khối lượng ước tính (500 giường) | Ai tạo |
|---|---|---|
| Thanh toán | 5–40 giao dịch (cao điểm đầu tháng) | Lễ tân, cổng thanh toán |
| Ticket bảo trì | 1–5 | Khách, nhân viên |
| Khách thăm ra vào | 5–30 | Bảo vệ, lễ tân |
| Booking mới | 0–10 (mùa cao điểm nhiều hơn) | Lễ tân, web |
| Check-in / Check-out | 0–8 | Lễ tân |
| Chuyển phòng/giường | 0–3 | Lễ tân |
| Vi phạm | 0–3 | Quản lý, bảo vệ |
| Chốt két | 1–3 (theo ca) | Lễ tân |
| Audit log | 200–1.000 bản ghi | Hệ thống |

### Hằng tháng
| Dữ liệu | Khối lượng |
|---|---|
| Chỉ số điện nước | Bằng số đồng hồ (50–150 phòng) × 2 loại |
| Hóa đơn | ~số hợp đồng đang hoạt động (300–500) |
| Dòng hóa đơn | 4–10 dòng/hóa đơn → 1.500–5.000 dòng |
| Hợp đồng mới / gia hạn | 20–80 |
| Chi phí vận hành | 20–50 phiếu |
| Báo cáo | ~10 loại |

→ **Kết luận về quy mô dữ liệu:** rất nhỏ theo chuẩn kỹ thuật (dưới 1 triệu document/năm ở quy mô hiện tại). **Vấn đề không phải hiệu năng, mà là tính đúng đắn và khả năng truy vết.** Đừng tối ưu hóa sớm; hãy đầu tư vào tính toàn vẹn dữ liệu và audit.

---

## 5. Những quy trình cần tự động hóa (xếp theo mức tiết kiệm công sức)

| Hạng | Quy trình | Tiết kiệm | Độ khó |
|---|---|---|---|
| 1 | **Sinh hóa đơn tháng hàng loạt** | 10–16 giờ/tháng/chi nhánh | Trung bình |
| 2 | **Nhắc thanh toán tự động theo bậc** | 5–8 giờ/tháng + tăng tỷ lệ thu | Thấp |
| 3 | **Tính tiền điện nước từ chỉ số** | 4–6 giờ/tháng + hết sai số | Thấp |
| 4 | **Đối soát thanh toán qua webhook ngân hàng** | 8–12 giờ/tháng | Cao (cần Phase 3) |
| 5 | **Cảnh báo hợp đồng sắp hết hạn** | Ngăn mất khách do quên | Thấp |
| 6 | **Tự hết hạn giữ chỗ chưa cọc** | Ngăn "khóa giường ảo" | Thấp |
| 7 | **Cập nhật trạng thái giường theo sự kiện** | Ngăn bán trùng giường | Thấp |
| 8 | **Báo cáo realtime cho chủ** | 4–8 giờ/tháng | Thấp |
| 9 | **Tạo ticket vệ sinh khi khách trả phòng** | Ngăn quên dọn phòng | Thấp |
| 10 | **Cộng phí phạt vào hóa đơn kỳ sau** | Ngăn quên thu phạt | Thấp |

Chi tiết: [16-automation-ai.md](16-automation-ai.md)

---

## 6. Rủi ro thường gặp trong vận hành KTX

### 6.1 Rủi ro tài chính
| Rủi ro | Cơ chế phòng ngừa trong hệ thống |
|---|---|
| **Thất thoát tiền mặt tại quầy** | Két theo ca (`cash_sessions`), chốt ca bắt buộc, chênh lệch phải có phê duyệt |
| **Ghi nhận thanh toán 2 lần** | Idempotency key trên mọi payment, unique index mã giao dịch ngân hàng |
| **Quên thu tiền một phòng** | Hóa đơn sinh tự động theo hợp đồng — không thể sót nếu hợp đồng còn hiệu lực |
| **Nhân viên tự ý giảm giá cho người quen** | Giảm giá là dòng hóa đơn riêng, bắt buộc có lý do, vượt hạn mức phải duyệt, có audit |
| **Cọc bị coi là doanh thu** | Sổ cọc riêng, không bao giờ vào báo cáo doanh thu |
| **Không biết nợ thật là bao nhiêu** | Aging report tự động theo 4 mốc thời gian |
| **Chủ không biết chi phí** | Module `expenses` bắt buộc — có P&L theo chi nhánh |
| **Sửa hóa đơn đã phát hành để che sai sót** | Cấm sửa; chỉ cho bút toán điều chỉnh có phê duyệt và audit |

### 6.2 Rủi ro vận hành
| Rủi ro | Phòng ngừa |
|---|---|
| **Bán trùng giường** | Ràng buộc DB: một giường không thể có 2 assignment chồng thời gian |
| **Giường trống mà không ai biết** | Job reconcile nightly + dashboard sơ đồ giường |
| **Quên dọn phòng trước khi khách mới vào** | Check-out → giường về `CLEANING`, tự tạo task vệ sinh, không về `AVAILABLE` |
| **Sự cố bị bỏ quên** | Ticket có SLA + auto-escalate |
| **Hợp đồng hết hạn mà không ai biết** | Cảnh báo D-30/D-15/D-7 |
| **Khách bỏ đi không báo** | Quy trình abandonment: cảnh báo sau N ngày không liên lạc được |
| **Tài sản trong phòng mất/hỏng không ai chịu trách nhiệm** | Kiểm kê tài sản có ký nhận tại check-in và check-out, kèm ảnh |

### 6.3 Rủi ro pháp lý & an ninh
| Rủi ro | Phòng ngừa |
|---|---|
| **Không đăng ký tạm trú cho khách** | Nghĩa vụ bắt buộc của cơ sở lưu trú. Hệ thống phải export được danh sách theo mẫu, theo dõi trạng thái đã/chưa khai báo |
| **Lộ dữ liệu cá nhân khách (ảnh CCCD)** | Nghị định 13/2023: mã hóa at-rest, URL có hạn, log mọi lượt xem, giới hạn theo vai trò |
| **Nhân viên nghỉ việc mang theo danh sách khách** | Lễ tân không có quyền export danh sách khách; mọi export đều ghi audit |
| **Người lạ vào KTX** | Sổ khách thăm, xác nhận bởi người được thăm |
| **Tranh chấp tiền cọc khi trả phòng** | Biên bản kiểm kê có ảnh 2 chiều (lúc vào và lúc ra) |

### 6.4 Rủi ro hệ thống
| Rủi ro | Phòng ngừa |
|---|---|
| **Mất dữ liệu** | Backup tự động + **diễn tập restore định kỳ** (backup chưa từng restore = không có backup) |
| **Quên backup file ảnh** | Object storage cũng phải có backup/versioning, không chỉ database |
| **User chi nhánh A xem được dữ liệu chi nhánh B** | Scope guard tập trung + test tự động bắt buộc cho mọi endpoint |
| **Tài khoản nhân viên cũ vẫn hoạt động** | Quy trình offboarding: vô hiệu hóa ngay, chuyển giao công việc đang xử lý |
| **Dữ liệu sai do nhập tay** | Validate ngược (chỉ số điện không thể nhỏ hơn kỳ trước), cảnh báo bất thường |

---

## 7. Những thứ thường bị bỏ sót

Phần này là kinh nghiệm thực tế — những gì hệ thống tự làm thường thiếu.

### 7.1 Tính năng developer hay quên

| # | Tính năng | Vì sao quan trọng |
|---|---|---|
| 1 | **Chi phí vận hành (`expenses`)** | Hệ thống nào cũng làm doanh thu, hiếm ai làm chi phí. Không có chi phí thì Owner **không bao giờ biết lợi nhuận thật theo chi nhánh** — mà đó chính là con số ông ấy muốn xem nhất. |
| 2 | **Két tiền mặt theo ca** | Không có thì tiền mặt thất thoát không ai phát hiện. |
| 3 | **Snapshot dữ liệu vào chứng từ** | In lại hóa đơn 6 tháng trước phải ra đúng tên, phòng, giá **lúc đó** — không phải thông tin hiện tại. Nếu chỉ lưu `customerId` và join, hóa đơn cũ sẽ đổi nội dung khi khách chuyển phòng. |
| 4 | **Credit balance (khách trả thừa)** | Khách chuyển dư 200k. Tiền đó ở đâu trong hệ thống? Nếu không có chỗ, lễ tân sẽ ghi sổ tay. |
| 5 | **Công cụ import từ Excel hiện tại** | Không import được dữ liệu đang có thì nhân viên sẽ quay lại Sheet. Đây là yếu tố **quyết định hệ thống có được dùng thật hay không**. |
| 6 | **Bàn giao ca lễ tân** | Ghi chú chuyển ca: việc còn tồn, khách hẹn quay lại, chìa khóa đang giữ. |
| 7 | **In ấn**: phiếu thu, hóa đơn, hợp đồng, biên bản kiểm kê | Khách VN vẫn cần giấy. In trực tiếp từ màn hình xem trên trình duyệt (khổ giấy A5/A4 và máy in nhiệt) — hệ thống không tạo/lưu file PDF riêng. |
| 8 | **Tìm kiếm toàn cục** | Lễ tân cần gõ SĐT ra ngay khách + phòng + nợ. Không có thì họ sẽ dùng Ctrl+F trên Excel. |
| 9 | **Chế độ offline / mất mạng** | Ít nhất phải rollback sạch, không để lại dữ liệu dở dang. |
| 10 | **Múi giờ và mốc chốt kỳ** | "Ngày 1" bắt đầu lúc nào? Lưu UTC, hiển thị Asia/Ho_Chi_Minh, mốc chốt kỳ theo giờ VN. |

### 7.2 Nghiệp vụ admin cần nhưng ít được đề cập

| # | Nghiệp vụ |
|---|---|
| 1 | **Đăng ký tạm trú** — export danh sách theo mẫu công an, theo dõi ai đã/chưa khai báo |
| 2 | **Danh sách chờ (waitlist)** mùa cao điểm — ai đăng ký trước được ưu tiên |
| 3 | **Ghép phòng theo yêu cầu** — sinh viên muốn ở cùng bạn, hoặc yêu cầu cùng giới/cùng trường |
| 4 | **Chính sách Tết / nghỉ hè** — giữ chỗ giá ưu đãi khi khách về quê dài ngày |
| 5 | **Khách đặc biệt** — được giảm giá dài hạn (người quen của chủ). Phải có chỗ ghi nhận chính thức, có phê duyệt, thay vì ghi nhớ miệng |
| 6 | **Hoàn cọc sau khi đã trả phòng** — thường trả sau 7–15 ngày, cần theo dõi "đến hạn hoàn" |
| 7 | **Nhật ký bàn giao chìa khóa / thẻ từ** |
| 8 | **Danh sách đen (blacklist)** — khách từng bỏ trốn, gây rối. Cảnh báo khi đăng ký lại |
| 9 | **Giá theo thời hạn thuê** — thuê 12 tháng rẻ hơn 3 tháng |
| 10 | **Báo cáo cho cơ quan PCCC / kiểm tra hành chính** — số người thực tế đang ở |

### 7.3 Dữ liệu bắt buộc phải audit

Không phải mọi thứ đều cần audit — audit tất cả sẽ tạo nhiễu. Nhưng những mục sau là **bắt buộc**:

- Mọi thay đổi trên hóa đơn đã phát hành (adjustment, void)
- Mọi giao dịch thanh toán và việc phân bổ thanh toán
- Mọi thao tác trên sổ cọc (trừ cọc, hoàn cọc, tịch thu cọc)
- Thay đổi giá (bảng giá, giá phòng, giá giường, giá dịch vụ)
- Giảm giá và xóa nợ
- Thay đổi vai trò/quyền của người dùng
- Xóa bất kỳ dữ liệu nào
- Chuyển phòng/giường/chi nhánh
- Chốt két có chênh lệch
- Mọi lượt **xem** ảnh CCCD (do là dữ liệu nhạy cảm)
- Mọi lượt export dữ liệu khách

Với mỗi bản ghi: ai, làm gì, dữ liệu trước, dữ liệu sau, thời gian, IP, **lý do** (bắt buộc với nhóm tài chính).

### 7.4 Vấn đề phân quyền hay bị xem nhẹ

1. **Quyền xem tiền** khác **quyền thu tiền** khác **quyền sửa số tiền**. Ba quyền riêng biệt, đừng gộp.
2. **Quyền export là quyền nguy hiểm nhất** — export một lần là mang được toàn bộ dữ liệu ra ngoài.
3. **Phạm vi chi nhánh phải áp dụng cả trên báo cáo**, không chỉ trên màn hình danh sách. Rất hay bị quên ở các endpoint tổng hợp.
4. **Owner nên là read-only.** Tránh rủi ro và giữ audit sạch.
5. **Quyền theo thời gian**: nhân viên hỗ trợ chi nhánh khác 1 tháng → quyền tạm thời có hạn, tự hết.
6. **Hạn mức phê duyệt** cần cấu hình được, không hard-code.

### 7.5 Vấn đề tài chính hay bị xem nhẹ

1. Cọc không phải doanh thu (đã nói ở trên — nhắc lại vì quan trọng).
2. **Doanh thu ghi nhận theo kỳ dịch vụ, không theo ngày thu tiền.** Khách trả trước 6 tháng không phải doanh thu tháng này.
3. **Làm tròn tiền** phải nhất quán, ghi rõ trong hóa đơn.
4. **Phân bổ thanh toán** khi khách nợ nhiều kỳ: mặc định trả hóa đơn cũ nhất trước (FIFO), nhưng cho phép lễ tân chỉ định.
5. **Chi phí phân bổ chung** (lương quản lý vùng, marketing) cần quy tắc phân bổ về chi nhánh để P&L có nghĩa.
6. **Phân biệt "đã phát hành" và "đã thu"** trong báo cáo doanh thu. Hai con số rất khác nhau.

### 7.6 Vấn đề khi mở rộng từ 1 lên 10–50 chi nhánh

| Vấn đề | Cách chuẩn bị ngay từ đầu |
|---|---|
| Mã phòng/giường trùng giữa chi nhánh | Unique theo `(branchId, code)`, không unique toàn cục. Số hóa đơn thì unique toàn cục. |
| Báo cáo tổng hợp chậm dần | Từ Phase 2 dùng `report_snapshots` tính sẵn theo ngày, không aggregate realtime |
| Cấu hình phình to | Kế thừa: cấu hình cấp tổ chức → chi nhánh override. Không copy-paste cấu hình |
| Phân quyền phức tạp | Scope dạng danh sách chi nhánh ngay từ đầu, không phải một `branchId` đơn |
| Onboard chi nhánh mới mất nhiều ngày | Chức năng "nhân bản cấu hình từ chi nhánh mẫu" |
| Nhiều múi công việc, nhiều người đăng nhập | Index luôn đặt `branchId` ở vị trí đầu compound index |
| Chủ muốn xem hợp nhất theo vùng | Chuẩn bị trường `region` trên `branches` từ đầu, dù chưa dùng |

### 7.7 Vấn đề hiệu năng

Quy mô hiện tại không có vấn đề hiệu năng. Nhưng 3 chỗ sẽ chậm trước tiên:

1. **Sơ đồ giường** — cần trả về vài trăm giường kèm trạng thái và người ở. → denormalize `branchId`, `roomId`, `currentAssignmentId` vào `beds`; một truy vấn duy nhất.
2. **Báo cáo doanh thu nhiều tháng × nhiều chi nhánh** — aggregate trên `invoice_lines`. → snapshot theo ngày từ Phase 2.
3. **Aging công nợ** — quét toàn bộ hóa đơn chưa thanh toán. → index `{branchId, status, dueDate}`.

### 7.8 Vấn đề bảo mật

1. Ảnh CCCD **không được để public URL**. Dùng presigned URL hết hạn sau vài phút.
2. Portal khách thuê là bề mặt tấn công lớn nhất → rate limit, khóa tài khoản sau N lần sai, không tiết lộ "email không tồn tại".
3. Không bao giờ trả về nhiều dữ liệu hơn màn hình cần (tránh lộ qua API response).
4. Webhook thanh toán phải verify chữ ký, không tin payload.
5. Mật khẩu mặc định khi tạo tài khoản nhân viên → bắt buộc đổi lần đầu.
6. Session của nhân viên nên có thời hạn ngắn hơn của khách thuê.

### 7.9 Vấn đề backup / khôi phục

1. Backup database **hằng ngày**, giữ 30 ngày + bản cuối tháng giữ 12 tháng.
2. Backup **lưu trữ ảnh** (Cloudinary — CCCD, ảnh kiểm kê hợp đồng, ảnh hiện trạng) — hay bị quên nhất.
3. **Diễn tập restore mỗi quý.** Ghi lại thời gian restore thực tế.
4. Xác định rõ **RPO/RTO**: mất tối đa bao nhiêu dữ liệu (đề xuất ≤ 24 giờ), khôi phục trong bao lâu (đề xuất ≤ 4 giờ).
5. Audit log tài chính nên có bản sao **append-only** riêng, không xóa được kể cả khi DB chính bị xâm nhập.
6. Trước mỗi lần migration schema: backup + có kịch bản rollback.
