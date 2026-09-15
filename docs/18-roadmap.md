# 18 — Roadmap

> Giả định: team 2–4 người (1–2 fullstack, 1 người kiêm BA/QA, có thể thêm 1 frontend). Ước lượng tính theo tuần thực tế, đã trừ hao cho họp, sửa lỗi và thay đổi yêu cầu.

---

## Nguyên tắc phân phase

| Nguyên tắc | Nghĩa là |
|---|---|
| **Mỗi phase phải dùng được thật** | Không phase nào kết thúc bằng "chưa chạy được, chờ phase sau" |
| **Nền tảng trước, tính năng sau** | Phân quyền và audit không thể thêm sau — phải có từ đầu |
| **Import dữ liệu là Phase 0** | Không import được dữ liệu hiện có thì hệ thống sẽ không bao giờ được dùng |
| **Không làm tính năng chưa ai cần** | Mọi tính năng phải trả lời được: nó thay thế việc thủ công nào? |
| **Chạy song song Excel 1 tháng** | Phase 1 kết thúc bằng 1 tháng chạy song song để đối chiếu, rồi mới bỏ Excel |

---

## Phase 0 — Nền tảng (2–3 tuần)

### Làm gì
| # | Hạng mục | Chi tiết |
|---|---|---|
| 1 | Khởi tạo dự án | Monorepo pnpm, Vite+React+TS, Fastify+Mongoose, MongoDB replica set, CI |
| 2 | Xác thực | Đăng nhập, JWT + refresh, đổi mật khẩu, khóa tài khoản |
| 3 | **RBAC + Scope guard** | Permission, role, assignment, `scopeFilter()`, ESLint rule, bộ test phân quyền |
| 4 | **Audit log** | Ghi tự động ở tầng service, màn hình xem |
| 5 | **Module tiền** | `VND` bigint, làm tròn, chia có trọng số, đọc thành chữ, serialize JSON |
| 6 | Cấu trúc BĐS | Chi nhánh → tòa → tầng → loại phòng → phòng → giường; tạo hàng loạt |
| 7 | **Công cụ import Excel** | 5 file mẫu + validate + báo cáo đối chiếu |
| 8 | Khung giao diện | Sidebar theo vai trò, thanh trên, tìm kiếm toàn cục, mẫu danh sách/chi tiết/form |

### Vì sao làm trước
- **Phân quyền và audit không thể thêm sau.** Bắt buộc mọi truy vấn đi qua `scopeFilter` từ dòng code đầu tiên, nếu không sẽ phải rà lại toàn bộ hệ thống.
- **Module tiền phải đúng từ đầu.** Nếu Phase 1 dùng `Number` rồi Phase 2 mới chuyển sang `bigint`, phải migrate dữ liệu tiền — rất rủi ro.
- **Import quyết định hệ thống có được dùng thật hay không.** Đây là bài học đắt giá của nhiều dự án nội bộ: sản phẩm tốt nhưng nhân viên không chuyển sang vì phải nhập tay 500 bản ghi.

### Tiêu chí hoàn thành
- [ ] Import được toàn bộ cấu trúc BĐS của 1 chi nhánh từ Excel, có báo cáo đối chiếu khớp
- [ ] Tạo được 3 tài khoản 3 vai trò, test phân quyền chéo chi nhánh **pass 100%**
- [ ] Mọi thao tác ghi đều xuất hiện trong audit log
- [ ] Sơ đồ giường hiển thị đúng

---

## Phase 1 — MVP vận hành được (6–8 tuần)

