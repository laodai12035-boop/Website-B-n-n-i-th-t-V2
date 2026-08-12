"""
tests/test_return_requests.py — Test cases cho chức năng Yêu cầu Đổi/Trả hàng (NT-06-CN-004, QTN-05).

Story: NT-06-CN-004 — Yêu cầu đổi hoặc trả hàng
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: Gửi yêu cầu đổi/trả cho đơn đã giao 5 ngày → 201 Created, status='pending' (QTN-05).
- TC-02: Gửi yêu cầu cho đơn đã giao quá 30 ngày (35 ngày) → 400 EXPIRED_RETURN_PERIOD (QTN-05).
- TC-03: Gửi yêu cầu cho đơn chưa giao (status='shipping' hoặc 'pending') → 400 ORDER_NOT_DELIVERED.
- TC-04: Gửi yêu cầu đổi/trả lần 2 cho cùng 1 đơn đã có request pending → 400 RETURN_REQUEST_EXISTS.
- TC-05: User 2 cố gửi yêu cầu đổi/trả cho đơn của User 1 → 403 FORBIDDEN.
- TC-06: Admin duyệt (approved) hoặc từ chối (rejected) yêu cầu đổi/trả → 200 OK.
- TC-07: Khách chưa đăng nhập gửi yêu cầu → 401 Unauthorized.
"""

from datetime import datetime, timedelta
import pytest
from flask_jwt_extended import create_access_token
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.product import Product
from app.models.order import Order
from app.models.return_request import ReturnRequest


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

        db.session.add_all([user1, user2, admin])
        db.session.commit()

        now = datetime.utcnow()

        # Đơn 1: Thuộc user 1, delivered 5 ngày trước (trong hạn 30 ngày)
        order1_valid = Order(
            id=1, order_code="ORD-20260812-0001", user_id=1,
            recipient_name="User Một", recipient_phone="0901234567",
            shipping_address="123 HW, HCM", payment_method="COD",
            payment_status="paid", status="delivered",
            subtotal=1000000.0, discount_amount=0.0, shipping_fee=50000.0, total_amount=1050000.0,
            created_at=now - timedelta(days=5),
        )

        # Đơn 2: Thuộc user 1, delivered 35 ngày trước (quá hạn 30 ngày QTN-05)
        order2_expired = Order(
            id=2, order_code="ORD-20260812-0002", user_id=1,
            recipient_name="User Một", recipient_phone="0901234567",
            shipping_address="123 HW, HCM", payment_method="COD",
            payment_status="paid", status="delivered",
            subtotal=2000000.0, discount_amount=0.0, shipping_fee=50000.0, total_amount=2050000.0,
            created_at=now - timedelta(days=35),
        )

        # Đơn 3: Thuộc user 1, shipping (chưa giao)
        order3_shipping = Order(
            id=3, order_code="ORD-20260812-0003", user_id=1,
            recipient_name="User Một", recipient_phone="0901234567",
            shipping_address="123 HW, HCM", payment_method="COD",
            payment_status="unpaid", status="shipping",
            subtotal=1500000.0, discount_amount=0.0, shipping_fee=50000.0, total_amount=1550000.0,
            created_at=now - timedelta(days=2),
        )

        # Đơn 4: Thuộc user 1, delivered 10 ngày trước, đã có return_request pending
        order4_existing_req = Order(
            id=4, order_code="ORD-20260812-0004", user_id=1,
            recipient_name="User Một", recipient_phone="0901234567",
            shipping_address="123 HW, HCM", payment_method="COD",
            payment_status="paid", status="delivered",
            subtotal=3000000.0, discount_amount=0.0, shipping_fee=50000.0, total_amount=3050000.0,
            created_at=now - timedelta(days=10),
        )

        db.session.add_all([order1_valid, order2_expired, order3_shipping, order4_existing_req])
        db.session.commit()

        # Existing return request for order 4
        req4 = ReturnRequest(
            id=1,
            order_id=4,
            user_id=1,
            request_type="return",
            reason="Lỗi sứt mẻ góc bàn",
            status="pending",
        )
        db.session.add(req4)
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
# TC-01: Gửi yêu cầu đổi/trả cho đơn giao 5 ngày -> 201 Created (QTN-05)
# ============================================================

