# Phân tích nghiệp vụ: NT-05-CN-004 — Tính phí vận chuyển theo kích thước và trọng lượng

**Story:** NT-05-CN-004  
**Epic:** NT-05 — Thanh toán  
**Quy tắc nghiệp vụ:** QTN-07  
**Ngày phân tích:** 2026-08-12

---

## 1. Mô tả nghiệp vụ

> Là Khách hàng, tôi muốn hệ thống tự tính phí vận chuyển dựa trên kích thước và trọng lượng sản phẩm nội thất, để biết chính xác tổng chi phí trước khi đặt hàng.

**Điều kiện bắt đầu:** Sản phẩm trong giỏ hàng có khai báo kích thước (`dimensions`) và trọng lượng (`weight_kg`).  
**Kết quả sau hoàn thành:** Phí vận chuyển hiển thị chính xác trong trang Checkout trước khi khách xác nhận đặt hàng.

---

## 2. Quy tắc nghiệp vụ QTN-07

### 2.1 Công thức tính trọng lượng quy đổi (Dimensional Weight)
Chuẩn GHN/GHTK — áp dụng cho sản phẩm nội thất cồng kềnh:

```
dimensional_weight = (Dài × Rộng × Cao) / 5000   [cm, đơn vị kg]

charged_weight = max(actual_weight_kg, dimensional_weight)
```

**Ví dụ:** Bộ Sofa Gỗ Óc Chó (120×80×75 cm, 25kg):
- dimensional_weight = (120 × 80 × 75) / 5000 = 144 kg
- charged_weight = max(25, 144) = **144 kg** → Phí tỉnh: 350,000đ

### 2.2 Bảng phí vận chuyển (Rate Card QTN-07)

| Mức | Trọng lượng quy đổi | Phí nội thành (HCM/HN) | Phí tỉnh/thành khác |
|---|---|---|---|
| A | ≤ 5 kg | 35,000 đ | 65,000 đ |
| B | 5 – 15 kg | 55,000 đ | 95,000 đ |
| C | 15 – 30 kg | 85,000 đ | 145,000 đ |
| D | 30 – 50 kg | 120,000 đ | 200,000 đ |
| E | > 50 kg (cồng kềnh) | 200,000 đ | 350,000 đ |
| **DEFAULT** | Thiếu data (QTN-07 TC-02) | **120,000 đ** | **120,000 đ** |

### 2.3 Phân loại vùng giao hàng

| Vùng | Từ khóa nhận diện trong địa chỉ | Ghi chú |
|---|---|---|
| `inner_city` (Nội thành) | `tp.hcm`, `tp hcm`, `hcm`, `hồ chí minh`, `hà nội`, `ha noi` | Case-insensitive |
| `province` (Tỉnh/thành khác) | Tất cả địa chỉ còn lại | Mặc định |

---

## 3. Thiết kế dữ liệu

### 3.1 Thay đổi bảng `products`
```sql
ALTER TABLE products ADD COLUMN weight_kg FLOAT NULL COMMENT 'Trọng lượng thực tế (kg) - QTN-07';
```

### 3.2 Thay đổi bảng `orders`
```sql
ALTER TABLE orders ADD COLUMN shipping_fee DOUBLE NOT NULL DEFAULT 0.0 COMMENT 'Phí vận chuyển (QTN-07)';
```

### 3.3 Sample data trọng lượng (ước tính thực tế)

| Sản phẩm | weight_kg | dimensions (cm) |
|---|---|---|
| Bộ Sofa Gỗ Óc Chó | 25.0 | 220×90×85 |
| Ghế Sofa Văng | 18.0 | 180×80×75 |
| Bàn Ăn Gỗ Sồi 6 Ghế | 35.0 | 200×90×78 |
| Bàn Làm Việc | 12.0 | 140×60×75 |
| Kệ Sách Kim Loại | 8.0 | 80×30×180 |
| Kệ Tivi Gỗ | 15.0 | 160×40×55 |
| Tủ Quần Áo 4 Cánh | 45.0 | 200×60×220 |
| Đèn Sàn Trang Trí | 2.5 | 30×30×150 |

---

## 4. Luồng xử lý

```
Frontend (CheckoutPage)
  │
  ├── User nhập địa chỉ giao hàng (debounce 800ms)
  │
  ▼
POST /api/v1/shipping/calculate  (JWT Customer)
  Body: { shipping_address: "..." }
  │
  ├── [ShippingService]
  │   ├── Lấy CartItems của user → ProductList
  │   ├── Với mỗi sản phẩm:
  │   │   ├── Nếu có weight_kg VÀ dimensions → tính dimensional_weight → charged_weight
  │   │   └── Nếu thiếu → set missing_data_warning = True, dùng DEFAULT
  │   ├── Tổng charged_weight = sum(charged_weight × quantity)
  │   ├── Phân loại zone từ shipping_address
  │   └── Tra bảng Rate Card → shipping_fee
  │
  ▼
200 OK → { fee, zone, total_weight, breakdown: [...], missing_data_warning }
  │
  ▼
Frontend hiển thị:
  ├── "Phí vận chuyển: 85,000đ"
  ├── "Khu vực: Nội thành TP.HCM"
  └── [!] Cảnh báo nếu missing_data_warning = true
```

---

## 5. Ma trận Test Cases

| Mã AC | Kịch bản | Input | Kết quả mong đợi |
|---|---|---|---|
| **TC-01** | Sản phẩm có đủ data | weight_kg=30, dims đủ, địa chỉ HCM | 200 OK. fee=85,000. zone=inner_city. missing_data_warning=false |
| **TC-02** | Sản phẩm thiếu weight_kg | weight_kg=None | 200 OK. fee=120,000 (default). missing_data_warning=true |
| **TC-03** | Zone nội thành HCM | "123 Nguyễn Huệ, TP.HCM" | zone=inner_city |
| **TC-04** | Zone tỉnh khác | "15 Lê Duẩn, Đà Nẵng" | zone=province |
| **TC-05** | Dimensional > actual | weight=5kg, dims lớn | charged_weight = dimensional_weight |
| **TC-06** | Giỏ rỗng | Cart empty | 400 CART_EMPTY |
