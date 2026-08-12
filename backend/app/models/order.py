"""
app/models/order.py — SQLAlchemy Models cho bảng orders và order_items (NT-05-CN-001 COD, NT-05-CN-002 QR).
"""

from datetime import datetime
from app.extensions import db


class Order(db.Model):
    """Bảng lưu thông tin đơn hàng."""

    __tablename__ = "orders"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    order_code = db.Column(db.String(50), unique=True, nullable=True, index=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    recipient_name = db.Column(db.String(100), nullable=True)
    recipient_phone = db.Column(db.String(20), nullable=True)
    shipping_address = db.Column(db.String(255), nullable=True)
    note = db.Column(db.String(255), nullable=True)
    payment_method = db.Column(db.String(20), nullable=False, default="COD")  # 'COD', 'VNPAY'
    payment_status = db.Column(db.String(20), nullable=False, default="unpaid")  # 'unpaid', 'paid'
    status = db.Column(
        db.String(20), nullable=False, default="pending", comment="pending, confirmed, shipping, delivered, cancelled"
    )
    subtotal = db.Column(db.Float, nullable=False, default=0.0)
    discount_amount = db.Column(db.Float, nullable=False, default=0.0)
    shipping_fee = db.Column(db.Float, nullable=False, default=0.0, comment="Phí vận chuyển QTN-07")
    total_amount = db.Column(db.Float, nullable=False, default=0.0)
    qr_expire_at = db.Column(db.DateTime, nullable=True)  # NT-05-CN-002: QR payment expiry timestamp
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    items = db.relationship("OrderItem", backref="order", lazy="joined", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "order_code": self.order_code,
            "user_id": self.user_id,
            "recipient_name": self.recipient_name,
            "recipient_phone": self.recipient_phone,
            "shipping_address": self.shipping_address,
            "note": self.note,
            "payment_method": self.payment_method,
            "payment_status": self.payment_status,
            "status": self.status,
            "subtotal": float(self.subtotal),
            "discount_amount": float(self.discount_amount),
            "shipping_fee": float(self.shipping_fee) if self.shipping_fee is not None else 0.0,
            "total_amount": float(self.total_amount),
            "qr_expire_at": self.qr_expire_at.isoformat() if self.qr_expire_at else None,
            "items": [item.to_dict() for item in self.items],
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class OrderItem(db.Model):
    """Bảng chi tiết các sản phẩm trong đơn hàng."""

    __tablename__ = "order_items"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    order_id = db.Column(
        db.Integer, db.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True
    )
    product_id = db.Column(
        db.Integer, db.ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True
    )
    product_name = db.Column(db.String(200), nullable=True)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    price = db.Column(db.Float, nullable=False, default=0.0)
    subtotal = db.Column(db.Float, nullable=False, default=0.0)

    # Relationships
    product = db.relationship("Product")

    def to_dict(self):
        return {
            "id": self.id,
            "order_id": self.order_id,
            "product_id": self.product_id,
            "product_name": self.product_name or (self.product.name if self.product else None),
            "quantity": self.quantity,
            "price": float(self.price),
            "subtotal": float(self.subtotal),
            "product": self.product.to_dict() if self.product else None,
        }
