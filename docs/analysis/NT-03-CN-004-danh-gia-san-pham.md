# Phân tích nghiệp vụ: NT-03-CN-004 — Viết đánh giá và bình luận sản phẩm

**Story:** NT-03-CN-004  
**Epic:** NT-03 — Giỏ hàng & Đặt hàng  
**Ngày phân tích:** 2026-08-12  
**Quy tắc nghiệp vụ liên quan:** **QTN-06** (Điều kiện đánh giá sản phẩm)  
**Người thực hiện:** BA / Backend Dev

---

## 1. Mô tả nghiệp vụ

> Là Khách hàng, tôi muốn viết đánh giá kèm số sao cho sản phẩm đã mua, để chia sẻ trải nghiệm với người mua khác.

**Điều kiện bắt đầu:** Khách hàng mở trang chi tiết sản phẩm (`/products/:id`) và cuộn tới khối nhận xét.  
**Kết quả sau hoàn thành:** Đánh giá của khách hàng được ghi nhận, điểm sao trung bình của sản phẩm được tự động tính toán lại và hiển thị trên giao diện.

---

## 2. Quy tắc nghiệp vụ QTN-06 (Review Eligibility Rules)

- **Quy tắc QTN-06:** Khách hàng chỉ được viết đánh giá cho sản phẩm thuộc đơn hàng đã giao thành công (`status == 'delivered'`).
- **Thỏa mãn (Then):** Nếu tài khoản của khách hàng có ít nhất một đơn hàng chứa sản phẩm đó với trạng thái `delivered` -> Ghi nhận đánh giá, tính lại sao trung bình.
- **Không thỏa mãn (Else):** Khóa/ẩn form đánh giá hoặc từ chối gửi đánh giá với thông báo: *"Bạn chỉ được viết đánh giá cho sản phẩm thuộc đơn hàng đã giao thành công (QTN-06)."*

---

## 3. Các kịch bản kiểm thử nghiệp vụ (Test Cases Matrix)

| Mã AC | Kịch bản | Dữ liệu đầu vào | Kết quả mong đợi |
|---|---|---|---|
| **TC-01** | Viết đánh giá sản phẩm thành công (Happy Path) | Khách hàng đã giao thành công sản phẩm ID=1 -> Chọn 5 sao + Nhập bình luận | Trả về 201 Created. Đánh giá xuất hiện trên giao diện, điểm sao sản phẩm cập nhật. |
| **TC-02** | Vi phạm quy tắc QTN-06 (Sad Path) | Khách hàng chưa mua sản phẩm hoặc đơn hàng chưa ở trạng thái `delivered` | Trả về 403 Forbidden (`code: REVIEW_NOT_ALLOWED`). Báo lý do QTN-06. |
| **TC-01 (NT-03-CN-005)** | Xem danh sách đánh giá của sản phẩm | Xem trang chi tiết sản phẩm ID=1 | Trả về 200 OK + Danh sách các nhận xét kèm tổng quan điểm trung bình & phân bổ số sao. |

---

## 4. API Specification

### 1. `POST /api/v1/products/<int:product_id>/reviews` (Bảo vệ bởi `@jwt_required()`)
- **Headers:** `Authorization: Bearer <user_token>`
- **Request Body:**
```json
{
  "rating": 5,
  "comment": "Sofa gỗ óc chó rất sang trọng, đệm êm ái, giao hàng nhanh!"
}
```
- **Response Success (201 Created):**
```json
{
  "status": "success",
  "data": {
    "review": {
      "id": 1,
      "product_id": 1,
      "user_name": "Khách Hàng",
      "rating": 5,
      "comment": "Sofa gỗ óc chó...",
      "created_at": "2026-08-12T07:50:00Z"
    },
    "new_product_rating": 5.0,
    "new_rating_count": 1
  },
  "message": "Đăng đánh giá sản phẩm thành công"
}
```
- **Response Error QTN-06 (403 Forbidden):**
```json
{
  "status": "error",
  "message": "Bạn chỉ được viết đánh giá cho sản phẩm thuộc đơn hàng đã giao thành công (QTN-06).",
  "code": "REVIEW_NOT_ALLOWED"
}
```

### 2. `GET /api/v1/products/<int:product_id>/reviews` (Public)
- **Response Success (200 OK):**
```json
{
  "status": "success",
  "data": {
    "reviews": [...],
    "summary": {
      "average_rating": 4.8,
      "total_reviews": 10,
      "rating_breakdown": { "5": 8, "4": 2, "3": 0, "2": 0, "1": 0 }
    }
  }
}
```
