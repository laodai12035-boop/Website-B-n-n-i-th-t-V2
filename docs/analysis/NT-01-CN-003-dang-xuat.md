# Phân tích nghiệp vụ: NT-01-CN-003 — Đăng xuất

**Story:** NT-01-CN-003  
**Epic:** NT-01 — Quản lý tài khoản & phân quyền  
**Ngày phân tích:** 2026-08-11  
**Người thực hiện:** BA

---

## 1. Mô tả nghiệp vụ

> Là Khách hàng, tôi muốn đăng xuất khỏi tài khoản, để bảo vệ thông tin cá nhân khi dùng thiết bị chung.

**Điều kiện bắt đầu:** Người dùng đang đăng nhập (có JWT token trong `localStorage` và `user` state trong `AuthContext`).  
**Kết quả sau hoàn thành:** Phiên đăng nhập kết thúc, token bị xóa, thông tin user được reset về `null`, hệ thống yêu cầu đăng nhập lại nếu muốn truy cập các trang bảo vệ.

---

## 2. Luồng nghiệp vụ chính (Happy Path - TC-01)

```
[Khách hàng] → Đang ở trang bất kỳ (ví dụ: Trang chủ / Trang cá nhân / Giỏ hàng)
      ↓
[Thao tác] → Bấm nút "Đăng xuất" trên Navbar / Account Menu
      ↓
[Frontend] → Gọi API POST /api/v1/auth/logout (kèm Header Authorization: Bearer <token>)
      ↓
[Backend] → Xác nhận token hợp lệ, trả về status 200 OK
      ↓
[Frontend] → Xóa 'token' khỏi localStorage
      ↓
[Frontend] → Reset `user` state về `null` trong AuthContext
      ↓
[Frontend] → Chuyển hướng người dùng về trang /login (hoặc Trang chủ /)
```

---

## 3. Bảo mật & Kiểm soát truy cập trang (Protected Routes - TC-02)

| Mã AC | Tình huống | Hành vi mong đợi |
|---|---|---|
| TC-01 | Đang đăng nhập -> Bấm Đăng xuất | Hủy phiên thành công, chuyển hướng về `/login` hoặc `/` |
| TC-02 | Đã đăng xuất -> Cố nhập URL trang cá nhân (`/profile`) | `ProtectedRoute` chặn truy cập, tự động đẩy về `/login` |

---

## 4. API Specification

### Endpoint: `POST /api/v1/auth/logout`
- **Auth:** Required (Header `Authorization: Bearer <token>`)
- **Request Body:** None
- **Response Success (200 OK):**
```json
{
  "status": "success",
  "data": null,
  "message": "Đăng xuất thành công"
}
```
- **Response Error (401 Unauthorized):**
```json
{
  "status": "error",
  "message": "Phiên đăng nhập không hợp lệ hoặc đã hết hạn",
  "code": "UNAUTHORIZED"
}
```

---

## 5. Kiến trúc Frontend: Component `<ProtectedRoute>`

Để đáp ứng **TC-02**, xây dựng component bọc Route:

```jsx
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
```
