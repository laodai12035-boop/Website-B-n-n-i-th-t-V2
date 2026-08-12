# Phân tích nghiệp vụ: NT-04-CN-004 — Áp dụng mã giảm giá vào giỏ hàng

**Story:** NT-04-CN-004  
**Epic:** NT-04 / NT-11 — Giỏ hàng & Khuyến mãi  
**Ngày phân tích:** 2026-08-12  
**Quy tắc nghiệp vụ liên quan:** **QTN-01** (Điều kiện áp dụng mã giảm giá)  
**Người thực hiện:** BA / Backend Dev

---

## 1. Mô tả nghiệp vụ

> Là Khách hàng, tôi muốn nhập mã giảm giá vào giỏ hàng, để được giảm giá cho đơn hàng của mình.

**Điều kiện bắt đầu:** Khách hàng mở trang Giỏ hàng (`/cart`) hoặc Thanh toán (`/checkout`) có ít nhất 1 sản phẩm.  
**Kết quả sau hoàn thành:** Nhập mã giảm giá hợp lệ, hệ thống áp dụng mức giảm (% hoặc số tiền cố định VND) vào tổng tiền thanh toán.

---

## 2. Quy tắc nghiệp vụ QTN-01 (Coupon Validation Rules)

Mã giảm giá chỉ được áp dụng khi thỏa mãn **toàn bộ 3 điều kiện**:
1. **Trạng thái & Thời hạn:** Mã tồn tại trong hệ thống, `is_active == True`, và thời gian hiện tại nằm trong khoảng `start_date <= now <= end_date`.
2. **Giá trị đơn hàng tối thiểu (`min_order_value`):** Tổng tiền tạm tính giỏ hàng (`subtotal`) phải `>= min_order_value`.
3. **Giới hạn sử dụng:** Mỗi mã có thể có mức giảm tối đa (`max_discount` đối với loại giảm theo %).

---

## 3. Danh sách Mã lỗi API (RFC 7807 Standard)

| Mã lỗi (`code`) | HTTP Status | Mô tả chi tiết | Thông báo hiển thị cho người dùng |
|---|---|---|---|
| `COUPON_EXPIRED_OR_INVALID` | `400 Bad Request` / `404` | Mã không tồn tại, bị ngưng kích hoạt, hoặc đã quá ngày hết hạn. | *"Mã giảm giá không hợp lệ hoặc đã hết hạn sử dụng."* |
| `MIN_ORDER_VALUE_NOT_MET` | `400 Bad Request` | Đơn hàng chưa đạt giá trị tối thiểu để áp dụng mã. | *"Đơn hàng chưa đạt giá trị tối thiểu {min_order_value}đ để áp dụng mã này."* |
| `COUPON_ALREADY_USED` | `400 Bad Request` | Tài khoản đã sử dụng mã này trước đó. | *"Tài khoản của bạn đã sử dụng mã giảm giá này."* |

---

## 4. Các kịch bản kiểm thử nghiệp vụ (Test Cases Matrix)

| Mã AC | Kịch bản | Dữ liệu đầu vào | Kết quả mong đợi |
|---|---|---|---|
| **TC-01** | Nhập mã hợp lệ với đơn 2 triệu (Happy Path) | Mã `NOITHAT10` (giảm 10%, đơn tối thiểu 2 triệu). Đơn hàng = 2.500.000đ | Trả về 200 OK. Giảm 250.000đ, tổng tiền thanh toán = 2.250.000đ. |
| **TC-02** | Vi phạm giá trị đơn tối thiểu QTN-01 | Mã `NOITHAT10` (đơn tối thiểu 2 triệu). Đơn hàng = 200.000đ | Trả về 400 Bad Request (`MIN_ORDER_VALUE_NOT_MET`). Báo đơn chưa đủ 2 triệu. |
| **TC-03** | Vi phạm thời hạn QTN-01 | Mã `HETHAN2025` (hết hạn 2025-01-01) hoặc mã `INVALID` | Trả về 400 Bad Request (`COUPON_EXPIRED_OR_INVALID`). Báo mã không hợp lệ hoặc hết hạn. |
