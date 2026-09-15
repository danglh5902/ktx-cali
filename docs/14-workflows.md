# 14 — Workflow nghiệp vụ

12 quy trình cốt lõi. Mỗi quy trình gồm: sơ đồ, các bước hệ thống thực hiện, và điểm dễ sai nhất.

---

## 1. Khách đăng ký thuê KTX

```mermaid
sequenceDiagram
    autonumber
    actor KH as Khách
    participant LT as Lễ tân
    participant HT as Hệ thống

    KH->>LT: Liên hệ (điện thoại / Zalo / đến quầy)
    LT->>HT: Tìm khách theo SĐT hoặc CCCD

    alt Đã có hồ sơ
        HT-->>LT: Hồ sơ cũ + lịch sử (nợ cũ, vi phạm, blacklist)
        Note over LT: Nếu có nợ cũ hoặc trong blacklist<br/>→ cảnh báo, cần quản lý duyệt
    else Khách mới
        LT->>HT: Tạo hồ sơ tối giản (tên + SĐT)
    end

    LT->>HT: Tìm giường khả dụng (loại phòng, ngày vào, giới tính, ngân sách)
    HT->>HT: isAvailableForPeriod cho từng giường
    HT-->>LT: Danh sách giường + giá + tiện ích

    LT->>KH: Tư vấn, dẫn xem phòng
    KH-->>LT: Chọn giường

    LT->>HT: Tạo booking (NEW → CONFIRMED)
    HT->>HT: Đặt bed.status = RESERVED
    HT->>HT: Đặt holdUntil = now + 48h
    HT->>HT: Snapshot quotedPrice
    HT-->>KH: Thông báo Zalo: đã giữ chỗ, hạn đặt cọc
```

**Điểm dễ sai:** không đặt `holdUntil`. Hệ quả: lễ tân giữ giường cho khách "đang suy nghĩ", giường bị khóa ảo hàng tuần, tỷ lệ lấp đầy tụt mà không ai biết nguyên nhân.

---

## 2. Đặt cọc

```mermaid
sequenceDiagram
    autonumber
    actor KH as Khách
    participant LT as Lễ tân
    participant HT as Hệ thống
    participant KET as Két ca

    KH->>LT: Đặt cọc (tiền mặt / chuyển khoản)
    LT->>HT: Ghi nhận cọc cho booking

    HT->>HT: Kiểm tra có ca két đang mở không
    alt Tiền mặt & chưa mở ca
        HT-->>LT: CHẶN — phải mở ca két trước
    end

    rect rgb(240, 245, 255)
    Note over HT: TRANSACTION
    HT->>HT: Tạo payments (method, idempotencyKey)
    HT->>KET: Gắn payment vào cash_session
    HT->>HT: Ghi deposit_ledger: HOLD +4.000.000
    HT->>HT: booking.status = DEPOSIT_PAID
    HT->>HT: booking.holdUntil = ngày hẹn nhận phòng
    HT->>HT: customer.status = RESERVED
    HT->>HT: Ghi audit_logs
    end

    HT-->>LT: Phiếu thu cọc (in được)
    Note over LT,KH: Phiếu cọc PHẢI ghi rõ chính sách hoàn cọc khi hủy
    HT-->>KH: Zalo xác nhận đã nhận cọc
```

**Điểm dễ sai:**
1. **Ghi cọc vào doanh thu.** Cọc là công nợ phải trả. Phải vào `deposit_ledger`, không vào báo cáo doanh thu.
2. **Không ghi chính sách hoàn cọc lên phiếu.** Mọi tranh chấp sau này đều thua.

---

## 3. Check-in

