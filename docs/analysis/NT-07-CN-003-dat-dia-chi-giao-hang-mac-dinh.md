# Phân tích nghiệp vụ: NT-07-CN-003 — Đặt địa chỉ giao hàng mặc định

**Story:** NT-07-CN-003  
**Epic:** NT-07 — Quản lý địa chỉ giao hàng  
**Ngày phân tích:** 2026-08-13

---

## 1. Mô tả nghiệp vụ

> Là Khách hàng, tôi muốn đặt một địa chỉ làm mặc định, để hệ thống tự chọn địa chỉ đó khi thanh toán.

**Điều kiện bắt đầu:** Có ít nhất một địa chỉ đã lưu thuộc sở hữu của tài khoản.  
**Kết quả:** Địa chỉ được đánh dấu cờ `is_default = True`, các địa chỉ khác chuyển thành `is_default = False` và tự động áp dụng khi thanh toán.

---

## 2. Quy tắc dữ liệu & Phân quyền

### 2.1 API Endpoint `PATCH /api/v1/addresses/:id/default`
- Kiểm tra quyền sở hữu (`address.user_id == current_user_id`). Nếu không thuộc sở hữu ➔ Trả **403 FORBIDDEN_ACCESS**.
- Đặt `is_default = False` cho tất cả địa chỉ cũ của người dùng.
- Đặt `is_default = True` cho địa chỉ `address_id` được chỉ định.
- Trả về đối tượng `Address` cập nhật.

### 2.2 Tối ưu UI Bộ chọn Địa chỉ tại Checkout (`CheckoutPage.jsx`)
- Sử dụng **Dropdown Menu (`<select>`)** nhỏ gọn, tinh tế thay cho dạng thẻ lưới để tránh tốn diện tích khi người dùng có nhiều địa chỉ (tối đa 10 địa chỉ).
- Danh sách option trong Dropdown hiển thị thông tin tóm tắt: Họ tên, SĐT, Địa chỉ chi tiết và nhãn `(Mặc định)`.
- Khi thay đổi option trong Dropdown ➔ Tự động cập nhật thông tin nhận hàng và tự động tính lại Phí vận chuyển (QTN-07).

---

## 3. Ma trận Test Cases

| Mã AC | Kịch bản | Dữ liệu đầu vào | Kết quả mong đợi |
|---|---|---|---|
| **TC-01** | Đặt mặc định thành công | Gửi request `PATCH /api/v1/addresses/:id/default` với `address_id` hợp lệ | Trả về 200 OK. Địa chỉ nhận cờ `is_default = True`, địa chỉ cũ mất cờ mặc định. |
| **TC-01b** | Chặn người dùng khác | Gửi request `PATCH` với `address_id` của user khác | Trả **403 FORBIDDEN_ACCESS**. |
| **TC-01c** | Địa chỉ không tồn tại | Gửi request `PATCH` với `address_id` không có trong DB | Trả **404 NOT_FOUND**. |
