# Phân tích nghiệp vụ: NT-09-CN-003 — Cảnh báo tồn kho thấp (QTN-08)

**Story:** NT-09-CN-003  
**Epic:** NT-09 — Quản lý Kho & Tồn Kho (Admin)  
**Quy tắc liên quan:** QTN-08  
**Ngày phân tích:** 2026-08-13

---

## 1. Mô tả nghiệp vụ

> Là Quản trị viên, tôi muốn nhận cảnh báo khi tồn kho một sản phẩm xuống dưới ngưỡng tối thiểu, để kịp thời nhập thêm hàng.

**Điều kiện bắt đầu:** Sản phẩm có khai báo ngưỡng tồn kho tối thiểu (`min_stock_threshold`, mặc định = 10). Tồn kho sản phẩm bị giảm sau khi bán hàng hoặc điều chỉnh kho.  
**Kết quả:** Cảnh báo tồn kho thấp hiển thị danh sách các sản phẩm đang có `stock < min_stock_threshold` trên Bảng điều khiển Admin và trang Quản lý Kho.

---

## 2. Quy tắc nghiệp vụ QTN-08

### 2.1 Khai báo Ngưỡng Tồn Kho Tối Thủy (`min_stock_threshold`)
- Mỗi sản phẩm có trường `min_stock_threshold` (Số nguyên `>= 0`, mặc định 10).
- Quản trị viên có thể điều chỉnh ngưỡng này khi thêm mới hoặc chỉnh sửa sản phẩm.

### 2.2 Quy tắc Phát Cảnh Báo Tồn Kho Thấp
- **Công thức so sánh**:
  $$\text{Tồn kho hiện tại } (\text{stock}) < \text{Ngưỡng tối thiểu } (\text{min\_stock\_threshold})$$
- **TC-01 (Dưới ngưỡng - Phát cảnh báo)**:
  - Nếu `stock < min_stock_threshold` (Ví dụ: `min_stock_threshold` = 10, `stock` = 5):
    - Hệ thống đưa sản phẩm vào danh sách cảnh báo tồn kho thấp.
    - Hiển thị Widget Cảnh báo trên Bảng điều khiển Admin (`AdminDashboardPage`) kèm nút **"📦 Nhập kho ngay"**.
    - Hiển thị Banner cảnh báo và Badge màu đỏ **"⚠️ Dưới ngưỡng (5/10)"** trên trang Quản lý Kho (`AdminInventoryPage`).
- **TC-02 (Trên ngưỡng - Không cảnh báo)**:
  - Nếu `stock >= min_stock_threshold` (Ví dụ: `min_stock_threshold` = 10, `stock` = 20):
    - Không hiển thị cảnh báo đối với sản phẩm đó.
- **Tự động cập nhật**:
  - Khi lập phiếu nhập kho làm `stock >= min_stock_threshold`, cảnh báo sẽ tự động biến mất realtime.

---

## 3. Ma trận Test Cases

| Mã AC | Kịch bản | Given | When | Then |
|---|---|---|---|---|
| **TC-01** | Tồn kho giảm xuống dưới ngưỡng | SP có `min_stock_threshold` = 10, `stock` = 5 | Khách hàng mua hoặc điều chỉnh kho làm stock = 5 | Cảnh báo hiển thị trên Bảng điều khiển Admin và API Low Stock Warnings. |
| **TC-02** | Tồn kho trên ngưỡng | SP có `min_stock_threshold` = 10, `stock` = 20 | Truy vấn danh sách cảnh báo | Không có cảnh báo cho sản phẩm này. |
| **TC-03** | Tự động hết cảnh báo khi nhập kho | SP đang cảnh báo (`stock` = 5 < 10) | Admin lập phiếu nhập kho thêm 15 sản phẩm (`stock` ➔ 20) | Cảnh báo tự động biến mất. |
| **TC-04** | Người dùng thường gọi API | User thường không phải Admin | Gọi `GET /api/v1/admin/inventory/low-stock-warnings` | Trả về **403 FORBIDDEN**. |