```mermaid
sequenceDiagram
    autonumber
    actor KH as Khách
    participant LT as Lễ tân
    participant HT as Hệ thống

    KH->>LT: Đến nhận phòng
    LT->>HT: Mở quy trình check-in từ booking

    HT->>HT: Kiểm tra điều kiện bắt buộc
    Note over HT: Hồ sơ đủ? CCCD 2 mặt? Liên hệ khẩn cấp?<br/>Blacklist? Đúng giới tính tòa/tầng?<br/>Hợp đồng đã ký? Cọc đủ?

    alt Thiếu điều kiện
        HT-->>LT: Danh sách còn thiếu
        opt Quản lý duyệt ngoại lệ
            LT->>HT: Đề xuất + lý do → duyệt → ghi audit
        end
    end

    LT->>HT: Kiểm kê tài sản trong phòng (đủ/thiếu/tình trạng)
    LT->>HT: Chụp ảnh hiện trạng phòng + giường
    LT->>HT: Ghi số chìa khóa/thẻ bàn giao
    LT->>HT: Ghi chỉ số điện nước đầu kỳ (nếu phòng trống trước đó)
    KH->>HT: Ký xác nhận đã đọc nội quy

    rect rgb(240, 245, 255)
    Note over HT: TRANSACTION
    HT->>HT: 1. Tạo bed_assignments (startDate, dailyRate snapshot)
    HT->>HT: 2. beds.status = OCCUPIED, currentAssignmentId
    HT->>HT: 3. contracts.status = ACTIVE
    HT->>HT: 4. bookings.status = CHECKED_IN
    HT->>HT: 5. customers.status = ACTIVE
    HT->>HT: 6. deposit_ledger: HOLD (nếu nhận cọc lúc này)
    HT->>HT: 7. checkin_checkout_records (checklist + ảnh + tài sản)
    HT->>HT: 8. utility_readings đầu kỳ
    HT->>HT: 9. Đưa vào hàng chờ đăng ký tạm trú
    HT->>HT: 10. audit_logs
    end

    HT-->>LT: Phiếu check-in + biên bản bàn giao (in, 2 bên ký)
    HT-->>KH: Zalo: chào mừng + thông tin phòng + nội quy
```

**Điểm dễ sai:**
1. **Không dùng transaction.** Hệ quả: khách đang ở mà không có hợp đồng, hoặc giường `OCCUPIED` mà không ai ở. Loại dữ liệu rác này rất khó phát hiện và sửa.
2. **Bỏ qua bước chụp ảnh.** Đến lúc check-out không có gì đối chiếu, mọi tranh chấp cọc đều thua.

---

## 4. Sinh hợp đồng

```mermaid
sequenceDiagram
    autonumber
    participant LT as Lễ tân
    participant HT as Hệ thống
    participant QL as Branch Manager
    actor KH as Khách

    LT->>HT: Tạo hợp đồng từ booking
    HT->>HT: Giá = bed.priceOverride ?? room.priceOverride ?? roomType.basePrice
    HT->>HT: Áp hệ số theo thời hạn thuê (nếu có)

    rect rgb(255, 250, 240)
    Note over HT: SNAPSHOT — quan trọng nhất
    HT->>HT: monthlyRent, depositAmount
    HT->>HT: electricityPrice, waterPrice
    HT->>HT: termsSnapshot (toàn văn điều khoản)
    HT->>HT: houseRulesVersion
    end

    HT->>HT: Sinh contractNo từ counters
    HT-->>LT: Hợp đồng DRAFT

    alt Có giảm giá hoặc điều khoản đặc biệt
        LT->>QL: Gửi duyệt (PENDING_APPROVAL)
        QL->>HT: Duyệt + ghi lý do
        HT->>HT: audit_logs
    end

    LT->>HT: Xuất PDF (render template + biến)
    HT-->>LT: File PDF
    LT->>KH: In, đọc, ký
    KH-->>LT: Bản đã ký
    LT->>HT: Upload bản ký (signedPdfUrl)
    Note over HT: Hợp đồng chỉ ACTIVE khi check-in
```

**Điểm dễ sai:** **không snapshot điều khoản và giá.** Nếu hợp đồng chỉ trỏ tới `templateId` và bảng giá, thì khi sửa template hoặc tăng giá, mọi hợp đồng cũ đều "thay đổi nội dung" — mất giá trị pháp lý hoàn toàn.

