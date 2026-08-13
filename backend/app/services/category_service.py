"""
services/category_service.py — Business Logic Quản lý Danh mục sản phẩm (NT-08-CN-001).
"""

import logging
import re
import unicodedata
from typing import Dict, Any, List
from sqlalchemy.sql import func
from app.extensions import db
from app.models.category import Category

logger = logging.getLogger(__name__)


def generate_slug(text: str) -> str:
    """Tạo slug URL an toàn từ chuỗi Tiếng Việt."""
    if not text:
        return ""
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    text = text.replace("đ", "d").replace("Đ", "d")
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-")


class CategoryService:
    """Service xử lý các tác vụ danh mục sản phẩm."""

    @staticmethod
    def seed_initial_categories():
        """Tự động khởi tạo các danh mục mặc định nếu DB chưa có."""
        if db.session.query(Category).count() > 0:
            return

        defaults = [
            {"name": "Bàn", "slug": "ban", "icon": "🪑", "description": "Bàn ăn, bàn làm việc, bàn trà hiện đại"},
            {"name": "Ghế", "slug": "ghe", "icon": "🛋️", "description": "Sofa, ghế ăn, ghế làm việc êm ái"},
            {"name": "Kệ", "slug": "ke", "icon": "📚", "description": "Kệ sách, kệ tivi, kệ trang trí đa năng"},
            {"name": "Tủ", "slug": "tu", "icon": "🚪", "description": "Tủ quần áo, tủ giày, tủ bếp gỗ tự nhiên"},
            {"name": "Trang trí", "slug": "trang-tri", "icon": "💡", "description": "Đèn trang trí, thảm, tranh treo tường"},
            {"name": "Phòng khách", "slug": "phong-khach", "icon": "🏠", "description": "Trọn bộ nội thất phòng khách sang trọng"},
        ]

        for item in defaults:
            cat = Category(
                name=item["name"],
                slug=item["slug"],
                icon=item["icon"],
                description=item["description"],
                is_active=True,
            )
            db.session.add(cat)
        db.session.commit()
        logger.info("Seeded initial categories to database.")

    @staticmethod
    def get_all_categories() -> List[Dict[str, Any]]:
        """Lấy tất cả danh mục sản phẩm đang active."""
        CategoryService.seed_initial_categories()
        categories = (
            db.session.query(Category)
            .filter(Category.is_active == True)
            .order_by(Category.id.asc())
            .all()
        )
        return [c.to_dict() for c in categories]

    @staticmethod
    def create_category(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Tạo danh mục sản phẩm mới dành cho Admin (NT-08-CN-001).

        Args:
            data: Dữ liệu đã validate từ CategorySchema (name, description, icon)

        Returns:
            Dict thông tin danh mục vừa tạo.

        Raises:
            ValueError("CATEGORY_EXISTS"): Tên danh mục đã tồn tại (case-insensitive).
        """
        CategoryService.seed_initial_categories()
        name_stripped = data["name"].strip()

        # Kiểm tra trùng tên (case-insensitive)
        existing = (
            db.session.query(Category)
            .filter(func.lower(Category.name) == name_stripped.lower())
            .first()
        )
        if existing:
            raise ValueError("CATEGORY_EXISTS")

        base_slug = generate_slug(name_stripped)
        slug = base_slug
        counter = 1

        # Đảm bảo slug unique
        while db.session.query(Category).filter(Category.slug == slug).first():
            slug = f"{base_slug}-{counter}"
            counter += 1

        new_category = Category(
            name=name_stripped,
            slug=slug,
            description=data.get("description", "").strip() if data.get("description") else None,
            icon=data.get("icon", "").strip() if data.get("icon") else "📁",
            is_active=data.get("is_active", True),
        )

        db.session.add(new_category)
        db.session.commit()

        logger.info("Admin created new category id=%s name='%s'", new_category.id, new_category.name)
        return new_category.to_dict()
