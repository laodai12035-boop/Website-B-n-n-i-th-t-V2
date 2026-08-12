"""
tests/test_product_related.py — Test cases cho chức năng Xem sản phẩm liên quan và gợi ý mua kèm.

Story: NT-03-CN-002 (NT-03-CN-003) — Xem sản phẩm liên quan và gợi ý
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: Xem sản phẩm có gợi ý liên quan -> 200 OK + Đúng các sản phẩm cùng danh mục (loại trừ ID hiện tại)
- TC-02: Sản phẩm thuộc danh mục không có sản phẩm khác -> 200 OK + Trả danh sách rỗng []
- TC-03: ID sản phẩm không tồn tại -> 404 Not Found (PRODUCT_NOT_FOUND)
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

        # Seed 3 sản phẩm danh mục 'ghe' và 1 sản phẩm độc nhất danh mục 'ke'
        p1 = Product(
            id=1,
            name="Bộ Sofa Gỗ Óc Chó",
            slug="sofa-oc-cho",
            price=28500000.0,
            category="ghe",
            rating=5.0,
            is_active=True,
        )
        p2 = Product(
            id=2,
            name="Ghế Sofa Văng Da",
            slug="sofa-vang-da",
            price=15800000.0,
            category="ghe",
            rating=4.8,
            is_active=True,
        )
        p3 = Product(
            id=3,
            name="Ghế Thư Giãn Bập Bênh",
            slug="ghe-thu-gian",
            price=3200000.0,
            category="ghe",
            rating=4.7,
            is_active=True,
        )
        p4_solo = Product(
            id=4,
            name="Kệ Sách Độc Bản",
            slug="ke-sach-doc-ban",
            price=4500000.0,
            category="ke",
            rating=4.9,
            is_active=True,
        )

        db.session.add_all([p1, p2, p3, p4_solo])
        db.session.commit()

        yield flask_app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Flask test client."""
    return app.test_client()


# ============================================================
# TC-01: Lấy danh sách sản phẩm liên quan (Happy Path)
# ============================================================

class TestProductRelatedSuccess:
    """TC-01: Kiểm tra lấy sản phẩm liên quan cùng danh mục."""

    def test_get_related_products_returns_same_category_excluding_current_id(self, client):
        """Gửi request cho ID=1 (danh mục 'ghe') trả về 200 OK + các sản phẩm 'ghe' khác (ID 2 và 3) (TC-01)."""
        response = client.get("/api/v1/products/1/related")
        assert response.status_code == 200

        body = response.get_json()
        assert body["status"] == "success"
        related = body["data"]["related_products"]

        assert len(related) == 2
        related_ids = [p["id"] for p in related]
        assert 1 not in related_ids  # Không chứa ID gốc 1
        assert 2 in related_ids
        assert 3 in related_ids
        assert all(p["category"] == "ghe" for p in related)

    def test_get_related_products_respects_limit(self, client):
        """Request với param limit=1 chỉ trả về tối đa 1 sản phẩm."""
        response = client.get("/api/v1/products/1/related?limit=1")
        assert response.status_code == 200

        body = response.get_json()
        related = body["data"]["related_products"]
        assert len(related) == 1


# ============================================================
# TC-02 & TC-03: Edge Cases & Sad Paths
# ============================================================

class TestProductRelatedEdgeCases:
    """TC-02 & TC-03: Kiểm tra các trường hợp không có sản phẩm liên quan hoặc ID sai."""

    def test_product_with_no_other_items_returns_empty_list(self, client):
        """ID=4 là sản phẩm duy nhất danh mục 'ke' -> Trả 200 OK và list rỗng [] (TC-02)."""
        response = client.get("/api/v1/products/4/related")
        assert response.status_code == 200

        body = response.get_json()
        assert body["data"]["related_products"] == []

    def test_non_existent_product_returns_404(self, client):
        """ID=9999 không tồn tại -> Trả 404 Not Found (TC-03)."""
        response = client.get("/api/v1/products/9999/related")
        assert response.status_code == 404

        body = response.get_json()
        assert body["status"] == "error"
        assert body["code"] == "PRODUCT_NOT_FOUND"
