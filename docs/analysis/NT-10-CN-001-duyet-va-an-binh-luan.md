# Phân tích nghiệp vụ: NT-10-CN-001 — Duyệt và ẩn bình luận đánh giá

**Story:** NT-10-CN-001  
**Epic:** NT-10 — Quản lý Đánh Giá & Phản Hồi (Admin)  
**Ngày phân tích:** 2026-08-13

---

## 1. Mô tả nghiệp vụ

> Là Quản trị viên, tôi muốn duyệt hoặc ẩn các bình luận đánh giá sản phẩm, để loại bỏ nội dung không phù hợp trước khi hiển thị công khai.

**Điều kiện bắt đầu:** Có các bình luận đánh giá của khách hàng trong cơ sở dữ liệu (bảng `reviews`).  
**Kết quả:** Bình luận được cập nhật cờ `is_approved`. Nếu `is_approved = True` ➔ Hiển thị công khai trên sản phẩm. Nếu `is_approved = False` ➔ Bị ẩn khỏi danh sách đánh giá công khai.

---

## 2. Quy tắc kiểm duyệt nội dung

### 2.1 Cờ hiển thị `review.is_approved`
- `is_approved = True`: Bình luận hợp lệ, hiển thị công khai cho mọi người xem trang sản phẩm.
- `is_approved = False`: Bình luận bị ẩn (vi phạm chính sách, ngôn từ không phù hợp, spam, quảng cáo).

### 2.2 Tự động cập nhật chỉ số Rating sản phẩm
Khi cờ `is_approved` thay đổi (được duyệt hoặc bị ẩn):
- Hệ thống tự động tính toán lại:
  - **Điểm sao trung bình (`product.rating`)**: Trung bình cộng số sao của tất cả các bình luận đang có `is_approved = True`.
  - **Tổng số đánh giá (`product.rating_count`)**: Đếm số lượng bình luận có `is_approved = True`.
- Nếu không còn bình luận nào được duyệt ➔ `rating = 5.0` và `rating_count = 0`.

---

## 3. Ma trận Test Cases

| Mã AC | Kịch bản | Given | When | Then |
|---|---|---|---|---|
| **TC-01** | Admin duyệt bình luận hợp lệ | Bình luận đang bị ẩn (`is_approved` = False) | Admin gọi API duyệt (`is_approved` = True) | `is_approved` ➔ True, bình luận hiển thị trên trang sản phẩm công khai. |
| **TC-02** | Admin ẩn bình luận vi phạm | Bình luận đang công khai (`is_approved` = True) | Admin gọi API ẩn (`is_approved` = False) | `is_approved` ➔ False, bình luận bị ẩn khỏi trang sản phẩm công khai. |
| **TC-03** | Duyệt bình luận không tồn tại | ID bình luận = 99999 | Gọi API moderation | Trả về **404 NOT_FOUND**. |
| **TC-04** | User thường gọi API duyệt | Khách hàng role = `user` | Gọi API Admin reviews | Trả về **403 FORBIDDEN**. |
