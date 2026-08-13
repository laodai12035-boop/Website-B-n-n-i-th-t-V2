# Phân tích nghiệp vụ: NT-12-CN-002 — Khóa và mở khóa tài khoản khách hàng

**Story:** NT-12-CN-002  
**Epic:** NT-12 — Quản lý Khách Hàng (Admin)  
**Ngày phân tích:** 2026-08-14

---

## 1. Mô tả nghiệp vụ

> Là Quản trị viên, tôi muốn khóa hoặc mở khóa tài khoản khách hàng, để ngăn chặn hành vi gian lận hoặc vi phạm chính sách.

**Điều kiện bắt đầu:** Tài khoản khách hàng tồn tại trong hệ thống.  
**Kết quả:** Tài khoản chuyển đúng trạng thái khóa hoặc hoạt động và áp dụng quy tắc xác thực ngay lập tức.

---

## 2. Quy tắc Nghiệp vụ (Account Lock Enforcement)

1. **Khi tài khoản bị khóa (`is_active = False`)**:
   - Trường `is_active` của `User` trong CSDL chuyển thành `False`.
   - Nếu người dùng thử đăng nhập qua API `POST /api/v1/auth/login` ➔ Dịch vụ `AuthService.login()` kiểm tra `is_active == False` và trả về lỗi **403 FORBIDDEN** với mã lỗi `ACCOUNT_LOCKED` ("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ bộ phận hỗ trợ.").
2. **Khi tài khoản được mở khóa (`is_active = True`)**:
   - Trường `is_active` của `User` chuyển thành `True`.
   - Người dùng có thể đăng nhập bình thường (200 OK trả JWT Access Token).

---

## 3. Ma trận Test Cases

| Mã AC | Kịch bản | Given | When | Then |
|---|---|---|---|---|
| **TC-01** | Admin khóa tài khoản đang hoạt động | Tài khoản khách hàng đang hoạt động | Admin khóa tài khoản (`is_active = False`) | Tài khoản chuyển trạng thái khóa, khách hàng không đăng nhập được (403 ACCOUNT_LOCKED). |
| **TC-02** | Admin mở khóa tài khoản đang bị khóa | Tài khoản khách hàng đang bị khóa | Admin mở khóa tài khoản (`is_active = True`) | Tài khoản hoạt động trở lại, đăng nhập thành công (200 OK). |
| **TC-03** | Khóa tài khoản không tồn tại | ID khách hàng không có trong DB | Admin gọi API toggle status | Trả về **404 CUSTOMER_NOT_FOUND**. |
| **TC-04** | User thường gọi API khóa tài khoản | Người dùng role = `user` | Gọi API Admin Customers Status | Trả về **403 FORBIDDEN**. |
