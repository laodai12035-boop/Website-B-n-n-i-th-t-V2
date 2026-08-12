# Phân tích nghiệp vụ: NT-06-CN-004 — Yêu cầu đổi hoặc trả hàng

**Story:** NT-06-CN-004  
**Epic:** NT-06 — Quản lý đơn hàng  
**Ngày phân tích:** 2026-08-12

---

## 1. Mô tả nghiệp vụ

> Là Khách hàng, tôi muốn gửi yêu cầu đổi hoặc trả sản phẩm đã nhận, để xử lý khi sản phẩm lỗi hoặc không như mong đợi.

**Điều kiện bắt đầu:** Đơn hàng đã giao thành công (`status = 'delivered'`) và còn trong thời hạn 30 ngày kể từ ngày nhận hàng (Quy tắc **QTN-05**).  
**Kết quả:** Yêu cầu đổi trả được ghi nhận vào hệ thống với trạng thái `pending` và chuyển cho Admin xử lý.

---

## 2. Quy tắc nghiệp vụ

### 2.1 Điều kiện đổi/trả hàng (QTN-05)
- **Cho phép đổi/trả:**
  1. Đơn hàng ở trạng thái `delivered` (Giao hàng thành công).
  2. Thời gian tính từ khi tạo/giao đơn đến thời điểm gửi yêu cầu **không vượt quá 30 ngày** (`MAX_RETURN_DAYS = 30`).
  3. Đơn hàng chưa có yêu cầu đổi/trả nào đang ở trạng thái `pending` hoặc `approved`.
- **Từ chối đổi/trả (Xử lý Else / Error cases):**
  - Nếu đơn hàng chưa giao (`pending`, `confirmed`, `shipping`, `cancelled`) ➔ Báo lỗi **400 Bad Request** (`ORDER_NOT_DELIVERED`: *"Yêu cầu đổi/trả chỉ áp dụng cho đơn hàng đã giao thành công."*).
  - Nếu đơn hàng đã giao quá 30 ngày ➔ Báo lỗi **400 Bad Request** (`EXPIRED_RETURN_PERIOD`: *"Đơn hàng đã quá thời hạn 30 ngày đổi/trả theo quy định QTN-05."*).
  - Nếu đã có yêu cầu đổi/trả active ➔ Báo lỗi **400 Bad Request** (`RETURN_REQUEST_EXISTS`: *"Đơn hàng này đã có yêu cầu đổi/trả đang xử lý."*).

### 2.2 Phân quyền (Security & Authorization)
- Khách hàng chỉ được gửi yêu cầu cho đơn hàng của chính mình (`order.user_id == current_user.id`).
- Thử gửi yêu cầu cho đơn hàng của tài khoản khác ➔ **403 FORBIDDEN** (`"Bạn không có quyền gửi yêu cầu đổi/trả cho đơn hàng này."`).
- Admin có quyền xem và cập nhật trạng thái mọi yêu cầu đổi trả (`pending` ➔ `approved` / `rejected`).

---

## 3. Thiết kế Mô hình Dữ liệu

### Bảng `return_requests`
| Cột | Kiểu | Mô tả |
|---|---|---|
| `id` | INT PK AUTO_INCREMENT | |
| `order_id` | INT FK → `orders.id` | Mã đơn hàng yêu cầu đổi/trả |
| `user_id` | INT FK → `users.id` | Mã khách hàng |
| `request_type` | VARCHAR(20) | `exchange` (Đổi hàng), `return` (Trả hàng hoàn tiền), `warranty` (Bảo hành) |
| `reason` | TEXT | Lý do đổi/trả (bắt buộc) |
| `proof_image_url` | TEXT NULL | URL hình ảnh minh chứng (tùy chọn) |
| `status` | VARCHAR(20) | `pending` (Chờ duyệt), `approved` (Đã chấp nhận), `rejected` (Bị từ chối) |
| `admin_note` | TEXT NULL | Ghi chú phản hồi của Admin |
| `created_at` | DATETIME | Thời gian tạo yêu cầu |
| `updated_at` | DATETIME | Thời gian cập nhật gần nhất |

---

## 4. Thiết kế REST API Endpoints

### 4.1 `POST /api/v1/returns` — Khách gửi yêu cầu đổi/trả
- **Request Body:**
  ```json
  {
    "order_id": 101,
    "request_type": "return",
    "reason": "Sản phẩm bị trầy xước góc chân bàn",
    "proof_image_url": "https://example.com/proof.jpg"
  }
  ```
- **Response 201 Created:**
  ```json
  {
    "status": "success",
    "message": "Đã gửi yêu cầu đổi/trả thành công. Yêu cầu của bạn đã được chuyển tới Admin xử lý.",
    "data": { ... }
  }
  ```

### 4.2 `GET /api/v1/returns/my-requests` — Danh sách yêu cầu của khách
- **Response 200 OK:** Danh sách các `ReturnRequest` của user.

### 4.3 `GET /api/v1/returns/order/<order_id>` — Lấy yêu cầu theo đơn
- **Response 200 OK:** Chi tiết yêu cầu đổi/trả của đơn hàng.

### 4.4 `PATCH /api/v1/returns/admin/<request_id>` — Admin duyệt/từ chối
- **Request Body:** `{ "status": "approved", "admin_note": "Đồng ý nhận lại hàng" }`
- **Response 200 OK**

---

## 5. Ma trận Test Cases

| Mã AC | Kịch bản | Trạng thái đơn | Số ngày kể từ khi giao | Kết quả mong đợi |
|---|---|---|---|---|
| **TC-01** | Luồng thành công | `delivered` | 5 ngày | 201 Created. Yêu cầu ghi nhận `pending`, chuyển Admin xử lý. |
| **TC-02** | Vi phạm quy tắc quá hạn | `delivered` | 35 ngày | 400 EXPIRED_RETURN_PERIOD (QTN-05). |
| **TC-03** | Đơn chưa giao | `pending` / `shipping` | N/A | 400 ORDER_NOT_DELIVERED. |
| **TC-04** | Yêu cầu trùng lặp | `delivered` | 10 ngày (đã gửi request) | 400 RETURN_REQUEST_EXISTS. |
| **TC-05** | Vi phạm phân quyền | `delivered` (của User A) | User B gửi | 403 FORBIDDEN. |
| **TC-06** | Admin duyệt yêu cầu | N/A | Admin token | 200 OK. Cập nhật `approved` hoặc `rejected`. |
| **TC-07** | Chưa đăng nhập | N/A | Không token | 401 Unauthorized. |
