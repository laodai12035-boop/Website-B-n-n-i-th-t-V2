"""
models/category.py — SQLAlchemy model cho bảng categories (NT-08-CN-001).
"""

from datetime import datetime
from app.extensions import db


class Category(db.Model):
    """Model đại diện cho danh mục sản phẩm trong hệ thống."""

    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), unique=True, nullable=False, index=True, comment="Tên danh mục")
    slug = db.Column(db.String(100), unique=True, nullable=False, index=True, comment="Slug URL")
    description = db.Column(db.Text, nullable=True, comment="Mô tả danh mục")
    icon = db.Column(db.String(50), nullable=True, comment="Icon / Emoji biểu tượng")
    is_active = db.Column(db.Boolean, nullable=False, default=True, comment="Trạng thái hoạt động")

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<Category id={self.id} name='{self.name}' slug='{self.slug}'>"

    def to_dict(self) -> dict:
        """Serialize Category thành dict."""
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "description": self.description or "",
            "icon": self.icon or "📁",
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
