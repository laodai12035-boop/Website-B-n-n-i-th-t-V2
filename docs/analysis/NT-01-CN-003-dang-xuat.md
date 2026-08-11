# Phân tích nghiệp vụ: NT-01-CN-003 — Đăng xuất

**Story:** NT-01-CN-003  
**Epic:** NT-01 — Quản lý tài khoản & phân quyền  
**Ngày phân tích:** 2026-08-11  
**Người thực hiện:** BA

---

## 1. Mô tả nghiệp vụ

> Là Khách hàng, tôi muốn đăng xuất khỏi tài khoản, để bảo vệ thông tin cá nhân khi dùng thiết bị chung.

**Điều kiện bắt đầu:** Người dùng đang đăng nhập vào hệ thống (đã có Token trong localStorage & state).  
**Kết quả sau hoàn thành:** Phiên đăng nhập kết thúc, token bị xóa, người dùng được chuyển hướng về trang đăng nhập hoặc trang chủ và cần đăng nhập lại để truy cập thông tin cá nhân.

---

## 2. Luồng nghiệp vụ đăng xuất (Happy Path - TC-01)

```
[Khách hàng] → Nhấp Avatar / User Menu trên Header
      ↓
[Khách hàng] → Chọn "Đăng xuất"
      ↓
[Frontend] → Gọi useAuth().logout()
      ↓
[POST /api/v1/auth/logout] → Header Authorization: Bearer <token>
      ↓
[Backend] → Ghi nhận log đăng xuất (200 OK)
      ↓
[Frontend] → Xóa 'token' khỏi localStorage
      ↓
[Frontend] → Cập nhật user state = null trong AuthContext
      ↓
[Frontend] → Chuyển hướng sang /login (hoặc /)
```

---

## 3. Bảo vệ Route & Kiểm tra bảo mật (TC-02)

### Kịch bản TC-02:
Sau khi đăng xuất (hoặc khi chưa đăng nhập):
1. Người dùng cố gắng nhập trực tiếp URL trang cá nhân (ví dụ: `/profile`).
2. Component `ProtectedRoute` kiểm tra:
   - `loading === true`: Hiển thị Spinner chờ kiểm tra phiên.
   - `isAuthenticated === false` (user = null): Tự động chuyển hướng về `/login` kèm query parameter `redirect` để hỗ trợ quay lại trang cũ sau khi đăng nhập.
3. Nếu gọi API cá nhân (`GET /api/v1/auth/me` hoặc các API riêng tư khác) không kèm Header `Authorization` hoặc kèm Token rác/đã hết hạn -> Backend trả về `401 Unauthorized`.

---

## 4. API Specification

### Endpoint: `POST /api/v1/auth/logout`
- **Auth Required:** `Bearer <token>`
- **Request Body:** Không có (empty)
- **Response Success (200 OK):**
```json
{
  "status": "success",
  "data": null,
  "message": "Đăng xuất thành công"
}
```
- **Response Unauthorized (401):**
```json
{
  "status": "error",
  "message": "Token không hợp lệ hoặc đã hết hạn",
  "code": "UNAUTHORIZED"
}
```
