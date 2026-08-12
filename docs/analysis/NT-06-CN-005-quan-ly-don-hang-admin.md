# Phân tích nghiệp vụ: NT-06-CN-005 — Admin quản lý danh sách đơn hàng

**Story:** NT-06-CN-005  
**Epic:** NT-06 — Quản lý đơn hàng  
**Ngày phân tích:** 2026-08-12

---

## 1. Mô tả nghiệp vụ

> Là Quản trị viên, tôi muốn xem và lọc danh sách toàn bộ đơn hàng, để theo dõi và xử lý đơn hàng của khách hàng.

**Điều kiện bắt đầu:** Quản trị viên đã đăng nhập tài khoản có quyền Admin (`role == 'admin'`).  
**Kết quả:** Danh sách đơn hàng hiển thị đúng theo bộ lọc trạng thái, từ khóa tìm kiếm và khoảng thời gian đã chọn, hỗ trợ phân trang và thống kê số lượng đơn hàng theo từng trạng thái.

---

## 2. Quy tắc nghiệp vụ & Bộ lọc

### 2.1 Các tiêu chí lọc đơn hàng (Admin Criteria)
1. **Lọc theo trạng thái (`status`):**
   - `all`: Tất cả đơn hàng
   - `pending`: Chờ xác nhận
   - `confirmed`: Đã xác nhận / Đang xử lý
   - `shipping`: Đang giao hàng
   - `delivered`: Giao thành công
   - `cancelled`: Đã hủy
2. **Tìm kiếm từ khóa (`q` / `search`):**
   - Tìm theo mã đơn hàng (`order_code`)
   - Tìm theo tên người nhận (`recipient_name`)
   - Tìm theo số điện thoại nhận hàng (`recipient_phone`)
   - Tìm theo địa chỉ giao hàng (`shipping_address`)
3. **Lọc theo khoảng thời gian (`start_date`, `end_date`):**
   - `start_date`: Đơn đặt từ 00:00:00 của ngày bắt đầu
   - `end_date`: Đơn đặt đến 23:59:59 của ngày kết thúc
4. **Phân trang (`page`, `limit`):**
   - Mặc định: `page = 1`, `limit = 20`.
   - Trả về metadata: `total_items`, `total_pages`, `current_page`.
5. **Thống kê tổng quan (`summary`):**
   - Trả về số lượng đơn hàng thuộc từng trạng thái (`total`, `pending`, `confirmed`, `shipping`, `delivered`, `cancelled`).

### 2.2 Phân quyền & Bảo mật (QTN-09)
- Chỉ tài khoản có `role == 'admin'` mới được phép gọi API quản lý đơn hàng Admin và xem trang `/admin/orders`.
- Người dùng thông thường (`role == 'user'`) hoặc khách chưa đăng nhập khi cố gọi API ➔ **403 FORBIDDEN** (`"Chỉ Quản trị viên (Admin) mới có quyền truy cập."`) hoặc **401 Unauthorized**.

---

## 3. Thiết kế REST API Endpoint

### `GET /api/v1/admin/orders`
- **Headers:** `Authorization: Bearer <admin_token>`
- **Query Parameters:**
  - `status` (string, default `'all'`): `'all'`, `'pending'`, `'confirmed'`, `'shipping'`, `'delivered'`, `'cancelled'`
  - `q` (string, optional): Từ khóa tìm kiếm
  - `start_date` (string, optional, format YYYY-MM-DD)
  - `end_date` (string, optional, format YYYY-MM-DD)
  - `page` (int, default 1)
  - `limit` (int, default 20)
- **Response 200 OK:**
  ```json
  {
    "status": "success",
    "message": "Lấy danh sách đơn hàng cho Admin thành công",
    "data": {
      "orders": [
        {
          "id": 101,
          "order_code": "ORD-20260812-1001",
          "user_id": 1,
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
          "created_at": "2026-08-12T10:00:00Z"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 20,
        "total_items": 1,
        "total_pages": 1
      },
      "summary": {
        "total": 15,
        "pending": 3,
        "confirmed": 4,
        "shipping": 3,
        "delivered": 4,
        "cancelled": 1
      }
    }
  }
  ```

---

## 4. Ma trận Test Cases

| Mã AC | Kịch bản | Bộ lọc áp dụng | Kết quả mong đợi |
|---|---|---|---|
| **TC-01** | Lọc theo trạng thái `pending` | `status = 'pending'` | Trả về 200 OK, danh sách chỉ chứa các đơn `pending`. Summary có thống kê đầy đủ. |
| **TC-02** | Tìm kiếm từ khóa | `q = '0901234567'` hoặc `'ORD-2026'` | Trả về 200 OK, danh sách các đơn khớp với SĐT / mã đơn. |
| **TC-03** | Lọc theo khoảng ngày | `start_date = '2026-08-01'`, `end_date = '2026-08-12'` | Trả về 200 OK, chỉ gồm các đơn được tạo trong khoảng thời gian trên. |
| **TC-04** | Vi phạm phân quyền | Role = `'user'` | Trả về **403 FORBIDDEN**. |
| **TC-05** | Khách chưa đăng nhập | Không có token | Trả về **401 Unauthorized**. |
| **TC-06** | Phân trang | `page = 1`, `limit = 2` | Trả về 2 đơn hàng đầu tiên và pagination metadata chính xác. |
| **TC-07** | Admin Quick Search | `q = 'ORD-2026'` tại `/quick-search` | Danh sách `orders` trong kết quả quick search trả về các đơn khớp từ khóa. |
