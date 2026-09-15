# 15 — UX & Navigation

---

## 1. Nguyên tắc UX cho hệ thống này

| Nguyên tắc | Lý do |
|---|---|
| **Lễ tân là người dùng chính, không phải Owner** | Họ dùng 8 giờ/ngày. Owner dùng 2 phút/ngày. Tối ưu cho lễ tân trước. |
| **Tìm kiếm quan trọng hơn menu** | Lễ tân không duyệt menu tìm khách — họ gõ số điện thoại. |
| **Thao tác thường xuyên ≤ 3 click** | Thu tiền, tra cứu khách, tạo ticket. |
| **Hiển thị số nợ ở mọi nơi có tên khách** | Đây là thông tin được hỏi nhiều nhất. |
| **Không giấu thông tin sau nhiều lớp tab** | Nhân viên KTX không phải người dùng phần mềm chuyên nghiệp. |
| **Xác nhận trước hành động nguy hiểm, không xác nhận thao tác thường** | Hộp thoại "bạn có chắc?" quá nhiều sẽ bị bấm qua theo phản xạ. |
| **Chữ to, nút to, tương phản cao** | Quầy lễ tân thường có ánh sáng mạnh, màn hình nhỏ. |
| **Mobile-first cho Kỹ thuật, Tạp vụ, Owner và Khách thuê** | Bốn nhóm này gần như chỉ dùng điện thoại. |

---

## 2. Sidebar Admin

```
┌─────────────────────────────┐
│  🏠  Tổng quan               │  ← khác nhau theo vai trò
├─────────────────────────────┤
│  📋  Tác nghiệp              │  ★ NHÓM LỄ TÂN DÙNG NHIỀU NHẤT
│      ├ Sơ đồ giường          │
│      ├ Check-in hôm nay      │
│      ├ Check-out hôm nay     │
│      ├ Thu tiền              │
│      └ Ca két của tôi        │
├─────────────────────────────┤
│  👥  Khách thuê              │
│      ├ Danh sách khách       │
│      ├ Đặt chỗ               │
│      ├ Danh sách chờ         │
│      └ Danh sách đen         │
├─────────────────────────────┤
│  📄  Hợp đồng                │
│      ├ Tất cả hợp đồng       │
│      ├ Sắp hết hạn      (5)  │  ← badge số lượng
│      └ Mẫu hợp đồng          │
├─────────────────────────────┤
│  💰  Tài chính               │
│      ├ Hóa đơn               │
│      ├ Thanh toán            │
│      ├ Công nợ          (12) │
│      ├ Tiền cọc              │
│      ├ Đối soát         (8)  │
│      ├ Két tiền mặt          │
│      └ Chi phí               │
├─────────────────────────────┤
│  ⚡  Điện nước               │
│      ├ Nhập chỉ số      (14) │
│      └ Lịch sử chỉ số        │
├─────────────────────────────┤
│  🛎  Dịch vụ                 │
├─────────────────────────────┤
│  🔧  Bảo trì            (3)  │
│      ├ Ticket                │
│      ├ Vệ sinh               │
│      └ Tài sản               │
├─────────────────────────────┤
│  📢  Nội quy & Vi phạm       │
├─────────────────────────────┤
│  🚶  Khách ra vào            │
├─────────────────────────────┤
│  🏢  Cơ sở vật chất          │  ← ít dùng hằng ngày, để dưới
│      ├ Chi nhánh             │
│      ├ Tòa nhà               │
│      ├ Tầng                  │
│      ├ Phòng                 │
│      ├ Giường                │
│      └ Bảng giá              │
├─────────────────────────────┤
│  👤  Nhân viên               │
├─────────────────────────────┤
│  🔔  Thông báo               │
├─────────────────────────────┤
│  📊  Báo cáo                 │
├─────────────────────────────┤
│  ⚙️  Cấu hình                │
├─────────────────────────────┤
│  🛡  Audit Log               │
└─────────────────────────────┘
```

### Khác biệt so với cấu trúc thông thường

