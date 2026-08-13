# Phân tích nghiệp vụ: NT-08-CN-005 — Khai báo thông tin bảo hành sản phẩm

**Story:** NT-08-CN-005  
**Epic:** NT-08 — Quản lý danh mục & sản phẩm (Admin)  
**Ngày phân tích:** 2026-08-13

---

## 1. Mô tả nghiệp vụ

> Là Quản trị viên, tôi muốn khai báo thời hạn và điều kiện bảo hành cho từng sản phẩm, để khách hàng nắm rõ quyền lợi bảo hành khi mua.

**Điều kiện bắt đầu:** Sản phẩm đã tồn tại trong hệ thống hoặc Admin đang tạo sản phẩm mới. Quản trị viên đã đăng nhập trang quản trị (`role == 'admin'`).  
**Kết quả:** Thời hạn bảo hành (tháng) và điều kiện bảo hành được lưu vào hệ thống và hiển thị rõ ràng trên trang chi tiết sản phẩm khách hàng xem.

---

## 2. Quy tắc nghiệp vụ

### 2.1 Cấu trúc thông tin bảo hành
- **`warranty_months` (Thời hạn bảo hành)**:
  - Kiểu dữ liệu: Số nguyên `>= 0`.
  - Đơn vị tính: Tháng (ví dụ: `6`, `12`, `24`, `36`). Mặc định = `12` tháng nếu không khai báo.
  - Nếu Admin nhập số âm (`< 0`) ➔ Hệ thống báo lỗi validation **400 Bad Request** (`VALIDATION_ERROR`).
- **`warranty_terms` (Điều kiện bảo hành)**:
  - Kiểu dữ liệu: Văn bản (Text / String).
  - Nội dung: Mô tả điều kiện được bảo hành (VD: *"Bảo hành chính hãng cho các lỗi kết cấu khung gỗ, cong vênh và mối mọt từ nhà sản xuất."*).
  - Nếu để trống, hệ thống hiển thị chính sách bảo hành tiêu chuẩn mặc định.

### 2.2 Hiển thị cho Khách hàng
- Trên trang chi tiết sản phẩm (`ProductDetailPage.jsx`), thông tin bảo hành được hiển thị tại 2 vị trí:
  1. Trong bảng Thông số sản phẩm: `Bảo hành chính hãng: X tháng`.
  2. Thẻ nổi bật **🛡️ Chính sách & Điều kiện bảo hành**: Hiển thị rõ nội dung `warranty_terms`.

---

## 3. Ma trận Test Cases

| Mã AC | Kịch bản | Dữ liệu đầu vào | Kết quả mong đợi |
|---|---|---|---|
| **TC-01** | Khai báo bảo hành khi tạo/sửa sản phẩm | `warranty_months` = 24, `warranty_terms` = *"Bảo hành 24 tháng khung gỗ"* | Trả về 200/201. Dữ liệu lưu đúng `warranty_months` = 24. |
| **TC-02** | Khách xem thông tin bảo hành trên API | Gọi GET `/api/v1/products/:id` | Trả về thông tin sản phẩm chứa `warranty_months` và `warranty_terms`. |
| **TC-03** | Thời gian bảo hành âm | `warranty_months` = -6 | Trả về **400 Bad Request** (`VALIDATION_ERROR`). |
