# 02 — Vision, Personas & Business Model

## 1. Vision

> **Một nơi duy nhất để biết mọi giường ở mọi chi nhánh Cali đang ở trạng thái nào, ai đang ở, ai còn nợ bao nhiêu — cập nhật theo thời gian thực, và ai cũng chỉ thấy đúng phần việc của mình.**

### Ba cam kết sản phẩm

1. **Giảm việc thủ công cho nhân viên.** Mục tiêu cụ thể: giảm thời gian lập hóa đơn từ 10–16 giờ xuống dưới 1 giờ mỗi tháng mỗi chi nhánh.
2. **Cho chủ doanh nghiệp con số đúng, ngay lập tức.** Tỷ lệ lấp đầy, doanh thu, công nợ, lợi nhuận theo chi nhánh — không phải chờ cuối tháng.
3. **Mọi đồng tiền đều truy vết được.** Mỗi thay đổi tài chính có người chịu trách nhiệm, có lý do, có dấu vết không xóa được.

### Nguyên tắc thiết kế

| Nguyên tắc | Nghĩa là |
|---|---|
| **Thực dụng trước, hoàn hảo sau** | Ưu tiên tính năng thay thế được Excel. Không làm tính năng "có thì hay". |
| **Lễ tân là người dùng chính** | Họ dùng hệ thống 8 giờ/ngày. Tối ưu cho họ trước Owner. |
| **Không tin vào kỷ luật của con người** | Nhân viên sẽ quên bấm nút. Hệ thống phải tự phát hiện và nhắc. |
| **Dữ liệu tài chính là bất biến** | Không sửa, chỉ điều chỉnh có dấu vết. |
| **Multi-branch từ dòng code đầu tiên** | Thêm `branchId` sau này là dự án migration đau đớn. |
| **Không nhồi AI** | AI chỉ vào khi thay thế được một việc thủ công cụ thể, đo được. |

---

## 2. User Personas

### P1 — Anh Cường, Chủ doanh nghiệp (Owner)
> 45 tuổi. Đầu tư 3 KTX, đang tính mở thêm 2. Không rành công nghệ, dùng điện thoại nhiều hơn máy tính.

| | |
|---|---|
| **Mục tiêu** | Biết chính xác mỗi chi nhánh lãi bao nhiêu. Biết có đang bị thất thoát không. Quyết định mở chi nhánh mới ở đâu. |
| **Nỗi đau** | Số liệu về trễ và không tin được. Hỏi quản lý "tháng này lấp đầy bao nhiêu?" thì phải chờ nửa ngày. Không biết tiền mặt ở quầy có đủ về không. |
| **Dùng gì** | Mở app 1–2 lần/ngày, chủ yếu trên điện thoại. Xem 5 con số rồi tắt. Cuối tháng xem báo cáo kỹ hơn. |
| **Thành công khi** | Mở app, trong 10 giây biết được tình hình toàn hệ thống. |
| **Thiết kế cho anh ấy** | Dashboard mobile-first, 5 KPI lớn, so sánh cùng kỳ. **Read-only.** Báo cáo tự động gửi sáng thứ Hai. |

### P2 — Chị Hương, Quản lý chi nhánh (Branch Manager)
> 32 tuổi. Quản lý 1 chi nhánh 180 giường, 3 nhân viên dưới quyền. Dùng máy tính tốt, Excel khá.

| | |
|---|---|
| **Mục tiêu** | Giữ tỷ lệ lấp đầy cao, thu đủ tiền đúng hạn, không để sự cố tồn đọng. |
| **Nỗi đau** | Cuối tháng làm hóa đơn mệt mỏi. Phải nhớ ai sắp hết hợp đồng. Không biết lễ tân thu tiền đã ghi đủ chưa. |
| **Dùng gì** | Cả ngày. Duyệt hóa đơn, duyệt giảm giá, xem sơ đồ giường, giao việc cho kỹ thuật. |
| **Thành công khi** | Ngày 28 bấm một nút ra toàn bộ hóa đơn nháp, review 15 phút là xong. |
| **Thiết kế cho chị ấy** | Dashboard chi nhánh + hàng chờ phê duyệt + sơ đồ giường + cảnh báo. |

### P3 — Em Linh, Lễ tân (Receptionist)
> 23 tuổi. Trực quầy 8 giờ/ngày. Vừa tiếp khách vừa nghe điện thoại vừa thu tiền. Dùng máy tính ở mức cơ bản.

| | |
|---|---|
| **Mục tiêu** | Làm xong việc trước mặt khách thật nhanh, không để khách đợi. Không bị mắng vì làm sai. |
| **Nỗi đau** | Khách đứng trước mặt hỏi "em còn nợ bao nhiêu?" mà phải mở 3 file mới trả lời được. Thu tiền xong quên ghi. Cuối ca không khớp tiền. |
| **Dùng gì** | Liên tục. Tìm khách, thu tiền, check-in, tạo ticket. |
| **Thành công khi** | Gõ số điện thoại → thấy ngay khách, phòng, nợ, hợp đồng. Thu tiền 3 cú click. |
| **Thiết kế cho em ấy** | **Ô tìm kiếm toàn cục luôn ở trên cùng.** 4 nút tác vụ lớn. Ít chữ, nút to. Phím tắt. |

