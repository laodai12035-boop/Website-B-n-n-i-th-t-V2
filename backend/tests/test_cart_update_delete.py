"""
tests/test_cart_update_delete.py — Test cases cho chức năng Cập nhật số lượng và Xóa sản phẩm trong giỏ hàng.

Story: NT-04-CN-002 — Cập nhật số lượng và xóa sản phẩm trong giỏ hàng
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: Tăng số lượng sản phẩm hợp lệ trong giới hạn tồn kho (từ 1 lên 3) -> 200 OK + Cập nhật đúng tổng tiền
- TC-02: Tăng số lượng vượt tồn kho (QTN-02) -> 400 Bad Request (EXCEED_STOCK)
- TC-03: Xóa sản phẩm khỏi giỏ hàng -> 200 OK + Sản phẩm không còn trong giỏ, tổng tiền giảm tương ứng
- Extra: Giảm số lượng về 0 -> Tự động xóa item khỏi giỏ
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
            stock=5,
            category="ban",
            is_active=True,
        )

        db.session.add_all([user1, p1, p2])
        db.session.commit()

        # Seed cart item for user1: Product 1 with quantity 1
        item1 = CartItem(id=1, user_id=1, product_id=1, quantity=1)
        item2 = CartItem(id=2, user_id=1, product_id=2, quantity=2)
        db.session.add_all([item1, item2])
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

class TestCartUpdateAndDelete:
    """Kiểm thử tính năng Cập nhật số lượng và Xóa giỏ hàng."""

    def test_increase_quantity_within_stock_limit_success(self, client, auth_headers):
        """Tăng số lượng sản phẩm ID=1 từ 1 lên 3 (tồn kho 10) -> 200 OK + tổng tiền cập nhật đúng (TC-01)."""
        response = client.put(
            "/api/v1/cart/items/1",
            json={"quantity": 3},
            headers=auth_headers,
        )
        assert response.status_code == 200

        body = response.get_json()
        assert body["status"] == "success"
        data = body["data"]

        # 3 * 28500000.0 + 2 * 6500000.0 = 85500000.0 + 13000000.0 = 98500000.0
        assert data["cart_count"] == 5
        assert data["subtotal"] == 98500000.0

        p1_item = next(i for i in data["items"] if i["product_id"] == 1)
        assert p1_item["quantity"] == 3
        assert p1_item["subtotal"] == 85500000.0

    def test_increase_quantity_exceeding_stock_rejected(self, client, auth_headers):
        """Tăng số lượng sản phẩm ID=1 lên 20 (tồn kho 10) -> 400 Bad Request EXCEED_STOCK (TC-02)."""
        response = client.put(
            "/api/v1/cart/items/1",
            json={"quantity": 20},
            headers=auth_headers,
        )
        assert response.status_code == 400

        body = response.get_json()
        assert body["status"] == "error"
        assert body["code"] == "EXCEED_STOCK"
        assert body["available_stock"] == 10

    def test_delete_cart_item_success(self, client, auth_headers):
        """Xóa sản phẩm ID=1 khỏi giỏ hàng -> 200 OK + item bị loại bỏ (TC-03)."""
        response = client.delete("/api/v1/cart/items/1", headers=auth_headers)
        assert response.status_code == 200

        body = response.get_json()
        data = body["data"]

        # Only item 2 remains (quantity 2 * 6500000.0 = 13000000.0)
        assert data["cart_count"] == 2
        assert data["subtotal"] == 13000000.0
        assert len(data["items"]) == 1
        assert data["items"][0]["product_id"] == 2

    def test_update_quantity_to_zero_deletes_item(self, client, auth_headers):
        """Cập nhật số lượng về 0 -> Tự động xóa item khỏi giỏ hàng."""
        response = client.put(
            "/api/v1/cart/items/1",
            json={"quantity": 0},
            headers=auth_headers,
        )
        assert response.status_code == 200

        data = response.get_json()["data"]
        assert len(data["items"]) == 1
        assert data["items"][0]["product_id"] == 2
