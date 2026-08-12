# Phân tích nghiệp vụ: NT-06-CN-006 — Admin cập nhật trạng thái đơn hàng

**Story:** NT-06-CN-006  
**Epic:** NT-06 — Quản lý đơn hàng  
**Ngày phân tích:** 2026-08-12

---

## 1. Mô tả nghiệp vụ

> Là Quản trị viên, tôi muốn cập nhật trạng thái đơn hàng qua các bước xử lý, đóng gói, giao hàng, để phản ánh đúng tiến trình xử lý đơn.

**Điều kiện bắt đầu:** Đơn hàng tồn tại trong hệ thống và Admin đã đăng nhập tài khoản có `role == 'admin'`.  
**Kết quả:** Trạng thái đơn hàng được cập nhật chính xác, tồn kho được điều chỉnh theo QTN-03 (nếu bị hủy) và khách hàng nhìn thấy trạng thái mới ngay trên trang chi tiết/lịch sử đơn.

---

## 2. Ma trận Chuyển đổi Trạng thái (State Machine)

### 2.1 Các trạng thái hợp lệ (Valid Transitions)
| Trạng thái hiện tại | Trạng thái mới hợp lệ | Mô tả nghiệp vụ |
|---|---|---|
| `pending` (Chờ xác nhận) | `confirmed` | Admin xác nhận đơn hàng thành công |
| `pending` (Chờ xác nhận) | `cancelled` | Admin hủy đơn hàng (Tự động hoàn stock QTN-03) |
| `confirmed` (Đã xác nhận) | `shipping` | Admin bàn giao đơn hàng cho đơn vị vận chuyển |
| `confirmed` (Đã xác nhận) | `cancelled` | Admin hủy đơn hàng (Tự động hoàn stock QTN-03) |
| `shipping` (Đang giao hàng) | `delivered` | Đơn hàng giao thành công tới tay khách hàng |

### 2.2 Các chuyển đổi KHÔNG hợp lệ (Disallowed Transitions - TC-02)
- **Đơn hàng ở trạng thái cuối (`delivered` hoặc `cancelled`):** Không được chuyển sang bất kỳ trạng thái nào khác ➔ Báo lỗi **400 Bad Request** (`INVALID_STATUS_TRANSITION`: *"Không thể thay đổi trạng thái của đơn hàng đã ở giai đoạn hoàn thành/đã hủy."*).
- **Chuyển trạng thái trùng nhau:** Cố chuyển `delivered` ➔ `delivered` hoặc `shipping` ➔ `shipping` ➔ Báo lỗi **400 Bad Request** (`INVALID_STATUS_TRANSITION`: *"Đơn hàng đã ở trạng thái này."*).
- **Nhảy cóc/Quay ngược:** Cố chuyển `pending` ➔ `delivered` hoặc `shipping` ➔ `pending` ➔ Báo lỗi **400 Bad Request** (`INVALID_STATUS_TRANSITION`: *"Chuyển trạng thái không hợp lệ trong quy trình."*).

---

## 3. Quy tắc nghiệp vụ Tồn kho (QTN-03)

- **Trừ kho:** Đơn hàng đã được trừ kho ngay tại thời điểm khách đặt hàng (checkout).
- **Hoàn kho:** Khi Admin chuyển đơn sang trạng thái `cancelled`:
  - Duyệt toàn bộ `OrderItem` thuộc đơn.
  - Hoàn trả số lượng tồn kho sản phẩm: `product.stock += item.quantity`.
  - Transaction commit an toàn.

---

## 4. Thiết kế REST API Endpoint

### `PUT /api/v1/orders/<order_id>/status` & `PATCH /api/v1/admin/orders/<order_id>/status`
- **Headers:** `Authorization: Bearer <admin_token>`
- **Request Body:**
  ```json
  {
    "status": "shipping",
    "note": "Đã giao cho Shipper GHN"
  }
  ```
- **Response 200 OK:**
  ```json
  {
    "status": "success",
    "message": "Cập nhật trạng thái đơn hàng sang 'shipping' thành công.",
    "data": {
      "id": 101,
      "order_code": "ORD-20260812-1001",
      "status": "shipping"
    }
  }
  ```
- **Response 400 Bad Request (Transition lỗi):**
  ```json
  {
    "status": "error",
    "message": "Không thể thay đổi trạng thái của đơn hàng đã ở giai đoạn hoàn thành (delivered).",
    "code": "INVALID_STATUS_TRANSITION"
  }
  ```
- **Response 403 Forbidden:**
  ```json
  {
    "status": "error",
    "message": "Chỉ Quản trị viên (Admin) mới có quyền cập nhật trạng thái đơn hàng.",
    "code": "FORBIDDEN"
  }
  ```

---

## 5. Ma trận Test Cases

| Mã AC | Kịch bản | Trạng thái hiện tại | Trạng thái mới | Kết quả mong đợi |
|---|---|---|---|---|
| **TC-01** | Luồng thành công | `pending` ➔ `confirmed` ➔ `shipping` ➔ `delivered` | Chuyển tuần tự | 200 OK từng bước, trạng thái đơn cập nhật chuẩn. |
| **TC-02** | Vi phạm trạng thái cuối | `delivered` | `shipping` / `pending` | **400 INVALID_STATUS_TRANSITION**. Trạng thái giữ nguyên `delivered`. |
| **TC-02b** | Vi phạm đơn đã hủy | `cancelled` | `confirmed` | **400 INVALID_STATUS_TRANSITION**. |
| **TC-03** | Admin hủy đơn (QTN-03) | `pending` hoặc `confirmed` | `cancelled` | 200 OK. Stock sản phẩm được hoàn đủ. |
| **TC-04** | Vi phạm phân quyền | User thường (role='user') | `confirmed` | **403 FORBIDDEN**. |
| **TC-05** | Đơn không tồn tại | ID 99999 | `confirmed` | **404 ORDER_NOT_FOUND**. |
| **TC-06** | Trạng thái mới rác | Any | `'invalid_status'` | **400 INVALID_STATUS**. |
| **TC-07** | Chưa đăng nhập | Any | `shipping` | **401 Unauthorized**. |