**Thêm nhóm "Tác nghiệp" lên trên cùng.** Đây là thay đổi quan trọng nhất. Cấu trúc menu thông thường bắt đầu bằng "Chi nhánh → Tòa nhà → Tầng → Phòng → Giường" — nhưng lễ tân **gần như không bao giờ** vào đó. Họ vào để: xem sơ đồ giường, check-in, thu tiền. Đưa những việc đó lên đầu tiết kiệm hàng trăm click mỗi ngày.

**Đẩy "Cơ sở vật chất" xuống dưới.** Cấu hình tòa/tầng/phòng/giường chỉ làm khi onboard chi nhánh hoặc cải tạo — vài lần mỗi năm.

**Badge số lượng trên mục cần xử lý.** Hợp đồng sắp hết hạn, công nợ, đối soát chờ, chỉ số chưa nhập, ticket mở. Nhân viên nhìn sidebar là biết hôm nay phải làm gì.

### Sidebar theo vai trò

| Vai trò | Thấy gì |
|---|---|
| **Super Admin** | Toàn bộ |
| **Owner** | Tổng quan · Báo cáo · Tài chính (xem) · Audit Log. **Ẩn hết nhóm tác nghiệp** — anh ấy không cần và không có quyền |
| **Branch Manager** | Toàn bộ trừ Cấu hình hệ thống, giới hạn trong chi nhánh |
| **Receptionist** | Tác nghiệp · Khách thuê · Hợp đồng · Hóa đơn/Thanh toán/Công nợ · Điện nước · Dịch vụ · Bảo trì · Khách ra vào |
| **Accountant** | Tổng quan KT · Tài chính (đầy đủ) · Báo cáo · Audit tài chính |
| **Technician** | Giao diện riêng, mobile: chỉ "Việc của tôi" + Tài sản |
| **Housekeeper** | Giao diện riêng, mobile: chỉ danh sách phòng cần dọn |

**Nguyên tắc:** ẩn hoàn toàn mục không có quyền, không hiển thị rồi báo lỗi khi bấm.

---

