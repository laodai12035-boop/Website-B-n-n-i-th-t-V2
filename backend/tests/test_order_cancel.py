"""
tests/test_order_cancel.py — Test cases cho chức năng Hủy đơn hàng và Hoàn tồn kho (NT-06-CN-003, QTN-03, QTN-04).

Story: NT-06-CN-003 — Hủy đơn hàng
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: Hủy đơn ở trạng thái pending thành công → 200 OK, đơn chuyển "cancelled", stock sản phẩm được hoàn lại (QTN-03).
- TC-01b: Hủy đơn ở trạng thái confirmed thành công → 200 OK, stock sản phẩm được hoàn lại.
- TC-02: Hủy đơn ở trạng thái shipping (Đang giao) → 400 CANNOT_CANCEL_SHIPPED_ORDER (QTN-04), stock giữ nguyên.
- TC-02b: Hủy đơn ở trạng thái delivered (Hoàn thành) → 400 CANNOT_CANCEL_SHIPPED_ORDER.
- TC-03: User 2 cố hủy đơn của User 1 → 403 FORBIDDEN, đơn giữ nguyên.
- TC-04: Hủy lại đơn đã ở trạng thái cancelled → 400 ORDER_ALREADY_CANCELLED.
- TC-05: Hủy đơn hàng không tồn tại -> 404 ORDER_NOT_FOUND.
- TC-06: Chưa đăng nhập → 401 Unauthorized.
- TC-07: Admin hủy đơn hàng hợp lệ của user → 200 OK, stock hoàn lại.
"""

import pytest
from flask_jwt_extended import create_access_token
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.product import Product
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
            id=1, email="user1@example.com", full_name="User Một",
            phone="0901234567", password_hash="pwd", role="user",
        )
        user2 = User(
            id=2, email="user2@example.com", full_name="User Hai",
            phone="0909876543", password_hash="pwd", role="user",
        )
        admin = User(
            id=3, email="admin@example.com", full_name="Admin",
            phone="0900000000", password_hash="pwd", role="admin",
        )

        # Product p1 có stock ban đầu = 8 (giả sử vừa bị trừ 2 khi đặt hàng)
        p1 = Product(
            id=1, name="Bộ Sofa Gỗ Óc Chó", slug="sofa-oc-cho",
            price=28500000.0, stock=8, category="ghe", is_active=True,
        )

        db.session.add_all([user1, user2, admin, p1])
        db.session.commit()

        # Đơn 1: Thuộc user 1, pending, qty=2 của p1
        order1_pending = Order(
            id=1, order_code="ORD-20260812-0001", user_id=1,
            recipient_name="User Một", recipient_phone="0901234567",
            shipping_address="123 HW, HCM", payment_method="COD",
            payment_status="unpaid", status="pending",
            subtotal=57000000.0, discount_amount=0.0, shipping_fee=120000.0, total_amount=57120000.0,
        )

        # Đơn 2: Thuộc user 1, confirmed, qty=1 của p1
        order2_confirmed = Order(
            id=2, order_code="ORD-20260812-0002", user_id=1,
            recipient_name="User Một", recipient_phone="0901234567",
            shipping_address="123 HW, HCM", payment_method="COD",
            payment_status="unpaid", status="confirmed",
            subtotal=28500000.0, discount_amount=0.0, shipping_fee=120000.0, total_amount=28620000.0,
        )

        # Đơn 3: Thuộc user 1, shipping (Đang giao), qty=1 của p1
        order3_shipping = Order(
            id=3, order_code="ORD-20260812-0003", user_id=1,
            recipient_name="User Một", recipient_phone="0901234567",
            shipping_address="123 HW, HCM", payment_method="COD",
            payment_status="unpaid", status="shipping",
            subtotal=28500000.0, discount_amount=0.0, shipping_fee=120000.0, total_amount=28620000.0,
        )

        # Đơn 4: Thuộc user 1, delivered
        order4_delivered = Order(
            id=4, order_code="ORD-20260812-0004", user_id=1,
            recipient_name="User Một", recipient_phone="0901234567",
            shipping_address="123 HW, HCM", payment_method="COD",
            payment_status="paid", status="delivered",
            subtotal=28500000.0, discount_amount=0.0, shipping_fee=120000.0, total_amount=28620000.0,
        )

        # Đơn 5: Thuộc user 1, đã cancelled trước đó
        order5_already_cancelled = Order(
            id=5, order_code="ORD-20260812-0005", user_id=1,
            recipient_name="User Một", recipient_phone="0901234567",
            shipping_address="123 HW, HCM", payment_method="COD",
            payment_status="unpaid", status="cancelled",
            subtotal=28500000.0, discount_amount=0.0, shipping_fee=120000.0, total_amount=28620000.0,
        )

        db.session.add_all([order1_pending, order2_confirmed, order3_shipping, order4_delivered, order5_already_cancelled])
        db.session.commit()

        # Add items
        item1 = OrderItem(id=1, order_id=1, product_id=1, product_name="Bộ Sofa Gỗ Óc Chó", quantity=2, price=28500000.0, subtotal=57000000.0)
        item2 = OrderItem(id=2, order_id=2, product_id=1, product_name="Bộ Sofa Gỗ Óc Chó", quantity=1, price=28500000.0, subtotal=28500000.0)
        item3 = OrderItem(id=3, order_id=3, product_id=1, product_name="Bộ Sofa Gỗ Óc Chó", quantity=1, price=28500000.0, subtotal=28500000.0)
        item4 = OrderItem(id=4, order_id=4, product_id=1, product_name="Bộ Sofa Gỗ Óc Chó", quantity=1, price=28500000.0, subtotal=28500000.0)
        item5 = OrderItem(id=5, order_id=5, product_id=1, product_name="Bộ Sofa Gỗ Óc Chó", quantity=1, price=28500000.0, subtotal=28500000.0)

        db.session.add_all([item1, item2, item3, item4, item5])
        db.session.commit()

        yield flask_app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def user1_token(app):
    with app.app_context():
        return create_access_token(identity="1")