### P4 — Chị Mai, Kế toán (Accountant)
> 38 tuổi. Phụ trách tài chính cả 3 chi nhánh. Excel rất giỏi, tỉ mỉ, cẩn thận.

| | |
|---|---|
| **Mục tiêu** | Sổ sách khớp. Đối soát ngân hàng đúng. Công nợ rõ ràng. |
| **Nỗi đau** | Mất hàng chục giờ đối chiếu sao kê ngân hàng với danh sách khách đóng tiền. Không biết khoản chuyển khoản này là của ai khi khách ghi nội dung tùy tiện. |
| **Dùng gì** | Hằng ngày vào buổi sáng: đối soát, duyệt hoàn cọc, kiểm tra công nợ. Cuối tháng làm báo cáo. |
| **Thành công khi** | Đối soát tự động khớp >90%, chỉ xử lý tay phần còn lại. |
| **Thiết kế cho chị ấy** | Màn hình đối soát 2 cột (sao kê ↔ thanh toán), aging report, export Excel đầy đủ. |

### P5 — Anh Tuấn, Kỹ thuật (Technician)
> 40 tuổi. Phụ trách kỹ thuật 2 chi nhánh. Dùng điện thoại là chính, ít khi ngồi máy tính.

| | |
|---|---|
| **Mục tiêu** | Biết hôm nay phải sửa gì ở đâu. Không bị trách là chậm. |
| **Nỗi đau** | Được báo qua Zalo, trôi mất. Đến nơi mới biết cần mang đồ gì. |
| **Dùng gì** | Mobile. Xem danh sách việc, chụp ảnh trước/sau, đóng ticket. |
| **Thiết kế cho anh ấy** | **Giao diện mobile trước.** Danh sách việc của tôi. Upload ảnh dễ. Không cần nhập nhiều chữ. |

### P6 — Bạn Nam, Khách thuê là sinh viên (Tenant)
> 20 tuổi. Năm 2 đại học. Bố mẹ trả tiền phòng. Dùng điện thoại thành thạo.

| | |
|---|---|
| **Mục tiêu** | Biết tháng này đóng bao nhiêu, đóng thế nào. Báo hỏng đồ mà có người sửa. |
| **Nỗi đau** | Không biết tiền điện tính sao, thấy đắt mà không kiểm chứng được. Báo hỏng trong nhóm Zalo không ai phản hồi. |
| **Dùng gì** | Vài lần/tháng. Xem hóa đơn, quét QR trả tiền, báo sự cố. |
| **Thiết kế cho bạn ấy** | Portal web mobile (không cần app native ở giai đoạn đầu). Hóa đơn **có chi tiết chỉ số điện đầu-cuối**. QR thanh toán. Nút báo sự cố. |

### P7 — Anh Phong, Khách thuê là người đi làm
> 27 tuổi. Nhân viên văn phòng. Ở dài hạn, thuê phòng ít người hoặc phòng riêng.

| | |
|---|---|
| **Khác P6** | Tự trả tiền, chuyển khoản. Kỳ vọng dịch vụ và sự chuyên nghiệp cao hơn. Nhạy cảm với tiếng ồn và vệ sinh. Ở lâu (1–3 năm) → giá trị vòng đời cao. |
| **Thiết kế** | Gia hạn hợp đồng online. Lịch sử thanh toán rõ ràng. Phản hồi sự cố nhanh. |

### P8 — Chị Lan, Phụ huynh (người trả tiền)
> 48 tuổi. Mẹ của P6. Ở tỉnh, chuyển khoản hằng tháng.

| | |
|---|---|
| **Vì sao quan trọng** | **Người trả tiền không phải người ở.** Hệ thống phải phân biệt `customer` (người ở) và `payer` (người trả). Nếu không, đối soát sẽ sai khi chuyển khoản mang tên mẹ. |
| **Cần gì** | Nhận thông báo hóa đơn qua Zalo/SMS. Nội dung chuyển khoản có sẵn mã. Là người liên hệ khẩn cấp. |

---

## 3. Business Model của Cali

### 3.1 Nguồn doanh thu

| Nguồn | Tỷ trọng ước tính | Đặc điểm |
|---|---|---|
| **Tiền phòng/giường** | 75–85% | Cố định theo hợp đồng, thu hằng tháng |
| **Điện nước** | 10–15% | Biến đổi, thường tính có biên lợi nhuận nhỏ |
| **Dịch vụ** (giặt sấy, giữ xe, nước uống, internet) | 3–8% | Biên lợi nhuận cao, thường bị khai thác chưa hết |
| **Phí phạt vi phạm** | <1% | Không phải nguồn thu, là công cụ quản lý |
| **Phí phát sinh** (thay chìa khóa, hư hỏng) | <1% | Bù đắp chi phí |

