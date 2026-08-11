# Phân tích nghiệp vụ: NT-01-CN-006 — Giới hạn quyền truy cập trang quản trị

**Story:** NT-01-CN-006  
**Epic:** NT-01 — Quản lý tài khoản & phân quyền  
**Quy tắc nghiệp vụ liên quan:** **QTN-09 (Phân quyền truy cập trang quản trị)**  
**Ngày phân tích:** 2026-08-11  
**Người thực hiện:** BA / Backend Dev

---

## 1. Mô tả nghiệp vụ & Quy tắc QTN-09

> **Mô tả:** Là Quản trị viên, tôi muốn hệ thống chỉ cho tài khoản Admin vào khu vực quản trị, để bảo vệ dữ liệu vận hành khỏi truy cập trái phép.

> **Quy tắc QTN-09:**
> - **Đối tượng:** Chỉ tài khoản có vai trò `role == 'admin'` mới được phép truy cập khu vực quản trị của hệ thống.
> - **Điều kiện áp dụng:** Người dùng cố gắng truy cập một URL hoặc API thuộc khu vực quản trị (`/admin/*` hoặc `/api/v1/admin/*`).
> - **Thỏa mãn:** Nếu tài khoản có vai trò `admin`, hệ thống cho phép truy cập bình thường.
> - **Không thỏa mãn:** Nếu tài khoản có vai trò `user` (Khách hàng) hoặc chưa đăng nhập, hệ thống từ chối truy cập, ghi log truy cập trái phép và chuyển hướng ra ngoài.

---

## 2. Ma trận phân quyền (Authorization Matrix)

| Đối tượng (Role) | Trạng thái đăng nhập | Đăng nhập/Đăng ký (`/login`, `/register`) | Trang cá nhân (`/profile`) | Trang Admin (`/admin/*` & API `/api/v1/admin/*`) |
|---|---|---|---|---|
| Khách vãng lai (Guest) | ❌ Chưa đăng nhập | ✅ Cho phép | ❌ Redirect `/login` | ❌ 401 Unauthorized / Redirect `/login` |
| Khách hàng (User) | ✅ Đã đăng nhập (`role='user'`) | 🔄 Redirect `/` | ✅ Cho phép | ❌ **403 Forbidden** (`FORBIDDEN`) / Redirect `/403` |
| Quản trị viên (Admin) | ✅ Đã đăng nhập (`role='admin'`) | 🔄 Redirect `/` | ✅ Cho phép | ✅ **Cho phép truy cập** |

---

## 3. Kiến trúc bảo mật & Logging

### A. Backend Layer (`@admin_required`)
Decorator `@admin_required` bọc lấy endpoint Admin:
1. Decode JWT access token lấy `current_user_id`.
2. Kiểm tra `user = db.session.get(User, current_user_id)`.
3. Nếu `not user` hoặc `not user.is_active` hoặc `user.role != 'admin'`:
   - Ghi log cảnh báo: `logger.warning("Unauthorized admin access attempt: user_id=%s role=%s IP=%s", current_user_id, user.role if user else None, request.remote_addr)`
   - Trả về HTTP Response `403 Forbidden` (`code: FORBIDDEN`, `message: Bạn không có quyền truy cập chức năng này`).

### B. Frontend Layer (`<AdminRoute>`)
Component `<AdminRoute>` bọc các Route Admin trên Frontend:
- Nếu đang `loading`: Hiển thị Spinner.
- Nếu `!isAuthenticated`: `<Navigate to="/login" replace />`.
- Nếu `user.role !== 'admin'`: `<Navigate to="/403" replace />`.

---

## 4. API Specification

### Endpoint: `GET /api/v1/admin/dashboard`
- **Auth:** Required (`Header Authorization: Bearer <token>` & `Role = admin`)
- **Response Success (200 OK):**
```json
{
  "status": "success",
  "data": {
    "stats": {
      "total_users": 15,
      "total_orders": 0,
      "total_products": 0,
      "system_status": "healthy"
    }
  },
  "message": "Lấy thông tin dashboard quản trị thành công"
}
```
- **Response Error (403 Forbidden - Sad Path TC-02):**
```json
{
  "status": "error",
  "message": "Bạn không có quyền truy cập khu vực quản trị",
  "code": "FORBIDDEN"
}
```
