"""
tests/test_wishlist.py — Test cases cho chức năng Thêm và xóa sản phẩm yêu thích (Wishlist).

Story: NT-03-CN-003 — Thêm và xóa sản phẩm yêu thích
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: Người dùng đã đăng nhập -> Bấm yêu thích (POST /api/v1/wishlist) -> Sản phẩm được thêm/bỏ khỏi danh sách (201 / 200)
- TC-02: Người dùng chưa đăng nhập -> Gọi API -> 401 Unauthorized (UNAUTHORIZED)
- Extra: GET /api/v1/wishlist lấy danh sách yêu thích
- Extra: DELETE /api/v1/wishlist/<id> xóa trực tiếp sản phẩm khỏi danh sách
"""

import pytest
from flask_jwt_extended import create_access_token
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.product import Product
from app.models.wishlist import Wishlist


# ============================================================
# Fixtures
# ============================================================

@pytest.fixture(scope="function")
def app():
    """Tạo Flask app với TestingConfig (SQLite in-memory)."""
    flask_app = create_app("testing")
    with flask_app.app_context():
        db.create_all()

        # Create user
        user = User(
            id=1,
            email="customer@example.com",
            full_name="Khách Hàng",
            phone="0901234567",
            role="user",
        )
        user.set_password("Password123!")

        # Create products
        p1 = Product(
            id=1,
            name="Bộ Sofa Gỗ Óc Chó",
            slug="sofa-oc-cho",
            price=28500000.0,
            category="ghe",
            is_active=True,
        )
        p2 = Product(
            id=2,
            name="Bàn Ăn Gỗ Sồi 6 Ghế",
            slug="ban-an-go-soi",
            price=12500000.0,
            category="ban",
            is_active=True,
        )

        db.session.add_all([user, p1, p2])
        db.session.commit()

        yield flask_app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Flask test client."""
    return app.test_client()


@pytest.fixture
def auth_headers(app):
    """Tạo Authorization headers chứa JWT token hợp lệ."""
    with app.app_context():
        token = create_access_token(identity="1")
        return {"Authorization": f"Bearer {token}"}


# ============================================================
# TC-01: Luồng thành công (Toggle & Manage Wishlist)
# ============================================================

class TestWishlistSuccess:
    """TC-01: Kiểm tra thêm/xóa sản phẩm yêu thích khi đã đăng nhập."""

    def test_toggle_wishlist_add_product(self, client, auth_headers):
        """Bấm yêu thích sản phẩm ID=1 khi chưa có -> Thêm vào DB và trả về 201 Created (TC-01)."""
        response = client.post(
            "/api/v1/wishlist",
            json={"product_id": 1},
            headers=auth_headers,
        )
        assert response.status_code == 201

        body = response.get_json()
        assert body["status"] == "success"
        assert body["data"]["is_wishlisted"] is True
        assert body["data"]["product_id"] == 1

    def test_toggle_wishlist_remove_product(self, client, auth_headers):
        """Bấm yêu thích sản phẩm ID=1 lần 2 -> Tự động xóa khỏi DB và trả về 200 OK (TC-01)."""
        # Add first
        client.post("/api/v1/wishlist", json={"product_id": 1}, headers=auth_headers)

        # Toggle again to remove
        response = client.post(
            "/api/v1/wishlist",
            json={"product_id": 1},
            headers=auth_headers,
        )
        assert response.status_code == 200

        body = response.get_json()
        assert body["status"] == "success"
        assert body["data"]["is_wishlisted"] is False

    def test_get_wishlist_items(self, client, auth_headers):
        """Lấy danh sách sản phẩm yêu thích của người dùng."""
        # Thêm 2 sản phẩm vào wishlist
        client.post("/api/v1/wishlist", json={"product_id": 1}, headers=auth_headers)
        client.post("/api/v1/wishlist", json={"product_id": 2}, headers=auth_headers)

        response = client.get("/api/v1/wishlist", headers=auth_headers)
        assert response.status_code == 200

        body = response.get_json()
        items = body["data"]["items"]
        assert len(items) == 2
        item_ids = [item["id"] for item in items]
        assert 1 in item_ids
        assert 2 in item_ids

    def test_delete_wishlist_item(self, client, auth_headers):
        """Xóa trực tiếp sản phẩm khỏi wishlist bằng DELETE /api/v1/wishlist/<id>."""
        client.post("/api/v1/wishlist", json={"product_id": 1}, headers=auth_headers)

        response = client.delete("/api/v1/wishlist/1", headers=auth_headers)
        assert response.status_code == 200

        # Verify empty
        get_res = client.get("/api/v1/wishlist", headers=auth_headers)
        assert get_res.get_json()["data"]["items"] == []


# ============================================================
# TC-02: Luồng không có quyền (Unauthenticated Path)
# ============================================================

class TestWishlistUnauthorized:
    """TC-02: Kiểm tra chưa đăng nhập gọi API wishlist."""

    def test_toggle_wishlist_without_token_returns_401(self, client):
        """Khách chưa đăng nhập bấm yêu thích -> Trả về 401 Unauthorized (TC-02)."""
        response = client.post("/api/v1/wishlist", json={"product_id": 1})
        assert response.status_code == 401

    def test_get_wishlist_without_token_returns_401(self, client):
        """Khách chưa đăng nhập lấy wishlist -> Trả về 401 Unauthorized."""
        response = client.get("/api/v1/wishlist")
        assert response.status_code == 401

    def test_toggle_non_existent_product_returns_404(self, client, auth_headers):
        """Gửi product_id=9999 không tồn tại -> Trả về 404 Not Found."""
        response = client.post(
            "/api/v1/wishlist",
            json={"product_id": 9999},
            headers=auth_headers,
        )
        assert response.status_code == 404
        assert response.get_json()["code"] == "PRODUCT_NOT_FOUND"
