"""
tests/test_orders_cod.py — Test cases cho chức năng Thanh toán khi nhận hàng (COD).

Story: NT-05-CN-001 — Thanh toán khi nhận hàng (COD)
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: Chọn COD và nhập địa chỉ hợp lệ -> Đơn hàng tạo thành công 201 Created với status 'pending', payment_method 'COD', làm sạch giỏ hàng.
- TC-02: Thiếu địa chỉ giao hàng hoặc thông tin nhận hàng -> 400 Bad Request (MISSING_SHIPPING_INFO)
- TC-03: Giỏ hàng rỗng cố tạo đơn COD -> 400 Bad Request (CART_EMPTY)
"""

import pytest
from flask_jwt_extended import create_access_token
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.product import Product
from app.models.cart_item import CartItem
from app.models.order import Order, OrderItem


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
            full_name="Khách Hàng COD Test",
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

        # Seed cart item for user1: Product 1 with quantity 1
        item1 = CartItem(id=1, user_id=1, product_id=1, quantity=1)
        db.session.add(item1)
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

class TestOrdersCOD:
    """Kiểm thử tính năng Thanh toán khi nhận hàng COD."""

    def test_create_cod_order_success(self, client, auth_headers):
        """Đặt hàng COD thành công với thông tin địa chỉ đầy đủ -> 201 Created (TC-01)."""
        response = client.post(
            "/api/v1/orders/cod",
            json={
                "recipient_name": "Nguyễn Văn A",
                "recipient_phone": "0901234567",
                "shipping_address": "123 Đường Nguyễn Huệ, Quận 1, TP.HCM",
                "note": "Giao giờ hành chính",
            },
            headers=auth_headers,
        )
        assert response.status_code == 201

        body = response.get_json()
        assert body["status"] == "success"
        data = body["data"]

        assert data["order_code"].startswith("ORD-")
        assert data["status"] == "pending"
        assert data["payment_method"] == "COD"
        assert data["payment_status"] == "unpaid"
        assert data["total_amount"] == 28500000.0
        assert len(data["items"]) == 1

        # Check cart cleared
        cart_res = client.get("/api/v1/cart", headers=auth_headers)
        assert cart_res.get_json()["data"]["cart_count"] == 0

    def test_create_cod_order_missing_shipping_info_rejected(self, client, auth_headers):
        """Thiếu địa chỉ giao hàng -> 400 Bad Request MISSING_SHIPPING_INFO (TC-02)."""
        response = client.post(
            "/api/v1/orders/cod",
            json={
                "recipient_name": "Nguyễn Văn A",
                "recipient_phone": "0901234567",
                "shipping_address": "",  # Missing address
            },
            headers=auth_headers,
        )
        assert response.status_code == 400

        body = response.get_json()
        assert body["status"] == "error"
        assert body["code"] == "MISSING_SHIPPING_INFO"

    def test_create_cod_order_empty_cart_rejected(self, client, auth_headers):
        """Tạo đơn hàng COD khi giỏ rỗng -> 400 Bad Request CART_EMPTY (TC-03)."""
        # Clear cart first
        client.delete("/api/v1/cart/clear", headers=auth_headers)

        response = client.post(
            "/api/v1/orders/cod",
            json={
                "recipient_name": "Nguyễn Văn A",
                "recipient_phone": "0901234567",
                "shipping_address": "123 Đường Nguyễn Huệ",
            },
            headers=auth_headers,
        )
        assert response.status_code == 400
        assert response.get_json()["code"] == "CART_EMPTY"
