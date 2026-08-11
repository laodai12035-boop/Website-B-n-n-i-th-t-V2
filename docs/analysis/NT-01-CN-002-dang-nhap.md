# Phân tích nghiệp vụ: NT-01-CN-002 — Đăng nhập hệ thống

**Story:** NT-01-CN-002  
**Epic:** NT-01 — Quản lý tài khoản & phân quyền  
**Ngày phân tích:** 2026-08-11  
**Người thực hiện:** BA

---

## 1. Mô tả nghiệp vụ

> Là Khách hàng, tôi muốn đăng nhập bằng email và mật khẩu, để truy cập tài khoản và thực hiện mua hàng.

**Điều kiện bắt đầu:** Người dùng đã có tài khoản hợp lệ trên hệ thống.  
**Kết quả sau hoàn thành:** Người dùng được xác thực, nhận JWT token và truy cập được vào khu vực cá nhân của mình.

---

## 2. Luồng nghiệp vụ chính (Happy Path - TC-01)

```
[Khách hàng] → Truy cập trang /login
      ↓
[Điền form] → Email + Mật khẩu
      ↓
[Frontend] → Validate client-side (Required, Format email)
      ↓
[POST /api/v1/auth/login]
      ↓
[Backend] → Validate server-side (Marshmallow LoginSchema)
      ↓
[Backend] → Tìm user theo email (lowercase) → Nếu không thấy → 401 Unauthorized
      ↓
[Backend] → Kiểm tra mật khẩu (Bcrypt check) → Nếu không khớp → 401 Unauthorized
      ↓
[Backend] → Kiểm tra trạng thái is_active → Nếu False → 403 Forbidden (ACCOUNT_LOCKED)
      ↓
[Backend] → Sinh JWT Access Token (hạn 1h, payload identity = user.id)
      ↓
[Response 200] → { status: "success", data: { token, user: { id, full_name, email, role } }, message: "Đăng nhập thành công" }
      ↓
[Frontend] → Lưu token vào localStorage, cập nhật user state trong AuthContext
      ↓
[Frontend] → Chuyển hướng sang trang cá nhân (hoặc trang trước đó)
```

---

## 3. Các kịch bản lỗi & Mã phản hồi API (Sad Paths)

| Mã AC | Tình huống | HTTP Status | Error Code | Thông báo chi tiết |
|---|---|---|---|---|
| TC-02 | Email không tồn tại hoặc mật khẩu sai | 401 | `INVALID_CREDENTIALS` | "Email hoặc mật khẩu không chính xác" |
| TC-03 | Tài khoản bị khóa (`is_active=False`) | 403 | `ACCOUNT_LOCKED` | "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ bộ phận hỗ trợ." |
| - | Dữ liệu không hợp lệ (email rỗng, password rỗng) | 400 | `VALIDATION_ERROR` | "Dữ liệu không hợp lệ" |
| - | Token hết hạn / không hợp lệ khi gọi `/auth/me` | 401 | `UNAUTHORIZED` | "Phiên đăng nhập không hợp lệ hoặc đã hết hạn" |

> **Lưu ý bảo mật (Security best practice):** Không báo cụ thể "Email không tồn tại" hay "Mật khẩu sai" để tránh lỗi User Enumeration Vulnerability. Luôn trả chung message `"Email hoặc mật khẩu không chính xác"`.

---

## 4. API Specification

### A. Endpoint: `POST /api/v1/auth/login`
- **Auth:** Public
- **Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```
- **Response Success (200 OK):**
```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "user": {
      "id": 1,
      "full_name": "Nguyễn Văn A",
      "email": "user@example.com",
      "role": "user"
    }
  },
  "message": "Đăng nhập thành công"
}
```

### B. Endpoint: `GET /api/v1/auth/me`
- **Auth:** Required (Header `Authorization: Bearer <token>`)
- **Response Success (200 OK):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "full_name": "Nguyễn Văn A",
      "email": "user@example.com",
      "phone": "0901234567",
      "role": "user",
      "created_at": "2026-08-11T18:00:00"
    }
  },
  "message": "Lấy thông tin người dùng thành công"
}
```

---

## 5. Security & Session Management

1. **Bcrypt Password Verification**:
   - Dùng `bcrypt.check_password_hash(user.password_hash, password)`.
2. **JWT Payload**:
   - Subject / Identity: `user.id`.
   - Cấu hình thời gian hết hạn qua config: `JWT_ACCESS_TOKEN_EXPIRES` (default: 3600s = 1h).
3. **Frontend Interceptor & Auto-Login**:
   - Khi app khởi chạy, nếu phát hiện `token` trong `localStorage`, gọi `GET /api/v1/auth/me` để nạp thông tin User vào Context. Nếu 401 thì tự động xóa token rác.
