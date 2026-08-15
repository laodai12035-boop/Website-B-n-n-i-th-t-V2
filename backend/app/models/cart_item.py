"""
app/models/cart_item.py — SQLAlchemy Model cho bảng cart_items (Giỏ hàng của người dùng).
"""

from datetime import datetime
from app.extensions import db


class CartItem(db.Model):
    """Bảng lưu thông tin các sản phẩm trong giỏ hàng của từng tài khoản."""

    __tablename__ = "cart_items"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    product_id = db.Column(
        db.Integer, db.ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True
    )
    quantity = db.Column(db.Integer, nullable=False, default=1)
    unit_price_override = db.Column(db.Float, nullable=True, comment="Giá ưu đãi tùy chỉnh khi mua theo Combo QTN-05")
    added_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        db.UniqueConstraint("user_id", "product_id", name="uix_user_product_cart"),
    )

    # Relationships
    user = db.relationship("User", backref=db.backref("cart_items", lazy="dynamic", cascade="all, delete-orphan"))
    product = db.relationship("Product", backref=db.backref("cart_items", lazy="dynamic", cascade="all, delete-orphan"))

    def to_dict(self):
        if self.unit_price_override is not None and float(self.unit_price_override) > 0:
            unit_price = float(self.unit_price_override)
        else:
            raw_price = self.product.discount_price if (self.product and self.product.discount_price and float(self.product.discount_price) < float(self.product.price)) else (self.product.price if self.product else 0.0)
            unit_price = float(raw_price) if raw_price else 0.0

        return {
            "id": self.id,
            "user_id": self.user_id,
            "product_id": self.product_id,
            "quantity": self.quantity,
            "unit_price_override": float(self.unit_price_override) if self.unit_price_override else None,
            "price": unit_price,
            "subtotal": round(unit_price * self.quantity, 2),
            "product": self.product.to_dict() if self.product else None,
            "added_at": self.added_at.isoformat() if self.added_at else None,
        }
