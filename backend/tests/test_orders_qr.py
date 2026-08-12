"""
tests/test_orders_qr.py — Test cases cho chức năng Thanh toán QR ngân hàng (VietQR).

Story: NT-05-CN-002 — Thanh toán qua mã QR ngân hàng
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: Tạo đơn hàng QR_BANK thành công → 201 Created, payment_method=QR_BANK, payment_status=pending_payment, qr_url hợp lệ.
- TC-02: Giỏ hàng rỗng → 400 CART_EMPTY.
- TC-03: Thiếu thông tin giao hàng → 400 MISSING_SHIPPING_INFO.
- TC-04: Vượt quá tồn kho → 400 EXCEED_STOCK.
- TC-05: GET /orders/<id>/qr trả về trạng thái đang chờ thanh toán.
- TC-06: GET /orders/<id>/qr khi QR đã hết hạn → expired=True.
- TC-07: Admin PATCH /orders/<id>/confirm-payment → 200 OK, payment_status=paid, status=confirmed.
- TC-08: Customer (role=user) PATCH /orders/<id>/confirm-payment → 403 Forbidden.
- TC-09: PATCH /orders/<id>/confirm-payment với đơn đã paid → 409 ALREADY_PAID.
- TC-10: PATCH /orders/<id>/confirm-payment với đơn COD (không phải QR_BANK) → 400 ORDER_NOT_QR_BANK.
"""

import pytest
from datetime import datetime, timedelta
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

        customer = User(
            id=1,
            email="customer@example.com",
            full_name="Khách Hàng QR Test",
            phone="0901234567",
            password_hash="pwd",
            role="user",
        )
        admin = User(
            id=2,
            email="admin@example.com",
            full_name="Admin User",
            phone="0909090909",
            password_hash="pwd",
            role="admin",
        )
        product = Product(
            id=1,
            name="Ghế Ăn Gỗ Sồi",
            slug="ghe-an-go-soi",
            price=5000000.0,
            stock=10,
            category="ghe",
            is_active=True,
        )
        db.session.add_all([customer, admin, product])
        db.session.commit()

        # Seed cart item for customer
        item = CartItem(id=1, user_id=1, product_id=1, quantity=2)
        db.session.add(item)
        db.session.commit()

        yield flask_app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def customer_token(app):
    with app.app_context():
        return create_access_token(identity="1")


@pytest.fixture
def admin_token(app):
    with app.app_context():
        return create_access_token(identity="2")


@pytest.fixture
def valid_qr_payload():
    """Payload hợp lệ để tạo đơn QR."""
    return {
        "recipient_name": "Nguyễn Văn A",
        "recipient_phone": "0901234567",
        "shipping_address": "123 Nguyễn Huệ, Q.1, TP.HCM",
        "note": "Giao giờ hành chính",
    }


