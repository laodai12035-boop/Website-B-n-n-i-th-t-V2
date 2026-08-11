# Phân tích nghiệp vụ: NT-03-CN-001 — Xem chi tiết sản phẩm

**Story:** NT-03-CN-001  
**Epic:** NT-03 — Giỏ hàng & Đặt hàng  
**Ngày phân tích:** 2026-08-11  
**Người thực hiện:** BA / Backend Dev

---

## 1. Mô tả nghiệp vụ

> Là Khách hàng, tôi muốn xem chi tiết sản phẩm gồm hình ảnh, mô tả, thông số và giá, để có đủ thông tin trước khi quyết định mua.

**Điều kiện bắt đầu:** Sản phẩm tồn tại trong cơ sở dữ liệu và đang ở trạng thái kinh doanh (`is_active == True`).  
**Kết quả sau hoàn thành:** Màn hình chi tiết sản phẩm hiển thị đầy đủ thông tin: Tên sản phẩm, Danh mục, Hình ảnh chất lượng cao, Giá niêm yết, Giá khuyến mãi, Phần trăm giảm giá, Số sao đánh giá, Số lượt đánh giá, Số lượng tồn kho, Chất liệu (`material`), Kích thước (`dimensions`), Mô tả chi tiết và các chính sách bảo hành / vận chuyển.

---

## 2. Quy tắc kiểm tra tính hợp lệ dữ liệu (Data Validation & Status Rules)

| Trạng thái sản phẩm | Phản hồi API Backend | Xử lý giao diện Frontend |
|---|---|---|
| Sản phẩm tồn tại & `is_active == True` | HTTP `200 OK` + JSON product detail | Hiển thị đầy đủ trang chi tiết |
| Sản phẩm ngưng bán (`is_active == False`) | HTTP `404 Not Found` (`code: PRODUCT_NOT_FOUND`) | Hiển thị màn hình 404 Empty State: "Sản phẩm không còn tồn tại hoặc đã bị ngừng kinh doanh" |
| ID sản phẩm không tồn tại trong DB | HTTP `404 Not Found` (`code: PRODUCT_NOT_FOUND`) | Hiển thị màn hình 404 Empty State + Nút "Quay lại danh sách sản phẩm" |

---

## 3. Các kịch bản kiểm thử nghiệp vụ (Test Cases Matrix)

| Mã AC | Kịch bản | Dữ liệu đầu vào | Kết quả mong đợi |
|---|---|---|---|
| **TC-01** | Xem chi tiết sản phẩm hợp lệ (Happy Path) | ID sản phẩm hợp lệ (vd: `id=1`) | Trả về 200 OK + Hiển thị đầy đủ các thông số kĩ thuật, hình ảnh và mô tả sản phẩm |
| **TC-02** | Xem sản phẩm không tồn tại / đã ngừng bán (Sad Path) | ID không tồn tại (vd: `id=9999`) | API trả về 404 Not Found (`code: PRODUCT_NOT_FOUND`) + Frontend báo lỗi sản phẩm không tồn tại |

---

## 4. API Specification

### Endpoint: `GET /api/v1/products/<int:product_id>`
- **Auth:** Public
- **Response Success (200 OK - TC-01):**
```json
{
  "status": "success",
  "data": {
    "product": {
      "id": 1,
      "name": "Bộ Sofa Gỗ Óc Chó Cao Cấp",
      "slug": "sofa-oc-cho",
      "description": "Bộ ghế sofa phong cách hiện đại thích hợp cho phòng khách sang trọng.",
      "price": 28500000.0,
      "discount_price": 25000000.0,
      "category": "ghe",
      "material": "Gỗ óc chó tự nhiên, bọc da Ý",
      "dimensions": "2.8m x 1.8m x 0.8m",
      "rating": 5.0,
      "rating_count": 12,
      "stock": 10,
      "image_url": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
      "is_active": true,
      "created_at": "2026-08-11T16:00:00"
    }
  },
  "message": "Lấy thông tin chi tiết sản phẩm thành công"
}
```

- **Response Error (404 Not Found - TC-02):**
```json
{
  "status": "error",
  "message": "Sản phẩm không còn tồn tại hoặc đã bị ngừng kinh doanh",
  "code": "PRODUCT_NOT_FOUND"
}
```
