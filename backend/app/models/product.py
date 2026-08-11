"""
models/product.py — SQLAlchemy model cho bảng products.

Theo quy định tại product-context.md:
- id, name, slug, description, price, discount_price, category, stock, image_url, is_active
- category nằm trong tập ['ban', 'ghe', 'ke', 'tu', 'trang-tri']
"""

from datetime import datetime
from app.extensions import db


class Product(db.Model):
    """Model đại diện cho sản phẩm nội thất trong hệ thống."""

    __tablename__ = "products"

    # Primary key
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # Thông tin cơ bản
    name = db.Column(db.String(200), nullable=False, index=True, comment="Tên sản phẩm")
    slug = db.Column(db.String(200), unique=True, nullable=False, index=True, comment="Slug URL")
    description = db.Column(db.Text, nullable=True, comment="Mô tả chi tiết sản phẩm")
    price = db.Column(db.Numeric(10, 2), nullable=False, comment="Giá niêm yết")
    discount_price = db.Column(db.Numeric(10, 2), nullable=True, comment="Giá khuyến mãi")
    category = db.Column(db.String(50), nullable=False, index=True, comment="Danh mục: ban, ghe, ke, tu, trang-tri")
    stock = db.Column(db.Integer, nullable=False, default=0, comment="Số lượng tồn kho")
    image_url = db.Column(db.String(500), nullable=True, comment="URL ảnh đại diện sản phẩm")
    material = db.Column(db.String(100), nullable=True, comment="Chất liệu sản phẩm")
    dimensions = db.Column(db.String(100), nullable=True, comment="Kích thước (Dài x Rộng x Cao)")
    rating = db.Column(db.Float, nullable=False, default=5.0, comment="Đánh giá trung bình (1-5 sao)")
    rating_count = db.Column(db.Integer, nullable=False, default=0, comment="Tổng số lượt đánh giá")
    is_active = db.Column(db.Boolean, nullable=False, default=True, comment="True = hiển thị")

    # Timestamps
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<Product id={self.id} name='{self.name}' price={self.price}>"

    def to_dict(self) -> dict:
        """Serialize Product thành dict để trả về API."""
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "description": self.description,
            "price": float(self.price) if self.price is not None else 0.0,
            "discount_price": float(self.discount_price) if self.discount_price is not None else None,
            "category": self.category,
            "stock": self.stock,
            "image_url": self.image_url,
            "material": self.material or "Gỗ tự nhiên cao cấp",
            "dimensions": self.dimensions or "Đang cập nhật",
            "rating": float(self.rating) if self.rating is not None else 5.0,
            "rating_count": self.rating_count or 0,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
