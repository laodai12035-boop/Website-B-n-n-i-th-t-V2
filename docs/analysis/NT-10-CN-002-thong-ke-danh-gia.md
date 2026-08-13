# Phân tích nghiệp vụ: NT-10-CN-002 — Xem thống kê đánh giá sản phẩm

**Story:** NT-10-CN-002  
**Epic:** NT-10 — Quản lý Đánh Giá & Phản Hồi (Admin)  
**Ngày phân tích:** 2026-08-13

---

## 1. Mô tả nghiệp vụ

> Là Quản trị viên, tôi muốn xem điểm đánh giá trung bình và số lượt đánh giá theo từng sản phẩm, để nắm được mức độ hài lòng của khách hàng.

**Điều kiện bắt đầu:** Sản phẩm có ít nhất một đánh giá (bảng `reviews`).  
**Kết quả:** Thống kê tổng quan hệ thống và chi tiết chỉ số đánh giá theo từng sản phẩm hiển thị chính xác trên trang quản trị.

---

## 2. Công thức tổng hợp dữ liệu

### 2.1 Chỉ số Tổng quan (Overview)
- **Tổng số nhận xét (`total_reviews`)**: Đếm số lượng tất cả nhận xét trong bảng `reviews`.
- **Số nhận xét đã duyệt (`approved_reviews`)**: Số nhận xét có `is_approved = True`.
- **Số nhận xét đã ẩn (`hidden_reviews`)**: Số nhận xét có `is_approved = False`.
- **Điểm sao trung bình toàn sàn (`overall_average_rating`)**:
  $$\text{overall\_average\_rating} = \frac{\sum \text{rating (is\_approved = True)}}{\text{approved\_reviews}}$$
  *(Mặc định = 5.0 nếu chưa có đánh giá nào)*.
- **Phân bổ 5 mức sao (`star_distribution`)**: Đếm số lượng đánh giá 1★, 2★, 3★, 4★, 5★ trong hệ thống.

### 2.2 Chỉ số Chi tiết theo Sản phẩm (Product Level)
Với từng sản phẩm trong cơ sở dữ liệu:
- **Điểm trung bình sản phẩm (`average_rating`)**: Lấy từ `product.rating` (hoặc tính trung bình các review `is_approved = True` của sản phẩm đó).
- **Tổng lượt đánh giá (`total_reviews`)**: Tổng số review của sản phẩm.
- **Lượt đánh giá đã duyệt (`approved_reviews_count`)**: Số review `is_approved = True`.
- **Lượt đánh giá đã ẩn (`hidden_reviews_count`)**: Số review `is_approved = False`.
- **Tỷ lệ hài lòng (`satisfaction_rate`)**:
  $$\text{satisfaction\_rate} = \frac{\text{Số đánh giá 4-5 sao}}{\text{total\_reviews}} \times 100\%$$

---

## 3. Ma trận Test Cases

| Mã AC | Kịch bản | Given | When | Then |
|---|---|---|---|---|
| **TC-01** | Admin xem thống kê sản phẩm | Sản phẩm có 10 đánh giá (8 lượt 5★, 2 lượt 4★) | Admin xem trang thống kê đánh giá | Trả về `total_reviews` = 10, `average_rating` = 4.8, `satisfaction_rate` = 100%. |
| **TC-02** | Sản phẩm chưa có đánh giá | Sản phẩm vừa tạo chưa có review | Admin xem trang thống kê đánh giá | Trả về `total_reviews` = 0, `average_rating` = 5.0, `satisfaction_rate` = 0%. |
| **TC-03** | Khách hàng xem API thống kê | Người dùng role = `user` | Gọi API Admin stats | Trả về **403 FORBIDDEN**. |
