import time
import random
from typing import Dict, Any, List, Optional
from app.extensions import db
from app.models.order import Order, OrderItem
from app.models.cart_item import CartItem
from app.models.product import Product
from app.services.coupon_service import CouponService
from app.services.shipping_service import ShippingService


class OrderService:
    """Service xử lý tạo và quản lý đơn hàng (NT-05-CN-001 COD)."""

    @staticmethod
    def _generate_order_code() -> str:
        """Tạo mã đơn hàng duy nhất dạng ORD-YYYYMMDD-XXXX."""
        date_str = time.strftime("%Y%m%d")
        random_digits = "".join([str(random.randint(0, 9)) for _ in range(4)])
        return f"ORD-{date_str}-{random_digits}"

    @staticmethod
    def create_cod_order(
        user_id: int,
        recipient_name: str,
        recipient_phone: str,
        shipping_address: str,
        note: Optional[str] = None,
        coupon_code: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Tạo đơn hàng Thanh toán khi nhận hàng (COD).

        Args:
            user_id: ID người dùng
            recipient_name: Họ tên người nhận
            recipient_phone: Số điện thoại người nhận
            shipping_address: Địa chỉ nhận hàng
            note: Ghi chú đơn hàng (tùy chọn)
            coupon_code: Mã giảm giá (tùy chọn QTN-01)

        Returns:
            Dict chứa chi tiết đơn hàng vừa tạo.

        Raises:
            ValueError: Khi dữ liệu thiếu, giỏ rỗng, hoặc vượt tồn kho (QTN-02)
        """
        # 1. Kiểm tra thông tin nhận hàng
        if not recipient_name or not recipient_name.strip():
            raise ValueError("MISSING_RECIPIENT_NAME")
        if not recipient_phone or not recipient_phone.strip():
            raise ValueError("MISSING_RECIPIENT_PHONE")
        if not shipping_address or not shipping_address.strip():
            raise ValueError("MISSING_SHIPPING_ADDRESS")

        # 2. Lấy danh sách sản phẩm trong giỏ hàng
        cart_items = (
            db.session.query(CartItem)
            .filter(CartItem.user_id == user_id)
            .all()
        )

        if not cart_items:
            raise ValueError("CART_EMPTY")

        # 3. Kiểm tra Tồn kho QTN-02 và Tính tạm tính
        subtotal = 0.0
        order_item_configs = []

        for item in cart_items:
            product = (
                db.session.query(Product)
                .filter(Product.id == item.product_id, Product.is_active == True)
                .first()
            )
            if not product:
                raise ValueError(f"PRODUCT_NOT_AVAILABLE:{item.product_id}")

            if item.quantity > product.stock:
                raise ValueError(f"EXCEED_STOCK:{product.name}:{product.stock}")

            item_price = float(product.discount_price if product.discount_price and product.discount_price > 0 else product.price)
            item_subtotal = round(item_price * item.quantity, 2)
            subtotal += item_subtotal

            order_item_configs.append({
                "product": product,
                "product_id": product.id,
                "product_name": product.name,
                "quantity": item.quantity,
                "price": item_price,
                "subtotal": item_subtotal,
            })

        subtotal = round(subtotal, 2)

        # 4. Áp dụng mã giảm giá QTN-01 (nếu có)
        discount_amount = 0.0
        if coupon_code and coupon_code.strip():
            coupon_res = CouponService.validate_and_apply(coupon_code, subtotal)
            discount_amount = coupon_res["discount_amount"]

        # 5. Tính phí vận chuyển QTN-07
        try:
            shipping_result = ShippingService.calculate_shipping_fee(user_id, shipping_address)
            shipping_fee = float(shipping_result["fee"])
        except Exception:
            # An toàn: nếu lỗi thì không chặn tạo đơn
            shipping_fee = 0.0

        total_amount = max(0.0, round(subtotal - discount_amount + shipping_fee, 2))

        # 6. Tạo đơn hàng và chi tiết đơn hàng trong DB Transaction
        order_code = OrderService._generate_order_code()

        order = Order(
            order_code=order_code,
            user_id=user_id,
            recipient_name=recipient_name.strip(),
            recipient_phone=recipient_phone.strip(),
            shipping_address=shipping_address.strip(),
            note=note.strip() if note else None,
            payment_method="COD",
            payment_status="unpaid",
            status="pending",
            subtotal=subtotal,
            discount_amount=discount_amount,
            shipping_fee=shipping_fee,
            total_amount=total_amount,
        )

        db.session.add(order)
        db.session.flush()  # Phát sinh order.id

        # Thêm order_items và trừ tồn kho stock
        for cfg in order_item_configs:
            order_item = OrderItem(
                order_id=order.id,
                product_id=cfg["product_id"],
                product_name=cfg["product_name"],
                quantity=cfg["quantity"],
                price=cfg["price"],
                subtotal=cfg["subtotal"],
            )
            db.session.add(order_item)

            # Trừ số lượng tồn kho sản phẩm
            cfg["product"].stock -= cfg["quantity"]

        # Xóa sạch giỏ hàng người dùng
        db.session.query(CartItem).filter(CartItem.user_id == user_id).delete()
        db.session.commit()

        return order.to_dict()

    @staticmethod
    def get_user_orders(user_id: int, status_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        """Lấy danh sách đơn hàng của người dùng (hỗ trợ lọc theo trạng thái)."""
        query = db.session.query(Order).filter(Order.user_id == user_id)
        if status_filter and status_filter.strip() and status_filter.strip() != "all":
            query = query.filter(Order.status == status_filter.strip())
        orders = query.order_by(Order.created_at.desc()).all()
        return [o.to_dict() for o in orders]

    @staticmethod
    def get_order_detail(user_id: int, order_id: int) -> Dict[str, Any]:
        """
        Lấy chi tiết một đơn hàng của người dùng.
        - Trả về ORDER_NOT_FOUND (404) nếu đơn không tồn tại
        - Trả về FORBIDDEN (403) nếu đơn tồn tại nhưng thuộc tài khoản khác (và user không phải admin)
        """
        order = db.session.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise ValueError("ORDER_NOT_FOUND")

        if order.user_id != user_id:
            from app.models.user import User
            user = db.session.query(User).filter(User.id == user_id).first()
            if not user or user.role != "admin":
                raise ValueError("FORBIDDEN")

        return order.to_dict()

    @staticmethod
    def cancel_order(user_id: int, order_id: int, reason: Optional[str] = None) -> Dict[str, Any]:
        """
        Hủy đơn hàng khi chưa chuyển sang giao hàng (QTN-04) và hoàn tồn kho (QTN-03).

        Args:
            user_id: ID khách hàng
            order_id: ID đơn hàng
            reason: Lý do hủy (tùy chọn)

        Returns:
            Dict chi tiết đơn hàng sau khi hủy.

        Raises:
            ValueError: ORDER_NOT_FOUND (404), FORBIDDEN (403),
                        ORDER_ALREADY_CANCELLED (400), CANNOT_CANCEL_SHIPPED_ORDER (400)
        """
        order = db.session.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise ValueError("ORDER_NOT_FOUND")

        # 1. Kiểm tra phân quyền (Khách sở hữu đơn hoặc Admin)
        if order.user_id != user_id:
            from app.models.user import User
            user = db.session.query(User).filter(User.id == user_id).first()
            if not user or user.role != "admin":
                raise ValueError("FORBIDDEN")

        # 2. Kiểm tra quy tắc trạng thái (QTN-04)
        if order.status == "cancelled":
            raise ValueError("ORDER_ALREADY_CANCELLED")

        if order.status in ["shipping", "delivered"]:
            raise ValueError("CANNOT_CANCEL_SHIPPED_ORDER")

        if order.status not in ["pending", "confirmed", "processing"]:
            raise ValueError("CANNOT_CANCEL_ORDER")

        # 3. Chuyển trạng thái đơn thành cancelled
        order.status = "cancelled"
        if reason and reason.strip():
            order.note = f"{order.note} | Lý do hủy: {reason.strip()}" if order.note else f"Lý do hủy: {reason.strip()}"

        # 4. Hoàn lại số lượng tồn kho sản phẩm (QTN-03)
        for item in order.items:
            product = db.session.query(Product).filter(Product.id == item.product_id).first()
            if product:
                product.stock += item.quantity

        db.session.commit()
        return order.to_dict()

    @staticmethod
    def update_order_status(
        admin_id: int, order_id: int, new_status: str, note: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Admin cập nhật trạng thái đơn hàng theo đúng State Machine quy trình và hoàn kho QTN-03 khi hủy đơn.

        Args:
            admin_id: ID của Quản trị viên
            order_id: ID đơn hàng
            new_status: Trạng thái mới ('pending', 'confirmed', 'shipping', 'delivered', 'cancelled')
            note: Ghi chú phản hồi (tùy chọn)

        Returns:
            Dict chi tiết đơn hàng sau khi cập nhật.

        Raises:
            ValueError: FORBIDDEN (403), ORDER_NOT_FOUND (404),
                        INVALID_STATUS (400), INVALID_STATUS_TRANSITION (400)
        """
        # 1. Kiểm tra quyền Admin
        from app.models.user import User
        admin = db.session.query(User).filter(User.id == admin_id).first()
        if not admin or admin.role != "admin":
            raise ValueError("FORBIDDEN")

        # 2. Kiểm tra đơn hàng tồn tại
        order = db.session.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise ValueError("ORDER_NOT_FOUND")

        # 3. Kiểm tra trạng thái mới có hợp lệ không
        valid_statuses = ["pending", "confirmed", "shipping", "delivered", "cancelled"]
        if new_status not in valid_statuses:
            raise ValueError("INVALID_STATUS")

        current_status = order.status

        # 4. Kiểm tra quy tắc chuyển đổi State Machine
        if current_status == new_status:
            raise ValueError("INVALID_STATUS_TRANSITION_SAME")

        if current_status in ["delivered", "cancelled"]:
            raise ValueError("INVALID_STATUS_TRANSITION_FINAL")

        allowed_transitions = {
            "pending": ["confirmed", "cancelled"],
            "confirmed": ["shipping", "cancelled"],
            "shipping": ["delivered"],
        }

        if new_status not in allowed_transitions.get(current_status, []):
            raise ValueError("INVALID_STATUS_TRANSITION")

        # 5. Nếu chuyển sang cancelled: Hoàn lại tồn kho sản phẩm (QTN-03)
        if new_status == "cancelled":
            for item in order.items:
                product = db.session.query(Product).filter(Product.id == item.product_id).first()
                if product:
                    product.stock += item.quantity

        # 6. Cập nhật trạng thái và ghi chú
        order.status = new_status
        if note and note.strip():
            order.note = f"{order.note} | Admin: {note.strip()}" if order.note else f"Admin: {note.strip()}"

        db.session.commit()
        return order.to_dict()



