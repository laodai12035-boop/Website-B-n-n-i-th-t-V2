# Phân tích nghiệp vụ: NT-05-CN-002 — Thanh toán qua mã QR ngân hàng

**Story:** NT-05-CN-002  
**Epic:** NT-05 — Thanh toán  
**Ngày phân tích:** 2026-08-12  
**Người thực hiện:** BA / Backend Dev

---

## 1. Mô tả nghiệp vụ

> Là Khách hàng, tôi muốn thanh toán bằng cách quét mã QR ngân hàng, để chuyển khoản nhanh và đơn hàng được xác nhận tự động.

**Điều kiện bắt đầu:** Giỏ hàng có ít nhất 1 sản phẩm, Khách hàng mở trang Thanh toán (`/checkout`) và chọn phương thức "Thanh toán QR ngân hàng".  
**Kết quả sau hoàn thành:** Đơn hàng được tạo với trạng thái `payment_status=pending_payment`, hệ thống sinh mã QR theo chuẩn VietQR quốc gia. Khi Admin xác nhận thanh toán, đơn chuyển sang `payment_status=paid`, `status=confirmed`.

---

## 2. Giải pháp kỹ thuật — VietQR Standard (Napas)

### 2.1 Tại sao VietQR?
- **VietQR** là chuẩn QR liên ngân hàng quốc gia Việt Nam do NAPAS ban hành.
- Tất cả ứng dụng ngân hàng tại Việt Nam (MB, Vietcombank, Techcombank, BIDV, v.v.) đều hỗ trợ quét.
- Sinh mã QR hoàn toàn **miễn phí** qua API công khai của VietQR.io, **không cần API key hay đăng ký**.

### 2.2 URL Pattern sinh QR
```
https://img.vietqr.io/image/{BANK_ID}-{ACCOUNT_NO}-{TEMPLATE}.png
  ?amount={AMOUNT}
  &addInfo={ORDER_CODE}
  &accountName={ACCOUNT_NAME}
```

**Tham số:**
| Tham số | Giá trị mẫu | Mô tả |
|---|---|---|
| `BANK_ID` | `MB` | Mã ngân hàng (MB = MBBank, VCB = Vietcombank…) |
| `ACCOUNT_NO` | `0327067055` | Số tài khoản nhận tiền |
| `TEMPLATE` | `qr_only` | Template QR (chỉ mã QR không có logo) |
| `amount` | `28500000` | Số tiền (VNĐ) |
| `addInfo` | `ORD-20260812-1001` | Nội dung chuyển khoản (order_code) |
| `accountName` | `NGUYEN VAN A` | Tên chủ tài khoản (URL-encoded) |

### 2.3 Cấu hình tài khoản nhận tiền
Lưu trong `.env` hoặc `config.py`:
```
QR_BANK_ID=MB
QR_ACCOUNT_NO=0327067055
QR_ACCOUNT_NAME=NGUYEN VAN A
QR_EXPIRE_MINUTES=15
```

---

## 3. Quy trình xử lý nghiệp vụ (QR Order Flow)

```
Khách hàng
  │
  ├── 1. Chọn "Thanh toán QR ngân hàng" tại /checkout
  │
  ▼
POST /api/v1/orders/qr
  │
  ├── Kiểm tra thông tin giao hàng (recipient_name, phone, address) — MISSING_SHIPPING_INFO
  ├── Kiểm tra giỏ hàng không rỗng — CART_EMPTY
  ├── Kiểm tra tồn kho từng SP (QTN-02) — EXCEED_STOCK
  ├── Áp dụng mã giảm giá nếu có (QTN-01)
  ├── Tạo Order (payment_method=QR_BANK, payment_status=pending_payment)
  ├── Tạo OrderItems, trừ stock, xóa CartItems
  ├── Tính qr_expire_at = now + 15 phút
  └── Sinh QR URL via VietQR.io
  │
  ▼
201 Created → { order, qr_url, qr_expire_at }
  │
  ▼
Frontend hiển thị màn hình QR:
  ├── Ảnh QR VietQR
  ├── Thông tin chuyển khoản
  ├── Đồng hồ đếm ngược 15 phút
  └── Polling GET /api/v1/orders/{id}/qr mỗi 5 giây
        │
        ├── payment_status=pending_payment → tiếp tục chờ
        ├── payment_status=paid → "✅ Thanh toán thành công!"
        └── qr_expire_at < now → "⚠️ Mã QR đã hết hạn"
```

---

## 4. Xác nhận thanh toán (Admin)

```
Admin dùng Postman hoặc Admin Dashboard:
  PATCH /api/v1/orders/{id}/confirm-payment  (JWT Admin token)
  → payment_status = 'paid'
  → status = 'confirmed'
  → 200 OK
```

> **Lưu ý:** Trong môi trường thật, bước này được thay bởi **webhook từ ngân hàng** khi phát hiện giao dịch khớp `order_code` trong nội dung chuyển khoản.

---

## 5. Ma trận Test Cases

| Mã AC | Kịch bản | Input | Kết quả mong đợi |
|---|---|---|---|
| **TC-01** | Tạo đơn QR thành công | Giỏ hàng có SP, địa chỉ hợp lệ | 201 Created. `payment_method=QR_BANK`, `payment_status=pending_payment`, `qr_url` hợp lệ |
| **TC-02** | QR hết hạn | `qr_expire_at` đã qua | `GET /orders/{id}/qr` → `expired=true` |
| **TC-03** | Admin xác nhận thanh toán | Admin PATCH confirm-payment | `payment_status=paid`, `status=confirmed` |
| **TC-04** | Customer không được xác nhận | Customer PATCH confirm-payment | 403 Forbidden |
