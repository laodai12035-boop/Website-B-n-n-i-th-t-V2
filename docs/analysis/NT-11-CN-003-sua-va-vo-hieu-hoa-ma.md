# Phân tích nghiệp vụ: NT-11-CN-003 — Sửa và vô hiệu hóa mã giảm giá (QTN-01)

**Story:** NT-11-CN-003  
**Epic:** NT-11 — Quản lý Banner & Quảng Cáo / Khuyến Mãi (Admin)  
**Quy tắc liên quan:** QTN-01 (Điều kiện áp dụng mã giảm giá)  
**Ngày phân tích:** 2026-08-14

---

## 1. Mô tả nghiệp vụ

> Là Quản trị viên, tôi muốn chỉnh sửa hoặc vô hiệu hóa mã giảm giá đang chạy, để điều chỉnh chương trình khuyến mãi khi cần dừng sớm.

**Điều kiện bắt đầu:** Mã giảm giá đã tồn tại trong hệ thống.  
**Kết quả:** Mã giảm giá được cập nhật điều kiện mới hoặc lập tức ngưng cho áp dụng đối với khách hàng.

---

## 2. Quy tắc nghiệp vụ (QTN-01 & Dừng sớm khuyến mãi)

### 2.1 Vô hiệu hóa mã giảm giá (`is_active = False`)
- Khi Quản trị viên chuyển trạng thái mã từ `Active` sang `Inactive` (`is_active = False`):
  - Mã giảm giá lập tức ngưng cho áp dụng trên toàn bộ ứng dụng (Khách nhập mã tại giỏ hàng ➔ Trả lỗi `400 Bad Request` mã `COUPON_EXPIRED_OR_INVALID`).
  - Danh sách mã công khai `GET /api/v1/coupons/active` tự động loại bỏ mã đã vô hiệu hóa.

### 2.2 Chỉnh sửa điều kiện áp dụng mã giảm giá
- Khi Quản trị viên chỉnh sửa giá trị đơn tối thiểu (`min_order_value`), mức giảm (`discount_value`), hoặc hạn sử dụng (`end_date`):
  - Điều kiện mới lập tức có hiệu lực ở lần áp dụng tiếp theo của khách hàng (TC-02).
  - Nếu đơn hàng không đạt giá trị tối thiểu mới ➔ Trả về lỗi `400 Bad Request` mã `MIN_ORDER_VALUE_NOT_MET`.

---

## 3. Ma trận Test Cases

| Mã AC | Kịch bản | Given | When | Then |
|---|---|---|---|---|
| **TC-01** | Vô hiệu hóa mã giảm giá đang hoạt động | Mã đang hoạt động | Admin vô hiệu hóa mã (`is_active = False`) | Mã lập tức không còn áp dụng được cho khách hàng (400 Bad Request, `COUPON_EXPIRED_OR_INVALID`). |
| **TC-02** | Chỉnh sửa điều kiện áp dụng | Mã đã tồn tại | Admin sửa đơn tối thiểu từ 2tr lên 5tr | Đơn hàng 3tr bị từ chối (`MIN_ORDER_VALUE_NOT_MET`), đơn 5.5tr áp dụng thành công. |
| **TC-03** | Lùi ngày hết hạn để dừng sớm | Mã đang hoạt động | Admin lùi `end_date` về quá khứ | Mã dừng sớm và không áp dụng được nữa. |
| **TC-04** | User thường gọi API sửa/vô hiệu hóa | Người dùng role = `user` | Gọi API Admin PUT coupons | Trả về **403 FORBIDDEN**. |
