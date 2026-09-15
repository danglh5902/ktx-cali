# 16 — Tự động hóa & AI

---

## Phần 1 — Tự động hóa

### 1.1 Nguyên tắc chọn automation

Chỉ tự động hóa việc thỏa **cả ba** điều kiện:
1. Lặp lại thường xuyên (ít nhất hằng tháng)
2. Quy tắc rõ ràng, ít ngoại lệ
3. Sai sót gây hậu quả thật (mất tiền, mất khách, mất uy tín)

Việc không thỏa cả ba thì để con người làm — tự động hóa nửa vời tốn công bảo trì hơn là làm tay.

**Một nguyên tắc quan trọng:** automation nên **chuẩn bị** cho con người quyết định, không **thay** con người quyết định ở những việc có tiền. Ví dụ: tự sinh hóa đơn nháp (tốt) vs tự phát hành hóa đơn (nguy hiểm).

---

### 1.2 MUST HAVE — Phase 1–2

| # | Automation | Lịch chạy | Tiết kiệm | Chi tiết |
|---|---|---|---|---|
| **A1** | **Sinh hóa đơn kỳ hàng loạt** | Ngày chốt kỳ của từng chi nhánh | 10–16 giờ/tháng/chi nhánh | Sinh ở trạng thái `DRAFT` + báo cáo bất thường. **Không tự phát hành** |
| **A2** | **Nhắc thanh toán theo bậc** | Hằng ngày 08:00 | 5–8 giờ/tháng + tăng tỷ lệ thu | D-3, D+1, D+3 tự động; D+7 tạo nhiệm vụ gọi điện cho người |
| **A3** | **Cảnh báo hợp đồng sắp hết hạn** | Hằng ngày 07:00 | Ngăn mất khách do quên | D-30 → `EXPIRING`; D-15, D-7 nhắc lại |
| **A4** | **Hết hạn booking giữ chỗ** | Mỗi giờ | Ngăn khóa giường ảo | `holdUntil` qua → `EXPIRED`, giường về `AVAILABLE`, báo lễ tân |
| **A5** | **Chuyển hóa đơn sang quá hạn** | Hằng ngày 00:30 | Số liệu công nợ luôn đúng | Tính phí trễ hạn sau ngày ân hạn |
| **A6** | **Reconcile trạng thái giường** | Hằng đêm 02:00 | Ngăn bán trùng, ngăn giường trống không ai biết | So `beds.status` với assignment/ticket/booking → báo cáo lệch |
| **A7** | **Nhắc nhập chỉ số điện nước** | D-3 trước ngày chốt kỳ | Ngăn trễ chu kỳ hóa đơn | Danh sách phòng chưa có chỉ số |
| **A8** | **Cảnh báo két chưa chốt** | Hằng ngày 23:00 | Kiểm soát tiền mặt | Ca mở quá 12 giờ chưa đóng |

### 1.3 SHOULD HAVE — Phase 2–3

| # | Automation | Lịch chạy | Giá trị |
|---|---|---|---|
| **A9** | Tạo task vệ sinh khi giường về `CLEANING` | Theo sự kiện | Ngăn quên dọn phòng |
| **A10** | Escalate ticket quá SLA | Mỗi 30 phút | 50% SLA → nhắc kỹ thuật; 100% → quản lý; 150% → Owner |
| **A11** | Cộng phí phạt vi phạm vào hóa đơn kỳ sau | Khi sinh hóa đơn | Ngăn quên thu phạt |
| **A12** | **Đối soát tự động sao kê ngân hàng** | Theo webhook | **Tiết kiệm 8–12 giờ/tháng** — automation có ROI cao nhất sau A1 |
| **A13** | Báo cáo định kỳ gửi Owner/Manager | Thứ Hai 07:00 | Chủ không phải hỏi |
| **A14** | Cảnh báo tài sản sắp hết bảo hành | Hằng tuần | Tiết kiệm chi phí sửa chữa thật |
| **A15** | Cảnh báo cọc quá hạn chưa hoàn | Hằng ngày | Giữ uy tín |
| **A16** | Thu hồi quyền tạm thời hết hạn | Hằng ngày 01:00 | An ninh |
| **A17** | Cảnh báo tiêu thụ điện nước bất thường | Khi nhập chỉ số | Phát hiện rò rỉ, câu trộm |
| **A18** | Thông báo danh sách chờ khi có giường trống | Theo sự kiện | Chuyển hóa doanh thu mùa cao điểm |
| **A19** | Nhắc đăng ký tạm trú | Hằng ngày | Nghĩa vụ pháp lý |
| **A20** | Tự đóng ticket `RESOLVED` sau 48h | Hằng ngày | Dọn hàng đợi |

### 1.4 NICE TO HAVE — Phase 4

| # | Automation | Ghi chú |
|---|---|---|
| A21 | Tổng hợp `report_snapshots` hằng đêm | Chỉ cần khi báo cáo bắt đầu chậm |
| A22 | Gợi ý giá theo mùa và tỷ lệ lấp đầy | Cần ≥2 năm dữ liệu |
| A23 | Dự báo dòng tiền 3 tháng tới | |
| A24 | Tự động xóa nợ nhỏ theo lô | Có duyệt định kỳ |
| A25 | Tự động khóa quyền khi phát hiện bất thường | Rủi ro khóa nhầm, cần cẩn trọng |

