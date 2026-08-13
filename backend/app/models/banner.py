"""
app/models/banner.py — SQLAlchemy Model cho bảng banners (Banner Quảng Cáo Trang Chủ).
"""

from datetime import datetime
from app.extensions import db


class Banner(db.Model):
    """Bảng lưu thông tin banner quảng cáo hiển thị trên trang chủ (NT-11-CN-001)."""

    __tablename__ = "banners"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(255), nullable=False, comment="Tiêu đề banner")
    subtitle = db.Column(db.String(255), nullable=True, comment="Phụ đề banner")
    image_url = db.Column(db.String(500), nullable=False, comment="Đường dẫn hình ảnh banner (Bắt buộc)")
    link_url = db.Column(db.String(500), nullable=True, comment="Liên kết điều hướng khi nhấp banner")
    display_order = db.Column(db.Integer, default=0, nullable=False, comment="Thứ tự hiển thị")
    is_active = db.Column(db.Boolean, default=True, nullable=False, comment="Trạng thái hiển thị (True=Active)")
    start_date = db.Column(db.DateTime, nullable=True, comment="Thời gian bắt đầu hiển thị")
    end_date = db.Column(db.DateTime, nullable=True, comment="Thời gian kết thúc hiển thị")
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "subtitle": self.subtitle,
            "image_url": self.image_url,
            "link_url": self.link_url,
            "display_order": self.display_order,
            "is_active": self.is_active,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
