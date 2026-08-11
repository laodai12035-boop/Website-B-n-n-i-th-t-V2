# Phân tích nghiệp vụ: NT-01-CN-004 — Quên và đổi mật khẩu

**Story:** NT-01-CN-004  
**Epic:** NT-01 — Quản lý tài khoản & phân quyền  
**Ngày phân tích:** 2026-08-11  
**Người thực hiện:** BA

---

## 1. Mô tả nghiệp vụ

> Là Khách hàng, tôi muốn đặt lại mật khẩu khi quên, để tiếp tục truy cập tài khoản của mình.

**Điều kiện bắt đầu:** Tài khoản tồn tại với email hợp lệ trên hệ thống.  
**Kết quả sau hoàn thành:** Mật khẩu mới được lưu (đã mã hóa bcrypt) và dùng được để đăng nhập.

---

## 2. Luồng nghiệp vụ chính (Happy Path - TC-01 & TC-03)

```
[Khách hàng] → Bấm "Quên mật khẩu?" tại trang /login
      ↓
[Trang /forgot-password] → Nhập Email → Bấm "Gửi liên kết đặt lại mật khẩu"
      ↓
[POST /api/v1/auth/forgot-password] → Backend kiểm tra email tồn tại
      ↓
[Backend] → Sinh JWT Reset Token (type: "reset_password", exp: 15 phút)
      ↓
[Backend] → Log mock email chứa link: http://localhost:5173/reset-password?token=<token>
      ↓
[Response 200] → "Nếu email tồn tại trên hệ thống, bạn sẽ nhận được liên kết đặt lại mật khẩu."
      ↓
[Khách hàng] → Nhấp liên kết trong Email → Mở trang /reset-password?token=<token>
      ↓
[Trang /reset-password] → Nhập Mật khẩu mới & Xác nhận mật khẩu → Bấm "Cập nhật mật khẩu"
      ↓
[POST /api/v1/auth/reset-password] → Backend verify Reset Token & hash password mới
      ↓
[Response 200] → "Đặt lại mật khẩu thành công!"
      ↓
[Frontend] → Tự động chuyển hướng về trang /login sau 1.5 giây
```

---

## 3. Các kịch bản lỗi & Mã phản hồi API (Sad Paths - TC-02 & TC-04)

| Mã AC | Tình huống | HTTP Status | Error Code | Thông báo chi tiết |
|---|---|---|---|---|
| TC-02 | Email không tồn tại khi gửi yêu cầu reset | 404 | `USER_NOT_FOUND` | "Không tìm thấy tài khoản với email này" |
| TC-04 | Reset Token không hợp lệ / sai format | 400 | `INVALID_TOKEN` | "Liên kết đặt lại mật khẩu không hợp lệ" |
| TC-04 | Reset Token đã hết hạn (> 15 phút) | 401 | `EXPIRED_TOKEN` | "Liên kết đặt lại mật khẩu đã hết hạn. Vui lòng gửi yêu cầu mới." |
| - | Mật khẩu mới không đủ 8 ký tự | 400 | `VALIDATION_ERROR` | "Mật khẩu phải có ít nhất 8 ký tự" |

---

## 4. API Specification

### A. Endpoint: `POST /api/v1/auth/forgot-password`
- **Auth:** Public
- **Request Body:**
```json
{
  "email": "user@example.com"
}
```
- **Response Success (200 OK):**
```json
{
  "status": "success",
  "data": {
    "reset_token": "eyJhbGciOiJIUzI1...",
    "reset_link": "http://localhost:5173/reset-password?token=eyJhbGciOi..."
  },
  "message": "Liên kết đặt lại mật khẩu đã được gửi đến email của bạn"
}
```

### B. Endpoint: `POST /api/v1/auth/reset-password`
- **Auth:** Public
- **Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1...",
  "new_password": "NewPassword123"
}
```
- **Response Success (200 OK):**
```json
{
  "status": "success",
  "data": null,
  "message": "Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới."
}
```