### 1.5 Thiết kế kỹ thuật cho job

| Yêu cầu | Chi tiết |
|---|---|
| **Idempotent** | Chạy lại cùng job cùng ngày không tạo dữ liệu trùng |
| **Có khóa** | Không để hai instance chạy song song cùng một job |
| **Ghi lịch sử chạy** | Collection `jobs`: thời gian, kết quả, số bản ghi xử lý, lỗi |
| **Cảnh báo khi thất bại** | Job sinh hóa đơn lỗi mà không ai biết là thảm họa |
| **Chạy tay được** | Nút "Chạy ngay" cho admin, có xác nhận |
| **Theo múi giờ VN** | Cron tính theo `Asia/Ho_Chi_Minh` |
| **Theo chi nhánh** | Mỗi chi nhánh có ngày chốt kỳ riêng → job phải chạy theo lịch riêng từng chi nhánh |

---

## Phần 2 — AI

### 2.1 Quan điểm

**MVP không có AI.**

Ở quy mô 1–3 chi nhánh và dưới 500 giường, không có tính năng AI nào giảm được lượng công việc thủ công đủ lớn để biện minh cho chi phí xây dựng và vận hành. Việc tốn thời gian nhất của nhân viên là **lập hóa đơn và đối soát thanh toán** — và cả hai được giải quyết bằng automation thông thường, không cần AI.

Đưa AI vào sớm sẽ: tiêu tốn thời gian phát triển vốn nên dành cho nghiệp vụ cốt lõi, tạo kỳ vọng sai, và thêm một điểm phụ thuộc bên ngoài (API, chi phí, độ trễ) mà chưa mang lại giá trị tương xứng.

### 2.2 Đánh giá từng tính năng AI

| Tính năng | Giá trị | Độ khó | Chi phí | Dữ liệu cần | Làm MVP? | Khi nào |
|---|---|---|---|---|---|---|
| **OCR CCCD** | **Cao** — tiết kiệm 3–5 phút/khách, giảm sai số nhập liệu, cải thiện trải nghiệm check-in | **Thấp** — API sẵn có tại VN (FPT.AI, VNPT eKYC, Viettel) | ~500–1.500đ/lần gọi | Ảnh CCCD | ❌ | **Phase 3** |
| **OCR chỉ số điện nước** | Trung bình — ở <500 giường, nhập tay 50 phòng chỉ mất ~40 phút. Kiểm tra kết quả OCR có khi lâu hơn | Trung bình — đồng hồ cũ, mờ, chụp lệch góc → độ chính xác không ổn định | Thấp | Ảnh đồng hồ có nhãn | ❌ | **Phase 4**, và chỉ khi >1.000 phòng |
| **AI tìm kiếm ngôn ngữ tự nhiên** ("phòng nào trống tầng 3 giá dưới 2 triệu") | Trung bình — hữu ích khi nhiều chi nhánh; hiện tại bộ lọc thường là đủ | Thấp — text-to-query trên schema cố định | Thấp | Schema DB | ❌ | **Phase 4** |
| **AI tóm tắt báo cáo cho Owner** | Trung bình — "tháng này chi nhánh Q12 lấp đầy giảm 3 điểm chủ yếu do 8 khách trả phòng sau kỳ thi" | Thấp | Thấp | Dữ liệu báo cáo | ❌ | Phase 4 |
| **Phát hiện bất thường doanh thu/công nợ** | Trung bình — nhưng **quy tắc ngưỡng đơn giản đã bắt được 90% trường hợp** với chi phí bằng 0 | Cao (ML thật) / Thấp (quy tắc) | — | ≥24 tháng lịch sử | ❌ | Dùng quy tắc ngưỡng ngay Phase 2; ML thì Phase 4+ |
| **Chatbot hỗ trợ khách** | **Thấp** — dưới 500 khách, Zalo nhóm và lễ tân đã xử lý tốt. Chatbot trả lời sai về tiền bạc gây hậu quả nghiêm trọng | Trung bình | Trung bình | FAQ, nội quy | ❌ | **Bỏ** |
| **Dự đoán tỷ lệ lấp đầy** | **Thấp** — mùa vụ KTX rất dễ đoán bằng kinh nghiệm (tháng 8–9 đông, tháng 6–7 vắng) | Cao | Cao | ≥24 tháng | ❌ | **Bỏ** |
| **Dự đoán khách sắp rời đi (churn)** | **Thấp** — cần ≥2 năm dữ liệu. Và tín hiệu thật (khách hỏi về thủ tục trả phòng, nợ kéo dài, khiếu nại nhiều) đã đủ rõ để dùng quy tắc | Cao | Cao | ≥24 tháng, nhiều biến | ❌ | **Bỏ** ở giai đoạn này |
| **AI phân loại ticket bảo trì** | **Thấp** — chỉ có 9 loại, dropdown là đủ và chính xác 100% | — | — | — | ❌ | **Bỏ** |
| **AI định giá động** | Thấp — thị trường KTX VN không linh hoạt về giá như khách sạn; hợp đồng dài hạn | Cao | Cao | Dữ liệu thị trường | ❌ | **Bỏ** |

