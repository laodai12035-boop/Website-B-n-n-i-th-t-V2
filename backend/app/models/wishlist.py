"""
app/models/wishlist.py — SQLAlchemy Model cho bảng wishlists (Sản phẩm yêu thích).
"""

from datetime import datetime
from app.extensions import db


class Wishlist(db.Model):
    """Bảng lưu danh sách sản phẩm yêu thích của người dùng."""

    __tablename__ = "wishlists"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    product_id = db.Column(
        db.Integer, db.ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True
    )
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        db.UniqueConstraint("user_id", "product_id", name="uix_user_product_wishlist"),
    )

    # Relationships
    user = db.relationship("User", backref=db.backref("wishlist_items", lazy="dynamic", cascade="all, delete-orphan"))
    product = db.relationship("Product", backref=db.backref("favorited_by", lazy="dynamic", cascade="all, delete-orphan"))

    def to_dict(self):
        """Chuyển đổi object thành dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "product_id": self.product_id,
            "product": self.product.to_dict() if self.product else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
