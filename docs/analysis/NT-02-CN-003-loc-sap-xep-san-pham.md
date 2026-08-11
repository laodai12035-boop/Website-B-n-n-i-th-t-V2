# Phân tích nghiệp vụ: NT-02-CN-003 — Lọc và sắp xếp sản phẩm theo giá, đánh giá

**Story:** NT-02-CN-003  
**Epic:** NT-02 — Quản lý sản phẩm & danh mục  
**Ngày phân tích:** 2026-08-11  
**Người thực hiện:** BA / Backend Dev

---

## 1. Mô tả nghiệp vụ

> Là Khách hàng, tôi muốn lọc và sắp xếp sản phẩm theo khoảng giá hoặc đánh giá, để dễ so sánh và chọn sản phẩm phù hợp ngân sách.

**Điều kiện bắt đầu:** Danh sách sản phẩm đang hiển thị trên trang danh sách / tìm kiếm.  
**Kết quả sau hoàn thành:** Danh sách sản phẩm được cập nhật chính xác theo tiêu chí lọc khoảng giá (Giá tối thiểu, Giá tối đa) và thứ tự sắp xếp được lựa chọn (Giá tăng dần, Giá giảm dần, Đánh giá cao nhất, Mới nhất).

---

## 2. Tiêu chí Lọc và Sắp xếp (Sort & Filter Specifications)

### A. Lọc theo Khoảng giá (Price Filtering)
- **Công thức Giá hiệu lực (Effective Price):**  
  `COALESCE(discount_price, price)` (Nếu sản phẩm có `discount_price`, dùng giá khuyến mãi để so sánh khoảng giá; ngược lại dùng `price`).
- **Query Parameters:**
  - `min_price` (number, optional): Giá hiệu lực >= `min_price`
  - `max_price` (number, optional): Giá hiệu lực <= `max_price`
- **Các nấc Preset giá nhanh trên Frontend:**
  1. *Tất cả mức giá*
  2. *Dưới 5 triệu* (`max_price=5000000`)
  3. *5 triệu - 15 triệu* (`min_price=5000000&max_price=15000000`)
  4. *Trên 15 triệu* (`min_price=15000000`)

### B. Tiêu chí Sắp xếp (Sorting Options)

| Giá trị `sort` | Tiêu chí | Câu lệnh SQL ORDER BY |
|---|---|---|
| `newest` (Mặc định) | Sản phẩm mới nhất | `ORDER BY created_at DESC` |
| `price_asc` (TC-01) | Giá tăng dần | `ORDER BY COALESCE(discount_price, price) ASC` |
| `price_desc` | Giá giảm dần | `ORDER BY COALESCE(discount_price, price) DESC` |
| `rating_desc` | Đánh giá cao nhất | `ORDER BY rating DESC, rating_count DESC` |

---

## 3. Các Kịch bản Kiểm thử Nghiệp vụ (Test Cases Matrix)

| Mã AC | Kịch bản | Parameter truyền vào | Kết quả mong đợi |
|---|---|---|---|
| **TC-01** | Sắp xếp theo giá tăng dần (Happy Path) | `?sort=price_asc` | Sản phẩm đầu tiên có giá thấp nhất, sản phẩm cuối cùng có giá cao nhất. |
| **TC-02** | Lọc theo khoảng giá 1 - 5 triệu (Happy Path) | `?min_price=1000000&max_price=5000000` | Chỉ trả về các sản phẩm có giá hiệu lực trong khoảng 1.000.000đ đến 5.000.000đ. |
| - | Sắp xếp theo giá giảm dần | `?sort=price_desc` | Sản phẩm có giá cao nhất xếp đầu tiên. |
| - | Kết hợp Tìm kiếm + Lọc danh mục + Lọc giá + Sắp xếp | `?search=sofa&category=ghe&min_price=10000000&sort=price_asc` | Trả về danh sách lọc đồng thời theo 4 tiêu chí. |

---

## 4. API Specification Update

### Endpoint: `GET /api/v1/products`
- **Query Parameters:**
  - `search` (str)
  - `category` (str)
  - `min_price` (float, optional): Giá tối thiểu
  - `max_price` (float, optional): Giá tối đa
  - `sort` (str, optional): `newest` | `price_asc` | `price_desc` | `rating_desc`
  - `page` (int)
  - `limit` (int)