---

## 5. Sinh hóa đơn tháng

```mermaid
sequenceDiagram
    autonumber
    participant Job as Cron
    participant HT as Hệ thống
    participant QL as Branch Manager
    actor KH as Khách

    Note over Job: Ngày chốt kỳ của chi nhánh (vd 28)
    Job->>HT: Tạo billing_period (2026-09)

    HT->>HT: Kiểm tra tiền đề
    alt Chỉ số điện nước chưa nhập/duyệt đủ
        HT-->>QL: ⚠ 14/52 phòng chưa có chỉ số — DỪNG
        Note over QL: Phải hoàn tất rồi mới chạy lại
    end

    loop Mỗi hợp đồng ACTIVE trong kỳ
        HT->>HT: 1. RENT ← duyệt bed_assignments giao với kỳ, prorate
        HT->>HT: 2. ELECTRICITY/WATER ← utility_readings APPROVED
        HT->>HT: 3. SERVICE_RECURRING ← service_subscriptions
        HT->>HT: 4. SERVICE_USAGE ← service_usages trong kỳ
        HT->>HT: 5. PENALTY ← violations APPROVED chưa tính
        HT->>HT: 6. DAMAGE ← ticket chargeToTenant chưa tính
        HT->>HT: 7. DISCOUNT ← contracts.discounts
        HT->>HT: 8. Trừ creditBalance kỳ trước
        HT->>HT: Tạo invoice DRAFT + invoice_lines (có calculationNote)
    end

    HT-->>QL: N hóa đơn DRAFT + BÁO CÁO BẤT THƯỜNG
    Note over QL: Hóa đơn lệch >30% kỳ trước<br/>Tiền điện lệch >50% trung bình<br/>HĐ active không sinh được hóa đơn<br/>Hóa đơn 0đ hoặc âm

    QL->>HT: Review, sửa bản nháp nếu cần
    QL->>HT: Phát hành hàng loạt

    rect rgb(240, 245, 255)
    Note over HT: TRANSACTION mỗi hóa đơn
    HT->>HT: status = ISSUED, sinh invoiceNo
    HT->>HT: Ghi snapshot (tên, phòng, giá)
    HT->>HT: utility_readings → LOCKED
    HT->>HT: violations → CHARGED
    HT->>HT: audit_logs
    end

    HT->>KH: Zalo + Email: hóa đơn tháng 9, hạn 10/10
```

**Điểm dễ sai:**
1. **Tự động phát hành thẳng không qua review.** Tháng nào cũng có vài trường hợp bất thường. Phát hành sai rồi phải làm bút toán điều chỉnh — rất mất công và mất uy tín.
2. **Quên `calculationNote`.** Khách hỏi "sao tiền điện cao vậy" mà lễ tân không giải thích được.

---

## 6. Thanh toán

```mermaid
sequenceDiagram
    autonumber
    actor KH as Khách
    participant NH as Ngân hàng / Cổng TT
    participant HT as Hệ thống
    participant LT as Lễ tân

    alt Thanh toán tiền mặt tại quầy
        KH->>LT: Đưa tiền
        LT->>HT: Ghi nhận (idempotencyKey từ client)
        HT->>HT: Kiểm tra có ca két đang mở
    else Chuyển khoản / VietQR
        HT->>KH: Sinh QR động (số tiền + nội dung "HD142 NGUYENVANA")
        KH->>NH: Quét & chuyển
        NH->>HT: Webhook
        HT->>HT: Verify chữ ký HMAC
        HT->>HT: Kiểm tra idempotencyKey / externalTxnId
        alt Đã tồn tại
            HT-->>NH: 200 OK (không tạo mới, không báo lỗi)
        end
    end

    rect rgb(240, 245, 255)
    Note over HT: TRANSACTION
    HT->>HT: Tạo payments (CONFIRMED)
    HT->>HT: Khớp mã hóa đơn trong nội dung CK
    alt Khớp được
        HT->>HT: Phân bổ FIFO (hóa đơn cũ nhất trước)
        HT->>HT: Tạo payment_allocations
        HT->>HT: Cập nhật invoice.paidAmount, balance, status
    else Không khớp được chủ nhân
        HT->>HT: Đưa vào hàng chờ đối soát (KHÔNG gán bừa)
    end
    opt Thu vượt tổng nợ
        HT->>HT: Phần dư → customer.creditBalance
    end
    HT->>HT: audit_logs
    end

    HT-->>LT: Phiếu thu (in được)
    HT-->>KH: Zalo xác nhận đã nhận thanh toán
```

