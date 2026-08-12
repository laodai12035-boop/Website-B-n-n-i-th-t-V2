"""
tests/test_order_history.py — Test cases cho chức năng Xem lịch sử và Chi tiết đơn hàng (NT-06-CN-001 / NT-06-CN-002).

Story: NT-06-CN-001 — Xem lịch sử đơn hàng
Story: NT-06-CN-002 — Xem chi tiết và trạng thái đơn hàng
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: User xem danh sách đơn hàng của mình & chi tiết đơn thuộc sở hữu -> 200 OK, thông tin sản phẩm và tổng tiền đúng.
- TC-02: User 2 truy cập chi tiết đơn hàng của User 1 -> 403 FORBIDDEN (Hệ thống từ chối truy cập).
- TC-03: Admin truy cập chi tiết đơn hàng của bất kỳ User nào -> 200 OK.
- TC-04: Truy cập đơn hàng không tồn tại -> 404 ORDER_NOT_FOUND.
- TC-05: Khách chưa đăng nhập truy cập API đơn hàng -> 401 Unauthorized.
- TC-06: Lọc danh sách đơn hàng theo trạng thái (?status=pending) -> Chỉ trả về các đơn có status tương ứng.
- TC-07: Người dùng chưa có đơn hàng nào -> Trả về 200 OK với danh sách rỗng [].
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
            id=3, email="admin@example.com", full_name="Quản Trị Viên",
            phone="0900000000", password_hash="pwd", role="admin",
        )

        p1 = Product(
            id=1, name="Bộ Sofa Gỗ Óc Chó", slug="sofa-oc-cho",
            price=28500000.0, stock=10, category="ghe", is_active=True,
        )

        db.session.add_all([user1, user2, admin, p1])
        db.session.commit()

        # Đơn 1: Thuộc user 1, status = pending
        order1 = Order(
            id=1,
            order_code="ORD-20260812-1001",
            user_id=1,
            recipient_name="User Một",
            recipient_phone="0901234567",
            shipping_address="123 Nguyễn Huệ, TP.HCM",
            payment_method="COD",
            payment_status="unpaid",
            status="pending",
            subtotal=28500000.0,
            discount_amount=0.0,
            shipping_fee=120000.0,
            total_amount=28620000.0,
        )

        # Đơn 2: Thuộc user 1, status = delivered
        order2 = Order(
            id=2,
            order_code="ORD-20260812-1002",
            user_id=1,
            recipient_name="User Một",
            recipient_phone="0901234567",
            shipping_address="123 Nguyễn Huệ, TP.HCM",
            payment_method="QR_BANK",
            payment_status="paid",
            status="delivered",
            subtotal=28500000.0,
            discount_amount=500000.0,
            shipping_fee=120000.0,
            total_amount=28120000.0,
        )

        # Đơn 3: Thuộc user 2, status = pending
        order3_user2 = Order(
            id=3,
            order_code="ORD-20260812-1003",
            user_id=2,
            recipient_name="User Hai",
            recipient_phone="0909876543",
            shipping_address="456 Lê Lợi, Đà Nẵng",
            payment_method="COD",
            payment_status="unpaid",
            status="pending",
            subtotal=28500000.0,
            discount_amount=0.0,
            shipping_fee=200000.0,
            total_amount=28700000.0,
        )

        db.session.add_all([order1, order2, order3_user2])
        db.session.commit()

        # Order items
        item1 = OrderItem(id=1, order_id=1, product_id=1, product_name="Bộ Sofa Gỗ Óc Chó", quantity=1, price=28500000.0, subtotal=28500000.0)
        item2 = OrderItem(id=2, order_id=2, product_id=1, product_name="Bộ Sofa Gỗ Óc Chó", quantity=1, price=28500000.0, subtotal=28500000.0)
        item3 = OrderItem(id=3, order_id=3, product_id=1, product_name="Bộ Sofa Gỗ Óc Chó", quantity=1, price=28500000.0, subtotal=28500000.0)
        db.session.add_all([item1, item2, item3])
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
# TC-01: User xem danh sách đơn hàng & chi tiết đơn thuộc sở hữu
# ============================================================

def test_tc01_user_can_view_own_orders_and_detail(client, user1_token):
    headers = {"Authorization": f"Bearer {user1_token}"}

    # 1. Danh sách đơn hàng
    r_list = client.get("/api/v1/orders", headers=headers)
    assert r_list.status_code == 200
    orders = r_list.get_json()["data"]
    assert len(orders) == 2
    order_ids = [o["id"] for o in orders]
    assert 1 in order_ids
    assert 2 in order_ids
    assert 3 not in order_ids  # Không chứa đơn của User 2

    # 2. Chi tiết đơn hàng
    r_detail = client.get("/api/v1/orders/1", headers=headers)
    assert r_detail.status_code == 200
    data = r_detail.get_json()["data"]
    assert data["id"] == 1
    assert data["order_code"] == "ORD-20260812-1001"
    assert data["recipient_name"] == "User Một"
    assert data["total_amount"] == 28620000.0
    assert len(data["items"]) == 1


# ============================================================
# TC-02: User 2 truy cập chi tiết đơn hàng của User 1 -> 403 FORBIDDEN
# ============================================================

def test_tc02_user_accessing_other_user_order_forbidden(client, user2_token):
    headers = {"Authorization": f"Bearer {user2_token}"}

    # User 2 cố xem Đơn 1 (của User 1)
    r = client.get("/api/v1/orders/1", headers=headers)
    assert r.status_code == 403
    body = r.get_json()
    assert body["status"] == "error"
    assert body["code"] == "FORBIDDEN"


# ============================================================
# TC-03: Admin truy cập chi tiết đơn của bất kỳ user nào -> 200 OK
# ============================================================

def test_tc03_admin_can_access_any_order_detail(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}

    r1 = client.get("/api/v1/orders/1", headers=headers)
    assert r1.status_code == 200
    assert r1.get_json()["data"]["id"] == 1

    r3 = client.get("/api/v1/orders/3", headers=headers)
    assert r3.status_code == 200
    assert r3.get_json()["data"]["id"] == 3


# ============================================================
# TC-04: Truy cập đơn hàng không tồn tại -> 404 ORDER_NOT_FOUND
# ============================================================

def test_tc04_non_existing_order_returns_404(client, user1_token):
    headers = {"Authorization": f"Bearer {user1_token}"}
    r = client.get("/api/v1/orders/99999", headers=headers)
    assert r.status_code == 404
    assert r.get_json()["code"] == "ORDER_NOT_FOUND"


# ============================================================
# TC-05: Khách chưa đăng nhập -> 401 Unauthorized
# ============================================================

def test_tc05_unauthenticated_returns_401(client):
    r1 = client.get("/api/v1/orders")
    assert r1.status_code == 401

    r2 = client.get("/api/v1/orders/1")
    assert r2.status_code == 401


# ============================================================
# TC-06: Lọc đơn hàng theo trạng thái (?status=pending)
# ============================================================

def test_tc06_filter_orders_by_status(client, user1_token):
    headers = {"Authorization": f"Bearer {user1_token}"}

    # Filter status=pending (Đơn 1 là pending, Đơn 2 là delivered)
    r_pending = client.get("/api/v1/orders?status=pending", headers=headers)
    assert r_pending.status_code == 200
    data_pending = r_pending.get_json()["data"]
    assert len(data_pending) == 1
    assert data_pending[0]["id"] == 1

    # Filter status=delivered
    r_delivered = client.get("/api/v1/orders?status=delivered", headers=headers)
    assert r_delivered.status_code == 200
    data_delivered = r_delivered.get_json()["data"]
    assert len(data_delivered) == 1
    assert data_delivered[0]["id"] == 2


# ============================================================
# TC-07: Người dùng chưa có đơn hàng nào -> 200 OK với []
# ============================================================

def test_tc07_user_with_no_orders_returns_empty_list(client, app):
    with app.app_context():
        new_user = User(
            id=99, email="newbie@example.com", full_name="User Mới",
            phone="0911111111", password_hash="pwd", role="user",
        )
        db.session.add(new_user)
        db.session.commit()
        token = create_access_token(identity="99")

    r = client.get("/api/v1/orders", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.get_json()["data"] == []
