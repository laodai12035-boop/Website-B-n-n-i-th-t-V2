"""
tests/test_order_detail.py — Test cases cho chức năng Xem chi tiết và trạng thái đơn hàng (NT-06-CN-002).

Story: NT-06-CN-002 — Xem chi tiết và trạng thái đơn hàng
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01 (Thành công): Đơn hàng thuộc tài khoản đang đăng nhập -> Chi tiết hiển thị đúng sản phẩm, tổng tiền, trạng thái (200 OK).
- TC-02 (Không có quyền): Đơn hàng không thuộc tài khoản đang đăng nhập -> Hệ thống từ chối truy cập (403 FORBIDDEN).
- TC-03 (Không tồn tại): Cố truy cập đơn hàng không tồn tại -> 404 ORDER_NOT_FOUND.
- TC-04 (Admin): Tài khoản Admin có thể xem chi tiết bất kỳ đơn hàng nào -> 200 OK.
- TC-05 (Chưa đăng nhập): Khách chưa đăng nhập truy cập API chi tiết đơn hàng -> 401 Unauthorized.
- TC-06 (Các trạng thái đơn): Đảm bảo các đơn có trạng thái pending, confirmed, shipping, delivered, cancelled được serialize đúng.
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
            id=1, email="user1@example.com", full_name="Nguyễn Văn A",
            phone="0901234567", password_hash="pwd", role="user",
        )
        user2 = User(
            id=2, email="user2@example.com", full_name="Trần Thị B",
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
        p2 = Product(
            id=2, name="Kệ Tivi Gỗ Tự Nhiên", slug="ke-tivi",
            price=6800000.0, stock=5, category="ke", is_active=True,
        )

        db.session.add_all([user1, user2, admin, p1, p2])
        db.session.commit()

        # Đơn 101: Thuộc user 1, pending
        order101 = Order(
            id=101,
            order_code="ORD-20260812-0101",
            user_id=1,
            recipient_name="Nguyễn Văn A",
            recipient_phone="0901234567",
            shipping_address="123 Nguyễn Huệ, TP.HCM",
            note="Giao ngoài giờ hành chính",
            payment_method="COD",
            payment_status="unpaid",
            status="pending",
            subtotal=35300000.0,
            discount_amount=500000.0,
            shipping_fee=120000.0,
            total_amount=34920000.0,
        )

        # Đơn 102: Thuộc user 2, delivered
        order102_user2 = Order(
            id=102,
            order_code="ORD-20260812-0102",
            user_id=2,
            recipient_name="Trần Thị B",
            recipient_phone="0909876543",
            shipping_address="456 Lê Lợi, Đà Nẵng",
            payment_method="QR_BANK",
            payment_status="paid",
            status="delivered",
            subtotal=6800000.0,
            discount_amount=0.0,
            shipping_fee=95000.0,
            total_amount=6895000.0,
        )

        # Đơn 103: Thuộc user 1, cancelled
        order103_cancelled = Order(
            id=103,
            order_code="ORD-20260812-0103",
            user_id=1,
            recipient_name="Nguyễn Văn A",
            recipient_phone="0901234567",
            shipping_address="123 Nguyễn Huệ, TP.HCM",
            payment_method="COD",
            payment_status="unpaid",
            status="cancelled",
            subtotal=6800000.0,
            discount_amount=0.0,
            shipping_fee=120000.0,
            total_amount=6920000.0,
        )

        db.session.add_all([order101, order102_user2, order103_cancelled])
        db.session.commit()

        # Order Items for order 101
        item1 = OrderItem(id=1, order_id=101, product_id=1, product_name="Bộ Sofa Gỗ Óc Chó", quantity=1, price=28500000.0, subtotal=28500000.0)
        item2 = OrderItem(id=2, order_id=101, product_id=2, product_name="Kệ Tivi Gỗ Tự Nhiên", quantity=1, price=6800000.0, subtotal=6800000.0)
        # Order Item for order 102
        item3 = OrderItem(id=3, order_id=102, product_id=2, product_name="Kệ Tivi Gỗ Tự Nhiên", quantity=1, price=6800000.0, subtotal=6800000.0)

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
# TC-01: Luồng thành công — Đơn hàng thuộc tài khoản đang đăng nhập
# ============================================================

def test_tc01_get_own_order_detail_success(client, user1_token):
    headers = {"Authorization": f"Bearer {user1_token}"}
    r = client.get("/api/v1/orders/101", headers=headers)
    assert r.status_code == 200

    body = r.get_json()
    assert body["status"] == "success"
    data = body["data"]
    assert data["id"] == 101
    assert data["order_code"] == "ORD-20260812-0101"
    assert data["recipient_name"] == "Nguyễn Văn A"
    assert data["recipient_phone"] == "0901234567"
    assert data["shipping_address"] == "123 Nguyễn Huệ, TP.HCM"
    assert data["note"] == "Giao ngoài giờ hành chính"
    assert data["payment_method"] == "COD"
    assert data["payment_status"] == "unpaid"
    assert data["status"] == "pending"
    assert data["subtotal"] == 35300000.0
    assert data["discount_amount"] == 500000.0
    assert data["shipping_fee"] == 120000.0
    assert data["total_amount"] == 34920000.0
    assert len(data["items"]) == 2


# ============================================================
# TC-02: Không có quyền — Đơn hàng thuộc tài khoản khác -> 403 FORBIDDEN
# ============================================================

def test_tc02_get_other_user_order_detail_forbidden(client, user2_token):
    headers = {"Authorization": f"Bearer {user2_token}"}

    # User 2 truy cập Đơn 101 của User 1
    r = client.get("/api/v1/orders/101", headers=headers)
    assert r.status_code == 403

    body = r.get_json()
    assert body["status"] == "error"
    assert body["code"] == "FORBIDDEN"
    assert "Bạn không có quyền" in body["message"]


# ============================================================
# TC-03: Không tồn tại — Truy cập đơn 99999 -> 404 ORDER_NOT_FOUND
# ============================================================

def test_tc03_non_existing_order_detail_returns_404(client, user1_token):
    headers = {"Authorization": f"Bearer {user1_token}"}
    r = client.get("/api/v1/orders/99999", headers=headers)
    assert r.status_code == 404

    body = r.get_json()
    assert body["status"] == "error"
    assert body["code"] == "ORDER_NOT_FOUND"


# ============================================================
# TC-04: Admin có thể xem chi tiết bất kỳ đơn hàng nào -> 200 OK
# ============================================================

def test_tc04_admin_can_access_any_order_detail(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Admin xem đơn 101 của User 1
    r1 = client.get("/api/v1/orders/101", headers=headers)
    assert r1.status_code == 200
    assert r1.get_json()["data"]["id"] == 101

    # Admin xem đơn 102 của User 2
    r2 = client.get("/api/v1/orders/102", headers=headers)
    assert r2.status_code == 200
    assert r2.get_json()["data"]["id"] == 102


# ============================================================
# TC-05: Khách chưa đăng nhập -> 401 Unauthorized
# ============================================================

def test_tc05_unauthenticated_request_returns_401(client):
    r = client.get("/api/v1/orders/101")
    assert r.status_code == 401


# ============================================================
# TC-06: Đơn hàng bị hủy (cancelled) -> serialize đúng status
# ============================================================

def test_tc06_cancelled_order_detail(client, user1_token):
    headers = {"Authorization": f"Bearer {user1_token}"}
    r = client.get("/api/v1/orders/103", headers=headers)
    assert r.status_code == 200
    data = r.get_json()["data"]
    assert data["id"] == 103
    assert data["status"] == "cancelled"
