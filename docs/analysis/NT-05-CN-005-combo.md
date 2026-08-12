# Phân tích nghiệp vụ: NT-05-CN-005 — Đặt hàng combo hoặc bộ sản phẩm

**Story:** NT-05-CN-005  
**Epic:** NT-05 — Thanh toán  
**Ngày phân tích:** 2026-08-12

---

## 1. Mô tả nghiệp vụ

> Là Khách hàng, tôi muốn đặt mua theo combo bộ sản phẩm nội thất, để được giá ưu đãi khi mua trọn bộ thay vì mua lẻ.

**Điều kiện bắt đầu:** Combo đã được Admin thiết lập và còn đủ hàng cho **tất cả** sản phẩm thành phần.  
**Kết quả:** Giỏ hàng chứa đúng các sản phẩm trong combo với giá combo áp dụng.

---

## 2. Mô hình dữ liệu

### Bảng `combos`
| Cột | Kiểu | Mô tả |
|---|---|---|
| id | INT PK | |
| name | VARCHAR(200) | Tên combo (vd: "Bộ phòng khách cao cấp") |
| description | TEXT | Mô tả combo |
| discount_percent | FLOAT | % giảm giá khi mua trọn bộ (0-100) |
| is_active | BOOLEAN | Admin bật/tắt combo |
| created_at | DATETIME | |

### Bảng `combo_items`
| Cột | Kiểu | Mô tả |
|---|---|---|
| id | INT PK | |
| combo_id | INT FK→combos | |
| product_id | INT FK→products | |
| quantity | INT | Số lượng sản phẩm này trong combo |

---

## 3. Quy tắc tính giá combo

```
combo_price_per_item = original_price × (1 - discount_percent / 100)

Ví dụ: Combo "Bộ phòng khách" giảm 15%
  - Sofa gỗ óc chó: 28,500,000 → 24,225,000
  - Kệ TV: 6,800,000 → 5,780,000
  - Tổng combo: 30,005,000 (tiết kiệm 5,295,000)
```

---

## 4. Luồng thêm combo vào giỏ hàng

```
Frontend: User bấm "Thêm trọn bộ vào giỏ" trên ProductDetailPage
  │
  ▼
POST /api/v1/combos/:id/add-to-cart  (JWT Customer)
  │
  ├── [ComboService.add_combo_to_cart(combo_id, user_id)]
  │   ├── Kiểm tra combo tồn tại → 404 COMBO_NOT_FOUND
  │   ├── Kiểm tra combo active → 400 COMBO_INACTIVE
  │   ├── Với mỗi combo_item:
  │   │   ├── Load product (is_active=True) → 404 PRODUCT_NOT_AVAILABLE
  │   │   └── Kiểm tra tồn kho ≥ quantity → 400 COMBO_OUT_OF_STOCK
  │   └── Thêm từng sản phẩm vào cart_items (UPSERT: nếu đã có thì cộng quantity)
  │
  ▼
200 OK → { added_items: [...], combo_discount_percent, total_combo_price }
```

---

## 5. Hiển thị combo trên UI

- API `GET /api/v1/combos/by-product/:product_id` trả về danh sách combo chứa sản phẩm này.
- `ProductDetailPage` gọi API này khi mount → nếu có combo → hiển thị `<ComboSection>`.
- `ComboSection` hiển thị:
  - Tên combo, % giảm giá
  - Danh sách sản phẩm thành phần (ảnh, tên, giá gốc, giá combo)
  - Tổng giá combo vs tổng giá lẻ → tiết kiệm bao nhiêu
  - Nút "🛒 Thêm trọn bộ vào giỏ"

---

## 6. Seed data mẫu

| Combo | Sản phẩm thành phần | Giảm giá |
|---|---|---|
| Bộ phòng khách cao cấp | Sofa Gỗ Óc Chó (1), Kệ Tivi (1) | 15% |
| Bộ phòng làm việc | Bàn Làm Việc (1), Kệ Sách (1) | 10% |

---

## 7. Ma trận Test Cases

| Mã AC | Kịch bản | Input | Kết quả |
|---|---|---|---|
| **TC-01** | Combo đủ hàng | combo_id hợp lệ | 200 OK. Cart có đúng sản phẩm. Giá = price × (1 - %) |
| **TC-02** | Sản phẩm thành phần hết hàng | stock=0 | 400 COMBO_OUT_OF_STOCK |
| **TC-03** | Combo không tồn tại | combo_id=9999 | 404 COMBO_NOT_FOUND |
| **TC-04** | Combo inactive | is_active=False | 400 COMBO_INACTIVE |
| **TC-05** | Unauthenticated | Không có token | 401 |
| **TC-06** | GET by-product | product trong combo | Trả đúng combo chứa product |
| **TC-07** | Thêm combo 2 lần | Add twice | Cộng dồn quantity, không duplicate |
