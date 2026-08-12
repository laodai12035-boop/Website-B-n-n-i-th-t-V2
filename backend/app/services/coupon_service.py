from datetime import datetime
from typing import Dict, Any
from app.extensions import db
from app.models.coupon import Coupon


class CouponService:
    """Service quản lý và xác thực mã giảm giá (Tuân thủ QTN-01)."""

    @staticmethod
    def validate_and_apply(coupon_code: str, subtotal: float) -> Dict[str, Any]:
        """
        Xác thực điều kiện QTN-01 và tính toán số tiền giảm giá.

        Args:
            coupon_code: Mã giảm giá do khách nhập
            subtotal: Tạm tính đơn hàng (VND)

        Returns:
            Dict thông tin mã giảm giá và số tiền được trừ.

        Raises:
            ValueError: Khi không thỏa mãn điều kiện QTN-01
        """
        if not coupon_code or not coupon_code.strip():
            raise ValueError("COUPON_EMPTY")

        clean_code = coupon_code.strip().upper()
        now = datetime.utcnow()

        coupon = (
            db.session.query(Coupon)
            .filter(Coupon.code == clean_code, Coupon.is_active == True)
            .first()
        )

        if not coupon:
            raise ValueError("COUPON_EXPIRED_OR_INVALID")

        # Kiểm tra ngày hết hạn
        if coupon.end_date and coupon.end_date < now:
            raise ValueError("COUPON_EXPIRED_OR_INVALID")

        # Kiểm tra điều kiện QTN-01: Giá trị đơn tối thiểu
        if subtotal < coupon.min_order_value:
            raise ValueError(f"MIN_ORDER_VALUE_NOT_MET:{coupon.min_order_value}")

        # Tính toán mức giảm
        if coupon.discount_type == "percent":
            discount = subtotal * (coupon.discount_value / 100.0)
            if coupon.max_discount is not None and coupon.max_discount > 0:
                discount = min(discount, coupon.max_discount)
        else:
            discount = min(coupon.discount_value, subtotal)

        discount = round(float(discount), 2)
        final_total = max(0.0, round(subtotal - discount, 2))

        return {
            "coupon_code": coupon.code,
            "description": coupon.description,
            "discount_type": coupon.discount_type,
            "discount_value": coupon.discount_value,
            "discount_amount": discount,
            "min_order_value": coupon.min_order_value,
            "subtotal": float(subtotal),
            "final_total": final_total,
        }

    @staticmethod
    def get_active_coupons():
        """Lấy danh sách mã giảm giá đang hoạt động."""
        now = datetime.utcnow()
        coupons = (
            db.session.query(Coupon)
            .filter(Coupon.is_active == True)
            .all()
        )
        valid_coupons = [
            c.to_dict() for c in coupons if not c.end_date or c.end_date >= now
        ]
        return valid_coupons