@pytest.fixture
def user2_token(app):
    with app.app_context():
        return create_access_token(identity="2")


@pytest.fixture
def admin_token(app):
    with app.app_context():
        return create_access_token(identity="3")


# ============================================================
# TC-01: Hủy đơn ở trạng thái pending thành công -> stock hoàn lại (QTN-03, QTN-04)
# ============================================================

def test_tc01_cancel_pending_order_success_restores_stock(client, user1_token, app):
    headers = {"Authorization": f"Bearer {user1_token}"}
    r = client.post("/api/v1/orders/1/cancel", json={"reason": "Đổi ý không mua nữa"}, headers=headers)
    assert r.status_code == 200

    body = r.get_json()
    assert body["status"] == "success"
    assert body["data"]["status"] == "cancelled"

    # Kiểm tra tồn kho sản phẩm được hoàn từ 8 lên 10 (cộng lại 2)
    with app.app_context():
        product = db.session.query(Product).filter(Product.id == 1).first()
        assert product.stock == 10  # 8 + 2


# ============================================================
# TC-01b: Hủy đơn ở trạng thái confirmed thành công -> stock hoàn lại
# ============================================================

def test_tc01b_cancel_confirmed_order_success_restores_stock(client, user1_token, app):
    headers = {"Authorization": f"Bearer {user1_token}"}
    r = client.post("/api/v1/orders/2/cancel", json={"reason": "Đặt nhầm địa chỉ"}, headers=headers)
    assert r.status_code == 200

    body = r.get_json()
    assert body["status"] == "success"
    assert body["data"]["status"] == "cancelled"

    with app.app_context():
        product = db.session.query(Product).filter(Product.id == 1).first()
        assert product.stock == 9  # 8 + 1


