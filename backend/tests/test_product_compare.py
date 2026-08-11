"""
tests/test_product_compare.py — Test cases cho chức năng So sánh sản phẩm.

Story: NT-02-CN-004 — So sánh sản phẩm
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: So sánh 2 sản phẩm (Happy Path) -> 200 OK + Trả về danh sách thông số 2 sản phẩm
- TC-02: So sánh vượt quá 3 sản phẩm (Sad Path) -> 400 Bad Request (COMPARE_LIMIT_EXCEEDED)
- Extra: So sánh ít hơn 2 sản phẩm -> 400 Bad Request (INVALID_COMPARE_COUNT)
"""

import json
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
        # Seed 4 sản phẩm để thử nghiệm giới hạn 3 sản phẩm
        p1 = Product(
            id=1,
            name="Bộ Sofa Gỗ Óc Chó",
            slug="sofa-oc-cho",
            price=28500000.0,
            discount_price=25000000.0,
            category="ghe",
            material="Gỗ óc chó",
            dimensions="2.8m x 1.8m",
            is_active=True,
        )
        p2 = Product(
            id=2,
            name="Ghế Sofa Văng Da",
            slug="sofa-vang-da",
            price=15800000.0,
            category="ghe",
            material="Da bò thật",
            dimensions="2.2m x 0.9m",
            is_active=True,
        )
        p3 = Product(
            id=3,
            name="Bàn Ăn 6 Ghế",
            slug="ban-an-6-ghe",
            price=12500000.0,
            category="ban",
            material="Gỗ sồi Nga",
            dimensions="1.6m x 0.8m",
            is_active=True,
        )
        p4 = Product(
            id=4,
            name="Kệ Tivi Gỗ Tự Nhiên",
            slug="ke-tivi-go",
            price=6800000.0,
            category="ke",
            material="Gỗ sồi",
            dimensions="2.0m x 0.4m",
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
# TC-01: So sánh 2 hoặc 3 sản phẩm hợp lệ (Happy Path)
# ============================================================

class TestProductCompareSuccess:
    """TC-01: Kiểm tra so sánh 2 hoặc 3 sản phẩm hợp lệ."""

    def test_compare_2_products_returns_200_and_matrix(self, client):
        """So sánh 2 sản phẩm trả về 200 OK và đúng 2 items đầy đủ thông số (TC-01)."""
        response = client.post(
            "/api/v1/products/compare",
            data=json.dumps({"product_ids": [1, 2]}),
            content_type="application/json",
        )
        assert response.status_code == 200

        body = response.get_json()
        assert body["status"] == "success"
        products = body["data"]["products"]
        assert len(products) == 2
        assert products[0]["id"] == 1
        assert products[1]["id"] == 2
        assert "material" in products[0]
        assert "dimensions" in products[0]

    def test_compare_3_products_returns_200(self, client):
        """So sánh tối đa 3 sản phẩm trả về 200 OK."""
        response = client.post(
            "/api/v1/products/compare",
            data=json.dumps({"product_ids": [1, 2, 3]}),
            content_type="application/json",
        )
        assert response.status_code == 200

        body = response.get_json()
        assert len(body["data"]["products"]) == 3


# ============================================================
# TC-02: Giới hạn số lượng so sánh (Sad Paths)
# ============================================================

class TestProductCompareLimits:
    """TC-02: Kiểm tra giới hạn tối đa 3 sản phẩm và tối thiểu 2 sản phẩm."""

    def test_compare_exceeding_3_items_returns_400(self, client):
        """Gửi 4 sản phẩm trả về 400 Bad Request và code COMPARE_LIMIT_EXCEEDED (TC-02)."""
        response = client.post(
            "/api/v1/products/compare",
            data=json.dumps({"product_ids": [1, 2, 3, 4]}),
            content_type="application/json",
        )
        assert response.status_code == 400

        body = response.get_json()
        assert body["status"] == "error"
        assert body["code"] == "COMPARE_LIMIT_EXCEEDED"

    def test_compare_less_than_2_items_returns_400(self, client):
        """Gửi 1 sản phẩm trả về 400 Bad Request và code INVALID_COMPARE_COUNT."""
        response = client.post(
            "/api/v1/products/compare",
            data=json.dumps({"product_ids": [1]}),
            content_type="application/json",
        )
        assert response.status_code == 400

        body = response.get_json()
        assert body["status"] == "error"
        assert body["code"] == "INVALID_COMPARE_COUNT"
