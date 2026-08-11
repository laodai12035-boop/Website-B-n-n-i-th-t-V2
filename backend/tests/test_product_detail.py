"""
tests/test_product_detail.py — Test cases cho chức năng Xem chi tiết sản phẩm.

Story: NT-03-CN-001 — Xem chi tiết sản phẩm
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: Xem chi tiết sản phẩm hợp lệ đang bán -> 200 OK + Hiển thị đầy đủ thông tin
- TC-02: Truy cập ID sản phẩm không tồn tại hoặc ngưng bán -> 404 Not Found (PRODUCT_NOT_FOUND)
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

        # Seed 1 sản phẩm active và 1 sản phẩm inactive (ngừng bán)
        p1 = Product(
            id=1,
            name="Bộ Sofa Gỗ Óc Chó",
            slug="sofa-oc-cho",
            description="Mô tả sản phẩm sofa cao cấp.",
            price=28500000.0,
            discount_price=25000000.0,
            category="ghe",
            material="Gỗ óc chó",
            dimensions="2.8m x 1.8m",
            rating=5.0,
            rating_count=12,
            stock=10,
            is_active=True,
        )
        p2_inactive = Product(
            id=2,
            name="Sản Phẩm Đã Ngừng Bán",
            slug="san-pham-ngung-ban",
            description="Sản phẩm cũ.",
            price=1000000.0,
            category="ban",
            is_active=False,  # Ngừng kinh doanh
        )
        db.session.add_all([p1, p2_inactive])
        db.session.commit()

        yield flask_app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Flask test client."""
    return app.test_client()


# ============================================================
# TC-01: Xem chi tiết sản phẩm hợp lệ (Happy Path)
# ============================================================

class TestProductDetailSuccess:
    """TC-01: Kiểm tra xem chi tiết sản phẩm đang được bán."""

    def test_get_valid_product_detail_returns_200(self, client):
        """Truy cập ID sản phẩm hợp lệ (1) trả về HTTP 200 OK + Đầy đủ thông số (TC-01)."""
        response = client.get("/api/v1/products/1")
        assert response.status_code == 200

        body = response.get_json()
        assert body["status"] == "success"
        product = body["data"]["product"]

        assert product["id"] == 1
        assert product["name"] == "Bộ Sofa Gỗ Óc Chó"
        assert product["price"] == 28500000.0
        assert product["discount_price"] == 25000000.0
        assert product["material"] == "Gỗ óc chó"
        assert product["dimensions"] == "2.8m x 1.8m"
        assert product["rating"] == 5.0
        assert product["stock"] == 10


# ============================================================
# TC-02: Dữ liệu không hợp lệ / ngưng bán (Sad Paths)
# ============================================================

class TestProductDetailInvalid:
    """TC-02: Kiểm tra truy cập sản phẩm không tồn tại hoặc đã bị ngưng bán."""

    def test_get_non_existent_product_returns_404(self, client):
        """Truy cập ID không tồn tại (9999) trả về 404 Not Found và code PRODUCT_NOT_FOUND (TC-02)."""
        response = client.get("/api/v1/products/9999")
        assert response.status_code == 404

        body = response.get_json()
        assert body["status"] == "error"
        assert body["code"] == "PRODUCT_NOT_FOUND"

    def test_get_inactive_product_returns_404(self, client):
        """Truy cập sản phẩm đã bị ngưng bán (is_active=False) trả về 404 Not Found (TC-02)."""
        response = client.get("/api/v1/products/2")
        assert response.status_code == 404

        body = response.get_json()
        assert body["status"] == "error"
        assert body["code"] == "PRODUCT_NOT_FOUND"
