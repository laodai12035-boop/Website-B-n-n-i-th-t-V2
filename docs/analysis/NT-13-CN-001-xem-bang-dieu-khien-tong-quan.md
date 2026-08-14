# Phân tích nghiệp vụ: NT-13-CN-001 — Xem bảng điều khiển tổng quan (Dashboard Analytics)

**Story:** NT-13-CN-001  
**Epic:** NT-13 — Báo Cáo & Thống Kê (Dashboard)  
**Ngày phân tích:** 2026-08-14

---

## 1. Mô tả nghiệp vụ

> Là Quản trị viên, tôi muốn xem bảng điều khiển tổng quan gồm doanh thu, số đơn hàng và sản phẩm bán chạy, để nắm nhanh tình hình kinh doanh.

**Điều kiện bắt đầu:** Quản trị viên đã đăng nhập trang quản trị.  
**Kết quả:** Bảng điều khiển hiển thị số liệu tổng quan chính xác theo khoảng thời gian chọn.

---

## 2. Quy tắc Thống kê & Tổng hợp Dữ liệu

### 2.1 Bộ lọc thời gian (`time_range`)
- `today`: Từ 00:00:00 hôm nay đến thời điểm hiện tại.
- `this_week`: Từ đầu tuần (Thứ Hai 00:00:00) đến thời điểm hiện tại.
- `this_month` *(Mặc định)*: Từ ngày đầu tháng 00:00:00 đến thời điểm hiện tại.
- `this_year`: Từ 01/01 năm nay 00:00:00 đến thời điểm hiện tại.
- `all`: Không giới hạn thời gian.
- `custom`: Nhập ngày bắt đầu `start_date` (YYYY-MM-DD) và ngày kết thúc `end_date` (YYYY-MM-DD).

### 2.2 Các chỉ số tổng quan
1. **Doanh thu thực tế (`total_revenue`)**: Tổng giá trị tiền (`Order.total_amount`) của các đơn hàng có trạng thái **không bị hủy** (`status != 'cancelled'`) trong khoảng thời gian chọn.
2. **Số lượng đơn hàng (`total_orders`)**: Tổng số đơn hàng mới phát sinh trong khoảng thời gian chọn.
3. **Top 5 Sản phẩm bán chạy nhất (`top_selling_products`)**: Danh sách 5 sản phẩm có tổng số lượng bán tích lũy (`sold_count`) từ các đơn không bị hủy cao nhất trong khoảng thời gian chọn. Kèm doanh thu tích lũy của từng sản phẩm.
4. **Xử lý dữ liệu rỗng (TC-02)**: Khi khoảng thời gian chọn chưa có đơn hàng, hệ thống trả về `total_revenue = 0.0` (0đ), `total_orders = 0`, `top_selling_products = []` mà **không sinh lỗi crash / 500**.

---

## 3. Ma trận Test Cases

| Mã AC | Kịch bản | Given | When | Then |
|---|---|---|---|---|
| **TC-01** | Xem bảng điều khiển khi có dữ liệu | Có dữ liệu đơn hàng phát sinh trong DB | Admin xem bảng điều khiển (hoặc chọn Tháng này) | Doanh thu, số đơn, và danh sách sản phẩm bán chạy nhất hiển thị chính xác. |
| **TC-02** | Xem bảng điều khiển khi dữ liệu rỗng | Chưa có đơn hàng trong khoảng thời gian chọn | Admin chọn khoảng thời gian | Hiển thị số liệu bằng 0, top products rỗng, không lỗi. |
| **TC-03** | Bộ lọc thời gian linh hoạt | Có đơn hàng trong các mốc thời gian khác nhau | Admin chọn "Hôm nay", "Tuần này", "Năm nay" | Dữ liệu tổng hợp thay đổi tương ứng mốc thời gian. |
| **TC-04** | User thường gọi API Dashboard Admin | Người dùng role = `user` | Gọi API GET `/api/v1/admin/dashboard` | Trả về **403 FORBIDDEN**. |
