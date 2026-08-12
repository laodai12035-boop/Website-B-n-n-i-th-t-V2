# Phân tích nghiệp vụ: NT-06-CN-001 — Xem lịch sử đơn hàng & Chi tiết đơn hàng

**Story:** NT-06-CN-001 & NT-06-CN-002  
**Epic:** NT-06 — Quản lý đơn hàng  
**Ngày phân tích:** 2026-08-12

---

## 1. Mô tả nghiệp vụ

- **Lịch sử đơn hàng:** Khách hàng (sau khi đăng nhập) có thể xem danh sách các đơn hàng đã từng đặt, sắp xếp theo thời gian đặt mới nhất tới cũ nhất. Có thể lọc theo trạng thái đơn hàng (Tất cả, Chờ xác nhận, Đã xác nhận, Đang giao, Đã hoàn thành, Đã hủy).
- **Chi tiết đơn hàng:** Khách hàng có thể bấm vào từng đơn hàng để xem đầy đủ thông tin: Danh sách mặt hàng, số lượng, đơn giá, subtotal, phí vận chuyển (QTN-07), số tiền giảm giá, tổng tiền thanh toán, hình thức thanh toán (COD / QR), trạng thái thanh toán và địa chỉ nhận hàng.
- **Bảo mật & Phân quyền (Authorization):** Khách hàng chỉ có quyền xem đơn hàng của chính mình (`order.user_id == current_user.id`). Cố tình xem đơn hàng của người khác sẽ bị hệ thống từ chối truy cập với lỗi `403 FORBIDDEN` (hoặc `404 ORDER_NOT_FOUND` nếu mã đơn không tồn tại). Admin có quyền xem chi tiết mọi đơn hàng.

---

## 2. Trạng thái đơn hàng & Trạng thái thanh toán

### 2.1 Trạng thái đơn hàng (`status`)
| Mã trạng thái | Tên hiển thị | Màu sắc đại diện (Badge UI) |
|---|---|---|
| `pending` | Chờ xác nhận | Vàng / Orange (`bg-amber-100 text-amber-800`) |
| `confirmed` | Đã xác nhận | Xanh dương (`bg-blue-100 text-blue-800`) |
| `shipping` | Đang giao hàng | Tím (`bg-purple-100 text-purple-800`) |
| `delivered` | Đã giao / Hoàn thành | Xanh lá (`bg-emerald-100 text-emerald-800`) |
| `cancelled` | Đã hủy | Đỏ (`bg-red-100 text-red-800`) |

### 2.2 Trạng thái thanh toán (`payment_status`)
| Mã trạng thái | Tên hiển thị | Mô tả |
|---|---|---|
| `unpaid` | Chưa thanh toán | Thanh toán COD lúc nhận hàng |
| `pending_payment` | Chờ thanh toán | Đơn QR chưa được quét/chưa xác nhận |
| `paid` | Đã thanh toán | Đã chuyển khoản QR thành công |

---

## 3. Thiết kế API Endpoints

### 3.1 `GET /api/v1/orders`
- **Mô tả:** Lấy danh sách đơn hàng của khách hàng đang đăng nhập.
- **Headers:** `Authorization: Bearer <token>`
- **Query Params (tùy chọn):** `status` (vd: `pending`, `delivered`, ...)
- **Response 200:**
  ```json
  {
    "status": "success",
    "message": "Thành công",
    "data": [
      {
        "id": 1,
        "order_code": "ORD-20260812-1001",
        "recipient_name": "Nguyễn Văn A",
        "recipient_phone": "0901234567",
        "shipping_address": "123 Nguyễn Huệ, TP.HCM",
        "payment_method": "COD",
        "payment_status": "unpaid",
        "status": "pending",
        "subtotal": 28500000.0,
        "discount_amount": 0.0,
        "shipping_fee": 120000.0,
        "total_amount": 28620000.0,
        "created_at": "2026-08-12T10:00:00",
        "items": [...]
      }
    ]
  }
  ```

### 3.2 `GET /api/v1/orders/<int:order_id>`
- **Mô tả:** Lấy chi tiết 1 đơn hàng theo ID.
- **Headers:** `Authorization: Bearer <token>`
- **Authorization Rule:**
  - Nếu `order.id` không tồn tại trong DB -> 404 `ORDER_NOT_FOUND`
  - Nếu `order.user_id != current_user.id` (và không phải admin) -> 403 `FORBIDDEN`
- **Response 200:** Trả về dict chi tiết đơn hàng.

---

## 4. Ma trận Test Cases

| Mã AC | Kịch bản | Input | Trạng thái mong đợi | Phản hồi API / UI |
|---|---|---|---|---|
| **TC-01** | Khách xem danh sách đơn hàng | Token hợp lệ | 200 OK | Trả về danh sách đơn của đúng user_id, mới nhất xếp trước |
| **TC-02** | Xem chi tiết đơn hợp lệ | `order_id` thuộc user | 200 OK | Hiển thị chi tiết đơn hàng, sản phẩm, tổng tiền |
| **TC-03** | Truy cập đơn người khác | `order_id` thuộc user khác | 403 FORBIDDEN | Lỗi "Bạn không có quyền xem đơn hàng này" |
| **TC-04** | Truy cập đơn không tồn tại | `order_id` = 99999 | 404 ORDER_NOT_FOUND | Lỗi "Đơn hàng không tồn tại" |
| **TC-05** | Khách chưa đăng nhập | Không token | 401 Unauthorized | Yêu cầu đăng nhập |
| **TC-06** | Lọc đơn hàng theo status | `?status=pending` | 200 OK | Chỉ trả về các đơn có `status='pending'` |
