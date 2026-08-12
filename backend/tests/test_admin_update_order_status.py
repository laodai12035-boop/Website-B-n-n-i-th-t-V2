"""
tests/test_admin_update_order_status.py — Test cases cho chức năng Admin cập nhật trạng thái đơn hàng (NT-06-CN-006).

Story: NT-06-CN-006 — Admin cập nhật trạng thái đơn hàng
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: Luồng thành công: Admin cập nhật đơn từ pending -> confirmed -> shipping -> delivered (200 OK).
- TC-02: Dữ liệu không hợp lệ: Đơn ở trạng thái cuối (delivered/cancelled) cố chuyển ngược -> 400 INVALID_STATUS_TRANSITION.
- TC-02b: Cố chuyển trạng thái từ cancelled sang confirmed -> 400 INVALID_STATUS_TRANSITION.
- TC-03: Admin hủy đơn (cancelled) -> 200 OK và tự động hoàn trả số lượng tồn kho (QTN-03).
- TC-04: User thường (role='user') cố cập nhật trạng thái đơn hàng -> 403 FORBIDDEN.
- TC-05: Đơn hàng không tồn tại -> 404 ORDER_NOT_FOUND.
- TC-06: Trạng thái mới không hợp lệ (status='invalid_status') -> 400 INVALID_STATUS.
- TC-07: Khách chưa đăng nhập -> 401 Unauthorized.
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

        user = User(
            id=1, email="user@example.com", full_name="Khách Mua Hàng",
            phone="0901234567", password_hash="pwd", role="user",
        )
        admin = User(
            id=2, email="admin@example.com", full_name="Admin Hệ Thống",
            phone="0900000000", password_hash="pwd", role="admin",
        )
        db.session.add_all([user, admin])
        db.session.commit()

        # Tạo 2 sản phẩm mẫu
        p1 = Product(id=1, name="Sofa Gỗ Sồi", slug="sofa-go-soi", category="Sofa", price=15000000.0, stock=10, is_active=True)
        p2 = Product(id=2, name="Bàn Ăn 6 Ghế", slug="ban-an-6-ghe", category="Bàn Ăn", price=8000000.0, stock=5, is_active=True)
        db.session.add_all([p1, p2])
        db.session.commit()

        # Order 1: pending
        o1 = Order(
            id=101, order_code="ORD-TEST-001", user_id=1,
            recipient_name="Khách Mua Hàng", recipient_phone="0901234567",
            shipping_address="123 Lê Lợi, Q1", payment_method="COD",
            payment_status="unpaid", status="pending",
            subtotal=15000000.0, discount_amount=0.0, shipping_fee=100000.0, total_amount=15100000.0,
        )
        item1 = OrderItem(id=1, order_id=101, product_id=1, product_name="Sofa Gỗ Sồi", price=15000000.0, quantity=2)

        # Order 2: confirmed
        o2 = Order(
            id=102, order_code="ORD-TEST-002", user_id=1,
            recipient_name="Khách Mua Hàng", recipient_phone="0901234567",
            shipping_address="123 Lê Lợi, Q1", payment_method="COD",
            payment_status="unpaid", status="confirmed",
            subtotal=8000000.0, discount_amount=0.0, shipping_fee=50000.0, total_amount=8050000.0,
        )
        item2 = OrderItem(id=2, order_id=102, product_id=2, product_name="Bàn Ăn 6 Ghế", price=8000000.0, quantity=1)

        # Order 3: delivered (Trạng thái cuối)
        o3 = Order(
            id=103, order_code="ORD-TEST-003", user_id=1,
            recipient_name="Khách Mua Hàng", recipient_phone="0901234567",
            shipping_address="123 Lê Lợi, Q1", payment_method="QR_BANK",
            payment_status="paid", status="delivered",
            subtotal=15000000.0, discount_amount=0.0, shipping_fee=0.0, total_amount=15000000.0,
        )

        # Order 4: cancelled (Trạng thái cuối)
        o4 = Order(
            id=104, order_code="ORD-TEST-004", user_id=1,
            recipient_name="Khách Mua Hàng", recipient_phone="0901234567",
            shipping_address="123 Lê Lợi, Q1", payment_method="COD",
            payment_status="unpaid", status="cancelled",
            subtotal=8000000.0, discount_amount=0.0, shipping_fee=50000.0, total_amount=8050000.0,
        )

        db.session.add_all([o1, item1, o2, item2, o3, o4])
        db.session.commit()

        yield flask_app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def user_token(app):
    with app.app_context():
        return create_access_token(identity="1")


@pytest.fixture
def admin_token(app):
    with app.app_context():
        return create_access_token(identity="2")


# ============================================================
# TC-01: Luồng thành công: pending -> confirmed -> shipping -> delivered
# ============================================================

def test_tc01_admin_update_status_success_pipeline(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Step 1: pending -> confirmed
    r1 = client.put("/api/v1/orders/101/status", json={"status": "confirmed", "note": "Đã gọi xác nhận"}, headers=headers)
    assert r1.status_code == 200
    data1 = r1.get_json()["data"]
    assert data1["status"] == "confirmed"

    # Step 2: confirmed -> shipping
    r2 = client.put("/api/v1/orders/101/status", json={"status": "shipping", "note": "Bàn giao Viettel Post"}, headers=headers)
    assert r2.status_code == 200
    data2 = r2.get_json()["data"]
    assert data2["status"] == "shipping"

    # Step 3: shipping -> delivered
    r3 = client.put("/api/v1/orders/101/status", json={"status": "delivered", "note": "Khách đã ký nhận"}, headers=headers)
    assert r3.status_code == 200
    data3 = r3.get_json()["data"]
    assert data3["status"] == "delivered"


# ============================================================
# TC-02: Đơn đã ở trạng thái cuối (delivered/cancelled) cố chuyển trạng thái -> 400
# ============================================================

def test_tc02_update_delivered_order_returns_400(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Thử chuyển delivered -> shipping
    r1 = client.put("/api/v1/orders/103/status", json={"status": "shipping"}, headers=headers)
    assert r1.status_code == 400
    body1 = r1.get_json()
    assert body1["code"] == "INVALID_STATUS_TRANSITION"

    # Thử chuyển delivered -> pending
    r2 = client.put("/api/v1/orders/103/status", json={"status": "pending"}, headers=headers)
    assert r2.status_code == 400
    assert r2.get_json()["code"] == "INVALID_STATUS_TRANSITION"


def test_tc02b_update_cancelled_order_returns_400(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Thử chuyển cancelled -> confirmed
    r = client.put("/api/v1/orders/104/status", json={"status": "confirmed"}, headers=headers)
    assert r.status_code == 400
    assert r.get_json()["code"] == "INVALID_STATUS_TRANSITION"


# ============================================================
# TC-03: Admin hủy đơn (cancelled) -> 200 OK và hoàn kho QTN-03
# ============================================================

def test_tc03_admin_cancel_order_restores_stock(client, app, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Kiểm tra tồn kho trước khi hủy đơn 102 (Product 2 có quantity=1, stock ban đầu 5)
    with app.app_context():
        p2_before = db.session.query(Product).filter(Product.id == 2).first()
        stock_before = p2_before.stock

    r = client.put("/api/v1/orders/102/status", json={"status": "cancelled", "note": "Hết hàng màu trắng"}, headers=headers)
    assert r.status_code == 200
    assert r.get_json()["data"]["status"] == "cancelled"

    # Kiểm tra tồn kho sau khi hủy đơn (stock phải được cộng lại +1)
    with app.app_context():
        p2_after = db.session.query(Product).filter(Product.id == 2).first()
        assert p2_after.stock == stock_before + 1


# ============================================================
# TC-04: User thường (role='user') cố cập nhật -> 403 FORBIDDEN
# ============================================================

def test_tc04_regular_user_cannot_update_order_status(client, user_token):
    headers = {"Authorization": f"Bearer {user_token}"}
    r = client.put("/api/v1/orders/101/status", json={"status": "confirmed"}, headers=headers)
    assert r.status_code == 403
    body = r.get_json()
    assert body["code"] == "FORBIDDEN"


# ============================================================
# TC-05: Đơn hàng không tồn tại -> 404 ORDER_NOT_FOUND
# ============================================================

def test_tc05_non_existent_order_returns_404(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    r = client.put("/api/v1/orders/99999/status", json={"status": "confirmed"}, headers=headers)
    assert r.status_code == 404
    assert r.get_json()["code"] == "ORDER_NOT_FOUND"


# ============================================================
# TC-06: Trạng thái mới rác ('invalid_status') -> 400 INVALID_STATUS
# ============================================================

def test_tc06_invalid_status_string_returns_400(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    r = client.put("/api/v1/orders/101/status", json={"status": "invalid_status_xyz"}, headers=headers)
    assert r.status_code == 400
    assert r.get_json()["code"] == "INVALID_STATUS"


# ============================================================
# TC-07: Chưa đăng nhập -> 401 Unauthorized
# ============================================================

def test_tc07_unauthenticated_request_returns_401(client):
    r = client.put("/api/v1/orders/101/status", json={"status": "confirmed"})
    assert r.status_code == 401