**Điểm dễ sai:**
1. **Không có idempotency key.** Webhook retry → ghi nhận 2 lần → khách được ghi thừa tiền → phát hiện muộn.
2. **Trả lỗi cho webhook trùng.** Ngân hàng sẽ retry mãi. Phải trả `200 OK`.
3. **Gán bừa khoản chuyển khoản không rõ chủ.** Tạo sai lệch rất khó lần ra.

---

## 7. Quá hạn thanh toán

```mermaid
sequenceDiagram
    autonumber
    participant Job as Cron hằng ngày
    participant HT as Hệ thống
    actor KH as Khách
    participant LT as Lễ tân
    participant QL as Branch Manager

    Job->>HT: Quét invoices ISSUED/PARTIALLY_PAID có dueDate < hôm nay
    HT->>HT: status = OVERDUE
    HT->>HT: Tính phí trễ hạn theo chính sách (sau ngày ân hạn)

    Note over HT: Nhắc theo bậc
    HT->>KH: D-3 trước hạn: Zalo nhắc nhẹ + QR
    HT->>KH: D+1: Zalo thông báo quá hạn
    HT->>KH: D+3: Zalo + Email lần 2, nêu phí trễ hạn
    HT->>LT: D+7: Tạo nhiệm vụ GỌI ĐIỆN (không tự động thay được)
    LT->>KH: Gọi, ghi nhận cam kết trả
    HT->>KH: D+15: Email + văn bản, gửi cả người liên hệ khẩn cấp
    HT->>QL: D+30: Nhiệm vụ làm việc trực tiếp, lập biên bản
    QL->>HT: D+45: Quyết định — chấm dứt HĐ / trừ cọc / kế hoạch trả góp

    opt Khách cam kết trả góp
        LT->>HT: Tạo payment_plan (các mốc + số tiền)
        HT->>HT: Nhắc theo mốc đó thay vì nhắc chung
    end
```

**Điểm dễ sai:** để hệ thống nhắc mãi bằng tin nhắn. Sau D+7 phải có **con người gọi điện**. Tin nhắn tự động sau mốc đó gần như vô tác dụng, chỉ làm khách chai lì.

---

## 8. Chuyển giường / chuyển phòng

```mermaid
sequenceDiagram
    autonumber
    actor KH as Khách
    participant LT as Lễ tân
    participant HT as Hệ thống

    KH->>LT: Yêu cầu chuyển (ồn, không hợp bạn cùng phòng, muốn nâng cấp)
    LT->>HT: Tìm giường trống phù hợp
    HT->>HT: isAvailableForPeriod + kiểm tra giới tính tòa/tầng
    HT-->>LT: Danh sách + chênh lệch giá

    LT->>KH: Thông báo giá mới (nếu khác)
    KH-->>LT: Đồng ý

    rect rgb(240, 245, 255)
    Note over HT: TRANSACTION
    HT->>HT: 1. Đóng assignment cũ: endDate = hôm qua, reason = TRANSFER_ROOM
    HT->>HT: 2. Giường cũ → CLEANING, currentAssignmentId = null
    HT->>HT: 3. Tạo housekeeping_task cho giường cũ
    HT->>HT: 4. Tạo assignment mới: startDate = hôm nay, dailyRate mới (snapshot)
    HT->>HT: 5. Giường mới → OCCUPIED
    HT->>HT: 6. customer.currentBedId/currentRoomId
    HT->>HT: 7. Chốt chỉ số điện nước phòng cũ (nếu đồng hồ theo phòng)
    HT->>HT: 8. audit_logs (nhóm nhạy cảm)
    end

    Note over HT: Hóa đơn kỳ này TỰ ĐỘNG prorate 2 đoạn<br/>Không cần code riêng
    HT-->>KH: Zalo xác nhận chuyển phòng
```

