"""
app/services/qr_payment_service.py — Dịch vụ Thanh toán QR ngân hàng (NT-05-CN-002).

Sử dụng chuẩn VietQR quốc gia (NAPAS) để sinh mã QR liên ngân hàng.
URL QR được sinh hoàn toàn miễn phí qua img.vietqr.io, không cần API key.
"""

import os
import time
import random
from datetime import datetime, timedelta
from urllib.parse import quote
from typing import Dict, Any, Optional

from app.extensions import db
from app.models.order import Order, OrderItem
from app.models.cart_item import CartItem
from app.models.product import Product
from app.services.coupon_service import CouponService
from app.services.shipping_service import ShippingService

# ------------------------------------------------------------------ #
# Cấu hình tài khoản ngân hàng nhận tiền (đọc từ env hoặc dùng mặc định)
# ------------------------------------------------------------------ #
QR_BANK_ID = os.environ.get("QR_BANK_ID", "MB")
QR_ACCOUNT_NO = os.environ.get("QR_ACCOUNT_NO", "0327067055")
QR_ACCOUNT_NAME = os.environ.get("QR_ACCOUNT_NAME", "NGUYEN VAN A")
QR_EXPIRE_MINUTES = int(os.environ.get("QR_EXPIRE_MINUTES", "15"))
VIETQR_BASE_URL = "https://img.vietqr.io/image"


