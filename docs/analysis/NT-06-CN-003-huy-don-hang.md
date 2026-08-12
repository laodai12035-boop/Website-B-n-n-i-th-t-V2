# Phân tích nghiệp vụ: NT-06-CN-003 — Hủy đơn hàng

**Story:** NT-06-CN-003  
**Epic:** NT-06 — Quản lý đơn hàng  
**Ngày phân tích:** 2026-08-12

---

## 1. Mô tả nghiệp vụ

> Là Khách hàng, tôi muốn hủy đơn hàng khi đơn chưa được giao cho vận chuyển, để thay đổi quyết định mua hàng khi cần.

**Điều kiện bắt đầu:** Đơn hàng thuộc tài khoản đang đăng nhập và đang ở trạng thái `pending` (Chờ xác nhận) hoặc `confirmed` (Đã xác nhận/Đang xử lý).  
**Kết quả:** Đơn hàng chuyển sang trạng thái `cancelled` (Đã hủy) và **tồn kho sản phẩm được hoàn lại** (QTN-03).

---

## 2. Quy tắc nghiệp vụ

### 2.1 Quy tắc trạng thái hủy đơn (QTN-04)
- **Cho phép hủy:** Đơn hàng có trạng thái `status IN ('pending', 'confirmed')`.
- **Từ chối hủy:**
  - Nếu đơn đã ở trạng thái `shipping` (Đang giao hàng) hoặc `delivered` (Đã hoàn thành) ➔ Hệ thống từ chối với lỗi **400 Bad Request** (`CANNOT_CANCEL_SHIPPED_ORDER`: *"Đơn hàng đã qua giai đoạn có thể hủy. Không thể hủy đơn khi đã giao cho đơn vị vận chuyển."*).
  - Nếu đơn đã ở trạng thái `cancelled` (Đã hủy trước đó) ➔ Hệ thống báo lỗi **400 Bad Request** (`ORDER_ALREADY_CANCELLED`: *"Đơn hàng này đã được hủy trước đó."*).

### 2.2 Quy tắc hoàn trả tồn kho (QTN-03)
Khi hủy đơn hàng thành công:
1. Đổi `order.status = 'cancelled'`.
2. Duyệt qua tất cả `OrderItem` thuộc `order`:
   ```python
   product.stock += item.quantity
   ```
3. Commit DB Transaction an toàn.

### 2.3 Phân quyền (Authorization)
- Khách hàng chỉ được hủy đơn hàng của chính mình (`order.user_id == current_user.id`).
- Thử hủy đơn hàng của tài khoản khác ➔ **403 FORBIDDEN** (`"Bạn không có quyền hủy đơn hàng này."`).
- Admin có quyền hủy đơn hàng bất kỳ nếu đơn thỏa mãn điều kiện QTN-04.

---

## 3. Thiết kế API Endpoints

### `POST /api/v1/orders/<int:order_id>/cancel` & `PUT /api/v1/orders/<int:order_id>/cancel`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body (Tùy chọn):** `{ "reason": "Thay đổi nhu cầu mua hàng" }`
- **Response 200 OK (Thành công):**
  ```json
  {
    "status": "success",
    "message": "Đã hủy đơn hàng thành công và hoàn lại số lượng tồn kho.",
    "data": {
      "id": 1,
      "order_code": "ORD-20260812-1001",
      "status": "cancelled",
      "restored_items_count": 2
    }
  }
  ```
- **Response 400 Bad Request (Đã giao hàng):**
  ```json
  {
    "status": "error",
    "message": "Đơn hàng đã qua giai đoạn có thể hủy. Không thể hủy đơn khi đã giao cho vận chuyển.",
    "code": "CANNOT_CANCEL_SHIPPED_ORDER"
  }
  ```
- **Response 403 Forbidden:**
  ```json
  {
    "status": "error",
    "message": "Bạn không có quyền hủy đơn hàng này.",
    "code": "FORBIDDEN"
  }
  ```

---

## 4. Ma trận Test Cases

| Mã AC | Kịch bản | Trạng thái ban đầu | Thao tác | Trạng thái mong đợi | Phản hồi |
|---|---|---|---|---|---|
| **TC-01** | Hủy đơn chờ xác nhận | `pending` | Khách bấm Hủy | `cancelled`, stock hoàn đủ | 200 OK |
| **TC-02** | Hủy đơn đã xác nhận | `confirmed` | Khách bấm Hủy | `cancelled`, stock hoàn đủ | 200 OK |
| **TC-03** | Hủy đơn đang giao (Vi phạm QTN-04) | `shipping` | Khách bấm Hủy | Giữ nguyên `shipping`, không đổi stock | 400 CANNOT_CANCEL_SHIPPED_ORDER |
| **TC-04** | Hủy đơn đã hoàn thành | `delivered` | Khách bấm Hủy | Giữ nguyên `delivered` | 400 CANNOT_CANCEL_SHIPPED_ORDER |
| **TC-05** | Hủy đơn người khác (Vi phạm QTN-08) | Any | User B bấm Hủy đơn User A | Giữ nguyên | 403 FORBIDDEN |
| **TC-06** | Hủy đơn đã hủy trước đó | `cancelled` | Bấm Hủy lần 2 | Giữ nguyên | 400 ORDER_ALREADY_CANCELLED |
| **TC-07** | Khách chưa đăng nhập | Any | Không token | Giữ nguyên | 401 Unauthorized |
