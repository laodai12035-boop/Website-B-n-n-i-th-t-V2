"""
app/models/review.py — SQLAlchemy Model cho bảng reviews (Đánh giá & Bình luận sản phẩm).
"""

from datetime import datetime
from app.extensions import db


class Review(db.Model):
    """Bảng lưu đánh giá và nhận xét của khách hàng cho sản phẩm."""

    __tablename__ = "reviews"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    product_id = db.Column(
        db.Integer, db.ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True
    )
    order_id = db.Column(
        db.Integer, db.ForeignKey("orders.id", ondelete="SET NULL"), nullable=True, index=True
    )
    rating = db.Column(db.Integer, nullable=False, comment="Số sao đánh giá từ 1 đến 5")
    comment = db.Column(db.Text, nullable=True, comment="Nội dung nhận xét chi tiết")
    is_approved = db.Column(db.Boolean, default=True, nullable=False, comment="Trạng thái duyệt hiển thị")
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        db.UniqueConstraint("user_id", "product_id", name="uix_user_product_review"),
    )

    # Relationships
    user = db.relationship("User", backref=db.backref("reviews", lazy="dynamic", cascade="all, delete-orphan"))
    product = db.relationship("Product", backref=db.backref("reviews", lazy="dynamic", cascade="all, delete-orphan"))

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "user_name": self.user.full_name if self.user else "Khách hàng",
            "product_id": self.product_id,
            "order_id": self.order_id,
            "rating": self.rating,
            "comment": self.comment,
            "is_approved": self.is_approved,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
