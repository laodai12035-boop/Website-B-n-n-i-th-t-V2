# Phân tích nghiệp vụ: NT-12-CN-001 — Xem danh sách khách hàng

**Story:** NT-12-CN-001  
**Epic:** NT-12 — Quản lý Khách Hàng (Admin)  
**Ngày phân tích:** 2026-08-14

---

## 1. Mô tả nghiệp vụ

> Là Quản trị viên, tôi muốn xem danh sách khách hàng đã đăng ký, để nắm được thông tin và lịch sử mua hàng của từng khách.

**Điều kiện bắt đầu:** Quản trị viên đã đăng nhập trang quản trị.  
**Kết quả:** Danh sách khách hàng hiển thị đầy đủ và chính xác kèm các thông tin thống kê đơn hàng.

---

## 2. Dữ liệu cần hiển thị cho mỗi Khách hàng

1. **Thông tin tài khoản**: `id`, `full_name`, `email`, `phone`, `role`, `is_active`, `created_at` (ngày đăng ký).
2. **Tổng số đơn hàng (`total_orders`)**: Tổng số đơn hàng mà khách hàng này đã đặt (từ bảng `orders`).
3. **Tổng giá trị chi tiêu (`total_spent`)**: Tổng tiền tích lũy của các đơn hàng thành công/khác hủy (đơn không ở trạng thái `cancelled`).
4. **Lần mua hàng gần nhất (`last_order_at`)**: Thời gian đặt đơn mới nhất của khách hàng (hoặc `None` nếu chưa mua hàng).

---

## 3. Ma trận Test Cases

| Mã AC | Kịch bản | Given | When | Then |
|---|---|---|---|---|
| **TC-01** | Admin xem danh sách khách hàng thành công | Admin đã đăng nhập | Vào trang danh sách khách hàng | Danh sách khách hàng hiển thị đầy đủ, chính xác kèm tổng số đơn hàng đã đặt. |
| **TC-02** | Tìm kiếm & lọc khách hàng | Có dữ liệu khách hàng | Nhập từ khóa tìm kiếm (tên, email, sĐT) hoặc lọc trạng thái | Trả về danh sách khách hàng thỏa mãn bộ lọc. |
| **TC-03** | Phân trang danh sách khách hàng | Danh sách có nhiều khách | Chuyển trang hoặc thay đổi `limit` | Dữ liệu trả về phân trang đúng theo `page` và `limit`. |
| **TC-04** | User thường gọi API Admin Customers | Người dùng role = `user` | Gọi API Admin Customers | Trả về **403 FORBIDDEN**. |
