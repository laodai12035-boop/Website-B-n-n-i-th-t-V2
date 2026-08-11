"""
tests/test_product_category.py — Test cases cho chức năng Lọc sản phẩm theo danh mục.

Story: NT-02-CN-002 — Lọc sản phẩm theo danh mục
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: Lọc danh mục có sản phẩm (vd: "ghe") -> 200 OK + Đúng danh sách sản phẩm thuộc danh mục
- TC-02: Lọc danh mục chưa có sản phẩm (vd: "phong-ngu") -> 200 OK + items: [] & total_items: 0
- Extra: API GET /api/v1/products/categories trả về thống kê danh mục kèm số lượng sản phẩm
"""

import pytest
from app import create_app
from app.extensions import db
from app.models.product import Product


# ============================================================
# Fixtures
# ============================================================

@pytest.fixture(scope="function")
def app():
    """Tạo Flask app với TestingConfig (SQLite in-memory)."""
    flask_app = create_app("testing")
    with flask_app.app_context():
        db.create_all()
        # Seed sản phẩm thuộc nhiều danh mục khác nhau
        p1 = Product(
            name="Bộ Sofa Gỗ Óc Chó",
            slug="bo-sofa-go-oc-cho",
            description="Sofa phòng khách cao cấp.",
            price=28500000.00,
            category="ghe",
            is_active=True,
        )
        p2 = Product(
            name="Ghế Xoay Văn Phòng Ergonomic",
            slug="ghe-xoay-van-phong-ergonomic",
            description="Ghế làm việc bảo vệ cột sống.",
            price=3500000.00,
            category="ghe",
            is_active=True,
        )
        p3 = Product(
            name="Bàn Ăn 6 Ghế Gỗ Sồi",
            slug="ban-an-6-ghe-go-soi",
            description="Bàn ăn gia đình.",
            price=12500000.00,
            category="ban",
            is_active=True,
        )
        p4 = Product(
            name="Kệ Tivi Gỗ Tự Nhiên",
            slug="ke-tivi-go-tu-nhien",
            description="Kệ tivi phòng khách.",
            price=6800000.00,
            category="ke",
            is_active=True,
        )
        db.session.add_all([p1, p2, p3, p4])
        db.session.commit()

        yield flask_app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Flask test client."""
    return app.test_client()


# ============================================================
# TC-01: Lọc danh mục có sản phẩm (Happy Path)
# ============================================================

class TestCategoryFilterSuccess:
    """TC-01: Kiểm tra lọc theo danh mục có tồn tại sản phẩm."""

    def test_filter_by_category_ghe_returns_only_ghe_products(self, client):
        """Lọc danh mục 'ghe' chỉ trả về các sản phẩm thuộc danh mục 'ghe' (TC-01)."""
        response = client.get("/api/v1/products?category=ghe")
        assert response.status_code == 200

        body = response.get_json()
        assert body["status"] == "success"
        items = body["data"]["items"]

        assert len(items) == 2
        for item in items:
            assert item["category"] == "ghe"

    def test_filter_by_category_ban_returns_only_ban_products(self, client):
        """Lọc danh mục 'ban' chỉ trả về sản phẩm thuộc danh mục 'ban'."""
        response = client.get("/api/v1/products?category=ban")
        assert response.status_code == 200

        body = response.get_json()
        items = body["data"]["items"]

        assert len(items) == 1
        assert items[0]["name"] == "Bàn Ăn 6 Ghế Gỗ Sồi"


# ============================================================
# TC-02: Lọc danh mục chưa có sản phẩm (Empty Category)
# ============================================================

class TestCategoryFilterEmpty:
    """TC-02: Kiểm tra lọc theo danh mục chưa có sản phẩm."""

    def test_filter_empty_category_returns_200_and_empty_list(self, client):
        """Lọc danh mục chưa có sản phẩm ('phong-ngu') trả về 200 OK + items: [] (TC-02)."""
        response = client.get("/api/v1/products?category=phong-ngu")
        assert response.status_code == 200

        body = response.get_json()
        assert body["status"] == "success"
        assert body["data"]["items"] == []
        assert body["data"]["pagination"]["total_items"] == 0


# ============================================================
# Extra: API Thống kê Danh mục (Categories Summary)
# ============================================================

class TestCategoriesSummaryAPI:
    """Kiểm tra API GET /api/v1/products/categories."""

    def test_get_categories_summary_returns_category_counts(self, client):
        """API /products/categories trả về đúng danh sách và số lượng sản phẩm mỗi danh mục."""
        response = client.get("/api/v1/products/categories")
        assert response.status_code == 200

        body = response.get_json()
        assert body["status"] == "success"
        categories = body["data"]["categories"]

        cat_map = {c["id"]: c["count"] for c in categories}
        assert cat_map.get("ghe") == 2
        assert cat_map.get("ban") == 1
        assert cat_map.get("ke") == 1
        assert cat_map.get("phong-ngu") == 0