**Điểm dễ sai:** **sửa assignment cũ thay vì đóng nó và mở cái mới.** Làm vậy là mất lịch sử, và hóa đơn sẽ tính sai toàn bộ khoảng thời gian trước khi chuyển.

---

## 9. Gia hạn hợp đồng

```mermaid
sequenceDiagram
    autonumber
    participant Job as Cron
    participant HT as Hệ thống
    actor KH as Khách
    participant LT as Lễ tân

    Job->>HT: Quét hợp đồng còn ≤30 ngày
    HT->>HT: status = EXPIRING
    HT->>KH: D-30: Zalo hỏi có gia hạn không
    HT->>LT: Đưa vào danh sách cần chăm sóc

    alt Khách đồng ý gia hạn
        LT->>HT: Tạo hợp đồng gia hạn
        HT->>HT: Giá mới (nếu tăng, kiểm tra đã thông báo đủ hạn chưa)

        rect rgb(240, 245, 255)
        Note over HT: TRANSACTION
        HT->>HT: 1. Tạo contract MỚI, previousContractId = HĐ cũ
        HT->>HT: 2. startDate = endDate HĐ cũ + 1 ngày (liền mạch)
        HT->>HT: 3. Snapshot giá + điều khoản mới
        HT->>HT: 4. Cọc CHUYỂN sang HĐ mới (TRANSFER), không hoàn rồi thu lại
        HT->>HT: 5. Đóng assignment cũ, mở assignment mới cùng giường
        HT->>HT: 6. HĐ cũ → EXPIRED, nextContractId
        HT->>HT: 7. audit_logs
        end

        HT->>KH: PDF hợp đồng mới để ký
    else Khách không gia hạn
        LT->>HT: Đánh dấu sẽ trả phòng
        HT->>HT: Giường → CHECKOUT_PENDING (bán được cho ngày sau)
    else Khách không phản hồi đến ngày hết hạn
        alt Hợp đồng có autoRenewMonthly
            HT->>HT: Chuyển sang thuê tháng theo giá hiện hành
            HT-->>LT: Cảnh báo
        else
            HT-->>LT: ⛔ CẢNH BÁO ĐỎ: khách đang ở không hợp đồng
        end
    end
```

**Điểm dễ sai:** **hoàn cọc rồi thu cọc lại** khi gia hạn. Vừa mất công vừa tạo hai giao dịch tiền không cần thiết, dễ sai sót. Dùng bút toán `TRANSFER` trong sổ cọc.

---

## 10. Check-out

