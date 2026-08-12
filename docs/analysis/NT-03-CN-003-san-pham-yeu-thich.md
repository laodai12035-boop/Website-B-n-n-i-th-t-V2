# Phân tích nghiệp vụ: NT-03-CN-003 — Thêm và xóa sản phẩm yêu thích (Wishlist)

**Story:** NT-03-CN-003  
**Epic:** NT-03 — Giỏ hàng & Đặt hàng  
**Ngày phân tích:** 2026-08-12  
**Người thực hiện:** BA / Backend Dev

---

## 1. Mô tả nghiệp vụ

> Là Khách hàng, tôi muốn lưu sản phẩm vào danh sách yêu thích, để xem lại và quyết định mua sau.

**Điều kiện bắt đầu:** Khách hàng bấm vào biểu tượng Trái tim yêu thích trên bất kỳ thẻ sản phẩm (ProductCard) hoặc trang chi tiết sản phẩm (`ProductDetailPage`).  
**Kết quả sau hoàn thành:**
- Nếu Khách hàng đã đăng nhập: Hệ thống thêm/xóa sản phẩm vào cơ sở dữ liệu `wishlists` của tài khoản đó. Biểu tượng Trái tim đổi màu đỏ rực rỡ và badge đếm số lượng trên Navbar được cập nhật. Trang `/wishlist` hiển thị toàn bộ các sản phẩm đã lưu.
- Nếu Khách hàng chưa đăng nhập: Hệ thống yêu cầu đăng nhập trước (HTTP 401 Unauthorized / Chuyển hướng tới `/login`).

---

## 2. Quy tắc nghiệp vụ & Luồng xử lý Toggle (Wishlist Rules)

### A. Mô hình dữ liệu Database (`wishlists`)
- Bảng `wishlists` thiết lập mối quan hệ N-N giữa `users` và `products`:
  - `user_id` (Integer, Foreign Key `users.id` - ON DELETE CASCADE)
  - `product_id` (Integer, Foreign Key `products.id` - ON DELETE CASCADE)
  - `created_at` (DateTime - Thời điểm thả tim)
  - `UniqueConstraint('user_id', 'product_id')`: Ngăn tạo trùng lặp sản phẩm cho cùng 1 user.

### B. Hành vi Toggle (`POST /api/v1/wishlist`)
- Input: JSON `{"product_id": 1}` + Header `Authorization: Bearer <user_token>`
- Logic xử lý:
  1. Kiểm tra xem cặp `(user_id, product_id)` đã tồn tại trong DB chưa.
  2. Nếu **chưa có**: Tạo mới bản ghi -> Trả về HTTP `201 Created` (`is_wishlisted: true`, message: "Đã thêm vào danh sách yêu thích").
  3. Nếu **đã có**: Xóa bản ghi khỏi DB -> Trả về HTTP `200 OK` (`is_wishlisted: false`, message: "Đã xóa khỏi danh sách yêu thích").

---

## 3. Các kịch bản kiểm thử nghiệp vụ (Test Cases Matrix)

| Mã AC | Kịch bản | Dữ liệu đầu vào | Kết quả mong đợi |
|---|---|---|---|
| **TC-01** | Thêm/xóa sản phẩm yêu thích (Happy Path) | User đã đăng nhập -> Bấm icon trái tim trên sản phẩm ID=1 | Trả về 201 Created (`is_wishlisted: true`). Bấm lần 2 -> Trả 200 OK (`is_wishlisted: false`). |
| **TC-02** | Khách chưa đăng nhập bấm yêu thích (Sad Path) | Không truyền JWT Token -> Bấm icon trái tim | API trả về HTTP 401 Unauthorized (`code: UNAUTHORIZED`). Frontend yêu cầu đăng nhập. |
| - | Lấy danh sách yêu thích của người dùng | `GET /api/v1/wishlist` với JWT Token | Trả về 200 OK + Mảng danh sách các sản phẩm đang được thả tim. |
| - | Xóa trực tiếp sản phẩm khỏi Wishlist | `DELETE /api/v1/wishlist/1` với JWT Token | Trả về 200 OK + Xóa sản phẩm khỏi danh sách yêu thích. |

---

## 4. API Specification Update

### Endpoints (Bảo vệ bởi `@jwt_required()`):

1. **`GET /api/v1/wishlist`**
   - Headers: `Authorization: Bearer <user_token>`
   - Response (200 OK): `{"data": {"items": [product_objects], "total": 2}}`

2. **`POST /api/v1/wishlist`**
   - Request Body: `{"product_id": 1}`
   - Headers: `Authorization: Bearer <user_token>`
   - Response (201 Created / 200 OK): `{"data": {"is_wishlisted": true/false}, "message": "..."}`

3. **`DELETE /api/v1/wishlist/<int:product_id>`**
   - Headers: `Authorization: Bearer <user_token>`
   - Response (200 OK): `{"message": "Đã xóa khỏi danh sách yêu thích"}`