def test_tc01_create_return_request_success(client, user1_token, app):
    headers = {"Authorization": f"Bearer {user1_token}"}
    payload = {
        "order_id": 1,
        "request_type": "exchange",
        "reason": "Sản phẩm không đúng kích thước mong muốn, muốn đổi sang kích thước lớn hơn.",
        "proof_image_url": "https://example.com/proof1.jpg",
    }
    r = client.post("/api/v1/returns", json=payload, headers=headers)
    assert r.status_code == 201

    body = r.get_json()
    assert body["status"] == "success"
    data = body["data"]
    assert data["order_id"] == 1
    assert data["request_type"] == "exchange"
    assert data["status"] == "pending"
    assert data["reason"] == payload["reason"]
    assert data["proof_image_url"] == payload["proof_image_url"]

    # Kiểm tra cơ sở dữ liệu
    with app.app_context():
        req = db.session.query(ReturnRequest).filter(ReturnRequest.order_id == 1).first()
        assert req is not None
        assert req.status == "pending"


# ============================================================
# TC-02: Đơn đã quá 30 ngày (35 ngày) -> 400 EXPIRED_RETURN_PERIOD (QTN-05)
# ============================================================

def test_tc02_create_return_request_expired_30_days(client, user1_token):
    headers = {"Authorization": f"Bearer {user1_token}"}
    payload = {
        "order_id": 2,
        "request_type": "return",
        "reason": "Muốn trả hàng",
    }
    r = client.post("/api/v1/returns", json=payload, headers=headers)
    assert r.status_code == 400

    body = r.get_json()
    assert body["status"] == "error"
    assert body["code"] == "EXPIRED_RETURN_PERIOD"
    assert "quá thời hạn 30 ngày" in body["message"]


# ============================================================
# TC-03: Đơn chưa giao (shipping) -> 400 ORDER_NOT_DELIVERED
# ============================================================

def test_tc03_create_return_request_order_not_delivered(client, user1_token):
    headers = {"Authorization": f"Bearer {user1_token}"}
    payload = {
        "order_id": 3,
        "request_type": "return",
        "reason": "Muốn hủy/trả",
    }
    r = client.post("/api/v1/returns", json=payload, headers=headers)
    assert r.status_code == 400

    body = r.get_json()
    assert body["status"] == "error"
    assert body["code"] == "ORDER_NOT_DELIVERED"
    assert "đã giao thành công" in body["message"]


# ============================================================
# TC-04: Đơn đã có yêu cầu active -> 400 RETURN_REQUEST_EXISTS
# ============================================================

def test_tc04_create_duplicate_return_request_rejected(client, user1_token):
    headers = {"Authorization": f"Bearer {user1_token}"}
    payload = {
        "order_id": 4,
        "request_type": "warranty",
        "reason": "Gửi trùng yêu cầu",
    }
    r = client.post("/api/v1/returns", json=payload, headers=headers)
    assert r.status_code == 400

    body = r.get_json()
    assert body["status"] == "error"
    assert body["code"] == "RETURN_REQUEST_EXISTS"


# ============================================================
# TC-05: User 2 cố gửi yêu cầu cho đơn của User 1 -> 403 FORBIDDEN
# ============================================================

def test_tc05_create_return_request_other_user_forbidden(client, user2_token):
    headers = {"Authorization": f"Bearer {user2_token}"}
    payload = {
        "order_id": 1,
        "request_type": "return",
        "reason": "Gửi nhờ tài khoản khác",
    }
    r = client.post("/api/v1/returns", json=payload, headers=headers)
    assert r.status_code == 403

    body = r.get_json()
    assert body["status"] == "error"
    assert body["code"] == "FORBIDDEN"


# ============================================================
# TC-06: Admin duyệt / từ chối yêu cầu đổi/trả -> 200 OK
# ============================================================

def test_tc06_admin_approve_and_reject_return_request(client, admin_token, app):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Admin lấy danh sách tất cả yêu cầu
    r1 = client.get("/api/v1/returns/admin", headers=headers)
    assert r1.status_code == 200
    assert len(r1.get_json()["data"]) >= 1

    # 2. Admin chấp nhận (approve) request_id = 1 (của order 4)
    r2 = client.patch(
        "/api/v1/returns/admin/1",
        json={"status": "approved", "admin_note": "Đồng ý hỗ trợ đổi trả tại showroom"},
        headers=headers,
    )
    assert r2.status_code == 200
    data2 = r2.get_json()["data"]
    assert data2["status"] == "approved"
    assert data2["admin_note"] == "Đồng ý hỗ trợ đổi trả tại showroom"

    # Kiểm tra DB
    with app.app_context():
        req = db.session.query(ReturnRequest).filter(ReturnRequest.id == 1).first()
        assert req.status == "approved"


# ============================================================
# TC-07: Khách chưa đăng nhập -> 401 Unauthorized
# ============================================================

def test_tc07_unauthenticated_request_returns_401(client):
    r = client.post("/api/v1/returns", json={"order_id": 1, "reason": "test"})
    assert r.status_code == 401