# ============================================================
# TC-02: Hủy đơn ở trạng thái shipping (Đang giao) -> 400 CANNOT_CANCEL_SHIPPED_ORDER
# ============================================================

def test_tc02_cancel_shipped_order_rejected(client, user1_token, app):
    headers = {"Authorization": f"Bearer {user1_token}"}
    r = client.post("/api/v1/orders/3/cancel", json={}, headers=headers)
    assert r.status_code == 400

    body = r.get_json()
    assert body["status"] == "error"
    assert body["code"] == "CANNOT_CANCEL_SHIPPED_ORDER"
    assert "Đơn hàng đã qua giai đoạn có thể hủy" in body["message"]

    # Đơn giữ nguyên status shipping và stock giữ nguyên 8
    with app.app_context():
        order = db.session.query(Order).filter(Order.id == 3).first()
        assert order.status == "shipping"
        product = db.session.query(Product).filter(Product.id == 1).first()
        assert product.stock == 8


# ============================================================
# TC-02b: Hủy đơn ở trạng thái delivered -> 400
# ============================================================

def test_tc02b_cancel_delivered_order_rejected(client, user1_token):
    headers = {"Authorization": f"Bearer {user1_token}"}
    r = client.post("/api/v1/orders/4/cancel", json={}, headers=headers)
    assert r.status_code == 400
    assert r.get_json()["code"] == "CANNOT_CANCEL_SHIPPED_ORDER"


# ============================================================
# TC-03: User 2 cố hủy đơn của User 1 -> 403 FORBIDDEN
# ============================================================

def test_tc03_cancel_other_user_order_forbidden(client, user2_token, app):
    headers = {"Authorization": f"Bearer {user2_token}"}
    r = client.post("/api/v1/orders/1/cancel", json={}, headers=headers)
    assert r.status_code == 403

    body = r.get_json()
    assert body["status"] == "error"
    assert body["code"] == "FORBIDDEN"

    with app.app_context():
        order = db.session.query(Order).filter(Order.id == 1).first()
        assert order.status == "pending"  # Giữ nguyên


# ============================================================
# TC-04: Hủy đơn đã ở trạng thái cancelled -> 400 ORDER_ALREADY_CANCELLED
# ============================================================

def test_tc04_cancel_already_cancelled_order_rejected(client, user1_token):
    headers = {"Authorization": f"Bearer {user1_token}"}
    r = client.post("/api/v1/orders/5/cancel", json={}, headers=headers)
    assert r.status_code == 400

    body = r.get_json()
    assert body["code"] == "ORDER_ALREADY_CANCELLED"


# ============================================================
# TC-05: Đơn hàng không tồn tại -> 404 ORDER_NOT_FOUND
# ============================================================

def test_tc05_cancel_non_existing_order_returns_404(client, user1_token):
    headers = {"Authorization": f"Bearer {user1_token}"}
    r = client.post("/api/v1/orders/99999/cancel", json={}, headers=headers)
    assert r.status_code == 404
    assert r.get_json()["code"] == "ORDER_NOT_FOUND"


# ============================================================
# TC-06: Khách chưa đăng nhập -> 401
# ============================================================

def test_tc06_unauthenticated_cancel_returns_401(client):
    r = client.post("/api/v1/orders/1/cancel")
    assert r.status_code == 401


# ============================================================
# TC-07: Admin hủy đơn hàng hợp lệ -> 200 OK
# ============================================================

def test_tc07_admin_can_cancel_valid_order(client, admin_token, app):
    headers = {"Authorization": f"Bearer {admin_token}"}
    r = client.post("/api/v1/orders/1/cancel", json={"reason": "Admin hủy do lỗi hệ thống"}, headers=headers)
    assert r.status_code == 200
    assert r.get_json()["data"]["status"] == "cancelled"

    with app.app_context():
        product = db.session.query(Product).filter(Product.id == 1).first()
        assert product.stock == 10  # 8 + 2
