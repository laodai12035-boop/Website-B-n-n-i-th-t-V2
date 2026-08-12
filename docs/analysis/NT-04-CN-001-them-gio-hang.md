# Phân tích nghiệp vụ: NT-04-CN-001 — Thêm sản phẩm vào giỏ hàng

**Story:** NT-04-CN-001  
**Epic:** NT-04 / NT-03 — Giỏ hàng & Đặt hàng  
**Ngày phân tích:** 2026-08-12  
**Quy tắc nghiệp vụ liên quan:** **QTN-02** (Không bán vượt tồn kho)  
**Người thực hiện:** BA / Backend Dev

---

## 1. Mô tả nghiệp vụ

> Là Khách hàng, tôi muốn thêm sản phẩm vào giỏ hàng, để gom nhiều sản phẩm lại và thanh toán một lần.

**Điều kiện bắt đầu:** Khách hàng bấm nút "Thêm vào giỏ hàng" trên thẻ sản phẩm (`ProductCard`) hoặc trang chi tiết sản phẩm (`ProductDetailPage`).  
**Kết quả sau hoàn thành:** Sản phẩm cùng số lượng mong muốn xuất hiện trong giỏ hàng. Icon Giỏ hàng trên thanh Navbar cập nhật tổng số lượng item và Panel Giỏ hàng (Cart Drawer) mở ra hiển thị các mặt hàng trong giỏ.

---

## 2. Quy tắc nghiệp vụ QTN-02 (Cart & Stock Rules)

- **Quy tắc QTN-02:** Hệ thống không cho phép đặt số lượng sản phẩm vượt quá tồn kho hiện có tại thời điểm đặt hàng.
- **Thỏa mãn (Then):** Nếu `(Số lượng đã có trong giỏ + Số lượng mới thêm) <= product.stock` -> Chấp nhận thêm/cập nhật giỏ hàng, trả về HTTP `201 Created` hoặc `200 OK`.
- **Không thỏa mãn (Else):** Nếu số lượng vượt tồn kho hiện có -> Từ chối thao tác, trả về HTTP `400 Bad Request` (`code: EXCEED_STOCK`, message: *"Số lượng đặt vượt quá tồn kho hiện có (Tồn kho còn: X sản phẩm)."*).

---

## 3. Các kịch bản kiểm thử nghiệp vụ (Test Cases Matrix)

| Mã AC | Kịch bản | Dữ liệu đầu vào | Kết quả mong đợi |
|---|---|---|---|
| **TC-01** | Thêm sản phẩm hợp lệ vào giỏ (Happy Path) | Sản phẩm ID=1 (Tồn kho=10), Thêm số lượng = 2 | Trả về 201 Created. Sản phẩm xuất hiện trong giỏ hàng với đúng số lượng 2. |
| **TC-02** | Vi phạm quy tắc QTN-02 (Sad Path) | Sản phẩm ID=1 (Tồn kho=10), Thêm số lượng = 20 | Trả về 400 Bad Request (`code: EXCEED_STOCK`). Báo lỗi vượt quá tồn kho hiện có (Tồn kho còn 10). |
| - | Cập nhật số lượng item trong giỏ | `PUT /api/v1/cart/items/1` với quantity = 5 | Trả về 200 OK + Cập nhật số lượng item trong giỏ thành 5. |
| - | Xóa sản phẩm khỏi giỏ hàng | `DELETE /api/v1/cart/items/1` | Trả về 200 OK + Xóa item khỏi giỏ. |

---

## 4. API Specification

### Endpoints (Bảo vệ bởi `@jwt_required()`):

1. **`GET /api/v1/cart`**
   - Headers: `Authorization: Bearer <user_token>`
   - Response (200 OK): `{"data": {"items": [...], "cart_count": 2, "subtotal": 35000000.0}}`

2. **`POST /api/v1/cart/items`**
   - Request Body: `{"product_id": 1, "quantity": 2}`
   - Headers: `Authorization: Bearer <user_token>`
   - Response Success (201 Created / 200 OK):
   ```json
   {
     "status": "success",
     "data": {
       "item": { "id": 1, "product_id": 1, "quantity": 2, "price": 28500000.0 },
       "cart_count": 2,
       "subtotal": 57000000.0
     },
     "message": "Đã thêm sản phẩm vào giỏ hàng"
   }
   ```
   - Response Error QTN-02 (400 Bad Request):
   ```json
   {
     "status": "error",
     "message": "Số lượng đặt vượt quá tồn kho hiện có (Tồn kho còn: 10 sản phẩm).",
     "code": "EXCEED_STOCK"
   }
   ```

3. **`PUT /api/v1/cart/items/<int:product_id>`**
   - Request Body: `{"quantity": 3}`
   - Headers: `Authorization: Bearer <user_token>`
   - Response (200 OK / 400 EXCEED_STOCK)

4. **`DELETE /api/v1/cart/items/<int:product_id>`**
   - Response (200 OK)

5. **`DELETE /api/v1/cart/clear`**
   - Response (200 OK)
