# Phân tích nghiệp vụ: NT-11-CN-002 — Tạo mã giảm giá (QTN-01)

**Story:** NT-11-CN-002  
**Epic:** NT-11 — Quản lý Banner & Quảng Cáo / Khuyến Mãi (Admin)  
**Quy tắc liên quan:** QTN-01 (Điều kiện áp dụng mã giảm giá)  
**Ngày phân tích:** 2026-08-14

---

## 1. Mô tả nghiệp vụ

> Là Quản trị viên, tôi muốn tạo mã giảm giá với điều kiện áp dụng và thời hạn, để triển khai chương trình khuyến mãi cho khách hàng.

**Điều kiện bắt đầu:** Quản trị viên đã đăng nhập trang quản trị.  
**Kết quả:** Mã giảm giá mới sẵn sàng để khách hàng áp dụng tại giỏ hàng và thanh toán.

---

## 2. Quy tắc nghiệp vụ (QTN-01 & Validation)

### 2.1 Cấu trúc dữ liệu Mã giảm giá (Coupon)
- `code` (Chuỗi, bắt buộc, Duy nhất): Mã giảm giá viết hoa (Ví dụ: `NOITHAT10`, `GIAM500K`). Nếu trùng mã ➔ Báo lỗi `400 Bad Request` mã `COUPON_CODE_EXISTS`.
- `description` (Chuỗi, tùy chọn): Mô tả chương trình khuyến mãi.
- `discount_type` (Chuỗi, bắt buộc): Loại giảm giá (`percent` = giảm theo phần trăm %, `fixed` = giảm số tiền cố định VND).
- `discount_value` (Số thực, bắt buộc): Giá trị giảm (Nếu `percent` thì `0 < value <= 100`, nếu `fixed` thì `value > 0`).
- `min_order_value` (Số thực, mặc định 0.0): Giá trị đơn hàng tối thiểu để áp dụng mã (QTN-01).
- `max_discount` (Số thực, tùy chọn): Mức giảm giá tối đa cho mã phần trăm.
- `is_active` (Boolean, mặc định True): Trạng thái kích hoạt.
- `start_date` (DateTime, tùy chọn): Thời điểm bắt đầu hiệu lực.
- `end_date` (DateTime, tùy chọn): Thời điểm kết thúc hiệu lực.

---

## 3. Ma trận Test Cases

| Mã AC | Kịch bản | Given | When | Then |
|---|---|---|---|---|
| **TC-01** | Admin tạo mã giảm giá thành công | Admin đã đăng nhập | Nhập mã `NOITHAT10`, giảm 10%, đơn tối thiểu 2.000.000đ, thời hạn | Mã giảm giá khởi tạo thành công (201 Created) và sẵn sàng cho khách áp dụng. |
| **TC-02** | Dữ liệu trùng mã giảm giá | Mã `NOITHAT10` đã tồn tại | Admin tạo mã trùng `NOITHAT10` | Hệ thống từ chối và báo lỗi mã đã tồn tại (400 Bad Request, `COUPON_CODE_EXISTS`). |
| **TC-03** | Admin sửa và xóa mã giảm giá | Mã ID = X đã tồn tại | Admin cập nhật thông tin hoặc xóa mã | Mã được cập nhật / xóa thành công (200 OK). |
| **TC-04** | User thường gọi API Admin Coupons | Người dùng role = `user` | Gọi API Admin coupons | Trả về **403 FORBIDDEN**. |