## 3. Thanh trên cùng (luôn hiển thị)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [Cali]  [Chi nhánh: Thủ Đức ▼]   🔍 Tìm...  Ctrl+K     🔔(3)  [Linh ▼]     │
└────────────────────────────────────────────────────────────────────────────┘
```

| Thành phần | Chi tiết |
|---|---|
| **Chọn chi nhánh** | Chỉ hiện khi user có quyền >1 chi nhánh. Lựa chọn được nhớ trong session. Owner có thêm tùy chọn "Tất cả chi nhánh" |
| **Tìm kiếm toàn cục** | Phím tắt `Ctrl+K`. **Thành phần quan trọng nhất của toàn bộ giao diện** |
| **Thông báo** | Badge số chưa đọc |
| **Menu người dùng** | Hồ sơ · Đổi mật khẩu · Ca két của tôi · Đăng xuất |

---

## 4. Tìm kiếm toàn cục — đặc tả chi tiết

Đây là thành phần lễ tân dùng nhiều nhất trong ngày. Cần đặc tả kỹ.

```
┌──────────────────────────────────────────────────────────────┐
│ 🔍  0901234                                                   │
├──────────────────────────────────────────────────────────────┤
│ KHÁCH THUÊ                                                    │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Nguyễn Văn An        0901234567   A-301-B2   Đang ở      │ │
│ │ ⚠ Nợ 2.850.000đ · HĐ hết hạn 15/11/2026                  │ │
│ │ [Thu tiền] [Xem hồ sơ] [Tạo ticket]                      │ │  ← hành động nhanh
│ └──────────────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Trần Thị Bình        0901234890   B-105-B1   Đang ở      │ │
│ │ ✓ Không nợ                                                │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                               │
│ PHÒNG / GIƯỜNG                                                │
│ (không có kết quả)                                            │
│                                                               │
│ HÓA ĐƠN                                                       │
│ HD-TD-2026-000142   Nguyễn Văn An   2.850.000đ   Quá hạn     │
└──────────────────────────────────────────────────────────────┘
```

**Yêu cầu bắt buộc:**

| Yêu cầu | Chi tiết |
|---|---|
| Tìm được theo | Tên · SĐT (một phần) · CCCD · mã khách · mã phòng · mã giường · số hợp đồng · số hóa đơn |
| **Không dấu cũng ra** | Gõ `nguyen van an` phải ra `Nguyễn Văn An`. Lưu thêm trường `searchName` đã bỏ dấu |
| Tốc độ | Kết quả hiện trong 300ms, debounce 250ms |
| **Hiện số nợ ngay trong kết quả** | Không bắt mở hồ sơ mới biết |
| **Hành động nhanh ngay trong kết quả** | Thu tiền · Xem hồ sơ · Tạo ticket |
| Phím tắt | `Ctrl+K` mở · `↑↓` di chuyển · `Enter` chọn · `Esc` đóng |
| Lịch sử tìm kiếm | Hiện 5 lần tìm gần nhất khi mở ô trống |
| Phạm vi chi nhánh | Chỉ tìm trong chi nhánh có quyền |

---

## 5. Sơ đồ giường — màn hình quan trọng thứ hai

```
┌──────────────────────────────────────────────────────────────────────┐
│ Tòa [A ▼]  Tầng [Tất cả ▼]  Trạng thái [Tất cả ▼]  ☐ Sắp trống 30 ngày│
│                                                          [Bảng] [Sơ đồ]│
├──────────────────────────────────────────────────────────────────────┤
│ TẦNG 3                                              12/16 giường (75%) │
│  ┌── P301 ──┐  ┌── P302 ──┐  ┌── P303 ──┐  ┌── P304 ──┐              │
│  │ ▣ ▣ ▣ ▢  │  │ ▣ ▣ ◐ ▣  │  │ ▧ ▧ ▢ ▢  │  │ ▣ ▨ ▣ ▣  │              │
│  │   3/4    │  │   4/4    │  │ BẢO TRÌ  │  │   3/4    │              │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘              │
│                                                                        │
│ TẦNG 2                                              14/16 giường (88%) │
│  ...                                                                   │
├──────────────────────────────────────────────────────────────────────┤
│ ▣ Đang ở(12) ▢ Trống(3) ◐ Giữ chỗ(1) ▨ Chờ dọn(1) ▧ Bảo trì(2) ▩ Khóa │
└──────────────────────────────────────────────────────────────────────┘
```

**Tương tác:**
| Hành động | Kết quả |
|---|---|
| Di chuột lên giường | Tooltip: tên khách · SĐT · hợp đồng đến ngày · **số nợ** |
| Bấm giường trống | Menu: Tạo booking · Khóa giường |
| Bấm giường đang ở | Menu: Xem hồ sơ · Thu tiền · Chuyển giường · Tạo ticket · Check-out |
| Bấm giường chờ dọn | Menu: Đánh dấu đã dọn · Xem task vệ sinh |
| Bấm tên phòng | Chi tiết phòng: tài sản, chỉ số điện nước, lịch sử |

**Về màu sắc:** trạng thái giường dùng **bảng màu trạng thái riêng** (không dùng chung với màu biểu đồ), và **luôn kèm ký hiệu hình + nhãn chữ** — để người mù màu và bản in đen trắng vẫn đọc được. Không bao giờ chỉ dùng màu để truyền đạt trạng thái.

---

## 6. Ba luồng thao tác nhanh cho lễ tân

### 6.1 Thu tiền — mục tiêu 3 click, dưới 30 giây

```
Bước 1: Ctrl+K → gõ SĐT → Enter (hoặc bấm [Thu tiền] ngay trong kết quả)

