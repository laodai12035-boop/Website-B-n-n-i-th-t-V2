# Phân tích nghiệp vụ: NT-02-CN-001 — Tìm kiếm sản phẩm theo từ khóa

**Story:** NT-02-CN-001  
**Epic:** NT-02 — Quản lý sản phẩm & danh mục  
**Ngày phân tích:** 2026-08-11  
**Người thực hiện:** BA / Backend Dev

---

## 1. Mô tả nghiệp vụ

> Là Khách hàng, tôi muốn tìm kiếm sản phẩm theo tên hoặc từ khóa, để nhanh chóng tìm được món đồ nội thất mình cần.

**Điều kiện bắt đầu:** Hệ thống có cơ sở dữ liệu các sản phẩm nội thất (`is_active=True`).  
**Kết quả sau hoàn thành:** Màn hình danh sách hiển thị các sản phẩm khớp với từ khóa tìm kiếm (theo Tên sản phẩm hoặc Mô tả sản phẩm). Nếu không có sản phẩm phù hợp, hiển thị giao diện thông báo rỗng (Empty State).

---

## 2. Phạm vi & Quy tắc tìm kiếm (Search Specifications)

| Tiêu chí | Mô tả chi tiết |
|---|---|
| **Trường thông tin tìm kiếm** | `name` (Tên sản phẩm) OR `description` (Mô tả sản phẩm) |
| **Phân biệt hoa/thường** | Không phân biệt (`Case-insensitive search`). Tìm "SOFA", "Sofa", "sofa" đều khớp |
| **Lọc ẩn/hiện** | Chỉ tìm trong các sản phẩm đang hiển thị (`is_active == True`) |
| **Tìm kiếm rỗng** | Nếu không nhập từ khóa (`search=""` hoặc không truyền), trả về toàn bộ sản phẩm active |
| **Phân trang** | Trả về metadata phân trang: `page`, `limit`, `total_items`, `total_pages` |
| **Sắp xếp mặc định** | Mới nhất trước (`created_at DESC`) |

---

## 3. Các Kịch bản Kiểm thử Nghiệp vụ (Test Cases Matrix)

| Mã AC | Kịch bản | Từ khóa nhập (Query) | Kết quả mong đợi |
|---|---|---|---|
| **TC-01** | Tìm thấy sản phẩm khớp từ khóa (Happy Path) | `"sofa"` | Trả về danh sách chứa các sản phẩm có chữ "sofa" trong Tên hoặc Mô tả |
| **TC-02** | Tìm kiếm không có sản phẩm khớp (Empty State) | `"xyz_khong_ton_tai"` | Trả về HTTP 200 OK với danh sách rỗng `items: []`, `total: 0`. Frontend hiển thị màn hình thông báo rỗng |
| - | Tìm kiếm không phân biệt hoa thường | `"GHẾ"` / `"ghế"` | Kết quả danh sách giống nhau |
| - | Tìm kiếm từ khóa rỗng/khoảng trắng | `" "` | Trả về danh sách tất cả sản phẩm đang active |

---

## 4. API Specification

### Endpoint: `GET /api/v1/products`
- **Auth:** Public (Không yêu cầu đăng nhập)
- **Query Parameters:**
  - `search` (string, optional): Từ khóa tìm kiếm
  - `category` (string, optional): Lọc theo danh mục (`ban`, `ghe`, `ke`, `tu`, `trang-tri`)
  - `page` (int, default=1): Trang hiện tại
  - `limit` (int, default=12): Số lượng sản phẩm mỗi trang

- **Response Success (200 OK):**
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "Bộ Sofa Gỗ Óc Chó Cao Cấp",
        "slug": "bo-sofa-go-oc-cho-cao-cap",
        "description": "Sofa gỗ óc chó tự nhiên kết hợp đệm bọc da Ý nhập khẩu sang trọng.",
        "price": "28500000.00",
        "discount_price": "25000000.00",
        "category": "ghe",
        "stock": 5,
        "image_url": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
        "is_active": true,
        "created_at": "2026-08-11T12:00:00"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total_items": 1,
      "total_pages": 1
    }
  },
  "message": "Lấy danh sách sản phẩm thành công"
}
```
