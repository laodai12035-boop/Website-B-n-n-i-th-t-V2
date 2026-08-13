"""
app/services/coupon_service.py — Service quản lý và xác thực mã giảm giá (NT-11-CN-002, QTN-01).
"""

import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.extensions import db
from app.models.coupon import Coupon

logger = logging.getLogger(__name__)


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
    def get_active_coupons() -> List[Dict[str, Any]]:
        """Lấy danh sách mã giảm giá đang hoạt động cho khách hàng."""
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

    # ============================================================
    # ADMIN CRUD METHODS (NT-11-CN-002)
    # ============================================================

    @staticmethod
    def get_all_coupons_admin() -> List[Dict[str, Any]]:
        """Quản trị viên lấy tất cả danh sách mã giảm giá (NT-11-CN-002)."""
        coupons = db.session.query(Coupon).order_by(Coupon.id.desc()).all()
        return [c.to_dict() for c in coupons]

    @staticmethod
    def create_coupon(
        code: str,
        discount_type: str,
        discount_value: float,
        description: Optional[str] = None,
        min_order_value: float = 0.0,
        max_discount: Optional[float] = None,
        is_active: bool = True,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """
        Quản trị viên tạo mã giảm giá mới (NT-11-CN-002).

        Raises:
            ValueError("COUPON_CODE_EMPTY"): Mã giảm giá bị rỗng.
            ValueError("COUPON_CODE_EXISTS"): Mã giảm giá đã tồn tại (TC-02).
            ValueError("INVALID_DISCOUNT_VALUE"): Mức giảm giá không hợp lệ.
        """
        if not code or not str(code).strip():
            raise ValueError("COUPON_CODE_EMPTY")

        clean_code = str(code).strip().upper()

        # Kiểm tra trùng mã (TC-02)
        existing = db.session.query(Coupon).filter(Coupon.code == clean_code).first()
        if existing:
            raise ValueError("COUPON_CODE_EXISTS")

        val = float(discount_value)
        if val <= 0:
            raise ValueError("INVALID_DISCOUNT_VALUE")

        if discount_type == "percent" and val > 100:
            raise ValueError("INVALID_DISCOUNT_PERCENT")

        coupon = Coupon(
            code=clean_code,
            description=description.strip() if description else None,
            discount_type=discount_type if discount_type in ("percent", "fixed") else "percent",
            discount_value=val,
            min_order_value=max(0.0, float(min_order_value)) if min_order_value is not None else 0.0,
            max_discount=float(max_discount) if max_discount is not None and float(max_discount) > 0 else None,
            is_active=bool(is_active),
            start_date=start_date,
            end_date=end_date,
        )

        db.session.add(coupon)
        db.session.commit()
        logger.info("[NT-11-CN-002] Admin created coupon code=%s id=%s", clean_code, coupon.id)

        return coupon.to_dict()

    @staticmethod
    def update_coupon(coupon_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Quản trị viên cập nhật mã giảm giá (NT-11-CN-002).

        Raises:
            ValueError("COUPON_NOT_FOUND"): Mã giảm giá không tồn tại.
            ValueError("COUPON_CODE_EXISTS"): Mã giảm giá mới bị trùng.
        """
        coupon = db.session.query(Coupon).filter(Coupon.id == coupon_id).first()
        if not coupon:
            raise ValueError("COUPON_NOT_FOUND")

        if "code" in data and data["code"]:
            new_code = str(data["code"]).strip().upper()
            if new_code != coupon.code:
                existing = db.session.query(Coupon).filter(Coupon.code == new_code).first()
                if existing:
                    raise ValueError("COUPON_CODE_EXISTS")
                coupon.code = new_code

        if "description" in data:
            coupon.description = str(data["description"]).strip() if data["description"] else None
        if "discount_type" in data and data["discount_type"] in ("percent", "fixed"):
            coupon.discount_type = data["discount_type"]
        if "discount_value" in data and data["discount_value"] is not None:
            val = float(data["discount_value"])
            if val > 0:
                coupon.discount_value = val
        if "min_order_value" in data and data["min_order_value"] is not None:
            coupon.min_order_value = max(0.0, float(data["min_order_value"]))
        if "max_discount" in data:
            coupon.max_discount = float(data["max_discount"]) if data["max_discount"] is not None and float(data["max_discount"]) > 0 else None
        if "is_active" in data and data["is_active"] is not None:
            coupon.is_active = bool(data["is_active"])
        if "start_date" in data:
            coupon.start_date = data["start_date"]
        if "end_date" in data:
            coupon.end_date = data["end_date"]

        db.session.commit()
        logger.info("[NT-11-CN-002] Admin updated coupon id=%s code=%s", coupon.id, coupon.code)

        return coupon.to_dict()

    @staticmethod
    def delete_coupon(coupon_id: int) -> bool:
        """
        Quản trị viên xóa mã giảm giá (NT-11-CN-002).

        Raises:
            ValueError("COUPON_NOT_FOUND"): Mã giảm giá không tồn tại.
        """
        coupon = db.session.query(Coupon).filter(Coupon.id == coupon_id).first()
        if not coupon:
            raise ValueError("COUPON_NOT_FOUND")

        db.session.delete(coupon)
        db.session.commit()
        logger.info("[NT-11-CN-002] Admin deleted coupon id=%s", coupon_id)
        return True
