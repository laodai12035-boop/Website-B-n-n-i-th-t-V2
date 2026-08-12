from datetime import datetime
from app.extensions import db


class Coupon(db.Model):
    """SQLAlchemy Model cho bảng coupons (Mã giảm giá & Khuyến mãi QTN-01)."""

    __tablename__ = "coupons"

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    description = db.Column(db.String(255), nullable=True)
    discount_type = db.Column(db.String(20), nullable=False, default="percent")  # 'percent' hoặc 'fixed'
    discount_value = db.Column(db.Float, nullable=False)
    min_order_value = db.Column(db.Float, nullable=False, default=0.0)
    max_discount = db.Column(db.Float, nullable=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True, index=True)
    start_date = db.Column(db.DateTime, nullable=True)
    end_date = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def to_dict(self):
        """Chuyển đổi Coupon model sang dictionary."""
        return {
            "id": self.id,
            "code": self.code,
            "description": self.description,
            "discount_type": self.discount_type,
            "discount_value": float(self.discount_value),
            "min_order_value": float(self.min_order_value),
            "max_discount": float(self.max_discount) if self.max_discount is not None else None,
            "is_active": self.is_active,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
        }
