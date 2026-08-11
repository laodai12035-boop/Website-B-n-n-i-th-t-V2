# Phân tích nghiệp vụ: NT-01-CN-001 — Đăng ký tài khoản

**Story:** NT-01-CN-001  
**Epic:** NT-01 — Quản lý tài khoản & phân quyền  
**Ngày phân tích:** 2026-08-11  
**Người thực hiện:** BA

---

## 1. Mô tả nghiệp vụ

> Là Khách hàng, tôi muốn đăng ký tài khoản bằng email và mật khẩu, để có thể mua hàng và theo dõi đơn hàng của mình.

**Điều kiện bắt đầu:** Khách hàng chưa có tài khoản trên hệ thống.  
**Kết quả sau hoàn thành:** Tài khoản được tạo và khách hàng có thể đăng nhập.

---

## 2. Luồng nghiệp vụ chính (Happy Path)

```
[Khách hàng] → Truy cập trang /register
      ↓
[Điền form] → Họ tên + Email + Số điện thoại + Mật khẩu + Xác nhận mật khẩu
      ↓
[Frontend] → Validate client-side (format, required)
      ↓
[POST /api/v1/auth/register]
      ↓
[Backend] → Validate server-side
      ↓
[Backend] → Kiểm tra email đã tồn tại? → Nếu có → 409 Conflict
      ↓
[Backend] → Hash mật khẩu bằng bcrypt
      ↓
[Backend] → Lưu vào DB (bảng users)
      ↓
[Backend] → Log mock email "xác nhận" ra console
      ↓
[Response 201] → { status: "success", data: { user_id, email }, message: "Đăng ký thành công" }
      ↓
[Frontend] → Chuyển hướng sang trang /login
```

---

## 3. Luồng lỗi (Sad Paths)

| Tình huống | HTTP Status | Error Code | Thông báo hiển thị |
|---|---|---|---|
| Email đã tồn tại | 409 | `EMAIL_EXISTS` | "Email này đã được sử dụng" |
| Mật khẩu < 8 ký tự | 400 | `VALIDATION_ERROR` | "Mật khẩu phải có ít nhất 8 ký tự" |
| Email sai định dạng | 400 | `VALIDATION_ERROR` | "Email không hợp lệ" |
| Thiếu field bắt buộc | 400 | `VALIDATION_ERROR` | "Vui lòng điền đầy đủ thông tin" |
| SĐT sai format (VN) | 400 | `VALIDATION_ERROR` | "Số điện thoại không hợp lệ" |
| Lỗi server | 500 | `SERVER_ERROR` | "Đã xảy ra lỗi, vui lòng thử lại" |

---

## 4. Validation Rules

### Frontend (client-side — hiển thị ngay khi blur/submit)

| Field | Bắt buộc | Quy tắc |
|---|---|---|
| `full_name` | ✅ | 2–100 ký tự, không rỗng |
| `email` | ✅ | Format email hợp lệ, lowercase |
| `phone` | ✅ | Số điện thoại VN: bắt đầu 0, 10 chữ số |
| `password` | ✅ | Tối thiểu 8 ký tự |
| `confirm_password` | ✅ | Phải khớp với `password` |

### Backend (server-side — tuyến phòng thủ thứ 2)

| Field | Quy tắc |
|---|---|
| `full_name` | String, 2–100 chars, strip whitespace |
| `email` | Format hợp lệ, lowercase, unique trong DB |
| `phone` | Regex `^0[0-9]{9}$` |
| `password` | Min 8 chars |

> **Lý do validate cả 2 phía:** Frontend cho UX nhanh; Backend bắt buộc vì không tin tưởng client input (có thể bypass).

---

## 5. Data Model — Bảng `users`

```sql
CREATE TABLE users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    full_name   VARCHAR(100)  NOT NULL,
    email       VARCHAR(100)  NOT NULL UNIQUE,
    phone       VARCHAR(15),
    password_hash VARCHAR(255) NOT NULL,
    role        ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);
```

**Ghi chú:**
- Không lưu `password` plaintext — chỉ lưu `password_hash` (bcrypt, 12 rounds)
- `role` mặc định `'user'`, chỉ set `'admin'` thủ công
- `is_active` phục vụ soft-disable tài khoản (Admin khóa)
- Index trên `email` vì đây là field tìm kiếm chính

---

## 6. API Contract

**Endpoint:** `POST /api/v1/auth/register`  
**Auth:** Không yêu cầu (public)

### Request Body
```json
{
  "full_name": "Nguyễn Văn A",
  "email": "nguyenvana@gmail.com",
  "phone": "0901234567",
  "password": "Abc12345"
}
```

### Response — Success (201)
```json
{
  "status": "success",
  "data": {
    "user_id": 1,
    "email": "nguyenvana@gmail.com"
  },
  "message": "Đăng ký tài khoản thành công"
}
```

### Response — Email trùng (409)
```json
{
  "status": "error",
  "message": "Email này đã được sử dụng",
  "code": "EMAIL_EXISTS"
}
```

### Response — Validation lỗi (400)
```json
{
  "status": "error",
  "message": "Dữ liệu không hợp lệ",
  "code": "VALIDATION_ERROR",
  "errors": {
    "password": ["Mật khẩu phải có ít nhất 8 ký tự"],
    "email": ["Email không hợp lệ"]
  }
}
```

---

## 7. Security Considerations

- ✅ Mật khẩu hash bằng **bcrypt với 12 rounds** trước khi lưu DB
- ✅ Không bao giờ trả về `password_hash` trong response
- ✅ Validate server-side dù đã validate client-side
- ✅ Dùng parameterized queries (SQLAlchemy ORM) — tránh SQL Injection
- ✅ Email normalize: lowercase + strip trước khi so sánh & lưu

---

## 8. Test Cases tham chiếu

| Mã AC | Scenario | Expected |
|---|---|---|
| TC-01 | Thông tin đầy đủ, email chưa tồn tại | 201 — tài khoản tạo thành công |
| TC-02 | Email đã tồn tại | 409 — EMAIL_EXISTS |
| TC-03 | Mật khẩu < 8 ký tự | 400 — VALIDATION_ERROR |
| TC-04 | Email sai format | 400 — VALIDATION_ERROR |
| TC-05 | Thiếu `full_name` | 400 — VALIDATION_ERROR |
