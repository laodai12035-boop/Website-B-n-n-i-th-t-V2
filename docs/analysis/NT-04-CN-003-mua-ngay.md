# Phân tích nghiệp vụ: NT-04-CN-003 — Mua ngay (Express Checkout)

**Story:** NT-04-CN-003  
**Epic:** NT-04 / NT-03 — Giỏ hàng & Đặt hàng  
**Ngày phân tích:** 2026-08-12  
**Quy tắc nghiệp vụ liên quan:** **QTN-02** (Không bán vượt tồn kho)  
**Người thực hiện:** BA / Backend Dev

---

## 1. Mô tả nghiệp vụ

> Là Khách hàng, tôi muốn bấm mua ngay trên trang sản phẩm, để đặt hàng nhanh mà không cần qua giỏ hàng.

**Điều kiện bắt đầu:** Khách hàng xem sản phẩm còn hàng (`product.stock > 0`) tại trang chi tiết (`ProductDetailPage.jsx`) hoặc danh sách sản phẩm.  
**Kết quả sau hoàn thành:** Khách hàng bấm nút **"Mua ngay"**, hệ thống kiểm tra tồn kho, chuẩn bị sản phẩm đã chọn và chuyển hướng ngay lập tức đến Trang Thanh toán (`/checkout`).

---

## 2. Luồng nghiệp vụ Mua ngay (Express Checkout Flow)

1. **Khách hàng bấm "Mua ngay" (`POST /api/v1/cart/buy-now`):**
   - Body: `{"product_id": 1, "quantity": 1}`
   - Hệ thống tự động thêm/thiết lập duy nhất mặt hàng đã chọn vào phiên đặt hàng của khách hàng.
2. **Kiểm tra tồn kho QTN-02:**
   - Nếu `quantity <= product.stock`: Chấp nhận, trả về `200 OK` + Thông tin mặt hàng đã sẵn sàng cho thanh toán.
   - Nếu `quantity > product.stock` hoặc `product.stock <= 0`: Trả về `400 Bad Request` (`code: EXCEED_STOCK`, message: *"Sản phẩm đã hết hàng hoặc số lượng đặt vượt quá tồn kho còn lại."*).
3. **Chuyển hướng trang (Client-side Navigation):**
   - Chuyển hướng lập tức tới đường dẫn `/checkout`.

---

## 3. Các kịch bản kiểm thử nghiệp vụ (Test Cases Matrix)

| Mã AC | Kịch bản | Dữ liệu đầu vào | Kết quả mong đợi |
|---|---|---|---|
| **TC-01** | Mua ngay sản phẩm còn hàng (Happy Path) | Bấm "Mua ngay" cho SP ID=1 với số lượng 1 (tồn kho 10) | Trả về 200 OK. Hệ thống chuyển hướng thẳng đến `/checkout` với SP ID=1 đã chọn. |
| **TC-02** | Mua ngay sản phẩm vượt quá tồn kho (Sad Path - QTN-02) | Bấm "Mua ngay" SP ID=1 số lượng 20 (tồn kho 10) | Trả về 400 Bad Request (`EXCEED_STOCK`). Báo lỗi vượt tồn kho. |
| - | Chưa đăng nhập cố bấm Mua ngay | Chưa có JWT token | Trả về 401 Unauthorized. Chuyển hướng tới trang Đăng nhập `/login`. |
