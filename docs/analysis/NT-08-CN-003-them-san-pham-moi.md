# Phân tích nghiệp vụ: NT-08-CN-003 — Thêm sản phẩm mới (Admin)

**Story:** NT-08-CN-003  
**Epic:** NT-08 — Quản lý danh mục & sản phẩm (Admin)  
**Ngày phân tích:** 2026-08-13

---

## 1. Mô tả nghiệp vụ

> Là Quản trị viên, tôi muốn thêm sản phẩm nội thất mới kèm hình ảnh, giá, kích thước và chất liệu, để đưa sản phẩm lên bán trên website.

**Điều kiện bắt đầu:** Danh mục sản phẩm đã tồn tại trong hệ thống. Quản trị viên đã đăng nhập trang quản trị (`role == 'admin'`).  
**Kết quả:** Sản phẩm mới được lưu vào CSDL, tự động sinh slug duy nhất, hiển thị ở cả trang Quản trị và trang cửa hàng cho khách mua.

---

## 2. Quy tắc nghiệp vụ & Validation (Business Rules)

### 2.1 Phân quyền Admin (QTN-09)
- Endpoint `POST /api/v1/admin/products` yêu cầu xác thực JWT với vai trò Admin (`role == 'admin'`).
- Nếu không phải Admin ➔ Trả về **403 FORBIDDEN** (`code="FORBIDDEN"`).
- Chưa đăng nhập ➔ Trả về **401 Unauthorized**.

### 2.2 Quy tắc Validate Dữ liệu sản phẩm
- **Tên sản phẩm (`name`)**: Bắt buộc, độ dài từ 2 đến 200 ký tự. Không được chỉ chứa khoảng trắng.
- **Giá bán (`price`)**: Bắt buộc, số thực `> 0`. (Nếu `price <= 0` hoặc âm ➔ **400 Bad Request** với `code="VALIDATION_ERROR"`).
- **Giá khuyến mãi (`discount_price`)**: Tùy chọn. Nếu có, phải `>= 0` và `< price`.
- **Số lượng tồn kho (`stock`)**: Tùy chọn, mặc định là `0`. Phải là số nguyên `>= 0`.
- **Danh mục (`category`)**: Bắt buộc, chuỗi không rỗng đại diện cho slug/tên danh mục.
- **Trọng lượng (`weight_kg`)**: Tùy chọn. Phải là số thực `>= 0` (dùng tính phí ship QTN-07).
- **Kích thước (`dimensions`)**: Tùy chọn, ví dụ *"120x60x75 cm"*.
- **Chất liệu (`material`)**: Tùy chọn, ví dụ *"Gỗ sồi tự nhiên"*.
- **URL Ảnh (`image_url`)**: Tùy chọn, đường dẫn hình ảnh minh họa sản phẩm.
- **Tự động sinh Slug**: Tự động sinh `slug` từ tên sản phẩm bằng thuật toán `generate_slug` (chuẩn hóa tiếng Việt bỏ dấu). Đảm bảo `slug` duy nhất trong DB bằng cách thêm hậu tố số (ví dụ: `bo-sofa-2`).

---

## 3. Thiết kế REST API Endpoint

### `POST /api/v1/admin/products`
- **Headers:** `Authorization: Bearer <admin_token>`, `Content-Type: application/json`
- **Request Body Example:**
  ```json
  {
    "name": "Bàn Trà Gỗ Sồi Hiện Đại",
    "category": "ban",
    "price": 4500000.0,
    "discount_price": 3900000.0,
    "stock": 15,
    "dimensions": "120x60x45 cm",
    "material": "Gỗ sồi Mỹ nhập khẩu",
    "weight_kg": 14.5,
    "image_url": "https://images.unsplash.com/photo-1533090161767-e6ffed986c88",
    "description": "Bàn trà tròn tinh tế cho phòng khách Scandinavian"
  }
  ```
- **Responses:**
  - **201 Created:** Tạo sản phẩm thành công.
  - **400 Bad Request:** Dữ liệu không hợp lệ (`VALIDATION_ERROR`).
  - **401 Unauthorized:** Chưa đăng nhập.
  - **403 Forbidden:** Không có quyền Admin.

---

## 4. Ma trận Test Cases

| Mã AC | Kịch bản | Dữ liệu đầu vào | Kết quả mong đợi |
|---|---|---|---|
| **TC-01** | Tạo sản phẩm thành công | Điền đầy đủ thông tin hợp lệ (tên, giá > 0, tồn kho, kích thước...) | Trả về **201 Created**. Sản phẩm hiển thị trên hệ thống. |
| **TC-02** | Giá không hợp lệ (giá âm / = 0) | `price` = -100000 hoặc `price` = 0 | Trả về **400 Bad Request** (`VALIDATION_ERROR`). |
| **TC-03** | Tên sản phẩm không hợp lệ | `name` rỗng hoặc chỉ có dấu cách | Trả về **400 Bad Request** (`VALIDATION_ERROR`). |
| **TC-04** | Người dùng thường thực hiện | User gửi request POST /admin/products | Trả về **403 FORBIDDEN**. |
| **TC-05** | Chưa đăng nhập | Không gửi JWT token | Trả về **401 Unauthorized**. |
| **TC-06** | Lấy danh sách sản phẩm Admin | Get danh sách sản phẩm | Trả về **200 OK** kèm danh sách sản phẩm. |