```mermaid
sequenceDiagram
    autonumber
    actor KH as Khách
    participant LT as Lễ tân
    participant HT as Hệ thống
    participant QL as Branch Manager

    KH->>LT: Báo trả phòng
    LT->>HT: Kiểm tra noticePeriodDays
    alt Báo trễ hơn quy định
        HT-->>LT: Áp phí phạt theo điều khoản hợp đồng
    end

    Note over LT,HT: NGÀY TRẢ PHÒNG
    LT->>HT: Mở quy trình check-out
    LT->>HT: 1. Chốt chỉ số điện nước
    LT->>HT: 2. Kiểm kê tài sản — so với biên bản check-in
    LT->>HT: 3. Chụp ảnh hiện trạng
    LT->>HT: 4. Ghi nhận hư hỏng + định giá
    LT->>HT: 5. Thu chìa khóa/thẻ (thiếu → phí thay)

    HT->>HT: Sinh hóa đơn quyết toán
    Note over HT: Tiền phòng prorate + điện nước<br/>+ dịch vụ + hư hỏng + phạt chưa thu

    HT->>HT: Tính tổng nghĩa vụ = công nợ cũ + hóa đơn quyết toán
    HT->>HT: Quyết toán cọc

    alt Cọc nhiều hơn nghĩa vụ
        HT->>HT: deposit_ledger: DEDUCT_* rồi tạo refund_request
        HT->>QL: Chờ duyệt hoàn cọc
    else Cọc không đủ trừ
        HT-->>LT: ⚠ Khách còn nợ sau khi trừ hết cọc
        LT->>KH: Yêu cầu thanh toán
        alt Khách không trả
            LT->>QL: Cần duyệt cho nợ
            HT->>HT: customer.status = CHECKED_OUT_WITH_DEBT
        end
    end

    rect rgb(240, 245, 255)
    Note over HT: TRANSACTION
    HT->>HT: 1. Đóng bed_assignment (endDate, reason = CHECK_OUT)
    HT->>HT: 2. beds.status = CLEANING (KHÔNG phải AVAILABLE)
    HT->>HT: 3. Tạo housekeeping_task
    HT->>HT: 4. contract.status = TERMINATED/EXPIRED
    HT->>HT: 5. Hủy service_subscriptions đang chạy
    HT->>HT: 6. checkin_checkout_records (bản check-out)
    HT->>HT: 7. customer.status cập nhật
    HT->>HT: 8. Xóa đăng ký tạm trú
    HT->>HT: 9. audit_logs
    end

    HT-->>LT: Biên bản thanh lý (in, 2 bên ký)
```

**Điểm dễ sai:**
1. **Đưa giường thẳng về `AVAILABLE`.** Hệ thống sẽ bán giường chưa dọn. Đây là lỗi vận hành gây khiếu nại nhiều nhất.
2. **Chặn cứng check-out khi còn nợ.** Khách sẽ đi dù sao. Thay vào đó: cảnh báo, cần duyệt, trừ tối đa vào cọc, ghi nhận phần còn lại.

---

## 11. Hoàn cọc

```mermaid
sequenceDiagram
    autonumber
    participant LT as Lễ tân
    participant HT as Hệ thống
    participant QL as Branch Manager
    participant OW as Owner
    participant KT as Kế toán
    actor KH as Khách

    LT->>HT: Tạo đề nghị hoàn cọc (từ check-out)
    HT->>HT: Tính số hoàn = cọc − công nợ − hư hỏng − phạt + creditBalance
    HT->>HT: deposit_refund_request (PENDING)
    HT->>HT: refundDueDate = ngày trả phòng + refundDays (vd 7 ngày)

    alt Số hoàn ≤ hạn mức chi nhánh
        HT->>QL: Chờ duyệt
        QL->>HT: Duyệt
    else Vượt hạn mức
        HT->>OW: Chờ Owner duyệt
        OW->>HT: Duyệt
    end
    Note over HT: Người duyệt PHẢI khác người đề xuất

    HT->>KT: Vào danh sách "cọc đến hạn hoàn"
    KT->>HT: Thực hiện chi trả (tiền mặt / chuyển khoản)

    rect rgb(240, 245, 255)
    Note over HT: TRANSACTION
    HT->>HT: deposit_ledger: REFUND (âm)
    HT->>HT: Số dư cọc về 0, đóng sổ cọc hợp đồng
    HT->>HT: Tạo chứng từ chi
    HT->>HT: audit_logs
    end

    HT-->>KH: Zalo xác nhận đã hoàn cọc + chứng từ

    Note over HT: Job cảnh báo nếu quá refundDueDate chưa hoàn
```

**Điểm dễ sai:** **không theo dõi "cọc đến hạn hoàn".** Khách phải tự đòi — đây là nguồn đánh giá xấu lớn nhất của mô hình KTX, và hoàn toàn tránh được bằng một danh sách trên dashboard kế toán.

