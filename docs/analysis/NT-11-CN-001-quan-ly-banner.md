# Phân tích nghiệp vụ: NT-11-CN-001 — Thêm, sửa, xóa banner trang chủ

**Story:** NT-11-CN-001  
**Epic:** NT-11 — Quản lý Banner & Quảng Cáo (Admin)  
**Ngày phân tích:** 2026-08-14

---

## 1. Mô tả nghiệp vụ

> Là Quản trị viên, tôi muốn thêm, sửa hoặc xóa banner quảng cáo trên trang chủ, để giới thiệu chương trình khuyến mãi hoặc bộ sưu tập mới.

**Điều kiện bắt đầu:** Quản trị viên đã đăng nhập trang quản trị.  
**Kết quả:** Banner mới hiển thị trên trang chủ theo thứ tự và khoảng thời gian thiết lập.

---

## 2. Quy tắc nghiệp vụ các trường thông tin Banner

### 2.1 Cấu trúc dữ liệu Banner
- `image_url` (Chuỗi, bắt buộc): Đường dẫn đính kèm hình ảnh banner. Nếu rỗng ➔ Hệ thống trả lỗi `400 Bad Request` mã `MISSING_IMAGE_URL`.
- `title` (Chuỗi, bắt buộc): Tiêu đề đại diện chương trình quảng cáo / bộ sưu tập.
- `subtitle` (Chuỗi, tùy chọn): Dòng mô tả ngắn phụ đề.
- `link_url` (Chuỗi, tùy chọn): Liên kết điều hướng khi người dùng nhấp vào banner (Ví dụ: `/products?category=sofa` hoặc `/combos`).
- `display_order` (Số nguyên, mặc định 0): Thứ tự ưu tiên hiển thị trên slider (giá trị nhỏ hiển thị trước).
- `is_active` (Boolean, mặc định True): Cờ bật/tắt hiển thị.
- `start_date` (DateTime, tùy chọn): Thời điểm bắt đầu hiển thị banner.
- `end_date` (DateTime, tùy chọn): Thời điểm kết thúc hiển thị banner.

### 2.2 Quy tắc lọc Banner hiển thị công khai (Public)
Banner hiển thị trên trang chủ khách hàng phải thỏa mãn:
1. `is_active = True`
2. Nếu `start_date` được thiết lập ➔ `start_date <= Thời gian hiện tại`
3. Nếu `end_date` được thiết lập ➔ `end_date >= Thời gian hiện tại`
4. Sắp xếp theo `display_order.asc()`, `created_at.desc()`

---

## 3. Ma trận Test Cases

| Mã AC | Kịch bản | Given | When | Then |
|---|---|---|---|---|
| **TC-01** | Admin tạo banner thành công | Admin đã đăng nhập | Tải ảnh, đặt tiêu đề, liên kết và thời gian hiển thị hợp lệ | Banner khởi tạo thành công (201 Created) và hiển thị trên slider trang chủ. |
| **TC-02** | Dữ liệu thiếu ảnh banner | Chưa chọn/nhập ảnh banner (`image_url` rỗng) | Bấm Lưu banner | Hệ thống báo lỗi thiếu hình ảnh (400 Bad Request, `MISSING_IMAGE_URL`). |
| **TC-03** | Admin sửa và xóa banner | Banner ID = X đã tồn tại | Admin cập nhật tiêu đề hoặc xóa banner | Banner được cập nhật / xóa thành công (200 OK). |
| **TC-04** | User thường gọi API Admin Banners | Người dùng role = `user` | Gọi API Admin banners | Trả về **403 FORBIDDEN**. |
