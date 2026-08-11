"""
tests/test_product_sort_filter.py — Test cases cho Lọc & Sắp xếp sản phẩm theo Giá và Đánh giá.

Story: NT-02-CN-003 — Lọc và sắp xếp sản phẩm theo giá, đánh giá
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: Sắp xếp giá tăng dần (sort=price_asc) -> 200 OK + Đúng thứ tự giá từ thấp đến cao
- TC-02: Lọc khoảng giá (min_price, max_price) -> 200 OK + Chỉ trả về sản phẩm trong khoảng giá
- Extra: Sắp xếp giá giảm dần (price_desc), sắp xếp đánh giá (rating_desc)
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
        # Seed sản phẩm với mức giá và rating khác nhau
        p1 = Product(
            name="Đèn Đọc Sách Scandinavian",
            slug="den-doc-sach",
            description="Đèn học giá rẻ.",
            price=1200000.00,
            discount_price=950000.00,  # Effective price = 950.000
            category="trang-tri",
            rating=4.5,
            rating_count=12,
            is_active=True,
        )
        p2 = Product(
            name="Bàn Làm Việc Chân Sắt",
            slug="ban-lam-viec",
            description="Bàn làm việc 1.2m.",
            price=2450000.00,
            discount_price=None,       # Effective price = 2.450.000
            category="ban",
            rating=4.8,
            rating_count=20,
            is_active=True,
        )
        p3 = Product(
            name="Bàn Ăn 6 Ghế Gỗ Sồi",
            slug="ban-an-6-ghe",
            description="Bàn ăn gia đình.",
            price=12500000.00,
            discount_price=10900000.00, # Effective price = 10.900.000
            category="ban",
            rating=4.9,
            rating_count=35,
            is_active=True,
        )
        p4 = Product(
            name="Bộ Sofa Gỗ Óc Chó",
            slug="bo-sofa-go-oc-cho",
            description="Sofa sang trọng.",
            price=28500000.00,
            discount_price=25000000.00, # Effective price = 25.000.000
            category="ghe",
            rating=5.0,
            rating_count=50,
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
# TC-01: Sắp xếp theo giá tăng dần (price_asc)
# ============================================================

class TestProductSort:
    """TC-01: Kiểm tra sắp xếp sản phẩm theo giá và đánh giá."""

    def test_sort_by_price_ascending(self, client):
        """Sắp xếp sort=price_asc trả về giá từ thấp đến cao (TC-01)."""
        response = client.get("/api/v1/products?sort=price_asc")
        assert response.status_code == 200

        body = response.get_json()
        items = body["data"]["items"]
        assert len(items) == 4

        # Tính giá hiệu lực (discount_price nếu có, ngược lại là price)
        prices = [item["discount_price"] if item["discount_price"] is not None else item["price"] for item in items]
        assert prices == sorted(prices)
        assert items[0]["name"] == "Đèn Đọc Sách Scandinavian"  # 950k
        assert items[-1]["name"] == "Bộ Sofa Gỗ Óc Chó"          # 25 triệu

    def test_sort_by_price_descending(self, client):
        """Sắp xếp sort=price_desc trả về giá từ cao đến thấp."""
        response = client.get("/api/v1/products?sort=price_desc")
        assert response.status_code == 200

        body = response.get_json()
        items = body["data"]["items"]
        prices = [item["discount_price"] if item["discount_price"] is not None else item["price"] for item in items]
        assert prices == sorted(prices, reverse=True)
        assert items[0]["name"] == "Bộ Sofa Gỗ Óc Chó"

    def test_sort_by_rating_descending(self, client):
        """Sắp xếp sort=rating_desc trả về đánh giá cao nhất trước."""
        response = client.get("/api/v1/products?sort=rating_desc")
        assert response.status_code == 200

        body = response.get_json()
        items = body["data"]["items"]
        assert items[0]["name"] == "Bộ Sofa Gỗ Óc Chó"  # rating 5.0
        assert items[0]["rating"] == 5.0


# ============================================================
# TC-02: Lọc theo khoảng giá (min_price & max_price)
# ============================================================

class TestProductPriceFilter:
    """TC-02: Kiểm tra lọc sản phẩm theo khoảng giá."""

    def test_filter_by_price_range_1_to_5_million(self, client):
        """Lọc min_price=1000000 & max_price=5000000 chỉ trả sản phẩm trong khoảng (TC-02)."""
        response = client.get("/api/v1/products?min_price=1000000&max_price=5000000")
        assert response.status_code == 200

        body = response.get_json()
        items = body["data"]["items"]

        # Chỉ có "Bàn Làm Việc Chân Sắt" (2.450.000đ)
        assert len(items) == 1
        assert items[0]["name"] == "Bàn Làm Việc Chân Sắt"

    def test_filter_by_min_price_only(self, client):
        """Lọc min_price=10000000 trả về sản phẩm có giá >= 10tr."""
        response = client.get("/api/v1/products?min_price=10000000")
        assert response.status_code == 200

        body = response.get_json()
        items = body["data"]["items"]
        assert len(items) == 2  # Bàn ăn (10.9tr) và Sofa (25tr)
