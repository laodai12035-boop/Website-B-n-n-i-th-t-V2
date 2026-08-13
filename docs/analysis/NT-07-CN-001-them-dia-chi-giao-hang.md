# Phân tích nghiệp vụ: NT-07-CN-001 — Thêm địa chỉ giao hàng

**Story:** NT-07-CN-001  
**Epic:** NT-07 — Quản lý địa chỉ giao hàng  
**Ngày phân tích:** 2026-08-13

---

## 1. Mô tả nghiệp vụ

> Là Khách hàng, tôi muốn thêm địa chỉ giao hàng mới, để chọn đúng nơi nhận khi đặt hàng.

**Điều kiện bắt đầu:** Khách hàng đã đăng nhập vào hệ thống.  
**Kết quả:** Địa chỉ mới được lưu vào hệ thống, hiển thị trong danh sách địa chỉ của tài khoản và có thể sử dụng khi thanh toán đơn hàng.

---

## 2. Quy tắc dữ liệu & Validation

### 2.1 Các trường dữ liệu địa chỉ (Address Schema)
1. `recipient_name` (string, required): Họ tên người nhận (2 - 100 ký tự).
2. `phone` (string, required): Số điện thoại Việt Nam (10 chữ số, bắt đầu bằng 0, regex `^0[0-9]{9}$`).
3. `province` (string, required): Tỉnh/Thành phố.
4. `district` (string, required): Quận/Huyện.
5. `ward` (string, required): Phường/Xã.
6. `detail_address` (string, required): Địa chỉ chi tiết (số nhà, tên đường, tòa nhà).
7. `is_default` (boolean, optional): Đánh dấu làm địa chỉ mặc định (mặc định False).

### 2.2 Các quy tắc nghiệp vụ đặc biệt
- **Tự động đặt mặc định cho địa chỉ đầu tiên:** Nếu người dùng chưa có địa chỉ nào trong tài khoản, địa chỉ được thêm mới đầu tiên sẽ tự động có `is_default = True`.
- **Chuyển đổi địa chỉ mặc định:** Nếu địa chỉ mới được đánh dấu `is_default = True`, hệ thống tự động gán `is_default = False` cho tất cả địa chỉ cũ của người dùng trong cùng một DB transaction.
- **Giới hạn số lượng (Max Limit):** Tối đa **10 địa chỉ/tài khoản**. Nếu đã có 10 địa chỉ ➔ Trả lỗi **400 Bad Request** (`MAX_ADDRESSES_REACHED`: *"Tài khoản đã đạt giới hạn tối đa 10 địa chỉ."*).

---

## 3. Thiết kế REST API Endpoint

### `POST /api/v1/addresses`
- **Headers:** `Authorization: Bearer <user_token>`
- **Request Body (JSON):**
  ```json
  {
    "recipient_name": "Nguyễn Văn A",
    "phone": "0901234567",
    "province": "TP. Hồ Chí Minh",
    "district": "Quận 1",
    "ward": "Phường Bến Nghé",
    "detail_address": "123 Nguyễn Huệ",
    "is_default": true
  }
  ```
- **Response 201 Created / 200 OK:**
  ```json
  {
    "status": "success",
    "message": "Thêm địa chỉ giao hàng mới thành công.",
    "data": {
      "id": 1,
      "user_id": 10,
      "recipient_name": "Nguyễn Văn A",
      "phone": "0901234567",
      "province": "TP. Hồ Chí Minh",
      "district": "Quận 1",
      "ward": "Phường Bến Nghé",
      "detail_address": "123 Nguyễn Huệ",
      "is_default": true,
      "created_at": "2026-08-13T18:00:00Z"
    }
  }
  ```
- **Response 400 Bad Request (Thiếu SĐT / Sai định dạng):**
  ```json
  {
    "status": "error",
    "message": "Dữ liệu không hợp lệ",
    "code": "VALIDATION_ERROR",
    "errors": {
      "phone": ["Số điện thoại là bắt buộc"]
    }
  }
  ```

---

## 4. Ma trận Test Cases

| Mã AC | Kịch bản | Dữ liệu đầu vào | Kết quả mong đợi |
|---|---|---|---|
| **TC-01** | Luồng thành công | Nhập đầy đủ và hợp lệ `recipient_name`, `phone`, `province`, `district`, `ward`, `detail_address` | Trả về 201 Created. Địa chỉ mới xuất hiện trong danh sách. |
| **TC-01b** | Địa chỉ đầu tiên tự động mặc định | Thêm địa chỉ cho user chưa có địa chỉ nào | `is_default` tự động nhận giá trị `True`. |
| **TC-02** | Thiếu số điện thoại | Khuyết trường `phone` | Trả về **400 VALIDATION_ERROR**. |
| **TC-02b** | Định dạng SĐT không hợp lệ | `phone = "12345"` | Trả về **400 VALIDATION_ERROR** (*"Số điện thoại phải bắt đầu bằng 0 và có 10 chữ số"*). |
| **TC-03** | Đạt giới hạn 10 địa chỉ | Thêm địa chỉ thứ 11 | Trả về **400 MAX_ADDRESSES_REACHED**. |
| **TC-04** | Chưa đăng nhập | Không gửi JWT Token | Trả về **401 Unauthorized**. |
