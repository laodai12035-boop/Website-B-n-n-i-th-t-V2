# Phân tích nghiệp vụ: NT-05-CN-001 — Thanh toán khi nhận hàng (COD)

**Story:** NT-05-CN-001  
**Epic:** NT-05 — Thanh toán  
**Ngày phân tích:** 2026-08-12  
**Quy tắc nghiệp vụ liên quan:** **QTN-02** (Không bán vượt tồn kho), **QTN-01** (Điều kiện áp dụng mã giảm giá)  
**Người thực hiện:** BA / Backend Dev

---

## 1. Mô tả nghiệp vụ

> Là Khách hàng, tôi muốn chọn thanh toán khi nhận hàng (COD), để thanh toán bằng tiền mặt lúc nhận sản phẩm.

**Điều kiện bắt đầu:** Khách hàng có ít nhất 1 sản phẩm trong giỏ hàng và mở trang Thanh toán (`/checkout`).  
**Kết quả sau hoàn thành:** Đơn hàng được khởi tạo thành công trong cơ sở dữ liệu với trạng thái `pending` (Chờ xác nhận), hình thức thanh toán `COD`, mã đơn hàng duy nhất `order_code`, trừ số lượng tồn kho tương ứng và giỏ hàng của khách hàng được làm sạch.

---

## 2. Quy trình xử lý dữ liệu và Transaction (COD Order Flow)

1. **Nhận dữ liệu từ Client (`POST /api/v1/orders/cod`):**
   - Body: `{"recipient_name": "Nguyễn Văn A", "recipient_phone": "0901234567", "shipping_address": "123 Nguyễn Huệ, Q1, TP.HCM", "note": "Giao giờ hành chính", "coupon_code": "NOITHAT10"}`
2. **Kiểm tra thông tin giao hàng (Validation):**
   - Bắt buộc phải có `recipient_name`, `recipient_phone`, `shipping_address`. Nếu thiếu -> HTTP 400 Bad Request (`MISSING_SHIPPING_INFO`).
3. **Kiểm tra giỏ hàng và Tồn kho QTN-02:**
   - Lấy danh sách mặt hàng trong `cart_items` của `user_id`. Nếu giỏ hàng rỗng -> HTTP 400 Bad Request (`CART_EMPTY`).
   - Kiểm tra số lượng từng mặt hàng vs `product.stock`. Nếu `quantity > product.stock` -> HTTP 400 Bad Request (`EXCEED_STOCK`).
4. **Xử lý Mã giảm giá QTN-01 (nếu có):**
   - Nếu có `coupon_code`, gọi `CouponService.validate_and_apply(coupon_code, subtotal)` để tính tiền giảm giá.
5. **Thực thi Transaction cơ sở dữ liệu (Atomic DB Transaction):**
   - Tạo bản ghi `orders` với `status = 'pending'`, `payment_method = 'COD'`, `payment_status = 'unpaid'`.
   - Tạo các bản ghi `order_items` tương ứng với mỗi mặt hàng.
   - Cập nhật trừ tồn kho `products.stock`.
   - Xóa toàn bộ `cart_items` của người dùng.
6. **Phản hồi:** Trả về HTTP 201 Created kèm chi tiết đơn hàng và `order_code`.

---

## 3. Các kịch bản kiểm thử nghiệp vụ (Test Cases Matrix)

| Mã AC | Kịch bản | Dữ liệu đầu vào | Kết quả mong đợi |
|---|---|---|---|
| **TC-01** | Tạo đơn COD thành công (Happy Path) | Giỏ hàng có sản phẩm, địa chỉ giao hàng hợp lệ đầy đủ | Trả về HTTP 201 Created. Đơn hàng lưu DB với status `pending`, payment_method `COD`, giỏ hàng rỗng. |
| **TC-02** | Dữ liệu không hợp lệ (Sad Path) | Thiếu `shipping_address` hoặc `recipient_phone` | Trả về HTTP 400 Bad Request (`MISSING_SHIPPING_INFO`). Báo yêu cầu nhập đầy đủ địa chỉ. |
| - | Giỏ hàng rỗng | Không có sản phẩm trong giỏ | Trả về HTTP 400 Bad Request (`CART_EMPTY`). |
