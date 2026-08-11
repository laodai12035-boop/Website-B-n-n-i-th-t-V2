# Phân tích nghiệp vụ: NT-01-CN-005 — Cập nhật thông tin cá nhân

**Story:** NT-01-CN-005  
**Epic:** NT-01 — Quản lý tài khoản & phân quyền  
**Ngày phân tích:** 2026-08-11  
**Người thực hiện:** BA

---

## 1. Mô tả nghiệp vụ

> Là Khách hàng, tôi muốn cập nhật họ tên, số điện thoại và ảnh đại diện, để thông tin tài khoản luôn chính xác.

**Điều kiện bắt đầu:** Người dùng đã đăng nhập vào hệ thống (có JWT Access Token hợp lệ).  
**Kết quả sau hoàn thành:** Thông tin cá nhân mới được lưu thành công vào cơ sở dữ liệu và tự động phản ánh lên toàn bộ ứng dụng (Navbar, Profile Page).

---

## 2. Các trường thông tin được phép chỉnh sửa

| Field | Loại dữ liệu | Bắt buộc | Quy tắc Validation Server-side | Ghi chú |
|---|---|---|---|---|
| `full_name` | String | ✅ | Độ dài từ 2 đến 100 ký tự | Strip whitespace thừa |
| `phone` | String | ✅ | Đuôi 10 chữ số VN, bắt đầu bằng `0` (Regex `^0[0-9]{9}$`) | Kiểm tra số điện thoại |
| `avatar_url` | String | ❌ (Tùy chọn) | Chuỗi URL hợp lệ hoặc null/rỗng | Lưu URL ảnh đại diện |
| `email` | String | ❌ (Khóa) | **Không cho phép chỉnh sửa** ở API này | Email là trường định danh |

---

## 3. Luồng nghiệp vụ chính (Happy Path - TC-01)

```
[Khách hàng] → Đang ở trang /profile
      ↓
[Thao tác] → Bấm "Chỉnh sửa thông tin" → Form chuyển sang Edit Mode
      ↓
[Điền form] → Nhập Họ tên mới, SĐT mới, Avatar URL mới
      ↓
[Frontend] → Validate Client-side (Required, Format SĐT)
      ↓
[PUT /api/v1/auth/profile] → Header Authorization: Bearer <token>
      ↓
[Backend] → Verify JWT token & validate UpdateProfileSchema
      ↓
[Backend] → AuthService.update_profile() cập nhật DB
      ↓
[Response 200] → Trả về object User mới đã được serialize
      ↓
[Frontend] → Cập nhật AuthContext state, hiển thị Toast/Alert "Cập nhật thành công"
```

---

## 4. Các kịch bản lỗi & HTTP Status Codes (Sad Paths - TC-02)

| Mã AC | Tình huống | HTTP Status | Error Code | Thông báo chi tiết |
|---|---|---|---|---|
| TC-02 | SĐT nhập không đúng định dạng VN (ví dụ: `12345`) | 400 | `VALIDATION_ERROR` | "Số điện thoại không hợp lệ (phải bắt đầu bằng 0 và có 10 chữ số)" |
| TC-02 | Họ tên rỗng hoặc < 2 ký tự | 400 | `VALIDATION_ERROR` | "Họ tên phải từ 2 đến 100 ký tự" |
| - | Gọi API không truyền JWT Token | 401 | `UNAUTHORIZED` | "Phiên đăng nhập không hợp lệ hoặc đã hết hạn" |
| - | Tài khoản bị khóa (`is_active=False`) | 403 | `ACCOUNT_LOCKED` | "Tài khoản của bạn đã bị khóa" |

---

## 5. API Specification

### Endpoint: `PUT /api/v1/auth/profile`
- **Auth:** Required (`Header Authorization: Bearer <token>`)
- **Request Body (JSON):**
```json
{
  "full_name": "Nguyễn Văn A (Mới)",
  "phone": "0987654321",
  "avatar_url": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde"
}
```
- **Response Success (200 OK):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "full_name": "Nguyễn Văn A (Mới)",
      "email": "user@example.com",
      "phone": "0987654321",
      "avatar_url": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde",
      "role": "user",
      "is_active": true
    }
  },
  "message": "Cập nhật thông tin cá nhân thành công"
}
```
