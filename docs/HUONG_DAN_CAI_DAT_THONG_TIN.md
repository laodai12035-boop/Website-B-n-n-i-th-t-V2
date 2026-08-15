# HƯỚNG DẪN CẤP NHẬT THÔNG TIN CÁ NHÂN, CỬA HÀNG & NGÂN HÀNG (QR VIETQR)

Tài liệu này hướng dẫn chi tiết từng bước cách thay đổi toàn bộ thông tin cửa hàng, thông tin liên hệ, hotline, địa chỉ showroom, Google Maps và tài khoản ngân hàng nhận tiền chuyển khoản QR (VietQR) trong mã nguồn dự án **Nội Thất Nhà Xinh V2**.

---

## 1. Cấu hình Thông tin Ngân hàng & QR Chuyển khoản (VietQR)

Dự án sử dụng chuẩn quốc gia VietQR (NAPAS) để tự động sinh mã QR nhận tiền chuyển khoản chính xác tới số tiền của đơn hàng.

### Cách 1: Thay đổi qua file cấu hình môi trường `.env` (Khuyên dùng)
Mở file [`.env`](file:///d:/Website%20B%C3%A1n%20%C4%91%E1%BB%93%20n%E1%BB%99i%20th%E1%BA%A5t%20V2/backend/.env) nằm trong thư mục `backend/` và thêm/sửa các biến sau:

```env
# Cấu hình Ngân hàng VietQR
QR_BANK_ID=MB              # Mã Ngân hàng (MB, VCB, ACB, TCB, ICB, STB, TPB...)
QR_ACCOUNT_NO=0327067055   # Số tài khoản ngân hàng của bạn
QR_ACCOUNT_NAME=NGUYEN VAN A # Tên chủ tài khoản (Viết hoa KHÔNG DẤU)
QR_EXPIRE_MINUTES=15       # Thời gian mã QR có hiệu lực (Phút)
```

> **Danh sách mã ngân hàng phổ biến (QR_BANK_ID):**
> - `MB`: Ngân hàng Quân Đội (MBBank)
> - `VCB`: Ngân hàng Vietcombank
> - `ICB`: Ngân hàng VietinBank
> - `BIDV`: Ngân hàng BIDV
> - `ACB`: Ngân hàng Á Châu (ACB)
> - `TCB`: Ngân hàng Techcombank
> - `STB`: Ngân hàng Sacombank
> - `TPB`: Ngân hàng TPBank

### Cách 2: Thay đổi trực tiếp trong mã nguồn Backend
Nếu không dùng file `.env`, bạn có thể sửa trực tiếp các giá trị mặc định tại file:
📌 [`backend/app/services/qr_payment_service.py`](file:///d:/Website%20B%C3%A1n%20%C4%91%E1%BB%93%20n%E1%BB%99i%20th%E1%BA%A5t%20V2/backend/app/services/qr_payment_service.py) *(Dòng 25-28)*:

```python
QR_BANK_ID = os.environ.get("QR_BANK_ID", "TÊN_NGÂN_HÀNG")
QR_ACCOUNT_NO = os.environ.get("QR_ACCOUNT_NO", "SỐ_TÀI_KHOẢN_MỚI")
QR_ACCOUNT_NAME = os.environ.get("QR_ACCOUNT_NAME", "TÊN_CHỦ_TÀI_KHOẢN")
```

---

## 2. Cấu hình Thông tin Liên hệ (Hotline, Email, Showroom)

### A. Thay đổi trên Thanh Header Topbar & Menu Navigation
📌 File: [`frontend/src/components/layout/Navbar.jsx`](file:///d:/Website%20B%C3%A1n%20%C4%91%E1%BB%93%20n%E1%BB%99i%20th%E1%BA%A5t%20V2/frontend/src/components/layout/Navbar.jsx)

- **Hotline ở Topbar (Dòng 117):**
  ```jsx
  <a href="tel:0903884358">Hotline: 0903 884 358</a>
  ```
  *(Thay `0903884358` thành số điện thoại hotline của bạn)*.

- **Tên Thương Hiệu / Logo (Dòng 267):**
  ```jsx
  NHÀ XINH <span className="text-amber-800">V2</span>
  ```

---

### B. Thay đổi thông tin trên Trang Liên Hệ (`/contact`)
📌 File: [`frontend/src/pages/contact/ContactPage.jsx`](file:///d:/Website%20B%C3%A1n%20%C4%91%E1%BB%93%20n%E1%BB%99i%20th%E1%BA%A5t%20V2/frontend/src/pages/contact/ContactPage.jsx)

- **Địa chỉ Văn phòng & Showroom chính (Dòng 115):**
  ```jsx
  <p>160C Trường Chinh, Phường 12, Quận Tân Bình, TP.HCM</p>
  ```
- **Hotline tổng đài (Dòng 130):**
  ```jsx
  <a href="tel:0977456123">0977.456.123</a>
  ```
- **Email phản hồi (Dòng 145):**
  ```jsx
  <a href="mailto:info@noithat.vn">info@noithat.vn</a>
  ```
- **Bản đồ Google Maps (Dòng 155):**
  Thay thế thuộc tính `src="..."` của thẻ `<iframe>` bằng link mã nhúng Google Maps địa chỉ Showroom của bạn.
  *(Truy cập Google Maps -> Tìm địa chỉ -> Bấm "Chia sẻ" -> Bấm "Nhúng bản đồ" -> Copy link `src`)*.

---

### C. Thay đổi thông tin ở Chân Trang (Footer)
📌 File: [`frontend/src/components/layout/Footer.jsx`](file:///d:/Website%20B%C3%A1n%20%C4%91%E1%BB%93%20n%E1%BB%99i%20th%E1%BA%A5t%20V2/frontend/src/components/layout/Footer.jsx)

Sửa thông tin địa chỉ, tổng đài hỗ trợ, email và các liên kết mạng xã hội (Facebook, Zalo, YouTube...) ở các khối thông tin Footer.

---

## 3. Khởi động lại dịch vụ sau khi sửa

1. Sau khi chỉnh sửa file backend (`.env` hoặc `qr_payment_service.py`), bạn cần bấm `CTRL+C` ở Terminal Backend và chạy lại:
   ```bash
   python run.py
   ```
2. Frontend (Vite) sẽ tự động cập nhật ngay lập tức khi bạn lưu file.

---
*Nhà Xinh V2 — Tài liệu hướng dẫn thiết lập cửa hàng.*
