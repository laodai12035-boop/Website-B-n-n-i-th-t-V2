# Phân tích nghiệp vụ: NT-08-CN-004 — Sửa và xóa sản phẩm (Admin)

**Story:** NT-08-CN-004  
**Epic:** NT-08 — Quản lý danh mục & sản phẩm (Admin)  
**Ngày phân tích:** 2026-08-13

---

## 1. Mô tả nghiệp vụ

> Là Quản trị viên, tôi muốn chỉnh sửa hoặc ngừng bán một sản phẩm, để cập nhật thông tin hoặc loại bỏ sản phẩm không còn kinh doanh.

**Điều kiện bắt đầu:** Sản phẩm đã tồn tại trong hệ thống. Quản trị viên đã đăng nhập trang quản trị (`role == 'admin'`).  
**Kết quả:** Thông tin sản phẩm được cập nhật thành công hoặc sản phẩm được chuyển sang trạng thái ngừng bán (`is_active = False`) và ẩn khỏi website đối với khách hàng.

---

## 2. Quy tắc nghiệp vụ & Trạng thái kinh doanh

### 2.1 Bảo mật Phân quyền Admin (QTN-09)
- Endpoint `PUT /api/v1/admin/products/:id` và `DELETE /api/v1/admin/products/:id` bắt buộc yêu cầu token Admin.
- Người dùng thường cố tình gọi ➔ Trả **403 FORBIDDEN** (`code="FORBIDDEN"`).
- Chưa đăng nhập ➔ Trả **401 Unauthorized**.

### 2.2 Quy tắc Sửa sản phẩm (`PUT /api/v1/admin/products/:id`)
- Kiểm tra `product_id` tồn tại. Nếu không ➔ Trả **404 NOT_FOUND** (`code="PRODUCT_NOT_FOUND"`, message *"Không tìm thấy sản phẩm."*).
- **Validation:**
  - `name`: Không rỗng hoặc chỉ có khoảng trắng.
  - `price`: Phải là số thực `> 0`. (Giá âm hoặc = 0 ➔ **400 Bad Request** với `code="VALIDATION_ERROR"`).
  - `discount_price`: Nếu có, phải `>= 0` và `< price`.
  - `stock`: Phải `>= 0`.
- **Cập nhật dữ liệu:** `name`, `price`, `discount_price`, `category`, `stock`, `dimensions`, `material`, `weight_kg`, `image_url`, `description`, `is_active`.
- **Sinh lại Slug:** Nếu tên sản phẩm thay đổi, tự động sinh slug mới duy nhất để bảo đảm đường dẫn SEO chính xác.

### 2.3 Quy tắc Ngừng bán / Soft Delete (`DELETE /api/v1/admin/products/:id`)
- Kiểm tra `product_id` tồn tại. Nếu không ➔ Trả **404 NOT_FOUND** (`code="PRODUCT_NOT_FOUND"`).
- **Soft Delete Pattern:** Hệ thống cập nhật `is_active = False` (ngừng kinh doanh).
- **Tác động sau khi ngừng bán:**
  - Public API `GET /api/v1/products` và `GET /api/v1/products/:id` tự động lọc bỏ các sản phẩm có `is_active == False`.
  - Khách hàng không thể tìm kiếm, xem chi tiết hoặc thêm sản phẩm này vào giỏ hàng.
  - Dữ liệu sản phẩm trong các đơn hàng lịch sử (`order_items`) vẫn được giữ nguyên đầy đủ để tra cứu.
  - Giao diện Admin quản trị sản phẩm hiển thị badge màu đỏ/xám *"Ngừng bán"*, kèm nút bật lại kinh doanh khi cần.

---

## 3. Thiết kế REST API Endpoints

### `PUT /api/v1/admin/products/:id`
- **Headers:** `Authorization: Bearer <admin_token>`, `Content-Type: application/json`
- **Request Body (JSON):**
  ```json
  {
    "name": "Bộ Sofa Gỗ Óc Chó Cao Cấp V2",
    "category": "ghe",
    "price": 30000000.0,
    "discount_price": 27000000.0,
    "stock": 8,
    "dimensions": "220x90x85 cm",
    "material": "Gỗ óc chó tự nhiên Bắc Mỹ",
    "weight_kg": 28.0,
    "is_active": true
  }
  ```
- **Responses:**
  - **200 OK:** Cập nhật sản phẩm thành công.
  - **400 Bad Request:** Dữ liệu không hợp lệ (`VALIDATION_ERROR`).
  - **403 Forbidden:** Không phải Admin.
  - **404 Not Found:** Sản phẩm không tồn tại.

### `DELETE /api/v1/admin/products/:id`
- **Headers:** `Authorization: Bearer <admin_token>`
- **Responses:**
  - **200 OK:** Chuyển trạng thái sản phẩm sang ngừng bán thành công.
  - **403 Forbidden:** Không phải Admin.
  - **404 Not Found:** Sản phẩm không tồn tại.

---

## 4. Ma trận Test Cases

| Mã AC | Kịch bản | Dữ liệu đầu vào | Kết quả mong đợi |
|---|---|---|---|
| **TC-01** | Admin sửa sản phẩm thành công | Cập nhật giá `price` = 30,000,000 | Trả về 200 OK. Dữ liệu sản phẩm cập nhật đúng. |
| **TC-02** | Admin chuyển sang ngừng bán | Gửi DELETE request với `product_id` | Trả về 200 OK. `is_active` đổi thành `False`. |
| **TC-03** | Kiểm tra hiển thị sản phẩm ngừng bán | Khách xem Public API `/products/:id` đã bị ngừng bán | Trả về **404 PRODUCT_NOT_FOUND**. Khách không mua được. |
| **TC-04** | Sửa giá âm / = 0 | `price` = -50000 | Trả về **400 Bad Request** (`VALIDATION_ERROR`). |
| **TC-05** | Người dùng thường thực hiện | User gửi request PUT/DELETE | Trả về **403 FORBIDDEN**. |
| **TC-06** | Sản phẩm không tồn tại | Gửi request với `product_id` = 999999 | Trả về **404 PRODUCT_NOT_FOUND**. |
