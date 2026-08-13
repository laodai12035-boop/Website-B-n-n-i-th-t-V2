# Phân tích nghiệp vụ: NT-08-CN-002 — Sửa và xóa danh mục sản phẩm (Admin)

**Story:** NT-08-CN-002  
**Epic:** NT-08 — Quản lý danh mục & sản phẩm (Admin)  
**Ngày phân tích:** 2026-08-13

---

## 1. Mô tả nghiệp vụ

> Là Quản trị viên, tôi muốn sửa hoặc xóa danh mục sản phẩm, để cập nhật cấu trúc danh mục khi cần thay đổi.

**Điều kiện bắt đầu:** Danh mục đã tồn tại trong hệ thống. Quản trị viên đã đăng nhập (`role == 'admin'`).  
**Kết quả:** Thông tin danh mục được cập nhật hoặc danh mục bị xóa khỏi hệ thống nếu không còn sản phẩm nào gắn vào.

---

## 2. Quy tắc nghiệp vụ & Ràng buộc khi Xóa

### 2.1 Bảo mật & Phân quyền (QTN-09)
- Chỉ Quản trị viên (`role == 'admin'`) mới có quyền truy cập endpoints sửa/xóa danh mục.
- Nếu không phải Admin ➔ Trả **403 FORBIDDEN** (`code="FORBIDDEN"`).
- Nếu chưa đăng nhập ➔ Trả **401 Unauthorized**.

### 2.2 Quy tắc Sửa danh mục (`PUT /api/v1/admin/categories/:id`)
- Nếu `category_id` không tồn tại ➔ Trả **404 NOT_FOUND** (`code="CATEGORY_NOT_FOUND"`, message *"Không tìm thấy danh mục sản phẩm."*).
- **Kiểm tra trùng tên:** Tên danh mục mới không được trùng với tên danh mục khác đã tồn tại trong DB (không tính chính danh mục đang sửa). Nếu trùng ➔ Trả **400 Bad Request** (`code="CATEGORY_EXISTS"`, message *"Tên danh mục đã tồn tại."*).
- **Đồng bộ Slug:** Khi tên danh mục thay đổi, tự động cập nhật slug của danh mục và cập nhật cột `category` của tất cả `Product` thuộc danh mục đó để giữ tính nhất quán.

### 2.3 Quy tắc Ràng buộc khi Xóa danh mục (`DELETE /api/v1/admin/categories/:id`)
- Nếu `category_id` không tồn tại ➔ Trả **404 NOT_FOUND** (`code="CATEGORY_NOT_FOUND"`).
- **Kiểm tra sản phẩm liên quan (Constraint Check):**
  - Đếm số lượng sản phẩm gắn với danh mục này (`Product.category == category.slug` hoặc `Product.category == category.name`).
  - **Trường hợp danh mục còn sản phẩm (`count > 0`):** CHẶN XÓA ➔ Trả về **400 Bad Request** (`code="CATEGORY_HAS_PRODUCTS"`, message *"Không thể xóa danh mục này vì còn X sản phẩm đang sử dụng. Vui lòng di chuyển hoặc xóa sản phẩm trước."*).
  - **Trường hợp danh mục rỗng (`count == 0`):** Cho phép xóa bản ghi khỏi DB ➔ Trả về **200 OK** (`message="Xóa danh mục sản phẩm thành công."`).

---

## 3. Thiết kế REST API Endpoints

### `PUT /api/v1/admin/categories/:id`
- **Headers:** `Authorization: Bearer <admin_token>`
- **Request Body (JSON):**
  ```json
  {
    "name": "Phòng ngủ cao cấp",
    "description": "Nội thất giường, tủ, bàn trang điểm",
    "icon": "🛏️"
  }
  ```
- **Responses:**
  - **200 OK:** Cập nhật danh mục thành công.
  - **400 Bad Request:** Dữ liệu rỗng (`VALIDATION_ERROR`) / Trùng tên (`CATEGORY_EXISTS`).
  - **403 Forbidden:** Không phải Admin.
  - **404 Not Found:** Danh mục không tồn tại.

### `DELETE /api/v1/admin/categories/:id`
- **Headers:** `Authorization: Bearer <admin_token>`
- **Responses:**
  - **200 OK:** Xóa danh mục rỗng thành công.
  - **400 Bad Request:** Danh mục còn sản phẩm (`CATEGORY_HAS_PRODUCTS`).
  - **403 Forbidden:** Không phải Admin.
  - **404 Not Found:** Danh mục không tồn tại.

---

## 4. Ma trận Test Cases

| Mã AC | Kịch bản | Dữ liệu đầu vào | Kết quả mong đợi |
|---|---|---|---|
| **TC-01** | Sửa danh mục thành công | Admin cập nhật tên/mô tả/icon hợp lệ | Trả về 200 OK. Dữ liệu danh mục được cập nhật. |
| **TC-01b** | Sửa tên danh mục trùng tên khác | Admin sửa tên trùng tên danh mục đã có | Trả về **400 CATEGORY_EXISTS**. |
| **TC-02** | Xóa danh mục rỗng thành công | Admin xóa danh mục không chứa sản phẩm | Trả về 200 OK. Danh mục bị xóa khỏi DB. |
| **TC-02b** | Xóa danh mục còn sản phẩm | Admin cố xóa danh mục đang gắn với sản phẩm | Trả về **400 CATEGORY_HAS_PRODUCTS** (*"Không thể xóa danh mục..."*). |
| **TC-03** | Khách hàng thường thực hiện | User gửi request PUT/DELETE | Trả về **403 FORBIDDEN**. |
| **TC-04** | Danh mục không tồn tại | Gửi request với `category_id` = 99999 | Trả về **404 CATEGORY_NOT_FOUND**. |