### Làm gì
| # | Hạng mục |
|---|---|
| 1 | **Hồ sơ khách thuê** đầy đủ + tìm kiếm không dấu + upload CCCD an toàn |
| 2 | **Đặt chỗ & đặt cọc** + TTL giữ chỗ + chính sách hủy |
| 3 | **Hợp đồng**: template, sinh PDF, duyệt, gia hạn, chấm dứt |
| 4 | **Check-in / Check-out** đầy đủ checklist, kiểm kê tài sản, ảnh 2 chiều |
| 5 | **`bed_assignments`** + chuyển giường/phòng |
| 6 | **Điện nước**: đồng hồ, nhập chỉ số (web + mobile), ảnh, validate, duyệt, khóa kỳ |
| 7 | **Sinh hóa đơn kỳ** hàng loạt + báo cáo bất thường + phát hành |
| 8 | **Thanh toán**: tiền mặt, chuyển khoản thủ công, phân bổ FIFO, idempotency |
| 9 | **Két tiền mặt** theo ca |
| 10 | **Sổ cọc** + hoàn cọc có duyệt |
| 11 | **Công nợ** + aging report |
| 12 | **Dịch vụ** cơ bản (định kỳ + theo lần) |
| 13 | **Ticket bảo trì** cơ bản (chưa có SLA tự động) |
| 14 | **Báo cáo Phase 1**: lấp đầy, doanh thu, công nợ, khách thuê, hợp đồng, két, tạm trú |
| 15 | **Export Excel** toàn bộ báo cáo |
| 16 | Dashboard Owner + Branch Manager + màn hình tác nghiệp lễ tân |
| 17 | Thông báo trong app + Email |

### Vì sao đây là ranh giới "bỏ được Excel"
Phase 1 bao trọn **vòng đời khách thuê và vòng đời tiền**. Thiếu bất kỳ mục nào ở trên thì nhân viên vẫn phải giữ file Excel song song — và khi đã có file song song thì hệ thống sẽ dần bị bỏ.

### Chưa làm và vì sao
| Chưa làm | Lý do |
|---|---|
| Automation tự động | Phase 1 làm tay trước để **kiểm chứng logic đúng**, rồi mới tự động hóa. Tự động hóa một logic sai sẽ nhân sai số lên |
| Portal khách thuê | Nội bộ phải chạy ổn trước khi mở cho khách |
| Zalo ZNS | Cần thời gian đăng ký template với Zalo; email đủ dùng giai đoạn đầu |
| Tài sản, vi phạm, chi phí | Không chặn vận hành cơ bản |
| Payment gateway | Chuyển khoản thủ công vẫn chạy được |

### Tiêu chí hoàn thành
- [ ] Chạy trọn 1 chu kỳ tháng trên hệ thống: nhập chỉ số → sinh hóa đơn → phát hành → thu tiền → chốt công nợ
- [ ] **Chạy song song Excel 1 tháng, số liệu khớp 100%**
- [ ] Thời gian lập hóa đơn < 1 giờ/chi nhánh
- [ ] Thu tiền ≤ 3 click, < 30 giây
- [ ] Chốt két hằng ngày, chênh lệch có giải trình
- [ ] Không có giường bán trùng

**Đây là mốc release thật.** Chưa đạt đủ 6 tiêu chí trên thì không go-live.

---

## Phase 2 — Giảm việc thủ công (4–6 tuần)

### Làm gì
| # | Hạng mục |
|---|---|
| 1 | **Automation A1–A8** (must have): sinh hóa đơn tự động, nhắc nợ theo bậc, cảnh báo hợp đồng, hết hạn booking, quá hạn, reconcile giường, nhắc nhập chỉ số, cảnh báo két |
| 2 | **Zalo ZNS**: đăng ký template, tích hợp, gửi hóa đơn và nhắc nợ |
| 3 | **Ticket + SLA** đầy đủ: ưu tiên, deadline, escalate, chi phí |
| 4 | **Tài sản**: danh mục, QR, lịch sử, khấu hao, cảnh báo bảo hành, kiểm kê |
| 5 | **Vệ sinh**: task tự tạo khi check-out, giao việc, mobile |
| 6 | **Nội quy & vi phạm**: phiên bản nội quy, danh mục phạt, quy trình duyệt, tự cộng vào hóa đơn |
| 7 | **Chi phí vận hành** + phân bổ chi phí chung |
| 8 | **Báo cáo P&L theo chi nhánh** |
| 9 | **Báo cáo bổ sung**: chi phí, dòng tiền, bảo trì, tài sản, điện nước, vi phạm |
| 10 | Dashboard Owner đầy đủ + báo cáo tự động gửi định kỳ |
| 11 | Giao diện mobile cho Kỹ thuật và Tạp vụ |
| 12 | `report_snapshots` nếu báo cáo bắt đầu chậm |