@pytest.fixture
def created_qr_order_id(client, customer_token, valid_qr_payload, app):
    """Tạo sẵn 1 đơn QR_BANK và trả về order_id để các test khác dùng."""
    # Đảm bảo có cart item — nếu đã có thì cập nhật quantity
    with app.app_context():
        existing = db.session.query(CartItem).filter_by(user_id=1, product_id=1).first()
        if existing:
            existing.quantity = 2
        else:
            db.session.add(CartItem(user_id=1, product_id=1, quantity=2))
        db.session.commit()

    r = client.post(
        "/api/v1/orders/qr",
        json=valid_qr_payload,
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert r.status_code == 201
    return r.get_json()["data"]["id"]


# ============================================================
# TC-01: Tạo đơn QR thành công
# ============================================================

def test_tc01_create_qr_order_success(client, customer_token, valid_qr_payload):
    r = client.post(
        "/api/v1/orders/qr",
        json=valid_qr_payload,
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert r.status_code == 201
    data = r.get_json()["data"]

    # Kiểm tra fields
    assert data["payment_method"] == "QR_BANK"
    assert data["payment_status"] == "pending_payment"
    assert data["status"] == "pending"
    assert data["order_code"].startswith("ORD-")
    assert data["qr_expire_at"] is not None

    # qr_url phải hợp lệ và chứa vietqr.io
    assert "qr_url" in data
    assert "vietqr.io" in data["qr_url"]

    # bank_info phải có đủ keys
    bank_info = data["bank_info"]
    assert "bank_id" in bank_info
    assert "account_no" in bank_info
    assert "account_name" in bank_info
    assert "transfer_content" in bank_info
    assert data["order_code"] in bank_info["transfer_content"]

    # Tổng tiền = 2 * 5,000,000 = 10,000,000
    assert data["total_amount"] == 10_000_000.0

    # items đủ
    assert len(data["items"]) == 1
    assert data["items"][0]["quantity"] == 2


# ============================================================
# TC-02: Giỏ hàng rỗng → CART_EMPTY
# ============================================================

def test_tc02_cart_empty_returns_400(client, customer_token, valid_qr_payload, app):
    # Xóa sạch cart trước
    with app.app_context():
        db.session.query(CartItem).delete()
        db.session.commit()

    r = client.post(
        "/api/v1/orders/qr",
        json=valid_qr_payload,
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert r.status_code == 400
    assert r.get_json()["code"] == "CART_EMPTY"


# ============================================================
# TC-03: Thiếu thông tin giao hàng → 400
# ============================================================

@pytest.mark.parametrize("missing_field", ["recipient_name", "recipient_phone", "shipping_address"])
def test_tc03_missing_shipping_info_returns_400(client, customer_token, valid_qr_payload, missing_field):
    payload = dict(valid_qr_payload)
    payload[missing_field] = ""
    r = client.post(
        "/api/v1/orders/qr",
        json=payload,
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert r.status_code == 400
    assert r.get_json()["code"] in ["MISSING_SHIPPING_INFO", "MISSING_RECIPIENT_NAME", "MISSING_RECIPIENT_PHONE", "MISSING_SHIPPING_ADDRESS", "BAD_REQUEST"]


# ============================================================
# TC-04: Vượt tồn kho → EXCEED_STOCK
# ============================================================

def test_tc04_exceed_stock_returns_400(client, customer_token, valid_qr_payload, app):
    # Đặt số lượng giỏ hàng > stock
    with app.app_context():
        item = db.session.query(CartItem).filter_by(user_id=1).first()
        if item:
            item.quantity = 999  # stock chỉ 10
            db.session.commit()

    r = client.post(
        "/api/v1/orders/qr",
        json=valid_qr_payload,
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert r.status_code == 400
    assert r.get_json()["code"] == "EXCEED_STOCK"


# ============================================================
# TC-05: GET /orders/<id>/qr → trạng thái đang chờ thanh toán
# ============================================================

def test_tc05_get_qr_status_pending(client, customer_token, created_qr_order_id):
    r = client.get(
        f"/api/v1/orders/{created_qr_order_id}/qr",
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert r.status_code == 200
    data = r.get_json()["data"]
    assert data["payment_status"] == "pending_payment"
    assert data["expired"] is False
    assert "qr_url" in data
    assert data["qr_url"] is not None  # Chưa hết hạn nên vẫn có QR URL


# ============================================================
# TC-06: GET /orders/<id>/qr khi hết hạn → expired=True
# ============================================================

def test_tc06_expired_qr_returns_expired_true(client, customer_token, created_qr_order_id, app):
    # Force expiry: đặt qr_expire_at về quá khứ
    with app.app_context():
        order = db.session.query(Order).get(created_qr_order_id)
        order.qr_expire_at = datetime.utcnow() - timedelta(minutes=1)
        db.session.commit()

    r = client.get(
        f"/api/v1/orders/{created_qr_order_id}/qr",
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert r.status_code == 200
    data = r.get_json()["data"]
    assert data["expired"] is True
    assert data["payment_status"] == "pending_payment"  # Vẫn pending_payment, chưa paid
    assert data["qr_url"] is None  # QR URL bị ẩn khi hết hạn


# ============================================================
# TC-07: Admin xác nhận thanh toán → 200 OK
# ============================================================

def test_tc07_admin_confirm_payment_success(client, admin_token, created_qr_order_id):
    r = client.patch(
        f"/api/v1/orders/{created_qr_order_id}/confirm-payment",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r.status_code == 200
    data = r.get_json()["data"]
    assert data["payment_status"] == "paid"
    assert data["status"] == "confirmed"


# ============================================================
# TC-08: Customer (role=user) confirm-payment → 403 Forbidden
# ============================================================

def test_tc08_customer_cannot_confirm_payment(client, customer_token, created_qr_order_id):
    r = client.patch(
        f"/api/v1/orders/{created_qr_order_id}/confirm-payment",
        headers={"Authorization": f"Bearer {customer_token}"},
    )
    assert r.status_code == 403
    assert r.get_json()["code"] == "FORBIDDEN"


# ============================================================
# TC-09: Xác nhận đơn đã paid → 409 ALREADY_PAID
# ============================================================

def test_tc09_already_paid_returns_409(client, admin_token, created_qr_order_id):
    # Xác nhận lần 1
    client.patch(
        f"/api/v1/orders/{created_qr_order_id}/confirm-payment",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    # Xác nhận lần 2 → phải 409
    r = client.patch(
        f"/api/v1/orders/{created_qr_order_id}/confirm-payment",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r.status_code == 409
    assert r.get_json()["code"] == "ALREADY_PAID"


# ============================================================
# TC-10: Xác nhận đơn COD (không phải QR_BANK) → 400 ORDER_NOT_QR_BANK
# ============================================================

def test_tc10_confirm_payment_cod_order_returns_400(client, admin_token, app):
    # Tạo đơn COD thủ công
    with app.app_context():
        cod_order = Order(
            order_code="ORD-COD-TEST",
            user_id=1,
            recipient_name="Test User",
            recipient_phone="0900000000",
            shipping_address="123 Test St",
            payment_method="COD",
            payment_status="unpaid",
            status="pending",
            subtotal=1000000.0,
            discount_amount=0.0,
            total_amount=1000000.0,
        )
        db.session.add(cod_order)
        db.session.commit()
        cod_id = cod_order.id

    r = client.patch(
        f"/api/v1/orders/{cod_id}/confirm-payment",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r.status_code == 400
    assert r.get_json()["code"] == "BAD_REQUEST"  # ORDER_NOT_QR_BANK mapped to BAD_REQUEST
