# Phân tích nghiệp vụ: NT-09-CN-002 — Tự động trừ và hoàn kho theo trạng thái đơn hàng (QTN-03)

**Story:** NT-09-CN-002  
**Epic:** NT-09 — Quản lý Kho & Tồn Kho (Admin)  
**Quy tắc liên quan:** QTN-03  
**Ngày phân tích:** 2026-08-13

---

## 1. Mô tả nghiệp vụ

> Là Quản trị viên, tôi muốn hệ thống tự động trừ tồn kho khi đơn hàng được xác nhận và hoàn lại khi đơn bị hủy, để tồn kho luôn chính xác mà không cần thao tác thủ công.

**Điều kiện bắt đầu:** Đơn hàng chuyển trạng thái liên quan đến thanh toán hoặc vòng đời đơn hàng (`confirmed`, `paid`, `shipping`, `delivered`, `cancelled`).  
**Kết quả:** Tồn kho sản phẩm được cập nhật tăng/giảm chính xác tương ứng số lượng các sản phẩm có trong đơn hàng.

---

## 2. Quy tắc nghiệp vụ QTN-03

### 2.1 Cờ theo dõi trừ kho (`order.stock_deducted`)
- Trường `stock_deducted` (Boolean) trên bảng `orders` nhận giá trị `TRUE` khi số lượng tồn kho sản phẩm trong đơn đã bị trừ.
- Trường này giúp hệ thống đạt tính **idempotent**:
  - Không bao giờ trừ tồn kho 2 lần cho cùng một đơn hàng.
  - Không hoàn kho đối với đơn chưa từng bị trừ kho.

### 2.2 Quy tắc Trừ Kho tự động (TC-01)
- Áp dụng khi đơn hàng chuyển sang trạng thái: `confirmed` (Đã xác nhận), `paid` (Đã thanh toán), `shipping` (Đang giao hàng), `delivered` (Đã giao hàng).
- Nếu `order.stock_deducted == False`:
  - Lặp qua danh sách `order.items`: Trừ `product.stock = product.stock - item.quantity`.
  - Đặt `order.stock_deducted = True`.
- **Xử lý ngoại lệ (Else)**: Nếu sản phẩm bị thiếu tồn kho (`stock < item.quantity`) hoặc lỗi DB ➔ Ghi log cảnh báo `WARNING_STOCK_INSUFFICIENT`, giữ ứng dụng không bị sập và duy trì tính nhất quán dữ liệu.

### 2.3 Quy tắc Hoàn Kho tự động (TC-02)
- Áp dụng khi đơn hàng chuyển sang trạng thái: `cancelled` (Đã hủy).
- Nếu `order.stock_deducted == True`:
  - Lặp qua danh sách `order.items`: Hoàn lại `product.stock = product.stock + item.quantity`.
  - Đặt `order.stock_deducted = False`.
- Nếu `order.stock_deducted == False`:
  - Bỏ qua, không cộng kho lặp lại.

---

## 3. Ma trận Test Cases

| Mã AC | Kịch bản | Given | When | Then |
|---|---|---|---|---|
| **TC-01** | Xác nhận đơn / thanh toán trừ kho | Đơn hàng trạng thái `pending` (SP A có stock = 50, đơn mua 2) | Chuyển trạng thái đơn sang `confirmed` / `paid` | Stock SP A tự động giảm xuống 48. Cờ `stock_deducted` = True. |
| **TC-02** | Hủy đơn hoàn kho | Đơn hàng đã trừ kho (`stock_deducted` = True, SP A stock = 48) | Chuyển trạng thái đơn sang `cancelled` | Stock SP A tự động hoàn lại thành 50. Cờ `stock_deducted` = False. |
| **TC-03** | Hủy đơn chưa từng trừ kho | Đơn chưa trừ kho (`stock_deducted` = False) | Hủy đơn | Stock SP A giữ nguyên, không cộng thêm lặp lại. |
| **TC-04** | Idempotence chuyển trạng thái nhiều lần | Đơn chuyển từ `confirmed` ➔ `shipping` ➔ `delivered` | Cập nhật qua nhiều bước | Tồn kho chỉ trừ đúng 1 lần duy nhất. |