Bước 2: ┌──────────────────────────────────────────────┐
        │ THU TIỀN — Nguyễn Văn An (A-301-B2)          │
        ├──────────────────────────────────────────────┤
        │ CÔNG NỢ                                       │
        │ ☑ HD-000120  T7/2026   1.200.000   Quá hạn 45n│
        │ ☑ HD-000135  T8/2026   2.850.000   Quá hạn 15n│
        │ ☐ HD-000142  T9/2026   2.900.000   Đến hạn 10/10│
        │                        ─────────────          │
        │ Đã chọn:               4.050.000               │
        │                                               │
        │ Số tiền thu: [4.050.000        ]              │
        │ Phương thức: (•)Tiền mặt ( )Chuyển khoản ( )QR│
        │ Ghi chú:     [                 ]              │
        │                                               │
        │           [Hủy]  [THU TIỀN & IN PHIẾU]        │
        └──────────────────────────────────────────────┘

Bước 3: Phiếu thu in ra, Zalo tự gửi cho khách
```

Mặc định tích chọn các hóa đơn quá hạn cũ nhất (FIFO), lễ tân sửa được.

### 6.2 Check-in — quy trình theo bước (wizard)
```
[1 Xác nhận khách] → [2 Hợp đồng] → [3 Cọc] → [4 Chọn giường]
→ [5 Kiểm kê tài sản] → [6 Chụp ảnh] → [7 Bàn giao chìa khóa] → [8 Hoàn tất]

• Thanh tiến trình luôn hiển thị
• Lưu nháp tự động sau mỗi bước (mất mạng không mất dữ liệu đã nhập)
• Bước chưa đủ điều kiện hiện rõ lý do và nút "Đề nghị duyệt ngoại lệ"
• Bước 6 chụp ảnh: dùng camera điện thoại qua QR (quét mã trên màn hình để mở form chụp trên điện thoại)
```

### 6.3 Nhập chỉ số điện nước — tối ưu cho mobile
```
┌─────────────────────────────┐
│ Tòa A · Tầng 3 · Điện       │
│ Kỳ 09/2026    14/16 phòng   │
├─────────────────────────────┤
│ P301   Trước: 4.521         │
│        [ 4587        ] 📷    │
│        66 kWh · 231.000đ    │
│        ✓ Bình thường         │
├─────────────────────────────┤
│ P302   Trước: 3.892         │
│        [ 4120        ] 📷    │
│        228 kWh · 798.000đ   │
│        ⚠ Cao hơn 187% TB    │
│        [Ghi chú...]          │
├─────────────────────────────┤
│ P303   Trước: 5.102         │
│        [             ] 📷    │
└─────────────────────────────┘
        [Gửi duyệt 14 phòng]
