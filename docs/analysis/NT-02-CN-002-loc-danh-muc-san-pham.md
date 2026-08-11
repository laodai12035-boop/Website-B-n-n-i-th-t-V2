# Phân tích nghiệp vụ: NT-02-CN-002 — Lọc sản phẩm theo danh mục

**Story:** NT-02-CN-002  
**Epic:** NT-02 — Quản lý sản phẩm & danh mục  
**Ngày phân tích:** 2026-08-11  
**Người thực hiện:** BA / Backend Dev

---

## 1. Mô tả nghiệp vụ

> Là Khách hàng, tôi muốn xem sản phẩm theo từng danh mục như phòng khách, phòng ngủ, nhà bếp..., để duyệt đúng nhóm đồ nội thất mình quan tâm.

**Điều kiện bắt đầu:** Danh mục đã được khai báo và các sản phẩm đã được phân loại vào danh mục phù hợp.  
**Kết quả sau hoàn thành:** Màn hình danh sách tự động lọc các sản phẩm tương ứng với danh mục được chọn. Nếu danh mục rỗng (chưa có sản phẩm), hiển thị màn hình thông báo danh mục trống một cách lịch sự, không phát sinh lỗi.

---

## 2. Danh mục sản phẩm tiêu chuẩn (Category Matrix)

| Code Danh Mục | Tên Danh Mục (Tiếng Việt) | Mô tả nhóm đồ nội thất | Số lượng mẫu |
|---|---|---|---|
| `ban` | Bàn | Bàn ăn, bàn làm việc, bàn trà sofa | 2+ |
| `ghe` | Ghế & Sofa | Ghế ăn, ghế làm việc, sofa văng, sofa bọc da | 2+ |
| `ke` | Kệ sách & Tivi | Kệ sách 5 tầng, kệ tivi phòng khách | 2+ |
| `tu` | Tủ quần áo | Tủ áo 4 cánh, tủ giày, tủ trang trí | 1+ |
| `trang-tri` | Trang trí & Đèn | Đèn sàn, đệm, tranh treo tường, thảm | 1+ |
| `phong-ngu` | Phòng ngủ | Giường ngủ, bàn trang điểm (Danh mục trống) | 0 (TC-02) |

---

## 3. Quy tắc kiểm thử nghiệp vụ (Test Cases Matrix)

| Mã AC | Kịch bản | Danh mục chọn | Kết quả mong đợi |
|---|---|---|---|
| **TC-01** | Lọc danh mục có sản phẩm (Luồng thành công) | `"ghe"` (Ghế & Sofa) | Trả về danh sách chứa các sản phẩm có `category='ghe'`. |
| **TC-02** | Lọc danh mục chưa có sản phẩm (Danh mục rỗng) | `"phong-ngu"` (Phòng ngủ) | Trả về HTTP 200 OK với `items: []`, `total_items: 0`. Frontend hiển thị màn hình "Chưa có sản phẩm nào trong danh mục này". |
| - | Lấy danh sách thống kê danh mục (Summary API) | `/api/v1/products/categories` | Trả về danh sách tất cả danh mục kèm số lượng sản phẩm (`count`) khả dụng. |

---

## 4. API Specification

### Endpoint 1: `GET /api/v1/products?category={category_code}`
- **Auth:** Public
- **Response Success (200 OK):**
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "Bộ Sofa Gỗ Óc Chó Cao Cấp",
        "category": "ghe",
        "price": 25000000.00
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total_items": 2,
      "total_pages": 1
    }
  },
  "message": "Lấy danh sách sản phẩm thành công"
}
```

### Endpoint 2: `GET /api/v1/products/categories`
- **Auth:** Public
- **Response Success (200 OK):**
```json
{
  "status": "success",
  "data": {
    "categories": [
      { "id": "ban", "name": "Bàn", "count": 2 },
      { "id": "ghe", "name": "Ghế & Sofa", "count": 2 },
      { "id": "ke", "name": "Kệ sách & Tivi", "count": 2 },
      { "id": "tu", "name": "Tủ quần áo", "count": 1 },
      { "id": "trang-tri", "name": "Trang trí & Đèn", "count": 1 },
      { "id": "phong-ngu", "name": "Phòng ngủ", "count": 0 }
    ]
  },
  "message": "Lấy danh sách danh mục sản phẩm thành công"
}
```
