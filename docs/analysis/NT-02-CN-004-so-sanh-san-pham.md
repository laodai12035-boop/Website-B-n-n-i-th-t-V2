# Phân tích nghiệp vụ: NT-02-CN-004 — So sánh sản phẩm

**Story:** NT-02-CN-004  
**Epic:** NT-02 — Quản lý sản phẩm & danh mục  
**Ngày phân tích:** 2026-08-11  
**Người thực hiện:** BA / Backend Dev

---

## 1. Mô tả nghiệp vụ

> Là Khách hàng, tôi muốn chọn hai hoặc ba sản phẩm để so sánh thông số, để dễ dàng chọn được sản phẩm phù hợp nhất.

**Điều kiện bắt đầu:** Đã chọn ít nhất 2 sản phẩm vào danh sách so sánh (tối đa 3 sản phẩm).  
**Kết quả sau hoàn thành:** Màn hình bảng so sánh song song hiển thị đầy đủ thông số kỹ thuật (Tên, Hình ảnh, Giá gốc, Giá khuyến mãi, Danh mục, Chất liệu, Kích thước, Đánh giá, Trạng thái tồn kho).

---

## 2. Quy tắc kiểm soát số lượng so sánh (Comparison Limits)

| Số lượng chọn | Trạng thái xử lý Backend / Frontend | Hành động người dùng |
|---|---|---|
| `< 2` sản phẩm | ❌ Chưa đủ điều kiện so sánh | Nút "So sánh ngay" bị mờ / API trả về 400 `INVALID_COMPARE_COUNT` ("Vui lòng chọn ít nhất 2 sản phẩm") |
| `2 - 3` sản phẩm | ✅ Cho phép so sánh | Cho phép bấm "So sánh ngay", API trả về 200 OK + Matrix so sánh 2 hoặc 3 sản phẩm |
| `> 3` sản phẩm | 🛑 Vượt quá giới hạn so sánh (TC-02) | Ngăn không cho thêm sản phẩm thứ 4 + Hiển thị Toast/Alert: "Đã đạt giới hạn so sánh tối đa (3 sản phẩm)" / API trả 400 `COMPARE_LIMIT_EXCEEDED` |

---

## 3. Các kịch bản kiểm thử nghiệp vụ (Test Cases Matrix)

| Mã AC | Kịch bản | Dữ liệu đầu vào | Kết quả mong đợi |
|---|---|---|---|
| **TC-01** | So sánh 2 sản phẩm (Happy Path) | Chọn 2 sản phẩm (vd: ID 1 và ID 2) -> Bấm "So sánh" | Trả về bảng đối chiếu 2 sản phẩm đầy đủ các trường thông số kỹ thuật |
| **TC-02** | Giới hạn số lượng 3 sản phẩm (Sad Path) | Đã chọn 3 sản phẩm (ID 1, 2, 3) -> Chọn thêm sản phẩm thứ 4 (ID 4) | Hệ thống từ chối thêm, hiển thị thông báo "Đã đạt giới hạn so sánh tối đa (3 sản phẩm)" |
| - | Chọn dưới 2 sản phẩm | Chọn 1 sản phẩm -> Bấm "So sánh" | Báo lỗi yêu cầu chọn ít nhất 2 sản phẩm |

---

## 4. API Specification

### Endpoint: `POST /api/v1/products/compare`
- **Auth:** Public
- **Request Body (JSON):**
```json
{
  "product_ids": [1, 2, 3]
}
```

- **Response Success (200 OK - TC-01):**
```json
{
  "status": "success",
  "data": {
    "products": [
      {
        "id": 1,
        "name": "Bộ Sofa Gỗ Óc Chó Cao Cấp",
        "price": 28500000.0,
        "discount_price": 25000000.0,
        "category": "ghe",
        "material": "Gỗ óc chó tự nhiên, da Ý",
        "dimensions": "2.8m x 1.8m x 0.8m",
        "rating": 5.0,
        "stock": 5
      },
      {
        "id": 2,
        "name": "Ghế Sofa Văng Da Hiện Đại",
        "price": 15800000.0,
        "discount_price": null,
        "category": "ghe",
        "material": "Da bò thật, khung gỗ sồi",
        "dimensions": "2.2m x 0.9m x 0.8m",
        "rating": 4.8,
        "stock": 8
      }
    ]
  },
  "message": "Lấy thông tin so sánh sản phẩm thành công"
}
```

- **Response Error (400 Bad Request - TC-02):**
```json
{
  "status": "error",
  "message": "Đã đạt giới hạn so sánh tối đa (chỉ được so sánh tối đa 3 sản phẩm)",
  "code": "COMPARE_LIMIT_EXCEEDED"
}
```
