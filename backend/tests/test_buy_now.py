"""
tests/test_buy_now.py — Test cases cho chức năng Mua ngay (Express Checkout & QTN-02).

Story: NT-04-CN-003 — Mua ngay
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: Mua ngay sản phẩm hợp lệ trong giới hạn tồn kho -> 200 OK + Giỏ hàng sẵn sàng cho Checkout
- TC-02: Mua ngay sản phẩm với số lượng vượt tồn kho (QTN-02) -> 400 Bad Request (EXCEED_STOCK)
- TC-03: Chưa đăng nhập gọi API Mua ngay -> 401 Unauthorized
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
            full_name="Khách Hàng Mua Ngay",
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

        db.session.add_all([user1, p1])
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
# TC-01, TC-02 & TC-03: Tests
# ============================================================

class TestBuyNow:
    """Kiểm thử tính năng Mua ngay (Express Checkout)."""

    def test_buy_now_valid_product_returns_200(self, client, auth_headers):
        """Mua ngay 1 sản phẩm ID=1 (tồn kho 10) -> 200 OK + sẵn sàng cho thanh toán (TC-01)."""
        response = client.post(
            "/api/v1/cart/buy-now",
            json={"product_id": 1, "quantity": 1},
            headers=auth_headers,
        )
        assert response.status_code == 200

        body = response.get_json()
        assert body["status"] == "success"
        data = body["data"]

        assert data["cart_count"] == 1
        assert data["subtotal"] == 28500000.0
        assert data["items"][0]["product_id"] == 1
        assert data["items"][0]["quantity"] == 1

    def test_buy_now_exceeding_stock_returns_400(self, client, auth_headers):
        """Mua ngay 20 sản phẩm ID=1 khi tồn kho chỉ có 10 -> 400 Bad Request EXCEED_STOCK (TC-02)."""
        response = client.post(
            "/api/v1/cart/buy-now",
            json={"product_id": 1, "quantity": 20},
            headers=auth_headers,
        )
        assert response.status_code == 400

        body = response.get_json()
        assert body["status"] == "error"
        assert body["code"] == "EXCEED_STOCK"
        assert body["available_stock"] == 10

    def test_buy_now_unauthenticated_returns_401(self, client):
        """Chưa đăng nhập gọi API buy-now -> 401 Unauthorized (TC-03)."""
        response = client.post("/api/v1/cart/buy-now", json={"product_id": 1, "quantity": 1})
        assert response.status_code == 401
