# 05 — Dashboard

## 0. Nguyên tắc thiết kế dashboard

Trước khi liệt kê KPI, cần thống nhất mấy nguyên tắc — nếu không, dashboard sẽ trở thành bãi biểu đồ mà không ai đọc.

| Nguyên tắc | Nghĩa là |
|---|---|
| **Mỗi vai trò một dashboard khác nhau** | Owner cần 5 con số. Lễ tân cần 4 cái nút. Đừng dùng chung một màn hình. |
| **Dạng biểu đồ do "việc người đọc phải làm" quyết định** | Một con số hiện tại → ô số liệu (stat tile), không phải biểu đồ cột 1 cột. Một tỷ lệ so với giới hạn → thanh đo (meter), không phải biểu đồ tròn 2 phần. |
| **Không bao giờ dùng 2 trục tung** | Hai đại lượng khác thang đo → tách hai biểu đồ, hoặc quy về chỉ số cùng gốc. Đây là lỗi biểu đồ phổ biến nhất. |
| **Thang thứ tự dùng một màu đậm dần** | Aging công nợ (0–7 → >60 ngày) là thang có thứ tự → một màu đậm dần, không phải 4 màu khác nhau. |
| **Màu trạng thái được giữ riêng** | Xanh/vàng/cam/đỏ chỉ dùng cho trạng thái (tốt/cảnh báo/nghiêm trọng), không bao giờ dùng làm "màu series thứ 4". Luôn kèm nhãn chữ, không chỉ màu. |
| **Mỗi biểu đồ có bảng số tương ứng** | Bấm được để xem dạng bảng và export. Người Việt làm vận hành tin bảng số hơn biểu đồ. |
| **Mọi KPI phải bấm được để drill-down** | Con số không dẫn tới danh sách chi tiết thì vô dụng. |
| **Luôn có so sánh** | "Doanh thu 890tr" không có nghĩa. "890tr, +12% so với tháng trước" mới có nghĩa. |

---

## 1. Dashboard Owner — toàn hệ thống

**Thiết kế cho điện thoại trước.** Anh Cường mở app 1–2 lần/ngày, xem 10 giây rồi tắt.

### 1.1 Số dẫn đầu (hero figure)

```
┌──────────────────────────────────┐
│  TỶ LỆ LẤP ĐẦY TOÀN HỆ THỐNG     │
│                                   │
│         87,4%                     │  ← cỡ chữ lớn nhất màn hình
│    ▲ 2,1 điểm so với tháng trước  │
│    ████████████████████░░░  (meter)│
│    437 / 500 giường               │
└──────────────────────────────────┘
```

Vì sao đặt occupancy ở vị trí số 1: chi phí của mô hình KTX gần như cố định, nên mỗi điểm phần trăm lấp đầy tăng thêm chảy thẳng vào lợi nhuận. Đây là chỉ số sống còn.

### 1.2 Hàng KPI (5 ô)

| Ô | Nội dung | So sánh | Bấm vào dẫn tới |
|---|---|---|---|
| **Doanh thu tháng này** | Đã phát hành (VNĐ) | vs tháng trước, vs cùng kỳ năm ngoái | Báo cáo doanh thu |
| **Đã thu / Phải thu** | 782tr / 890tr (87,9%) | vs tháng trước | Báo cáo dòng tiền |
| **Công nợ quá hạn** | Tổng + số khách | ▲▼ vs tuần trước | Aging report |
| **Lợi nhuận gộp ước tính** | Doanh thu − chi phí trực tiếp | vs tháng trước | Báo cáo P&L |
| **Khách đang ở** | Số người + số khách mới tháng này | | Danh sách khách |

### 1.3 Biểu đồ