### 2.3 Ba tính năng AI nên làm, theo thứ tự

#### Thứ nhất — OCR CCCD (Phase 3)

**Vì sao đáng làm:**
- Việc nhập tay CCCD xảy ra với **mọi khách mới** — tần suất cao
- Sai số nhập tay CCCD gây hậu quả thật: sai đăng ký tạm trú, trùng hồ sơ, sai hợp đồng
- API có sẵn tại VN, độ chính xác cao với CCCD gắn chip (định dạng chuẩn)
- Chi phí thấp và tính theo lần dùng

**Thiết kế:**
```
Lễ tân chụp/upload CCCD 2 mặt
  → Gọi API OCR
  → Điền sẵn vào form: họ tên, ngày sinh, giới tính, số CCCD,
     ngày cấp, nơi cấp, quê quán, thường trú
  → LỄ TÂN LUÔN PHẢI XÁC NHẬN, không tự lưu
  → Lưu kèm độ tin cậy của từng trường; trường độ tin cậy thấp bôi vàng
```

**Quy tắc bắt buộc:** không bao giờ lưu tự động. AI đề xuất, con người xác nhận. Sai một ký tự trong CCCD sẽ gây rắc rối pháp lý.

**Lưu ý pháp lý:** gửi ảnh CCCD sang API bên thứ ba là chuyển giao dữ liệu cá nhân. Cần: chọn nhà cung cấp trong nước, có hợp đồng xử lý dữ liệu, ghi rõ trong điều khoản với khách, và không lưu ảnh ở phía nhà cung cấp.

#### Thứ hai — AI tóm tắt & hỏi đáp nội bộ (Phase 4)

**Vì sao đáng làm khi đã có 5+ chi nhánh:**
- Owner không muốn đọc 10 báo cáo, muốn biết "có gì bất thường không"
- Nhân viên mới không biết dữ liệu nằm ở đâu

**Thiết kế:** text-to-query trên schema cố định (không cho AI truy cập DB trực tiếp). AI sinh truy vấn có cấu trúc → hệ thống thực thi qua tầng repository (**vẫn áp scope guard**) → AI diễn giải kết quả.

**Quy tắc bảo mật quan trọng:** AI **không được vượt qua phân quyền**. Truy vấn do AI sinh ra vẫn đi qua `scopeFilter(ctx)`. Nếu không, đây là lỗ hổng nghiêm trọng nhất có thể tạo ra.

#### Thứ ba — OCR chỉ số điện nước (Phase 4, có điều kiện)

Chỉ làm khi số phòng vượt ~1.000. Dưới mức đó, thời gian kiểm tra kết quả OCR gần bằng thời gian nhập tay.

Nếu làm: OCR đề xuất số, người xác nhận. Ảnh vẫn lưu bắt buộc như hiện tại.

### 2.4 Cái nên làm thay vì AI

Nhiều thứ mà người ta định dùng AI để giải quyết, thực ra chỉ cần quy tắc đơn giản:

| Định dùng AI cho | Thay bằng | Chi phí |
|---|---|---|
| Phát hiện hóa đơn bất thường | Quy tắc ngưỡng: lệch >30% kỳ trước | 0 |
| Phát hiện tiêu thụ điện bất thường | Quy tắc: >200% trung bình 3 kỳ | 0 |
| Phát hiện khách sắp rời đi | Quy tắc: nợ >30 ngày HOẶC ≥2 khiếu nại trong 60 ngày HOẶC không gia hạn trước D-15 | 0 |
| Phân loại ticket | Dropdown 9 mục | 0 |
| Dự đoán mùa cao điểm | Biểu đồ so sánh cùng kỳ năm trước | 0 |
| Chatbot trả lời "tôi nợ bao nhiêu" | Portal khách thuê hiển thị số nợ ngay trang đầu | 0 |
| Gợi ý giường phù hợp | Bộ lọc: loại phòng, giá, giới tính, ngày trống | 0 |

**Đây không phải phản đối AI** — đây là thứ tự ưu tiên. Xây xong nền tảng, chạy thật 12 tháng, tích lũy dữ liệu, rồi mới xét xem AI giải quyết được vấn đề nào còn tồn tại.

### 2.5 Khi nào nên xem lại quyết định này

| Điều kiện | Xem xét lại |
|---|---|
| Số chi nhánh ≥ 5 | AI tóm tắt báo cáo, hỏi đáp nội bộ |
| Số giường ≥ 1.500 | OCR chỉ số điện nước |
| Có ≥ 24 tháng dữ liệu lịch sử sạch | Dự báo lấp đầy, dự đoán churn |
| Số lượt hỏi đáp khách/ngày ≥ 50 | Chatbot |
| Lễ tân dành >2 giờ/ngày trả lời câu hỏi lặp lại | Chatbot |
