# Phân tích nghiệp vụ: NT-03-CN-005 — Xem đánh giá của sản phẩm

**Story:** NT-03-CN-005  
**Epic:** NT-03 — Giỏ hàng & Đặt hàng  
**Ngày phân tích:** 2026-08-12  
**Người thực hiện:** BA / Backend Dev

---

## 1. Mô tả nghiệp vụ

> Là Khách hàng, tôi muốn xem đánh giá và bình luận của người mua trước, để tham khảo trước khi quyết định mua sản phẩm.

**Điều kiện bắt đầu:** Khách hàng truy cập trang chi tiết sản phẩm (`/products/:id`).  
**Kết quả sau hoàn thành:** Hiển thị tổng quan điểm sao trung bình, dải phân bổ lượt đánh giá (5★ -> 1★), bộ lọc xem nhận xét theo số sao, và danh sách bình luận thực tế từ người mua trước có kèm badge xác thực "Đã mua hàng".

---

## 2. Quy tắc nghiệp vụ & Thuật toán tính toán (Rating & Summary Rules)

1. **Điểm sao trung bình (`average_rating`):**
   - Công thức: `average_rating = SUM(reviews.rating) / COUNT(reviews.id)` cho tất cả nhận xét có `is_approved == True`.
   - Kết quả làm tròn đến 1 chữ số thập phân (ví dụ: `4.8`).
   - Nếu sản phẩm chưa có nhận xét nào -> Giá trị mặc định: `average_rating: 5.0`, `total_reviews: 0`.
2. **Bộ lọc theo số sao (`star` query parameter):**
   - Hỗ trợ lọc danh sách nhận xét theo từng cấp độ sao: `star=all` (Tất cả), `star=5`, `star=4`, `star=3`, `star=2`, `star=1`.
3. **Thứ tự sắp xếp nhận xét:**
   - Ưu tiên nhận xét mới nhất xếp lên đầu (`created_at DESC`).

---

## 3. Các kịch bản kiểm thử nghiệp vụ (Test Cases Matrix)

| Mã AC | Kịch bản | Dữ liệu đầu vào | Kết quả mong đợi |
|---|---|---|---|
| **TC-01** | Xem đánh giá sản phẩm có nhận xét (Happy Path) | Xem chi tiết sản phẩm ID=1 có 2 nhận xét (5★ và 4★) | Trả về 200 OK + `average_rating: 4.5`, `total_reviews: 2`, hiển thị danh sách nhận xét có tên người mua và badge đã mua hàng. |
| **TC-02** | Lọc nhận xét theo số sao | Truy cập API `GET /api/v1/products/1/reviews?star=5` | Trả về 200 OK + Danh sách chỉ bao gồm các nhận xét đạt 5 sao. |
| **TC-03** | Sản phẩm chưa có nhận xét nào | Sản phẩm mới chưa có người dùng đánh giá | Trả về 200 OK + `reviews: []`, `total_reviews: 0`, `average_rating: 5.0` và hiển thị thông báo chưa có nhận xét. |

---

## 4. API Specification Update

### Endpoint: `GET /api/v1/products/<int:product_id>/reviews?star=5`
- **Auth:** Public (hoặc Optional JWT Token để kiểm tra quyền QTN-06)
- **Query Parameter:**
  - `star` (int, optional): Lọc theo cấp độ sao (1 đến 5). Nếu bỏ trống -> Lấy tất cả.
- **Response Success (200 OK):**
```json
{
  "status": "success",
  "data": {
    "reviews": [
      {
        "id": 1,
        "product_id": 1,
        "user_name": "Người Mua Hàng",
        "rating": 5,
        "comment": "Sofa gỗ óc chó rất xịn và êm ái!",
        "created_at": "2026-08-12T07:50:00Z"
      }
    ],
    "summary": {
      "average_rating": 4.8,
      "total_reviews": 10,
      "rating_breakdown": {
        "5": 8,
        "4": 2,
        "3": 0,
        "2": 0,
        "1": 0
      }
    },
    "can_review": false
  },
  "message": "Lấy danh sách đánh giá sản phẩm thành công"
}
```
