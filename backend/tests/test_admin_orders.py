"""
tests/test_admin_orders.py — Test cases cho chức năng Admin Quản lý Danh sách Đơn hàng (NT-06-CN-005).

Story: NT-06-CN-005 — Admin quản lý danh sách đơn hàng
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: Admin lọc đơn hàng theo trạng thái 'pending' → 200 OK, trả về đúng các đơn pending.
- TC-02: Admin tìm kiếm đơn theo từ khóa SĐT / Mã đơn → 200 OK, trả về đúng đơn khớp.
- TC-03: Admin lọc đơn theo khoảng ngày start_date và end_date → 200 OK.
- TC-04: User thường (role='user') cố truy cập /api/v1/admin/orders → 403 FORBIDDEN.
- TC-05: Khách chưa đăng nhập → 401 Unauthorized.
- TC-06: Phân trang (page=1, limit=2) → 200 OK, trả về đúng số bản ghi và pagination metadata.
- TC-07: Admin Quick Search trả về thông tin đơn hàng khớp từ khóa.
"""

from datetime import datetime, timedelta
import pytest
from flask_jwt_extended import create_access_token
from app import create_app
from app.extensions import db
from app.models.user import User
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
            id=3, email="admin@example.com", full_name="Admin Quản Trị",
            phone="0900000000", password_hash="pwd", role="admin",
        )

        db.session.add_all([user1, user2, admin])
        db.session.commit()

        now = datetime.utcnow()

        # Order 1: pending
        o1 = Order(
            id=1, order_code="ORD-20260812-0001", user_id=1,
            recipient_name="Nguyễn Văn A", recipient_phone="0901234567",
            shipping_address="123 Nguyễn Huệ, TP.HCM", payment_method="COD",
            payment_status="unpaid", status="pending",
            subtotal=1000000.0, discount_amount=0.0, shipping_fee=50000.0, total_amount=1050000.0,
            created_at=now - timedelta(days=1),
        )

        # Order 2: confirmed
        o2 = Order(
            id=2, order_code="ORD-20260812-0002", user_id=2,
            recipient_name="Trần Thị B", recipient_phone="0909876543",
            shipping_address="456 Lê Lợi, Đà Nẵng", payment_method="QR_BANK",
            payment_status="paid", status="confirmed",
            subtotal=2000000.0, discount_amount=0.0, shipping_fee=50000.0, total_amount=2050000.0,
            created_at=now - timedelta(days=3),
        )

        # Order 3: shipping
        o3 = Order(
            id=3, order_code="ORD-20260812-0003", user_id=1,
            recipient_name="Nguyễn Văn A", recipient_phone="0901234567",
            shipping_address="123 Nguyễn Huệ, TP.HCM", payment_method="COD",
            payment_status="unpaid", status="shipping",
            subtotal=3000000.0, discount_amount=0.0, shipping_fee=50000.0, total_amount=3050000.0,
            created_at=now - timedelta(days=5),
        )

        # Order 4: delivered
        o4 = Order(
            id=4, order_code="ORD-20260812-0004", user_id=2,
            recipient_name="Trần Thị B", recipient_phone="0909876543",
            shipping_address="456 Lê Lợi, Đà Nẵng", payment_method="COD",
            payment_status="paid", status="delivered",
            subtotal=4000000.0, discount_amount=0.0, shipping_fee=50000.0, total_amount=4050000.0,
            created_at=now - timedelta(days=10),
        )

        db.session.add_all([o1, o2, o3, o4])
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
        return create_access_token(identity="3")


# ============================================================
# TC-01: Admin lọc đơn hàng theo trạng thái 'pending' -> 200 OK
# ============================================================