class QRPaymentService:
    """Service xử lý thanh toán qua mã QR ngân hàng (VietQR standard)."""

    @staticmethod
    def generate_vietqr_url(order_code: str, total_amount: float) -> str:
        """
        Sinh URL ảnh mã QR theo chuẩn VietQR (NAPAS).

        URL pattern:
        https://img.vietqr.io/image/{BANK_ID}-{ACCOUNT_NO}-qr_only.png
          ?amount={AMOUNT}&addInfo={ORDER_CODE}&accountName={NAME}
        """
        encoded_name = quote(QR_ACCOUNT_NAME)
        encoded_info = quote(f"Thanh toan {order_code}")
        amount_int = int(total_amount)

        url = (
            f"{VIETQR_BASE_URL}/{QR_BANK_ID}-{QR_ACCOUNT_NO}-qr_only.png"
            f"?amount={amount_int}"
            f"&addInfo={encoded_info}"
            f"&accountName={encoded_name}"
        )
        return url

    @staticmethod
    def _generate_order_code() -> str:
        """Tạo mã đơn hàng duy nhất dạng ORD-YYYYMMDD-XXXX."""
        date_str = time.strftime("%Y%m%d")
        random_digits = "".join([str(random.randint(0, 9)) for _ in range(4)])
        return f"ORD-{date_str}-{random_digits}"

    @staticmethod
    def create_qr_order(
        user_id: int,
        recipient_name: str,
        recipient_phone: str,
        shipping_address: str,
        note: Optional[str] = None,
        coupon_code: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Tạo đơn hàng Thanh toán QR ngân hàng.

        Returns:
            Dict chứa chi tiết đơn hàng, qr_url, bank_info, qr_expire_at.

        Raises:
            ValueError: MISSING_SHIPPING_INFO | CART_EMPTY | EXCEED_STOCK | QTN-01 errors
        """
        # 1. Kiểm tra thông tin nhận hàng
        if not recipient_name or not recipient_name.strip():
            raise ValueError("MISSING_RECIPIENT_NAME")
        if not recipient_phone or not recipient_phone.strip():
            raise ValueError("MISSING_RECIPIENT_PHONE")
        if not shipping_address or not shipping_address.strip():
            raise ValueError("MISSING_SHIPPING_ADDRESS")

        # 2. Lấy giỏ hàng
        cart_items = db.session.query(CartItem).filter(CartItem.user_id == user_id).all()
        if not cart_items:
            raise ValueError("CART_EMPTY")

        # 3. Kiểm tra tồn kho QTN-02
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

            item_price = float(
                product.discount_price
                if product.discount_price and product.discount_price > 0
                else product.price
            )
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

        # 4. Áp dụng mã giảm giá QTN-01
        discount_amount = 0.0
        if coupon_code and coupon_code.strip():
            coupon_res = CouponService.validate_and_apply(coupon_code, subtotal)
            discount_amount = coupon_res["discount_amount"]

        # 5. Tính phí vận chuyển QTN-07
        try:
            shipping_result = ShippingService.calculate_shipping_fee(user_id, shipping_address)
            shipping_fee = float(shipping_result["fee"])
        except Exception:
            shipping_fee = 0.0

        total_amount = max(0.0, round(subtotal - discount_amount + shipping_fee, 2))

        # 5. Tính thời hạn QR
        qr_expire_at = datetime.utcnow() + timedelta(minutes=QR_EXPIRE_MINUTES)
        order_code = QRPaymentService._generate_order_code()

        # 6. Tạo Order trong DB Transaction
        order = Order(
            order_code=order_code,
            user_id=user_id,
            recipient_name=recipient_name.strip(),
            recipient_phone=recipient_phone.strip(),
            shipping_address=shipping_address.strip(),
            note=note.strip() if note else None,
            payment_method="QR_BANK",
            payment_status="pending_payment",
            status="pending",
            subtotal=subtotal,
            discount_amount=discount_amount,
            shipping_fee=shipping_fee,
            total_amount=total_amount,
            qr_expire_at=qr_expire_at,
        )

        db.session.add(order)
        db.session.flush()

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
            cfg["product"].stock -= cfg["quantity"]

        # Xóa giỏ hàng
        db.session.query(CartItem).filter(CartItem.user_id == user_id).delete()
        db.session.commit()

        # 7. Sinh QR URL
        qr_url = QRPaymentService.generate_vietqr_url(order_code, total_amount)

        result = order.to_dict()
        result["qr_url"] = qr_url
        result["bank_info"] = {
            "bank_id": QR_BANK_ID,
            "account_no": QR_ACCOUNT_NO,
            "account_name": QR_ACCOUNT_NAME,
            "transfer_content": f"Thanh toan {order_code}",
        }
        return result

    @staticmethod
    def get_qr_status(order_id: int, user_id: int) -> Dict[str, Any]:
        """
        Lấy trạng thái thanh toán QR để frontend polling kiểm tra.

        Returns:
            { order_code, payment_status, expired, qr_url, qr_expire_at, ... }
        """
        order = (
            db.session.query(Order)
            .filter(Order.id == order_id, Order.user_id == user_id)
            .first()
        )
        if not order:
            raise ValueError("ORDER_NOT_FOUND")

        now = datetime.utcnow()
        expired = bool(order.qr_expire_at and order.qr_expire_at < now)
        qr_url = (
            QRPaymentService.generate_vietqr_url(order.order_code, order.total_amount)
            if not expired and order.payment_status == "pending_payment"
            else None
        )

        return {
            "order_id": order.id,
            "order_code": order.order_code,
            "payment_status": order.payment_status,
            "status": order.status,
            "expired": expired,
            "qr_url": qr_url,
            "qr_expire_at": order.qr_expire_at.isoformat() if order.qr_expire_at else None,
            "total_amount": float(order.total_amount),
            "bank_info": {
                "bank_id": QR_BANK_ID,
                "account_no": QR_ACCOUNT_NO,
                "account_name": QR_ACCOUNT_NAME,
                "transfer_content": f"Thanh toan {order.order_code}",
            },
        }

    @staticmethod
    def confirm_payment(order_id: int) -> Dict[str, Any]:
        """
        Admin xác nhận thanh toán QR thành công.
        Cập nhật payment_status='paid', status='confirmed'.

        Args:
            order_id: ID đơn hàng cần xác nhận.

        Returns:
            Dict chi tiết đơn hàng đã cập nhật.

        Raises:
            ValueError: ORDER_NOT_FOUND | ORDER_NOT_QR_BANK | ALREADY_PAID
        """
        order = db.session.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise ValueError("ORDER_NOT_FOUND")
        if order.payment_method != "QR_BANK":
            raise ValueError("ORDER_NOT_QR_BANK")
        if order.payment_status == "paid":
            raise ValueError("ALREADY_PAID")

        from app.services.stock_service import StockService

        order.payment_status = "paid"
        order.status = "confirmed"
        StockService.deduct_order_stock(order)
        db.session.commit()
        return order.to_dict()