```
- Bàn phím số tự động bật
- Tính và kiểm tra ngay khi gõ xong
- Nút chụp ảnh ngay cạnh ô nhập
- Sắp xếp theo thứ tự đi bộ thực tế của nhân viên

---

## 7. Mẫu bố cục dùng lại

### 7.1 Trang danh sách
```
┌─────────────────────────────────────────────────────────────┐
│ Tiêu đề                        [Import] [Export] [+ Thêm]   │
├─────────────────────────────────────────────────────────────┤
│ [🔍 Tìm...] [Bộ lọc ▼] [Khoảng thời gian ▼]   ← bộ lọc 1 hàng│
├─────────────────────────────────────────────────────────────┤
│ Chip lọc đang áp dụng: [Chi nhánh: Thủ Đức ✕] [Quá hạn ✕]   │
├─────────────────────────────────────────────────────────────┤
│ ☐ │ Cột 1 ↕ │ Cột 2 ↕ │ Cột 3 │ Trạng thái │ ⋮            │
│ ☐ │ ...                                                     │
├─────────────────────────────────────────────────────────────┤
│ Đã chọn 3 mục: [Hành động hàng loạt ▼]                      │
│                                    ◀ 1 2 3 ... 12 ▶  50/trang│
└─────────────────────────────────────────────────────────────┘
```
Quy tắc: bộ lọc trên một hàng ngang phía trên bảng · lọc đang áp dụng hiển thị thành chip xóa được · trạng thái dùng badge có chữ, không chỉ màu · cột hành động luôn ở cuối.

### 7.2 Trang chi tiết
```
┌─────────────────────────────────────────────────────────────┐
│ ← Quay lại │ Nguyễn Văn An · KH-TD-00142      [Sửa] [⋮]      │
├─────────────────────────────────────────────────────────────┤
│ ⚠ Còn nợ 2.850.000đ · Hợp đồng hết hạn sau 45 ngày          │  ← cảnh báo nổi bật
├─────────────────────────────────────────────────────────────┤
│ [Tổng quan] [Hợp đồng] [Lưu trú] [Hóa đơn] [Thanh toán]     │
│ [Cọc] [Dịch vụ] [Ticket] [Vi phạm] [Giấy tờ] [Nhật ký]      │
├─────────────────────────────────────────────────────────────┤
│  Nội dung tab                                                │
└─────────────────────────────────────────────────────────────┘
```
Cảnh báo quan trọng (nợ, hết hạn, blacklist) đặt ngay dưới tiêu đề, không giấu trong tab.

### 7.3 Form
- Nhóm trường theo khối logic, mỗi khối có tiêu đề
- Trường bắt buộc đánh dấu rõ
- Kiểm tra hợp lệ **khi rời khỏi ô**, không đợi đến lúc submit
- Lưu nháp tự động với form dài
- Nút chính bên phải, nút hủy bên trái
- Sau khi lưu: thông báo ngắn + ở lại trang hoặc về danh sách tùy ngữ cảnh

---

## 8. Thiết kế cho mobile

| Vai trò | Ưu tiên | Màn hình chính |
|---|---|---|
| **Kỹ thuật** | Cao | Việc của tôi · chi tiết ticket · chụp ảnh · nhập chi phí |
| **Tạp vụ** | Cao | Danh sách phòng cần dọn · đánh dấu hoàn thành · chụp ảnh |
| **Owner** | Cao | 5 KPI · bảng xếp hạng chi nhánh · cảnh báo |
| **Khách thuê** | Cao | Hóa đơn · QR thanh toán · báo sự cố |
| **Lễ tân** | Trung bình | Nhập chỉ số điện nước · tra cứu nhanh |
| **Kế toán** | Thấp | Công việc cần màn hình lớn |

**Quy tắc mobile:**
- Vùng chạm tối thiểu 44×44px
- Không có bảng nhiều cột — chuyển thành thẻ (card)
- Chụp ảnh gọi thẳng camera
- Hoạt động được ở kết nối 3G

---

## 9. Ngôn ngữ & định dạng

| Mục | Quy ước |
|---|---|
| **Ngôn ngữ** | Tiếng Việt toàn bộ giao diện. Chuẩn bị i18n nhưng chưa cần tiếng Anh |
| **Tiền** | `2.850.000đ`. Rút gọn khi lớn trong dashboard: `412tr`, `1,2 tỷ` |
| **Ngày** | `dd/MM/yyyy`. Ngày giờ: `dd/MM/yyyy HH:mm` |
| **Thời gian tương đối** | "3 ngày trước", "còn 15 ngày" — dễ đọc hơn ngày tuyệt đối trong danh sách cần xử lý |
| **Số điện thoại** | Hiển thị `0901 234 567`, lưu `+84901234567` |
| **Trạng thái** | Luôn có nhãn tiếng Việt kèm màu, không bao giờ chỉ màu |
| **Thông báo lỗi** | Nói rõ **phải làm gì**, không chỉ "Đã xảy ra lỗi". Ví dụ: "Giường A-301-B2 vừa được giữ bởi Linh lúc 14:32. Vui lòng chọn giường khác." |

---

## 10. Khả năng tiếp cận

- Tương phản chữ/nền tối thiểu 4.5:1
- Thao tác được hoàn toàn bằng bàn phím (đặc biệt luồng thu tiền)
- Focus ring rõ ràng
- Trạng thái không bao giờ chỉ dùng màu — luôn kèm chữ hoặc ký hiệu
- Chế độ tối: chọn màu riêng cho nền tối, không lật màu tự động
- Cỡ chữ cơ bản ≥14px, cho phép phóng to 200% mà không vỡ bố cục
