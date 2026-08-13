# Phân tích nghiệp vụ: NT-07-CN-002 — Sửa và xóa địa chỉ giao hàng

**Story:** NT-07-CN-002  
**Epic:** NT-07 — Quản lý địa chỉ giao hàng  
**Ngày phân tích:** 2026-08-13

---

## 1. Mô tả nghiệp vụ

> Là Khách hàng, tôi muốn sửa hoặc xóa địa chỉ đã lưu, để cập nhật thông tin giao hàng khi có thay đổi.

**Điều kiện bắt đầu:** Có ít nhất một địa chỉ đã lưu thuộc sở hữu của tài khoản đang đăng nhập.  
**Kết quả:** Thông tin địa chỉ được cập nhật hoặc không còn xuất hiện trong danh sách địa chỉ giao hàng.

---

## 2. Quy tắc nghiệp vụ & Phân quyền

### 2.1 Kiểm tra Quyền sở hữu (Ownership Protection)
- Mỗi người dùng chỉ có quyền sửa/xóa địa chỉ thuộc về chính mình (`address.user_id == current_user_id`).
- Nếu địa chỉ không tồn tại ➔ Trả **404 Not Found** (`ADDRESS_NOT_FOUND`: *"Không tìm thấy địa chỉ giao hàng."*).
- Nếu địa chỉ thuộc tài khoản người dùng khác ➔ Trả **403 Forbidden** (`FORBIDDEN_ACCESS`: *"Bạn không có quyền thao tác trên địa chỉ này."*).

### 2.2 Quy tắc Sửa địa chỉ (`PUT /api/v1/addresses/:id`)
- Validate đầy đủ các trường dữ liệu theo `AddressSchema`.
- **Xử lý cờ Mặc định (`is_default`):**
  - Nếu sửa địa chỉ thành mặc định (`is_default = True`) ➔ Tự động gán `is_default = False` cho toàn bộ địa chỉ khác của người dùng trong cùng 1 DB transaction.
  - Nếu địa chỉ này vốn là mặc định duy nhất và khách hàng cố bỏ mặc định (`is_default = False`) mà không chọn địa chỉ khác làm mặc định ➔ Hệ thống giữ nguyên `is_default = True` hoặc cho phép cập nhật nếu còn địa chỉ khác.

### 2.3 Quy tắc Xóa địa chỉ (`DELETE /api/v1/addresses/:id`)
- Xóa bản ghi địa chỉ khỏi hệ thống.
- **Tự động đôn địa chỉ mặc định mới:** Nếu địa chỉ bị xóa đang là địa chỉ mặc định (`is_default == True`), hệ thống tự động tìm địa chỉ còn lại gần nhất của người dùng và chuyển thành địa chỉ mặc định mới (`is_default = True`).

---

## 3. Thiết kế REST API Endpoints

### `PUT /api/v1/addresses/:id`
- **Headers:** `Authorization: Bearer <user_token>`
- **Request Body (JSON):**
  ```json
  {
    "recipient_name": "Nguyễn Văn Anh (Mới)",
    "phone": "0909876543",
    "province": "TP. Hồ Chí Minh",
    "district": "Quận 3",
    "ward": "Phường Võ Thị Sáu",
    "detail_address": "456 Điện Biên Phủ",
    "is_default": true
  }
  ```
- **Responses:**
  - **200 OK:** Cập nhật địa chỉ thành công.
  - **400 Bad Request:** Dữ liệu không hợp lệ.
  - **403 Forbidden:** Không có quyền thao tác địa chỉ của người khác.
  - **404 Not Found:** Địa chỉ không tồn tại.

### `DELETE /api/v1/addresses/:id`
- **Headers:** `Authorization: Bearer <user_token>`
- **Responses:**
  - **200 OK:** Xóa địa chỉ thành công.
  - **403 Forbidden:** Không có quyền xóa địa chỉ của người khác.
  - **404 Not Found:** Địa chỉ không tồn tại.

---

## 4. Ma trận Test Cases

| Mã AC | Kịch bản | Dữ liệu đầu vào | Kết quả mong đợi |
|---|---|---|---|
| **TC-01** | Sửa địa chỉ thành công | Nhập dữ liệu mới cho địa chỉ thuộc tài khoản | Trả 200 OK. Địa chỉ được cập nhật đúng thông tin mới. |
| **TC-01b** | Sửa địa chỉ thường thành mặc định | Chuyển `is_default = True` | Trả 200 OK. Địa chỉ cũ mất cờ mặc định, địa chỉ mới nhận cờ mặc định. |
| **TC-01c** | Sửa địa chỉ người khác | Gửi request PUT với `address_id` của user khác | Trả **403 FORBIDDEN_ACCESS**. |
| **TC-02** | Xóa địa chỉ thành công | Xóa một địa chỉ thuộc tài khoản | Trả 200 OK. Địa chỉ không còn xuất hiện trong danh sách. |
| **TC-02b** | Xóa địa chỉ đang là mặc định | Xóa địa chỉ có `is_default = True` | Trả 200 OK. Địa chỉ còn lại gần nhất tự động nhận cờ `is_default = True`. |
| **TC-02c** | Xóa địa chỉ người khác | Gửi request DELETE với `address_id` của user khác | Trả **403 FORBIDDEN_ACCESS**. |
