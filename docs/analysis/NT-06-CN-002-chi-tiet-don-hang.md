# Phân tích nghiệp vụ: NT-06-CN-002 — Xem chi tiết và trạng thái đơn hàng

**Story:** NT-06-CN-002  
**Epic:** NT-06 — Quản lý đơn hàng  
**Ngày phân tích:** 2026-08-12

---

## 1. Mô tả nghiệp vụ

> Là Khách hàng, tôi muốn xem chi tiết một đơn hàng gồm sản phẩm, giá, trạng thái vận chuyển, để nắm rõ tiến trình giao hàng.

**Điều kiện bắt đầu:** Đơn hàng thuộc về tài khoản đang đăng nhập (hoặc tài khoản Admin).  
**Kết quả:** Trang chi tiết đơn hàng hiển thị đúng và đầy đủ thông tin, kèm timeline trạng thái vận chuyển trực quan. Nếu xem đơn của người khác ➔ Hệ thống từ chối truy cập (403 Forbidden).

---

## 2. Sơ đồ Timeline trạng thái đơn hàng (Order Timeline Stepper)

Tiến trình đơn hàng gồm 4 bước chính:

```
[1. Đã đặt hàng] ──► [2. Đã xác nhận] ──► [3. Đang giao hàng] ──► [4. Đã hoàn thành]
   (pending)           (confirmed)           (shipping)             (delivered)
```

- Trạng thái `cancelled`: Đơn hàng bị hủy ➔ Hiện banner Đã hủy kèm lý do/ngày hủy.

---

## 3. Phân quyền và Bảo mật (Security & Authorization)

| Vai trò | Điều kiện đơn hàng | Mã phản hồi | Phản hồi |
|---|---|---|---|
| Customer A | `order.user_id == A.id` | **200 OK** | Hiển thị đầy đủ trang chi tiết đơn hàng |
| Customer A | `order.user_id == B.id` | **403 FORBIDDEN** | "Bạn không có quyền truy cập thông tin đơn hàng này" |
| Any User | `order.id` không tồn tại | **404 NOT FOUND** | "Đơn hàng không tồn tại" |
| Admin | Mọi đơn hàng | **200 OK** | Hiển thị đầy đủ chi tiết đơn hàng |
| Guest | Chưa đăng nhập | **401 UNAUTHORIZED** | Yêu cầu đăng nhập |

---

## 4. Cấu trúc dữ liệu chi tiết đơn hàng (Response API)

- **Thông tin chung:** `id`, `order_code`, `created_at`, `status`, `payment_method`, `payment_status`, `qr_expire_at`.
- **Thông tin người nhận:** `recipient_name`, `recipient_phone`, `shipping_address`, `note`.
- **Danh sách sản phẩm:** Array of items `[{ product_id, product_name, quantity, price, subtotal, product_image }]`.
- **Chi tiết giá:** `subtotal`, `shipping_fee` (QTN-07), `discount_amount`, `total_amount`.

---

## 5. Ma trận Test Cases

| Mã AC | Kịch bản | Input | Kết quả mong đợi |
|---|---|---|---|
| **TC-01** | Luồng thành công | `order_id` thuộc tài khoản hiện tại | 200 OK. Chi tiết hiển thị đúng sản phẩm, tổng tiền, timeline trạng thái |
| **TC-02** | Không có quyền | `order_id` thuộc tài khoản khác | 403 Forbidden. Lỗi FORBIDDEN |
| **TC-03** | Đơn không tồn tại | `order_id` = 99999 | 404 Not Found. Lỗi ORDER_NOT_FOUND |
| **TC-04** | Admin xem đơn | Admin token + any `order_id` | 200 OK. |
| **TC-05** | Khách chưa đăng nhập | Không token | 401 Unauthorized |