| # | Biểu đồ | Dạng | Vì sao dạng này |
|---|---|---|---|
| 1 | **Tỷ lệ lấp đầy 12 tháng theo chi nhánh** | Đường, mỗi chi nhánh 1 đường, có nhãn trực tiếp | Việc người đọc phải làm: phân biệt các chi nhánh và thấy xu hướng theo thời gian → đường + màu định danh. Với 3 chi nhánh, nhãn trực tiếp là đủ, không cần chú giải rời. |
| 2 | **Doanh thu và chi phí theo chi nhánh** (tháng hiện tại) | Cột nhóm ngang | Cùng đơn vị tiền → một trục duy nhất. Nằm ngang vì tên chi nhánh dài. |
| 3 | **Aging công nợ** | Cột chồng ngang, **một màu đậm dần** theo 4 mốc | Thang có thứ tự (0–7 → >60 ngày), không phải 4 hạng mục độc lập → một màu đậm dần, càng đậm càng nguy. |
| 4 | **Doanh thu 12 tháng toàn hệ thống** | Đường đơn + vùng tô nhạt | Một chuỗi, xu hướng theo thời gian. Không cần chú giải (tiêu đề đã nói rõ). |

### 1.4 Bảng xếp hạng chi nhánh

| Chi nhánh | Giường | Lấp đầy | Doanh thu | Chi phí | Lãi gộp | Doanh thu/giường | Nợ quá hạn |
|---|---|---|---|---|---|---|---|
| Thủ Đức | 220 | 94,1% ▲ | 412tr | 268tr | 144tr | 1,87tr | 12tr |
| Bình Thạnh | 180 | 86,7% ▬ | 318tr | 221tr | 97tr | 1,77tr | 28tr ⚠ |
| Quận 12 | 100 | 74,0% ▼ | 160tr | 129tr | 31tr | 1,60tr | 9tr |

Sắp xếp được theo mọi cột. Đây là bảng Owner dùng nhiều nhất — nó trả lời câu hỏi "chi nhánh nào có vấn đề".

### 1.5 Hộp cảnh báo (chỉ hiện khi có)
- 🔴 Chi nhánh Quận 12: lấp đầy giảm 3 tháng liên tiếp
- 🟠 12 khách nợ quá 60 ngày, tổng 48tr
- 🟠 Chênh lệch két chi nhánh Bình Thạnh 3 ngày liên tiếp
- 🟡 8 hợp đồng hết hạn trong 7 ngày chưa liên hệ

---

## 2. Dashboard Branch Manager

Chị Hương dùng cả ngày. Đây là **màn hình điều hành**, không phải màn hình phân tích.

### 2.1 Hàng KPI

| Ô | Nội dung |
|---|---|
| Lấp đầy chi nhánh | % + số giường trống + xu hướng 30 ngày (sparkline) |
| Doanh thu tháng | Đã phát hành / đã thu |
| Công nợ | Tổng + số khách quá hạn |
| Sắp hết hợp đồng | Số khách trong 30 ngày tới |
| Ticket đang mở | Tổng + số quá SLA (đỏ) |

### 2.2 Sơ đồ giường (thành phần quan trọng nhất)

```
TÒA A                                          [Tầng ▼ Tất cả]

Tầng 3   ┌───── P301 ─────┐ ┌───── P302 ─────┐ ┌───── P303 ─────┐
         │ ▣ ▣ ▣ ▢        │ │ ▣ ▣ ◐ ▣        │ │ ▧ ▧ ▢ ▢        │
         │ 3/4            │ │ 4/4            │ │ 0/4  BẢO TRÌ   │
         └────────────────┘ └────────────────┘ └────────────────┘

Tầng 2   ┌───── P201 ─────┐ ┌───── P202 ─────┐ ...

  ▣ Đang ở    ▢ Trống    ◐ Giữ chỗ    ▨ Chờ dọn    ▧ Bảo trì    ▩ Khóa
```

- Di chuột lên giường → tên khách, hợp đồng đến ngày nào, nợ bao nhiêu
- Bấm giường trống → tạo booking ngay
- Bấm giường đang ở → hồ sơ khách
- Bộ lọc: tòa / tầng / trạng thái / "sắp trống trong 30 ngày"

