"""
services/product_service.py — Business logic layer cho Quản lý Sản phẩm.

Bao gồm:
- Search & Filter sản phẩm với `name` hoặc `description` LIKE %search%
- Phân trang results
- Auto-seed dữ liệu sản phẩm ban đầu cho testing
"""

import logging
from typing import Dict, Any, Optional
from sqlalchemy import or_
from app.extensions import db
from app.models.product import Product

logger = logging.getLogger(__name__)


class ProductService:
    """Service xử lý nghiệp vụ liên quan tới Sản phẩm."""

    @staticmethod
    def search_products(
        search_query: Optional[str] = None,
        category: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        sort: Optional[str] = "newest",
        page: int = 1,
        limit: int = 12,
    ) -> Dict[str, Any]:
        """
        Tìm kiếm, lọc khoảng giá và sắp xếp danh sách sản phẩm.

        Args:
            search_query: Từ khóa tìm kiếm (khớp name hoặc description)
            category:     Danh mục lọc ('ban', 'ghe', 'ke', 'tu', 'trang-tri')
            min_price:    Giá tối thiểu
            max_price:    Giá tối đa
            sort:         Tiêu chí sắp xếp: 'newest', 'price_asc', 'price_desc', 'rating_desc'
            page:         Số trang (mặc định 1)
            limit:        Số sản phẩm mỗi trang (mặc định 12)

        Returns:
            Dict chứa danh sách `items` và metadata `pagination`.
        """
        query = db.session.query(Product).filter(Product.is_active == True)

        # Lọc theo danh mục
        if category and category.strip():
            query = query.filter(Product.category == category.strip().lower())

        # Lọc theo từ khóa (name OR description ILIKE/LIKE %search_query%)
        if search_query and search_query.strip():
            term = f"%{search_query.strip()}%"
            query = query.filter(
                or_(
                    Product.name.ilike(term),
                    Product.description.ilike(term),
                )
            )

        # Lọc theo khoảng giá (Effective Price = discount_price nếu có, ngược lại là price)
        effective_price = db.func.coalesce(Product.discount_price, Product.price)

        if min_price is not None and min_price >= 0:
            query = query.filter(effective_price >= min_price)

        if max_price is not None and max_price >= 0:
            query = query.filter(effective_price <= max_price)

        # Sắp xếp
        if sort == "price_asc":
            query = query.order_by(effective_price.asc())
        elif sort == "price_desc":
            query = query.order_by(effective_price.desc())
        elif sort == "rating_desc":
            query = query.order_by(Product.rating.desc(), Product.rating_count.desc())
        else:
            # 'newest' hoặc mặc định
            query = query.order_by(Product.created_at.desc())

        # Tổng số items khớp filter
        total_items = query.count()

        # Calculation pagination
        page = max(1, page)
        limit = max(1, min(100, limit))
        total_pages = (total_items + limit - 1) // limit if total_items > 0 else 1

        offset = (page - 1) * limit
        products = query.offset(offset).limit(limit).all()

        return {
            "items": [p.to_dict() for p in products],
            "pagination": {
                "page": page,
                "limit": limit,
                "total_items": total_items,
                "total_pages": total_pages,
            },
        }

    @staticmethod
    def get_categories_summary() -> list:
        """
        Lấy danh sách các danh mục tiêu chuẩn kèm tổng số sản phẩm active (count).

        Returns:
            List of dict: [{ id, name, count }, ...]
        """
        categories_def = [
            {"id": "ban", "name": "Bàn ăn & Bàn làm việc"},
            {"id": "ghe", "name": "Ghế & Sofa"},
            {"id": "ke", "name": "Kệ sách & Tivi"},
            {"id": "tu", "name": "Tủ quần áo & Trang trí"},
            {"id": "trang-tri", "name": "Trang trí & Đèn"},
            {"id": "phong-ngu", "name": "Phòng ngủ (Trống)"},
        ]

        # Đếm sản phẩm theo category
        counts_query = (
            db.session.query(Product.category, db.func.count(Product.id))
            .filter(Product.is_active == True)
            .group_by(Product.category)
            .all()
        )
        count_map = {cat: count for cat, count in counts_query}

        result = []
        for cat in categories_def:
            result.append(
                {
                    "id": cat["id"],
                    "name": cat["name"],
                    "count": count_map.get(cat["id"], 0),
                }
            )

        return result

    @staticmethod
    def compare_products(product_ids: list) -> list:
        """
        Lấy danh sách thông số các sản phẩm để so sánh (tối đa 3 sản phẩm).

        Args:
            product_ids: List các ID sản phẩm (2 đến 3 IDs)

        Returns:
            List các product dictionary.

        Raises:
            ValueError("INVALID_COMPARE_COUNT"): Nếu ít hơn 2 IDs.
            ValueError("COMPARE_LIMIT_EXCEEDED"): Nếu nhiều hơn 3 IDs.
        """
        if not product_ids or len(product_ids) < 2:
            raise ValueError("INVALID_COMPARE_COUNT")

        if len(product_ids) > 3:
            raise ValueError("COMPARE_LIMIT_EXCEEDED")

        products = (
            db.session.query(Product)
            .filter(Product.id.in_(product_ids), Product.is_active == True)
            .all()
        )

        # Giữ nguyên thứ tự ID người dùng đã truyền vào
        prod_map = {p.id: p for p in products}
        ordered_products = [prod_map[pid] for pid in product_ids if pid in prod_map]

        return [p.to_dict() for p in ordered_products]

    @staticmethod
    def seed_initial_products() -> None:
        """Helper tự động seed dữ liệu 8+ sản phẩm mẫu nếu DB rỗng."""
        if db.session.query(Product).count() > 0:
            return

        sample_products = [
            Product(
                name="Bộ Sofa Gỗ Óc Chó Cao Cấp",
                slug="bo-sofa-go-oc-cho-cao-cap",
                description="Bộ sofa gỗ óc chó tự nhiên kết hợp đệm bọc da Ý cao cấp sang trọng cho phòng khách.",
                price=28500000.00,
                discount_price=25000000.00,
                category="ghe",
                stock=5,
                image_url="https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
                is_active=True,
            ),
            Product(
                name="Ghế Sofa Văng Da Hiện Đại",
                slug="ghe-sofa-vang-da-hien-dai",
                description="Sofa văng da bò thật phong cách Bắc Âu tối giản, khung gỗ sồi chắc chắn.",
                price=15800000.00,
                discount_price=None,
                category="ghe",
                stock=8,
                image_url="https://images.unsplash.com/photo-1586023492125-27b2c045efd7",
                is_active=True,
            ),
            Product(
                name="Bàn Ăn Gỗ Sồi 6 Ghế",
                slug="ban-an-go-soi-6-ghe",
                description="Bộ bàn ăn gia đình 6 ghế bằng gỗ sồi Nga lau màu óc chó tinh tế.",
                price=12500000.00,
                discount_price=10900000.00,
                category="ban",
                stock=10,
                image_url="https://images.unsplash.com/photo-1617806118233-18e1de247200",
                is_active=True,
            ),
            Product(
                name="Bàn Làm Việc Chân Sắt Tối Giản",
                slug="ban-lam-viec-chan-sat-toi-gian",
                description="Bàn làm việc mặt gỗ công nghiệp phủ Melamine chống xước, chân sắt sơn tĩnh điện.",
                price=2450000.00,
                discount_price=None,
                category="ban",
                stock=20,
                image_url="https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd",
                is_active=True,
            ),
            Product(
                name="Kệ Sách Gỗ Khung Kim Loại",
                slug="ke-sach-go-khung-kim-loai",
                description="Kệ sách trang trí 5 tầng khung thép tĩnh điện phong cách Industrial.",
                price=3200000.00,
                discount_price=2800000.00,
                category="ke",
                stock=15,
                image_url="https://images.unsplash.com/photo-1594620302200-9a762244a156",
                is_active=True,
            ),
            Product(
                name="Kệ Tivi Gỗ Tự Nhiên Modern",
                slug="ke-tivi-go-tu-nhien-modern",
                description="Kệ tivi phòng khách thiết kế nhiều ngăn kéo lưu trữ tiện lợi.",
                price=6800000.00,
                discount_price=None,
                category="ke",
                stock=7,
                image_url="https://images.unsplash.com/photo-1595428774223-ef52624120d2",
                is_active=True,
            ),
            Product(
                name="Tủ Quần Áo 4 Cánh Cửa Lùa",
                slug="tu-quan-ao-4-canh-cua-lua",
                description="Tủ quần áo hiện đại tích hợp gương soi toàn thân và kệ trang trí bên hông.",
                price=14500000.00,
                discount_price=12900000.00,
                category="tu",
                stock=4,
                image_url="https://images.unsplash.com/photo-1558997519-83ea9252edf8",
                is_active=True,
            ),
            Product(
                name="Đèn Sàn Trang Trí Đọc Sách Scandinavian",
                slug="den-san-trang-tri-doc-sach-scandinavian",
                description="Đèn cây trang trí góc sofa với ánh sáng vàng ấm áp bảo vệ mắt.",
                price=1200000.00,
                discount_price=950000.00,
                category="trang-tri",
                stock=25,
                image_url="https://images.unsplash.com/photo-1507473885765-e6ed057f782c",
                is_active=True,
            ),
        ]

        db.session.add_all(sample_products)
        try:
            db.session.commit()
            logger.info("Successfully seeded %d sample products", len(sample_products))
        except Exception as exc:
            db.session.rollback()
            logger.error("Error seeding products: %s", exc)
