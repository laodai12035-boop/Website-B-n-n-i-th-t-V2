"""
tests/test_cart.py — Test cases cho chức năng Thêm sản phẩm vào giỏ hàng và Quy tắc QTN-02.

Story: NT-04-CN-001 — Thêm sản phẩm vào giỏ hàng
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: Thêm sản phẩm với số lượng hợp lệ (<= tồn kho) -> 200 OK / 201 Created + sản phẩm nằm trong giỏ
- TC-02: Thêm sản phẩm với số lượng vượt tồn kho (QTN-02) -> 400 Bad Request (EXCEED_STOCK)
- Extra: GET /api/v1/cart, PUT /api/v1/cart/items/<id>, DELETE item, DELETE clear
"""

import pytest
from flask_jwt_extended import create_access_token
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.product import Product
from app.models.cart_item import CartItem


# ============================================================
# Fixtures
# ============================================================

@pytest.fixture(scope="function")
def app():
    """Tạo Flask app với TestingConfig (SQLite in-memory)."""
    flask_app = create_app("testing")
    with flask_app.app_context():
        db.create_all()

        user1 = User(
            id=1,
            email="customer@example.com",
            full_name="Khách Hàng Test",
            phone="0901234567",
            password_hash="pwd",
            role="user",
        )

        p1 = Product(
            id=1,
            name="Bộ Sofa Gỗ Óc Chó",
            slug="sofa-oc-cho",
            price=28500000.0,
            stock=10,
            category="ghe",
            is_active=True,
        )

        p2 = Product(
            id=2,
            name="Bàn Trà Mặt Đá",
            slug="ban-tra-da",
            price=6500000.0,
            stock=3,
            category="ban",
            is_active=True,
        )

        db.session.add_all([user1, p1, p2])
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
    """Token cho Khách hàng."""
    with app.app_context():
        token = create_access_token(identity="1")
        return {"Authorization": f"Bearer {token}"}


# ============================================================
# TC-01 & TC-02: Tests
# ============================================================

class TestCartSuccess:
    """TC-01: Kiểm thử luồng thêm sản phẩm vào giỏ hàng thành công."""

    def test_add_to_cart_valid_quantity_returns_200(self, client, auth_headers):
        """Thêm 2 sản phẩm (tồn kho 10) -> 200 OK + item trong giỏ (TC-01)."""
        response = client.post(
            "/api/v1/cart/items",
            json={"product_id": 1, "quantity": 2},
            headers=auth_headers,
        )
        assert response.status_code == 200

        body = response.get_json()
        assert body["status"] == "success"
        data = body["data"]

        assert data["cart_count"] == 2
        assert data["subtotal"] == 57000000.0
        assert len(data["items"]) == 1
        assert data["items"][0]["product_id"] == 1
        assert data["items"][0]["quantity"] == 2

    def test_get_cart_returns_items_and_total(self, client, auth_headers):
        """Lấy danh sách giỏ hàng sau khi đã thêm item."""
        client.post("/api/v1/cart/items", json={"product_id": 1, "quantity": 1}, headers=auth_headers)

        response = client.get("/api/v1/cart", headers=auth_headers)
        assert response.status_code == 200

        data = response.get_json()["data"]
        assert data["cart_count"] == 1
        assert len(data["items"]) == 1

    def test_update_cart_quantity_success(self, client, auth_headers):
        """Cập nhật số lượng hợp lệ trong giỏ."""
        client.post("/api/v1/cart/items", json={"product_id": 1, "quantity": 1}, headers=auth_headers)

        response = client.put("/api/v1/cart/items/1", json={"quantity": 5}, headers=auth_headers)
        assert response.status_code == 200
        assert response.get_json()["data"]["cart_count"] == 5

    def test_remove_cart_item_success(self, client, auth_headers):
        """Xóa 1 item khỏi giỏ hàng."""
        client.post("/api/v1/cart/items", json={"product_id": 1, "quantity": 1}, headers=auth_headers)

        response = client.delete("/api/v1/cart/items/1", headers=auth_headers)
        assert response.status_code == 200
        assert response.get_json()["data"]["cart_count"] == 0

    def test_clear_cart_success(self, client, auth_headers):
        """Xóa sạch giỏ hàng."""
        client.post("/api/v1/cart/items", json={"product_id": 1, "quantity": 1}, headers=auth_headers)
        client.post("/api/v1/cart/items", json={"product_id": 2, "quantity": 2}, headers=auth_headers)

        response = client.delete("/api/v1/cart/clear", headers=auth_headers)
        assert response.status_code == 200
        assert response.get_json()["data"]["cart_count"] == 0


class TestCartQTN02Validation:
    """TC-02: Kiểm thử vi phạm quy tắc QTN-02 (Không bán vượt tồn kho)."""

    def test_add_to_cart_exceeding_stock_rejected(self, client, auth_headers):
        """Thêm 20 sản phẩm khi tồn kho chỉ còn 10 -> 400 Bad Request EXCEED_STOCK (TC-02)."""
        response = client.post(
            "/api/v1/cart/items",
            json={"product_id": 1, "quantity": 20},
            headers=auth_headers,
        )
        assert response.status_code == 400

        body = response.get_json()
        assert body["status"] == "error"
        assert body["code"] == "EXCEED_STOCK"
        assert body["available_stock"] == 10

    def test_cumulative_quantity_exceeding_stock_rejected(self, client, auth_headers):
        """Đã có 8 sản phẩm trong giỏ, cố thêm 5 sản phẩm nữa (tổng 13 > 10) -> 400 EXCEED_STOCK (TC-02)."""
        # Step 1: Add 8 items (valid)
        client.post("/api/v1/cart/items", json={"product_id": 1, "quantity": 8}, headers=auth_headers)

        # Step 2: Try adding 5 more
        response = client.post("/api/v1/cart/items", json={"product_id": 1, "quantity": 5}, headers=auth_headers)
        assert response.status_code == 400
        assert response.get_json()["code"] == "EXCEED_STOCK"

    def test_update_quantity_exceeding_stock_rejected(self, client, auth_headers):
        """Cập nhật số lượng item trong giỏ thành 10 (cho sản phẩm ID=2 chỉ còn 3 stock) -> 400 EXCEED_STOCK."""
        client.post("/api/v1/cart/items", json={"product_id": 2, "quantity": 1}, headers=auth_headers)

        response = client.put("/api/v1/cart/items/2", json={"quantity": 10}, headers=auth_headers)
        assert response.status_code == 400
        assert response.get_json()["code"] == "EXCEED_STOCK"

    def test_unauthenticated_cart_access_returns_401(self, client):
        """Chưa đăng nhập truy cập giỏ hàng -> 401 Unauthorized."""
        response = client.get("/api/v1/cart")
        assert response.status_code == 401