### Vì sao làm bây giờ
Phase 1 đã chứng minh logic đúng qua 1–2 chu kỳ thật. Giờ mới an toàn để tự động hóa. **Chi phí vận hành và P&L đưa vào đây** vì đó là thứ Owner cần nhất và Phase 1 chưa có.

### Tiêu chí hoàn thành
- [ ] Hóa đơn nháp tự sinh đúng ngày, quản lý chỉ cần review 15 phút
- [ ] Nhắc nợ tự động qua Zalo, tỷ lệ đọc >70%
- [ ] Owner xem được P&L từng chi nhánh không cần hỏi ai
- [ ] Ticket có SLA, tỷ lệ đạt SLA đo được

---

## Phase 3 — Khách tự phục vụ (6–8 tuần)

### Làm gì
| # | Hạng mục |
|---|---|
| 1 | **Portal khách thuê**: đăng nhập SĐT + OTP, xem hóa đơn (có chi tiết chỉ số điện), lịch sử thanh toán, hợp đồng, báo sự cố, nội quy, thông báo |
| 2 | **VietQR động** + webhook ngân hàng (Casso/SePay hoặc API ngân hàng) |
| 3 | **Đối soát tự động** — màn hình 2 cột, tự khớp theo mã hóa đơn |
| 4 | **Ký điện tử** hợp đồng (bắt đầu từ gia hạn) |
| 5 | **QR check-in khách thăm** |
| 6 | **OCR CCCD** khi đăng ký |
| 7 | Đăng ký thuê online (form công khai) + danh sách chờ |
| 8 | Gia hạn hợp đồng online |
| 9 | Automation A9–A20 |

### Vì sao làm bây giờ
- Portal chỉ có giá trị khi dữ liệu đã đầy đủ và chính xác. Mở portal với dữ liệu sai sẽ tạo hàng loạt khiếu nại.
- **VietQR + webhook là automation có ROI cao nhất còn lại** — tiết kiệm 8–12 giờ/tháng công đối soát. Đặt ở Phase 3 vì cần thời gian làm việc với ngân hàng/nhà cung cấp.
- OCR CCCD đến đây mới đáng làm, khi quy trình check-in đã ổn định.

### Tiêu chí hoàn thành
- [ ] >60% khách đăng nhập portal ít nhất 1 lần/tháng
- [ ] >80% thanh toán được đối soát tự động
- [ ] Số câu hỏi "tôi nợ bao nhiêu" gửi lễ tân giảm rõ rệt

---

## Phase 4 — Mở rộng chuỗi (khi ≥5 chi nhánh)

### Làm gì
| # | Hạng mục | Điều kiện kích hoạt |
|---|---|---|
| 1 | Báo cáo theo vùng, so sánh chi nhánh nâng cao | ≥5 chi nhánh |
| 2 | `report_snapshots` đầy đủ / data warehouse | Báo cáo >3 giây |
| 3 | AI tóm tắt báo cáo + hỏi đáp nội bộ | ≥5 chi nhánh |
| 4 | Dự báo lấp đầy, phát hiện bất thường bằng ML | ≥24 tháng dữ liệu sạch |
| 5 | OCR chỉ số điện nước | ≥1.000 phòng |
| 6 | App mobile native cho nhân viên | Khi web mobile không đủ |
| 7 | Thẻ từ / kiểm soát ra vào | Khi chi phí phần cứng có ROI |
| 8 | Multi-tenant thật (bán SaaS cho KTX khác) | Quyết định kinh doanh |

