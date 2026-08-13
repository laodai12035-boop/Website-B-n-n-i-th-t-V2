# Phân tích nghiệp vụ: NT-09-CN-001 — Nhập kho sản phẩm (Admin)

**Story:** NT-09-CN-001  
**Epic:** NT-09 — Quản lý Kho & Tồn Kho (Admin)  
**Ngày phân tích:** 2026-08-13

---

## 1. Mô tả nghiệp vụ

> Là Quản trị viên, tôi muốn ghi nhận số lượng hàng nhập kho cho từng sản phẩm, để cập nhật đúng tồn kho hiện có.

**Điều kiện bắt đầu:** Quản trị viên đã đăng nhập trang quản trị (`role == 'admin'`). Sản phẩm cần nhập kho đã tồn tại trong cơ sở dữ liệu.  
**Kết quả:** Phiếu nhập kho được lưu lại và số lượng tồn kho sản phẩm được cộng dồn tích lũy tăng lên (`product.stock += quantity`).

---

## 2. Quy tắc nghiệp vụ

### 2.1 Phân quyền Admin (QTN-09)
- Endpoints `POST /api/v1/admin/inventory/import` và `GET /api/v1/admin/inventory/receipts` yêu cầu Token Admin.
- Người dùng thường gọi API ➔ Trả **403 FORBIDDEN** (`code="FORBIDDEN"`).
- Chưa đăng nhập ➔ Trả **401 Unauthorized**.

### 2.2 Quy tắc kiểm tra phiếu nhập kho
- **Kiểm tra sự tồn tại sản phẩm**: `product_id` phải tồn tại trong bảng `products`. Nếu không tìm thấy ➔ Trả về **404 Not Found** (`code="PRODUCT_NOT_FOUND"`).
- **Kiểm tra số lượng nhập (TC-02)**:
  - `quantity` bắt buộc là số nguyên dương lớn hơn 0 (`quantity > 0`).
  - Nếu `quantity <= 0` (ví dụ `-5` hoặc `0`) ➔ Từ chối lưu phiếu nhập và trả về **400 Bad Request** với `code="VALIDATION_ERROR"`, message: *"Số lượng nhập kho phải là số nguyên lớn hơn 0."*
- **Cập nhật tồn kho tự động (TC-01)**:
  - Trong cùng 1 DB transaction, hệ thống lưu bản ghi `StockReceipt` đồng thời cộng tích lũy `product.stock = product.stock + quantity`.
  - Trả về **201 Created** kèm thông tin `old_stock`, `added_quantity`, `new_stock`.

---

## 3. Ma trận Test Cases

| Mã AC | Kịch bản | Dữ liệu đầu vào | Kết quả mong đợi |
|---|---|---|---|
| **TC-01** | Nhập kho hợp lệ | `product_id` = 1, `quantity` = 50 (sản phẩm đang có stock = 10) | Trả về **201 Created**. Phiếu nhập kho lưu lại, tồn kho sản phẩm cập nhật thành 60. |
| **TC-02** | Số lượng nhập âm hoặc bằng 0 | `quantity` = -5 hoặc 0 | Trả về **400 Bad Request** (`VALIDATION_ERROR`). Tồn kho sản phẩm không thay đổi. |
| **TC-03** | Sản phẩm không tồn tại | `product_id` = 99999 | Trả về **404 Not Found** (`PRODUCT_NOT_FOUND`). |
| **TC-04** | Người dùng thường cố nhập kho | User gọi POST `/api/v1/admin/inventory/import` | Trả về **403 FORBIDDEN**. |
| **TC-05** | Lịch sử phiếu nhập kho | GET `/api/v1/admin/inventory/receipts` | Trả về **200 OK** kèm danh sách các phiếu nhập kho đã tạo. |
