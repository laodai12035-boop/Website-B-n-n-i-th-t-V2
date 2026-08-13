# Phân tích nghiệp vụ: NT-08-CN-006 — Tạo combo hoặc bộ sản phẩm (Admin)

**Story:** NT-08-CN-006  
**Epic:** NT-08 — Quản lý danh mục & sản phẩm (Admin)  
**Ngày phân tích:** 2026-08-13

---

## 1. Mô tả nghiệp vụ

> Là Quản trị viên, tôi muốn tạo combo gồm nhiều sản phẩm nội thất bán kèm với giá ưu đãi, để thúc đẩy khách hàng mua trọn bộ.

**Điều kiện bắt đầu:** Quản trị viên đã đăng nhập trang quản trị (`role == 'admin'`). Các sản phẩm thành phần muốn tạo combo đã tồn tại trong cơ sở dữ liệu và đang kinh doanh (`is_active == True`).  
**Kết quả:** Combo mới được lưu thành công vào bảng `combos` & `combo_items` và hiển thị bán trên website.

---

## 2. Quy tắc nghiệp vụ

### 2.1 Phân quyền Admin (QTN-09)
- Endpoint `POST /api/v1/admin/combos` và `GET /api/v1/admin/combos` phải yêu cầu Token Admin.
- Người dùng thường gọi API ➔ Trả **403 FORBIDDEN** (`code="FORBIDDEN"`).
- Chưa đăng nhập ➔ Trả **401 Unauthorized**.

### 2.2 Quy tắc kiểm tra sản phẩm thành phần
- Combo bao gồm 1 danh sách các mặt hàng thành phần `items` dạng `[{"product_id": int, "quantity": int}]`.
- **Kiểm tra trạng thái sản phẩm thành phần (TC-02)**:
  - Tất cả `product_id` trong combo phải tồn tại trong bảng `products`.
  - Tất cả sản phẩm thành phần **PHẢI** có `is_active == True` (đang mở bán).
  - Nếu bất kỳ sản phẩm nào đã **ngừng bán** (`is_active == False`) hoặc **không tồn tại** ➔ Từ chối tạo combo và trả về **400 Bad Request** với `code="PRODUCT_INACTIVE_OR_NOT_FOUND"`, message: *"Không thể tạo combo chứa sản phẩm đã ngừng bán hoặc không tồn tại."*
- **Validation dữ liệu**:
  - `name`: Tên combo bắt buộc, không được rỗng.
  - `discount_percent`: Số thực từ `0.0` đến `100.0`.
  - `items`: Bắt buộc là danh sách chứa ít nhất 1 sản phẩm với số lượng `quantity > 0`.

---

## 3. Ma trận Test Cases

| Mã AC | Kịch bản | Dữ liệu đầu vào | Kết quả mong đợi |
|---|---|---|---|
| **TC-01** | Tạo combo thành công với SP active | `name` = "Combo Bộ Bàn Ăn 6 Ghế", `discount_percent` = 15.0, `items` = [(bàn, 1), (ghế, 6)] (tất cả SP active) | Trả về 201 Created. Combo mới lưu đúng các sản phẩm thành phần và ưu đãi 15%. |
| **TC-02** | Tạo combo chứa sản phẩm ngừng bán | SP 2 có `is_active` = False | Trả về **400 Bad Request** (`PRODUCT_INACTIVE_OR_NOT_FOUND`). |
| **TC-03** | Thiếu tên hoặc % chiết khấu không hợp lệ | `name` = "", `discount_percent` = -10 | Trả về **400 Bad Request** (`VALIDATION_ERROR`). |
| **TC-04** | Người dùng thường cố gọi | User gọi POST `/api/v1/admin/combos` | Trả về **403 FORBIDDEN**. |
| **TC-05** | Public API hiển thị combo vừa tạo | Khách gọi GET `/api/v1/combos` | Trả về danh sách combo active chứa combo vừa tạo. |
