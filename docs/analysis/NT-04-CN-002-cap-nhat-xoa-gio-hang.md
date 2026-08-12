# Phân tích nghiệp vụ: NT-04-CN-002 — Cập nhật số lượng và xóa sản phẩm trong giỏ hàng

**Story:** NT-04-CN-002  
**Epic:** NT-04 / NT-03 — Giỏ hàng & Đặt hàng  
**Ngày phân tích:** 2026-08-12  
**Quy tắc nghiệp vụ liên quan:** **QTN-02** (Không bán vượt tồn kho)  
**Người thực hiện:** BA / Backend Dev

---

## 1. Mô tả nghiệp vụ

> Là Khách hàng, tôi muốn thay đổi số lượng hoặc xóa sản phẩm khỏi giỏ hàng, để điều chỉnh đơn hàng trước khi thanh toán.

**Điều kiện bắt đầu:** Khách hàng mở giỏ hàng (trang `/cart` hoặc slide-over `CartDrawer`) đang có ít nhất 1 sản phẩm.  
**Kết quả sau hoàn thành:** Số lượng từng mặt hàng, đơn giá dòng sản phẩm, tổng đếm mặt hàng, và tổng tiền thanh toán được cập nhật chính xác theo thời gian thực.

---

## 2. Quy tắc nghiệp vụ & Kịch bản xử lý (Cart Update & Delete Rules)

1. **Thay đổi số lượng (Cộng `+` / Trừ `-` / Nhập số):**
   - **Tăng số lượng (TC-01):** Nếu `số lượng mới <= product.stock` -> Cho phép cập nhật (`PUT /api/v1/cart/items/<product_id>`), tính lại dòng tiền và tổng tiền giỏ hàng (200 OK).
   - **Tăng số lượng vượt tồn kho (TC-02 - QTN-02):** Nếu `số lượng mới > product.stock` -> Chặn thao tác, giữ nguyên số lượng cũ, trả về 400 Bad Request (`code: EXCEED_STOCK`), hiển thị thông báo lỗi báo số lượng còn lại trong kho.
   - **Giảm số lượng về 0:** Tự động xóa sản phẩm đó khỏi giỏ hàng.
2. **Xóa sản phẩm khỏi giỏ hàng (TC-03):**
   - Bấm icon Thùng rác 🗑️ trên từng dòng sản phẩm -> Gọi API `DELETE /api/v1/cart/items/<product_id>`, xóa item khỏi giỏ và tính lại tổng tiền.
   - Bấm nút "Xóa toàn bộ" -> Gọi API `DELETE /api/v1/cart/clear`, xóa sạch giỏ hàng.

---

## 3. Các kịch bản kiểm thử nghiệp vụ (Test Cases Matrix)

| Mã AC | Kịch bản | Dữ liệu đầu vào | Kết quả mong đợi |
|---|---|---|---|
| **TC-01** | Tăng số lượng trong giới hạn tồn kho (Happy Path) | Giỏ hàng có SP 1 (tồn kho 10). Tăng số lượng từ 1 lên 3 | Trả về 200 OK. Giỏ hàng cập nhật số lượng thành 3, dòng tiền và tổng tiền tăng tương ứng. |
| **TC-02** | Vi phạm quy tắc QTN-02 | Giỏ hàng có SP 1 (tồn kho 10). Tăng số lượng lên 20 | Trả về 400 Bad Request (`code: EXCEED_STOCK`). Báo tồn kho còn lại 10. |
| **TC-03** | Xóa sản phẩm khỏi giỏ hàng | Bấm nút xóa 🗑️ cho sản phẩm ID=1 | Trả về 200 OK. Sản phẩm biến mất khỏi giỏ, tổng tiền cập nhật giảm. |
| - | Giảm số lượng về 0 | Giảm số lượng từ 1 xuống 0 | Trả về 200 OK. Tự động xóa sản phẩm khỏi giỏ. |