def test_tc01_admin_filter_orders_by_pending_status(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    r = client.get("/api/v1/admin/orders?status=pending", headers=headers)
    assert r.status_code == 200

    body = r.get_json()
    assert body["status"] == "success"
    data = body["data"]
    
    orders = data["orders"]
    assert len(orders) == 1
    assert orders[0]["order_code"] == "ORD-20260812-0001"
    assert orders[0]["status"] == "pending"

    # Thống kê summary
    summary = data["summary"]
    assert summary["total"] == 4
    assert summary["pending"] == 1
    assert summary["confirmed"] == 1
    assert summary["shipping"] == 1
    assert summary["delivered"] == 1


# ============================================================
# TC-02: Admin tìm kiếm theo từ khóa (SĐT / Mã đơn) -> 200 OK
# ============================================================

def test_tc02_admin_search_orders_by_keyword(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Tìm theo SĐT người nhận
    r1 = client.get("/api/v1/admin/orders?q=0909876543", headers=headers)
    assert r1.status_code == 200
    orders1 = r1.get_json()["data"]["orders"]
    assert len(orders1) == 2
    assert all(o["recipient_name"] == "Trần Thị B" for o in orders1)

    # 2. Tìm theo Mã đơn
    r2 = client.get("/api/v1/admin/orders?q=0003", headers=headers)
    assert r2.status_code == 200
    orders2 = r2.get_json()["data"]["orders"]
    assert len(orders2) == 1
    assert orders2[0]["order_code"] == "ORD-20260812-0003"


# ============================================================
# TC-03: Admin lọc đơn theo khoảng ngày start_date và end_date
# ============================================================

def test_tc03_admin_filter_orders_by_date_range(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Giả định ngày hiện tại
    now = datetime.utcnow()
    start_str = (now - timedelta(days=4)).strftime("%Y-%m-%d")
    end_str = now.strftime("%Y-%m-%d")

    r = client.get(f"/api/v1/admin/orders?start_date={start_str}&end_date={end_str}", headers=headers)
    assert r.status_code == 200
    orders = r.get_json()["data"]["orders"]
    
    # Chỉ gồm order 1 (1 ngày trước) và order 2 (3 ngày trước)
    assert len(orders) == 2
    codes = [o["order_code"] for o in orders]
    assert "ORD-20260812-0001" in codes
    assert "ORD-20260812-0002" in codes


# ============================================================
# TC-04: User thường (role='user') cố truy cập -> 403 FORBIDDEN
# ============================================================

def test_tc04_regular_user_access_admin_orders_forbidden(client, user_token):
    headers = {"Authorization": f"Bearer {user_token}"}
    r = client.get("/api/v1/admin/orders", headers=headers)
    assert r.status_code == 403

    body = r.get_json()
    assert body["status"] == "error"
    assert body["code"] == "FORBIDDEN"


# ============================================================
# TC-05: Khách chưa đăng nhập -> 401 Unauthorized
# ============================================================

def test_tc05_unauthenticated_admin_orders_returns_401(client):
    r = client.get("/api/v1/admin/orders")
    assert r.status_code == 401


# ============================================================
# TC-06: Phân trang page=1, limit=2 -> 200 OK
# ============================================================

def test_tc06_admin_orders_pagination(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    r = client.get("/api/v1/admin/orders?page=1&limit=2", headers=headers)
    assert r.status_code == 200

    data = r.get_json()["data"]
    assert len(data["orders"]) == 2
    pagination = data["pagination"]
    assert pagination["page"] == 1
    assert pagination["limit"] == 2
    assert pagination["total_items"] == 4
    assert pagination["total_pages"] == 2


# ============================================================
# TC-07: Admin Quick Search bao gồm danh sách đơn hàng
# ============================================================

def test_tc07_admin_quick_search_returns_orders(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    r = client.get("/api/v1/admin/quick-search?q=0901234567", headers=headers)
    assert r.status_code == 200

    data = r.get_json()["data"]
    assert "orders" in data
    assert len(data["orders"]) >= 1
    assert data["orders"][0]["recipient_phone"] == "0901234567"