### Không làm trong 12 tháng đầu
| Không làm | Lý do |
|---|---|
| **Nhận diện khuôn mặt** | Dữ liệu sinh trắc học thuộc nhóm nhạy cảm theo Nghị định 13/2023 — cần sự đồng ý riêng và biện pháp bảo vệ nghiêm ngặt. Rủi ro pháp lý > giá trị ở quy mô này |
| **Tích hợp camera vào hệ thống** | Chi phí cao, không giảm được việc thủ công nào. Camera dùng riêng đã đủ |
| **Chatbot khách thuê** | Dưới 500 khách, lễ tân + Zalo xử lý tốt hơn. Chatbot trả lời sai về tiền gây hậu quả nghiêm trọng |
| **Module chấm công/KPI phức tạp** | Nghiệp vụ riêng, dùng phần mềm nhân sự chuyên dụng |
| **Phần mềm kế toán đầy đủ** | Export sang phần mềm kế toán chuyên dụng |

---

## Tổng thời gian

```
Phase 0  ████                          2–3 tuần
Phase 1  ████████████████              6–8 tuần
Phase 2  ██████████                    4–6 tuần
Phase 3  ██████████████                6–8 tuần
                                       ─────────
Tổng đến hết Phase 3:                  18–25 tuần  (~4,5–6 tháng)
Phase 4:                               theo nhu cầu kinh doanh
```

**Mốc go-live thật: cuối Phase 1 (~tuần 9–11).** Từ đó hệ thống thay thế được Excel; Phase 2–3 là cải tiến trên nền đang chạy.

---

## Rủi ro dự án và cách giảm thiểu

| Rủi ro | Xác suất | Ảnh hưởng | Giảm thiểu |
|---|---|---|---|
| **Nhân viên không chịu chuyển từ Excel** | Cao | Nghiêm trọng | Import dữ liệu tốt · đào tạo tại chỗ · chạy song song 1 tháng · lấy phản hồi lễ tân từ Phase 0 |
| **Yêu cầu thay đổi liên tục** | Cao | Trung bình | Bộ tài liệu này là điểm neo · thay đổi lớn phải cập nhật tài liệu trước |
| Logic tính tiền sai | Trung bình | **Nghiêm trọng** | Test tự động cho mọi trường hợp prorate · chạy song song Excel đối chiếu |
| Phân quyền rò rỉ giữa chi nhánh | Trung bình | **Nghiêm trọng** | Test phân quyền bắt buộc cho mọi endpoint · CI fail nếu thiếu test |
| MongoDB không chạy replica set ở production | Trung bình | **Nghiêm trọng** | Ghi rõ trong tài liệu triển khai · health check kiểm tra khả năng transaction khi khởi động |
| Mất dữ liệu | Thấp | **Nghiêm trọng** | Backup DB + object storage · diễn tập restore mỗi quý |
| Zalo ZNS duyệt template chậm | Trung bình | Thấp | Đăng ký sớm từ Phase 1 · email là phương án dự phòng |
| Webhook ngân hàng không ổn định | Trung bình | Trung bình | Luôn giữ luồng đối soát thủ công song song |

---

## Việc cần làm ngay trước khi code

1. **Xác nhận backend stack** — tài liệu giả định Node + Fastify + Mongoose. Cần bạn xác nhận.
2. **Chốt quy tắc prorate** — chia cho 30 cố định hay số ngày thực của tháng. Ảnh hưởng mọi hóa đơn. (Tài liệu khuyến nghị: chia 30, nhưng ở trọn tháng thì lấy đúng tiền tháng.)
3. **Chốt chính sách cọc** — số tháng, thời hạn hoàn, tỷ lệ hoàn khi hủy theo từng mốc.
4. **Chốt ngày chốt kỳ và hạn thanh toán** từng chi nhánh.
5. **Thu thập file Excel hiện tại** của cả 3 chi nhánh để thiết kế công cụ import sát thực tế.
6. **Chuẩn bị hạ tầng**: MongoDB replica set, object storage, tên miền.
7. **Đăng ký Zalo OA + ZNS** (thủ tục mất vài tuần, làm sớm).
