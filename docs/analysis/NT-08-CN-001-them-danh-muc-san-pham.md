# Phân tích nghiệp vụ: NT-08-CN-001 — Thêm danh mục sản phẩm (Admin)

**Story:** NT-08-CN-001  
**Epic:** NT-08 — Quản lý danh mục & sản phẩm (Admin)  
**Ngày phân tích:** 2026-08-13

---

## 1. Mô tả nghiệp vụ

> Là Quản trị viên, tôi muốn tạo danh mục sản phẩm mới như phòng khách hoặc phòng ngủ, để tổ chức sản phẩm theo nhóm rõ ràng.

**Điều kiện bắt đầu:** Quản trị viên đã đăng nhập bằng tài khoản Admin (`user.role == 'admin'`).  
**Kết quả:** Danh mục mới sẵn sàng để gắn sản phẩm và hiển thị trên giao diện cửa hàng.

---

## 2. Quy tắc nghiệp vụ & Phân quyền

### 2.1 Bảo mật Phân quyền Admin (QTN-09)
- Chỉ tài khoản có vai trò Quản trị viên (`role == 'admin'`) mới được phép gửi request tạo danh mục mới.
- Nếu tài khoản thường gửi request ➔ Trả về **403 FORBIDDEN** (`code="FORBIDDEN"`, message *"Bạn không có quyền thực hiện thao tác này."*).
- Nếu người dùng chưa đăng nhập ➔ Trả về **401 UNAUTHORIZED**.

### 2.2 Quy tắc Kiểm tra Trùng tên (TC-02)
- Tên danh mục không được trùng với danh mục đã có trong hệ thống (kiểm tra không phân biệt chữ hoa / chữ thường).
- Nếu tên danh mục đã tồn tại ➔ Trả về **400 Bad Request** (`code="CATEGORY_EXISTS"`, message *"Tên danh mục đã tồn tại."*).

### 2.3 Cấu trúc Dữ liệu Danh mục
- `name`: Tên danh mục (chuỗi 2-100 ký tự, bắt buộc).
- `slug`: Chuỗi URL không trùng lặp tự động tạo từ tên (VD: *"Phòng ngủ"* ➔ `"phong-ngu"`).
- `description`: Mô tả chi tiết danh mục (tùy chọn).
- `icon`: Icon/Emoji biểu tượng (tùy chọn, VD: `"🛏️"`).
- `is_active`: Trạng thái hoạt động (`default = True`).

---

## 3. Thiết kế REST API Endpoints

### `POST /api/v1/admin/categories`
- **Headers:** `Authorization: Bearer <admin_token>`
- **Request Body (JSON):**
  ```json
  {
    "name": "Phòng ngủ",
    "description": "Các sản phẩm giường, tủ quần áo, bàn trang điểm cao cấp",
    "icon": "🛏️"
  }
  ```
- **Responses:**
  - **201 Created:** Tạo danh mục thành công. Trả về thông tin danh mục vừa tạo.
  - **400 Bad Request:** Dữ liệu trống (`VALIDATION_ERROR`) hoặc Trùng tên danh mục (`CATEGORY_EXISTS`).
  - **401 Unauthorized:** Chưa đăng nhập.
  - **403 Forbidden:** Không có quyền Admin.

### `GET /api/v1/categories`
- Public Endpoint lấy danh sách toàn bộ danh mục sản phẩm.

---

## 4. Ma trận Test Cases

| Mã AC | Kịch bản | Dữ liệu đầu vào | Kết quả mong đợi |
|---|---|---|---|
| **TC-01** | Thêm danh mục hợp lệ | Admin nhập name="Phòng ngủ" | Trả về 201 Created. Danh mục được lưu thành công. |
| **TC-02** | Tên danh mục đã tồn tại | Admin tạo danh mục trùng tên đã có | Trả về **400 CATEGORY_EXISTS** (*"Tên danh mục đã tồn tại."*). |
| **TC-03** | Khách hàng thường thực hiện | User gửi request tạo danh mục | Trả về **403 FORBIDDEN**. |
| **TC-04** | Chưa đăng nhập | Gửi request không kèm Token | Trả về **401 Unauthorized**. |
| **TC-05** | Tên danh mục rỗng | Gửi `name = ""` | Trả về **400 VALIDATION_ERROR**. |
