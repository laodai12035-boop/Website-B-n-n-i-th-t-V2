"""
tests/test_product_search.py — Test cases cho chức năng Tìm kiếm sản phẩm theo từ khóa.

Story: NT-02-CN-001 — Tìm kiếm sản phẩm theo từ khóa
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: Tìm kiếm từ khóa khớp sản phẩm (vd: "sofa") -> 200 OK + Danh sách khớp
- TC-02: Tìm kiếm từ khóa không tồn tại -> 200 OK + items: [] & total_items: 0
- Extra: Tìm kiếm case-insensitive ("SOFA"), lọc category, ẩn sản phẩm inactive
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
        # Seed sản phẩm thử nghiệm
        p1 = Product(
            name="Bộ Sofa Gỗ Óc Chó Cao Cấp",
            slug="bo-sofa-go-oc-cho-cao-cap",
            description="Sofa gỗ tự nhiên cực đẹp cho phòng khách sang trọng.",
            price=28500000.00,
            discount_price=25000000.00,
            category="ghe",
            stock=5,
            image_url="https://example.com/sofa.jpg",
            is_active=True,
        )
        p2 = Product(
            name="Bàn Ăn Gỗ Sồi 6 Ghế",
            slug="ban-an-go-soi-6-ghe",
            description="Bàn ăn 6 ghế hiện đại phù hợp gia đình.",
            price=12500000.00,
            category="ban",
            stock=10,
            image_url="https://example.com/ban-an.jpg",
            is_active=True,
        )
        p3 = Product(
            name="Ghế Sofa Văng Da Hàn Quốc",
            slug="ghe-sofa-vang-da-han-quoc",
            description="Sofa da cao cấp bọc đệm êm ái.",
            price=15000000.00,
            category="ghe",
            stock=3,
            image_url="https://example.com/sofa-da.jpg",
            is_active=True,
        )
        p_inactive = Product(
            name="Sofa Cũ Ẩn Hệ Thống",
            slug="sofa-cu-an-he-thong",
            description="Sofa không hiển thị.",
            price=5000000.00,
            category="ghe",
            stock=0,
            image_url="https://example.com/sofa-cu.jpg",
            is_active=False,
        )
        db.session.add_all([p1, p2, p3, p_inactive])
        db.session.commit()

        yield flask_app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Flask test client."""
    return app.test_client()


# ============================================================
# TC-01: Tìm kiếm có kết quả (Happy Path)
# ============================================================

class TestProductSearchSuccess:
    """TC-01: Tìm kiếm sản phẩm theo từ khóa hợp lệ."""

    def test_search_returns_matching_products(self, client):
        """Từ khóa 'sofa' trả về đúng các sản phẩm chứa từ 'sofa' (TC-01)."""
        response = client.get("/api/v1/products?search=sofa")
        assert response.status_code == 200

        body = response.get_json()
        assert body["status"] == "success"
        items = body["data"]["items"]

        # Chỉ có 2 sản phẩm active có chữ 'sofa' (p1, p3)
        assert len(items) == 2
        for item in items:
            assert "sofa" in item["name"].lower() or "sofa" in item["description"].lower()

    @pytest.mark.parametrize("query", ["SOFA", "Sofa", "sofa", "SoFa"])
    def test_search_case_insensitive(self, client, query):
        """Tìm kiếm không phân biệt hoa/thường."""
        response = client.get(f"/api/v1/products?search={query}")
        assert response.status_code == 200

        body = response.get_json()
        assert len(body["data"]["items"]) == 2

    def test_search_by_description(self, client):
        """Từ khóa có trong description vẫn được tìm thấy."""
        response = client.get("/api/v1/products?search=phòng+khách")
        assert response.status_code == 200

        body = response.get_json()
        assert len(body["data"]["items"]) == 1
        assert body["data"]["items"][0]["name"] == "Bộ Sofa Gỗ Óc Chó Cao Cấp"


# ============================================================
# TC-02: Không tìm thấy kết quả (Empty State)
# ============================================================

class TestProductSearchEmpty:
    """TC-02: Tìm kiếm với từ khóa không tồn tại."""

    def test_search_non_existent_keyword_returns_empty_list(self, client):
        """Từ khóa không tồn tại trả về list rỗng (TC-02)."""
        response = client.get("/api/v1/products?search=tivi_khong_ton_tai_xyz")
        assert response.status_code == 200

        body = response.get_json()
        assert body["status"] == "success"
        assert body["data"]["items"] == []
        assert body["data"]["pagination"]["total_items"] == 0

    def test_search_does_not_return_inactive_products(self, client):
        """Sản phẩm bị ẩn (is_active=False) không được xuất hiện trong kết quả search."""
        response = client.get("/api/v1/products?search=Sofa+Cũ+Ẩn")
        assert response.status_code == 200

        body = response.get_json()
        assert len(body["data"]["items"]) == 0
