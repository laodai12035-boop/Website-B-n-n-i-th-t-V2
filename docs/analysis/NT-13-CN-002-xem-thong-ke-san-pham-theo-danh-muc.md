# Phân tích nghiệp vụ: NT-13-CN-002 — Xem thống kê sản phẩm theo danh mục (Category Analytics)

**Story:** NT-13-CN-002  
**Epic:** NT-13 — Báo Cáo & Thống Kê (Dashboard)  
**Ngày phân tích:** 2026-08-14

---

## 1. Mô tả nghiệp vụ

> Là Quản trị viên, tôi muốn xem thống kê số lượng bán và doanh thu theo từng danh mục sản phẩm, để đánh giá nhóm sản phẩm nào đang kinh doanh tốt.

**Điều kiện bắt đầu:** Có đơn hàng đã hoàn tất gắn với sản phẩm thuộc danh mục.  
**Kết quả:** Thống kê theo danh mục hiển thị đúng số liệu (doanh thu, số bán, tỉ lệ đóng góp).

---

## 2. Quy tắc Thống kê theo Danh mục

### 2.1 Bộ lọc thời gian (`time_range`)
- `today`: Từ 00:00:00 hôm nay.
- `this_week`: Từ Thứ Hai tuần này.
- `this_month` *(Mặc định)*: Từ ngày 1 đầu tháng này.
- `this_year`: Từ 01/01 năm nay.
- `all`: Toàn thời gian.
- `custom`: Theo `start_date` và `end_date`.

### 2.2 Các chỉ số tổng hợp
1. **Tổng số lượng bán ra (`total_sold`)**: Tổng số lượng các sản phẩm thuộc danh mục đó đã bán trong các đơn không bị hủy (`status != 'cancelled'`).
2. **Tổng doanh thu danh mục (`total_revenue`)**: Tổng số tiền thu được từ sản phẩm thuộc danh mục đó trong các đơn không bị hủy.
3. **Tỉ lệ đóng góp doanh thu (`revenue_percentage`)**: `(total_revenue_category / total_revenue_all_categories) * 100`.
4. **Xử lý danh mục chưa bán được đơn nào (TC-02)**: Trả về `total_sold = 0`, `total_revenue = 0.0`, `revenue_percentage = 0.0` mà **không sinh lỗi crash**.

---

## 3. Ma trận Test Cases

| Mã AC | Kịch bản | Given | When | Then |
|---|---|---|---|---|
| **TC-01** | Xem thống kê sản phẩm theo danh mục | Có đơn hàng hoàn tất gắn với sản phẩm thuộc danh mục | Admin chọn khoảng thời gian xem thống kê | Số lượng bán và doanh thu theo danh mục hiển thị đúng chính xác (TC-01). |
| **TC-02** | Xem thống kê khi danh mục chưa phát sinh đơn | Chưa có đơn hàng cho danh mục chọn | Admin xem báo cáo danh mục | Hiển thị `total_sold = 0`, `total_revenue = 0.0`, không sinh lỗi. |
| **TC-03** | Thống kê theo các khoảng thời gian | Đơn hàng phát sinh ở nhiều khoảng thời gian | Admin lọc theo "Hôm nay", "Tuần này", "Tháng này" | Số liệu từng mốc thời gian cập nhật đúng theo DB. |
| **TC-04** | Chặn truy cập người dùng thường | Account role = `user` | Gọi API GET `/api/v1/admin/analytics/categories` | Trả về **403 FORBIDDEN**. |
