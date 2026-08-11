# Phân tích nghiệp vụ: NT-02-CN-005 — Tìm kiếm nhanh (Admin)

**Story:** NT-02-CN-005  
**Epic:** NT-02 — Quản lý sản phẩm & danh mục  
**Ngày phân tích:** 2026-08-11  
**Người thực hiện:** BA / Backend Dev

---

## 1. Mô tả nghiệp vụ

> Là Quản trị viên, tôi muốn tìm kiếm nhanh sản phẩm, đơn hàng hoặc khách hàng trong trang quản trị, để xử lý công việc nhanh hơn.

**Điều kiện bắt đầu:** Quản trị viên đã đăng nhập thành công vào trang Quản trị (Admin Panel) với vai trò `admin`.  
**Kết quả sau hoàn thành:** Nhập từ khóa tại ô Tìm kiếm nhanh trên Header Admin -> Hiển thị kết quả tra cứu liên quan được phân nhóm rõ ràng theo **Sản phẩm (Products)**, **Đơn hàng (Orders)** và **Khách hàng (Customers)**.

---

## 2. Phạm vi Tra cứu & Tiêu chí Tìm kiếm (Search Scope)

| Nhóm đối tượng | Icon | Tiêu chí Match Query | Kết quả hiển thị |
|---|---|---|---|
| **Sản phẩm (Products)** | 📦 | `Product.name ILIKE %q%` OR `Product.category ILIKE %q%` OR `Product.description ILIKE %q%` | Tên sản phẩm, Giá bán, Danh mục, Tồn kho |
| **Đơn hàng (Orders)** | 🛒 | `Order.id ILIKE %q%` OR `Order.customer_name ILIKE %q%` | Mã đơn hàng, Tên khách hàng, Trạng thái, Tổng tiền |
| **Khách hàng (Customers)** | 👤 | `User.role == 'user'` AND (`User.full_name ILIKE %q%` OR `User.email ILIKE %q%` OR `User.phone ILIKE %q%`) | Họ tên khách hàng, Email, Số điện thoại, Trạng thái tài khoản |

---

## 3. Quy tắc Bảo mật & Phân quyền (Security Specifications)

1. **Endpoint API:** `GET /api/v1/admin/quick-search?q=<keyword>`
2. **Xác thực:** Yêu cầu `Authorization: Bearer <admin_jwt_token>` (sử dụng `@admin_required()`).
3. **Phân quyền:**
   - Khi token của tài khoản có `role == 'user'` hoặc chưa đăng nhập -> Trả về HTTP `403 Forbidden` (`code: FORBIDDEN`) hoặc `401 Unauthorized`.
4. **Xử lý từ khóa trống:**
   - Nếu `q` rỗng hoặc chỉ toàn khoảng trắng -> Trả về HTTP `200 OK` với danh sách kết quả rỗng `{"products": [], "orders": [], "customers": []}`.

---

## 4. Các kịch bản kiểm thử nghiệp vụ (Test Cases Matrix)

| Mã AC | Kịch bản | Dữ liệu đầu vào | Kết quả mong đợi |
|---|---|---|---|
| **TC-01** | Admin tìm kiếm nhanh từ khóa sản phẩm / khách hàng | `q=sofa` hoặc `q=postman` | Trả về 200 OK + Gom nhóm kết quả chính xác theo `products`, `orders`, `customers` |
| **Security** | User thường cố tình gọi API search Admin | Token tài khoản User | Trả về 403 Forbidden (`code: FORBIDDEN`) |
| **Security** | Khách chưa đăng nhập gọi API search Admin | Không truyền Token | Trả về 401 Unauthorized |