> **Lưu ý về màu:** trạng thái giường là dữ liệu **định danh có ý nghĩa trạng thái** → dùng bảng màu trạng thái (giữ riêng, không dùng cho biểu đồ khác) và **luôn kèm ký hiệu hình + nhãn**, không chỉ màu — để người mù màu và bản in đen trắng vẫn đọc được.

### 2.3 Danh sách cần xử lý hôm nay
| Nhóm | Ví dụ |
|---|---|
| Chờ phê duyệt | 3 hóa đơn nháp · 1 đề nghị giảm giá · 2 đề nghị hoàn cọc |
| Check-in hôm nay | 2 khách |
| Check-out hôm nay | 1 khách (còn nợ 1,2tr ⚠) |
| Ticket quá SLA | 2 |
| Chỉ số điện nước chưa nhập | 14/52 phòng (còn 3 ngày đến hạn chốt) |
| Giường chờ dọn quá 24h | 3 |
| Hợp đồng hết hạn ≤15 ngày chưa liên hệ | 5 |

### 2.4 Biểu đồ
| Biểu đồ | Dạng |
|---|---|
| Lấp đầy 12 tháng (chi nhánh này) | Đường đơn |
| Doanh thu theo nguồn (phòng / điện nước / dịch vụ) | Cột chồng theo tháng |
| Aging công nợ | Cột chồng ngang, một màu đậm dần |
| Ticket theo loại (30 ngày) | Cột ngang, một màu đậm dần theo số lượng |

---

## 3. Màn hình Lễ tân — KHÔNG phải dashboard

Đây là điểm khác biệt quan trọng. Em Linh không cần biểu đồ. Em cần **làm xong việc trước mặt khách thật nhanh**.

```
┌───────────────────────────────────────────────────────────────┐
│  🔍  Tìm tên / SĐT / CCCD / mã phòng...          [Ctrl+K]      │  ← luôn ở đây
└───────────────────────────────────────────────────────────────┘

┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  ➕ KHÁCH MỚI │ │  💰 THU TIỀN │ │  🔑 CHECK-IN │ │  🚪 CHECK-OUT│
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘

VIỆC HÔM NAY                                    KÉT CA NÀY
• Check-in: Nguyễn Văn A — P301-B2  [Thực hiện]   Đầu ca:    2.000.000
• Check-out: Trần Thị B — P205-B1               Đã thu:   12.450.000
  ⚠ còn nợ 1.200.000                             Hiện có:  14.450.000
• Hẹn xem phòng 15h: Lê Văn C — 0901234567       [Đóng ca]
• Ghi chú ca trước: chìa khóa P104 đang giữ ở quầy

GIƯỜNG TRỐNG SẴN SÀNG: 12    [Xem sơ đồ]
```

**Yêu cầu bắt buộc:**
- Ô tìm kiếm luôn ở vị trí cố định, phím tắt `Ctrl+K`, tìm được cả khi gõ thiếu dấu
- Kết quả tìm kiếm hiện ngay: tên · phòng/giường · SĐT · **số nợ hiện tại** · trạng thái hợp đồng
- Thu tiền tối đa **3 thao tác**: tìm khách → chọn hóa đơn → nhập số tiền & phương thức
- Nút to, chữ rõ, dùng được trên màn hình 1366×768 (máy văn phòng phổ thông)
- In phiếu thu ngay sau khi thu

---

## 4. Dashboard Kế toán

