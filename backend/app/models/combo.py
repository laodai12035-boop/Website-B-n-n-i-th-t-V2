"""
app/models/combo.py — SQLAlchemy models cho Combo và ComboItem (NT-05-CN-005).

Quan hệ:
- Combo (1) ↔ (N) ComboItem (N) ↔ (1) Product
- Admin tạo combo, Customer mua combo → thêm các sản phẩm vào giỏ hàng với giá ưu đãi.
"""

from datetime import datetime
from app.extensions import db


class Combo(db.Model):
    """Model đại diện cho 1 combo/bộ sản phẩm nội thất."""

    __tablename__ = "combos"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(200), nullable=False, comment="Tên combo (VD: Bộ phòng khách cao cấp)")
    description = db.Column(db.Text, nullable=True, comment="Mô tả combo")
    discount_percent = db.Column(
        db.Float, nullable=False, default=0.0,
        comment="Phần trăm giảm giá khi mua trọn bộ (0-100)"
    )
    is_active = db.Column(db.Boolean, nullable=False, default=True, comment="Admin bật/tắt combo")
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Relationship
    items = db.relationship(
        "ComboItem",
        backref="combo",
        lazy="joined",       # Eager load combo_items khi query Combo
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Combo id={self.id} name='{self.name}' discount={self.discount_percent}%>"

    def to_dict(self) -> dict:
        """Serialize Combo + items + products thành dict cho API."""
        from app.models.product import Product

        items_data = []
        original_total = 0.0
        combo_total = 0.0

        for item in self.items:
            product = db.session.query(Product).filter(
                Product.id == item.product_id, Product.is_active == True
            ).first()
            if not product:
                continue

            # Giá gốc (ưu tiên discount_price nếu có)
            original_price = float(
                product.discount_price if product.discount_price and product.discount_price > 0
                else product.price
            )
            combo_price = round(original_price * (1 - self.discount_percent / 100), 0)

            subtotal_original = round(original_price * item.quantity, 2)
            subtotal_combo = round(combo_price * item.quantity, 2)

            original_total += subtotal_original
            combo_total += subtotal_combo

            items_data.append({
                "combo_item_id": item.id,
                "product_id": product.id,
                "product_name": product.name,
                "product_slug": product.slug,
                "product_image": product.image_url,
                "quantity": item.quantity,
                "original_price": original_price,
                "combo_price": combo_price,
                "subtotal_original": subtotal_original,
                "subtotal_combo": subtotal_combo,
                "stock": product.stock,
            })

        savings = round(original_total - combo_total, 2)

        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "discount_percent": self.discount_percent,
            "is_active": self.is_active,
            "items": items_data,
            "original_total": round(original_total, 2),
            "combo_total": round(combo_total, 2),
            "savings": savings,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ComboItem(db.Model):
    """Model đại diện cho 1 sản phẩm thành phần trong combo."""

    __tablename__ = "combo_items"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    combo_id = db.Column(
        db.Integer,
        db.ForeignKey("combos.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_id = db.Column(
        db.Integer,
        db.ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    quantity = db.Column(db.Integer, nullable=False, default=1, comment="Số lượng sản phẩm này trong combo")

    __table_args__ = (
        db.UniqueConstraint("combo_id", "product_id", name="uix_combo_product"),
    )

    def __repr__(self) -> str:
        return f"<ComboItem combo={self.combo_id} product={self.product_id} qty={self.quantity}>"
