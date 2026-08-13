"""
models/address.py — SQLAlchemy Model đại diện cho Địa chỉ giao hàng của người dùng (NT-07).
"""

from datetime import datetime
from app.extensions import db


class Address(db.Model):
    """Bảng lưu trữ danh sách địa chỉ nhận hàng của người dùng (Max 10 địa chỉ/user)."""

    __tablename__ = "addresses"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    recipient_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(15), nullable=False)
    province = db.Column(db.String(100), nullable=False)
    district = db.Column(db.String(100), nullable=False)
    ward = db.Column(db.String(100), nullable=False)
    detail_address = db.Column(db.String(255), nullable=False)
    is_default = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        db.Index("idx_user_default", "user_id", "is_default"),
    )

    def to_dict(self) -> dict:
        """Serialize đối tượng Address ra Dict/JSON."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "recipient_name": self.recipient_name,
            "phone": self.phone,
            "province": self.province,
            "district": self.district,
            "ward": self.ward,
            "detail_address": self.detail_address,
            "is_default": self.is_default,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