### 3.2 Cơ cấu chi phí

| Khoản | Đặc điểm |
|---|---|
| **Thuê mặt bằng** | Chi phí cố định lớn nhất. Quyết định điểm hòa vốn. |
| **Lương nhân viên** | Cố định theo chi nhánh |
| Điện nước (giá mua vào) | Biến đổi theo số người ở |
| Bảo trì & sửa chữa | Biến đổi, tăng theo tuổi tòa nhà |
| Vệ sinh, vật tư tiêu hao | Biến đổi |
| Internet, camera, phần mềm | Cố định |
| Marketing | Tập trung mùa cao điểm |
| Khấu hao tài sản | Kế toán |

→ **Chỉ số sống còn của mô hình: tỷ lệ lấp đầy.** Do chi phí phần lớn là cố định, mỗi điểm phần trăm lấp đầy tăng thêm gần như chảy thẳng vào lợi nhuận. Đây là lý do dashboard phải đặt occupancy ở vị trí số 1.

### 3.3 Các chỉ số kinh doanh hệ thống phải tính được

| Chỉ số | Công thức | Vì sao |
|---|---|---|
| **Tỷ lệ lấp đầy** | Số giường có người ở ÷ tổng giường khả dụng | Chỉ số quan trọng nhất |
| **Giường-đêm khả dụng** | Tổng giường × số ngày − ngày bảo trì | Mẫu số chuẩn, tránh thổi phồng |
| **Doanh thu/giường/tháng** | Doanh thu ÷ số giường | So sánh giữa chi nhánh |
| **Tỷ lệ thu** (collection rate) | Đã thu ÷ đã phát hành, trong 30 ngày | Sức khỏe dòng tiền |
| **Thời gian ở trung bình** | Trung bình số tháng của hợp đồng đã kết thúc | Chi phí thay khách |
| **Tỷ lệ gia hạn** | Số HĐ gia hạn ÷ số HĐ đến hạn | Chất lượng dịch vụ |
| **Số ngày giường trống giữa 2 khách** | Từ check-out đến check-in kế tiếp | Hiệu quả vận hành (dọn, cho thuê lại) |
| **Lợi nhuận gộp theo chi nhánh** | Doanh thu − chi phí trực tiếp | Con số Owner cần nhất |

---

## 4. Phạm vi sản phẩm

### Trong phạm vi (In scope)
- Quản lý tài sản: chi nhánh → giường
- Vòng đời khách thuê: đăng ký → đặt chỗ → hợp đồng → ở → gia hạn/chuyển → trả phòng
- Toàn bộ tài chính vận hành: hóa đơn, thanh toán, công nợ, cọc, chi phí, két tiền mặt
- Điện nước, dịch vụ
- Bảo trì, tài sản, vệ sinh
- Nội quy, vi phạm
- Khách ra vào
- Nhân viên (hồ sơ, phân quyền, ca làm cơ bản)
- Thông báo đa kênh
- Báo cáo & export
- Audit log
- Portal khách thuê (Phase 3)

### Ngoài phạm vi (Out of scope)
| Không làm | Lý do |
|---|---|
| **Phần mềm kế toán đầy đủ** (sổ cái, thuế, BCTC) | Xuất dữ liệu sang phần mềm kế toán chuyên dụng. Làm lại là phí công. |
| **Tính lương nhân viên** | Nghiệp vụ riêng, quy định phức tạp. Dùng phần mềm nhân sự. |
| **Đặt phòng khách sạn theo đêm** | Mô hình khác, giá và trạng thái khác hẳn. |
| **Nhận diện khuôn mặt** | Rủi ro pháp lý (dữ liệu sinh trắc học) > giá trị ở quy mô này. |
| **Tích hợp camera vào hệ thống** | Chi phí cao, không giảm được việc thủ công nào. Camera dùng riêng là đủ. |
| **Mạng xã hội nội bộ cho khách** | Zalo đã làm tốt hơn. |
| **Bán hàng/căng tin** | Nếu có, dùng POS riêng. |

---

## 5. Tiêu chí thành công

### Sau 3 tháng vận hành
- 100% hợp đồng đang hoạt động có trên hệ thống
- 100% hóa đơn sinh từ hệ thống, không còn file Excel song song
- Thời gian lập hóa đơn tháng < 1 giờ/chi nhánh
- Không còn giường bán trùng

### Sau 6 tháng
- Owner xem được P&L theo chi nhánh mà không cần hỏi ai
- Tỷ lệ thu trong 10 ngày đầu tháng tăng (nhờ nhắc tự động)
- Chênh lệch két tiền mặt < 0,1% và luôn có người giải trình
- Mọi sự cố đều có ticket, không còn báo qua Zalo suông

### Sau 12 tháng
- Mở chi nhánh mới cấu hình xong trong 1 ngày
- >60% khách thuê tự xem hóa đơn trên portal
- >80% thanh toán được đối soát tự động
