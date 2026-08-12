# Phân tích nghiệp vụ: NT-03-CN-002 — Xem sản phẩm liên quan và gợi ý

**Story:** NT-03-CN-002 (NT-03-CN-003)  
**Epic:** NT-03 — Giỏ hàng & Đặt hàng  
**Ngày phân tích:** 2026-08-12  
**Người thực hiện:** BA / Backend Dev

---

## 1. Mô tả nghiệp vụ

> Là Khách hàng, tôi muốn xem các sản phẩm liên quan hoặc thường mua kèm, để dễ dàng chọn thêm sản phẩm phù hợp bộ sưu tập.

**Điều kiện bắt đầu:** Khách hàng đang ở trang chi tiết của một sản phẩm bất kỳ (`/products/:id`).  
**Kết quả sau hoàn thành:** Phía dưới trang chi tiết sản phẩm hiển thị danh sách từ 1 đến 4 sản phẩm cùng danh mục (loại trừ chính sản phẩm đang xem), có rating và giá bán cạnh tranh để khuyến khích mua thêm.

---

## 2. Quy tắc tìm kiếm & gợi ý sản phẩm liên quan (Recommendation Rules)

1. **Gợi ý theo Danh mục (`category`):**
   - Lọc tất cả sản phẩm có `category == current_product.category`.
   - Loại trừ sản phẩm đang hiển thị: `id != current_product.id`.
   - Chỉ lấy sản phẩm đang ở trạng thái kinh doanh: `is_active == True`.
2. **Sắp xếp thứ tự ưu tiên:**
   - Ưu tiên sản phẩm có sao đánh giá cao nhất (`rating DESC`).
   - Nếu bằng rating, ưu tiên sản phẩm mới đăng (`created_at DESC`).
3. **Giới hạn số lượng:** `limit = 4` sản phẩm.
4. **Xử lý danh sách rỗng (Empty State):**
   - Nếu trong danh mục không có sản phẩm nào khác ngoài sản phẩm hiện tại -> API trả về `200 OK` với mảng rỗng `{"related_products": []}`.
   - Frontend ẩn khối gợi ý một cách lịch sự, không gây gãy bố cục UI.

---

## 3. Các kịch bản kiểm thử nghiệp vụ (Test Cases Matrix)

| Mã AC | Kịch bản | Dữ liệu đầu vào | Kết quả mong đợi |
|---|---|---|---|
| **TC-01** | Xem sản phẩm có gợi ý liên quan (Happy Path) | ID sản phẩm thuộc danh mục "ghe" (vd: `id=1`) | Trả về 200 OK + Danh sách các sản phẩm khác thuộc danh mục "ghe" (không bao gồm ID 1) |
| **TC-02** | Danh mục chỉ có duy nhất 1 sản phẩm | ID sản phẩm không có sản phẩm khác cùng danh mục | Trả về 200 OK + Mảng `related_products: []` |
| **TC-03** | ID sản phẩm xem chi tiết không tồn tại | `id=9999` | Trả về 404 Not Found (`code: PRODUCT_NOT_FOUND`) |

---

## 4. API Specification

### Endpoint: `GET /api/v1/products/<int:product_id>/related?limit=4`
- **Auth:** Public
- **Response Success (200 OK - TC-01):**
```json
{
  "status": "success",
  "data": {
    "related_products": [
      {
        "id": 2,
        "name": "Ghế Sofa Văng Da Hiện Đại",
        "price": 15800000.0,
        "discount_price": null,
        "category": "ghe",
        "rating": 4.8,
        "rating_count": 20,
        "image_url": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc"
      }
    ]
  },
  "message": "Lấy danh sách sản phẩm liên quan thành công"
}
```