| Khối | Nội dung |
|---|---|
| **Hàng chờ đối soát** | N giao dịch ngân hàng chưa khớp với thanh toán — màn hình 2 cột, kéo thả để khớp |
| **Hóa đơn chờ phát hành** | Danh sách nháp theo chi nhánh, phát hành hàng loạt |
| **Aging công nợ** | Bảng + biểu đồ, lọc theo chi nhánh |
| **Đề nghị chờ duyệt** | Hoàn cọc · điều chỉnh hóa đơn · xóa nợ |
| **Chênh lệch két** | Các ca có chênh lệch chưa giải trình |
| **Cọc đến hạn hoàn** | Khách đã trả phòng, đến hạn hoàn cọc |
| **Biểu đồ dòng tiền** | Thu vs chi theo tuần, 12 tuần gần nhất — cột nhóm, một trục |

---

## 5. Dashboard Kỹ thuật (mobile)

```
VIỆC CỦA TÔI (5)
🔴 P301 — Điều hòa không lạnh        Quá SLA 4h
🟠 P205 — Vòi nước rỉ                Còn 6h
🟡 P108 — Bóng đèn hỏng              Còn 2 ngày
⏸ P402 — Thay khóa cửa               Chờ vật tư
⏸ P310 — Sửa tủ                      Chờ khách có mặt

[+ Tạo ticket]
```
Mở ticket → mô tả, ảnh khách gửi, lịch sử sửa chữa của phòng/tài sản đó, nút chụp ảnh sau khi sửa, nút nhập chi phí, nút hoàn thành.

---

## 6. Portal khách thuê (Phase 3)

| Khối | Nội dung |
|---|---|
| Số tiền phải đóng tháng này | Số lớn + hạn thanh toán + nút **QR thanh toán** |
| Hóa đơn hiện tại | **Có chi tiết chỉ số điện đầu kỳ/cuối kỳ và đơn giá** — đây là điều khách khiếu nại nhiều nhất, minh bạch được là giảm hẳn tranh cãi |
| Lịch sử thanh toán | Danh sách + tải phiếu thu |
| Hợp đồng | Xem/tải PDF, ngày hết hạn, nút đề nghị gia hạn |
| Sự cố | Nút báo sự cố (chọn loại + chụp ảnh) + theo dõi tiến độ |
| Nội quy | Nội quy chi nhánh |
| Thông báo | Từ ban quản lý |

---

## 7. Drill-down

Mọi con số đều đi xuống được, và bộ lọc thời gian được giữ nguyên khi đi sâu:

```
Toàn hệ thống
  └─ Chi nhánh Thủ Đức
       └─ Tòa A
            └─ Tầng 3
                 └─ Phòng P301
                      └─ Giường P301-B2
                           └─ Khách: Nguyễn Văn A
                                ├─ Hợp đồng HD-2026-0142
                                ├─ Hóa đơn (12 kỳ)
                                ├─ Thanh toán
                                ├─ Lịch sử chuyển phòng
                                ├─ Ticket đã tạo
                                └─ Vi phạm
```

Breadcrumb luôn hiển thị, bấm được để quay lên bất kỳ cấp nào.

---

## 8. Yêu cầu kỹ thuật cho dashboard

| Yêu cầu | Chi tiết |
|---|---|
| **Thời gian tải** | < 2 giây. Nếu chậm hơn, dùng số liệu tính sẵn (`report_snapshots`) thay vì tổng hợp realtime |
| **Độ tươi của dữ liệu** | Hiển thị rõ "Cập nhật lúc HH:mm". KPI vận hành (giường, ticket) realtime; KPI tài chính có thể trễ tới 15 phút |
| **Phạm vi chi nhánh** | Áp dụng ở backend cho **mọi** truy vấn dashboard — đây là chỗ hay quên nhất |
| **Chế độ tối** | Phải chọn màu riêng cho nền tối, không lật màu tự động |
| **Xem dạng bảng** | Mọi biểu đồ có nút chuyển sang bảng + export |
| **Mobile** | Dashboard Owner và Kỹ thuật bắt buộc dùng tốt trên điện thoại |
| **Định dạng số** | Tiền hiển thị rút gọn khi lớn (412tr), đầy đủ khi ở chi tiết (412.350.000đ). Ngày theo dd/MM/yyyy. |