---

## 12. Tạo & xử lý ticket bảo trì

```mermaid
sequenceDiagram
    autonumber
    actor KH as Khách
    participant HT as Hệ thống
    participant QL as Branch Manager
    participant KT as Kỹ thuật

    KH->>HT: Báo sự cố qua portal (chọn loại + mô tả + ảnh)
    HT->>HT: Tạo ticket OPEN
    HT->>HT: priority tự động theo category
    HT->>HT: Tính slaResponseDeadline, slaResolveDeadline
    HT->>HT: Kiểm tra ticket trùng cùng phòng cùng loại
    opt Trùng
        HT->>HT: Gộp (mergedIntoTicketId), thông báo cả 2 người báo
    end
    HT-->>QL: Thông báo ticket mới
    HT-->>KH: Xác nhận đã nhận, mã ticket, thời gian dự kiến

    QL->>HT: Phân công kỹ thuật → ASSIGNED
    HT-->>KT: Zalo + thông báo trong app

    KT->>HT: Nhận việc, đến nơi → IN_PROGRESS
    opt Tài sản còn bảo hành
        HT-->>KT: ⚠ Còn bảo hành đến 12/2027 — liên hệ NCC trước
    end

    alt Thiếu vật tư
        KT->>HT: WAITING_PARTS
        Note over HT: DỪNG đồng hồ SLA
    else Khách không có nhà
        KT->>HT: WAITING_TENANT
        Note over HT: DỪNG đồng hồ SLA
    end

    KT->>HT: Sửa xong, chụp ảnh → RESOLVED
    KT->>HT: Ghi chi phí (nhân công + vật tư)

    QL->>HT: Xác định ai chịu chi phí
    alt Cali chịu (hao mòn, lỗi thiết bị)
        HT->>HT: Tạo expenses
    else Khách làm hỏng
        HT->>HT: Tạo invoice_line DAMAGE cho kỳ tới
    end

    HT->>HT: Ghi asset_events, tăng asset.repairCount
    opt Tài sản sửa >3 lần/6 tháng
        HT-->>QL: Gợi ý thay mới
    end

    HT-->>KH: Thông báo đã xử lý xong, mời đánh giá
    KH->>HT: Xác nhận → CLOSED
    Note over HT: Không phản hồi 48h → tự động CLOSED

    par Escalate tự động
        HT->>KT: Quá 50% SLA chưa nhận → nhắc lại
        HT->>QL: Quá 100% SLA → thông báo quản lý
        HT->>QL: Quá 150% SLA → thông báo Owner
    end
```

**Điểm dễ sai:** **đếm SLA cả thời gian chờ vật tư và chờ khách.** Kỹ thuật bị phạt oan vì lý do ngoài tầm kiểm soát, và họ sẽ ngừng cập nhật trạng thái trên hệ thống — mất luôn giá trị của module.

---

## Tổng kết: các nghiệp vụ BẮT BUỘC dùng transaction

| Nghiệp vụ | Số thao tác ghi | Hậu quả nếu không atomic |
|---|---|---|
| Check-in | 9–10 | Khách ở mà không có hợp đồng |
| Check-out | 9 | Giường giải phóng mà cọc chưa quyết toán |
| Đặt cọc | 5 | Tiền thu mà booking không cập nhật |
| Phát hành hóa đơn | 4 | Hóa đơn thiếu dòng chi tiết |
| Ghi nhận thanh toán | 4–5 | Tiền ghi nhận mà hóa đơn không cập nhật |
| Chuyển giường | 8 | Hai assignment cùng mở, hoặc không cái nào |
| Gia hạn hợp đồng | 7 | Hở ngày giữa hai hợp đồng, cọc mất dấu |
| Hoàn cọc | 4 | Chi tiền mà sổ cọc không ghi |

Đây là lý do **MongoDB replica set là bắt buộc**, không phải tùy chọn.
