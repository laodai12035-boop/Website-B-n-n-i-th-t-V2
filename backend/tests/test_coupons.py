"""
tests/test_coupons.py — Test cases cho chức năng Áp dụng mã giảm giá (QTN-01).

Story: NT-04-CN-004 — Áp dụng mã giảm giá vào giỏ hàng
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: Nhập mã hợp lệ với đơn hàng 2.5 triệu (tối thiểu 2 triệu) -> 200 OK + Giảm 10% chính xác
- TC-02: Đơn hàng 200k chưa đạt giá trị tối thiểu 2 triệu (QTN-01) -> 400 Bad Request (MIN_ORDER_VALUE_NOT_MET)
- TC-03: Mã hết hạn hoặc không hợp lệ -> 400 Bad Request (COUPON_EXPIRED_OR_INVALID)
- Extra: Mã giảm cố định 500k cho đơn từ 5 triệu -> 200 OK + Giảm đúng 500k
"""

import pytest
from datetime import datetime, timedelta
from flask_jwt_extended import create_access_token
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.coupon import Coupon


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
            full_name="Khách Hàng Test Coupon",
            phone="0901234567",
            password_hash="pwd",
            role="user",
        )

        c1 = Coupon(
            id=1,
            code="NOITHAT10",
            description="Giảm 10% đơn từ 2.000.000đ",
            discount_type="percent",
            discount_value=10.0,
            min_order_value=2000000.0,
            max_discount=1000000.0,
            is_active=True,
        )

        c2 = Coupon(
            id=2,
            code="GIAM500K",
            description="Giảm 500k đơn từ 5.000.000đ",
            discount_type="fixed",
            discount_value=500000.0,
            min_order_value=5000000.0,
            is_active=True,
        )

        c3 = Coupon(
            id=3,
            code="HETHAN2025",
            description="Mã hết hạn",
            discount_type="percent",
            discount_value=20.0,
            min_order_value=1000000.0,
            is_active=False,
            end_date=datetime.utcnow() - timedelta(days=1),
        )

        db.session.add_all([user1, c1, c2, c3])
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

class TestCouponsQTN01:
    """Kiểm thử tính năng Áp dụng mã giảm giá (QTN-01)."""

    def test_apply_valid_percent_coupon_success(self, client, auth_headers):
        """Đơn hàng 2.500.000đ áp mã NOITHAT10 (min 2M) -> 200 OK, giảm 250.000đ, tổng 2.250.000đ (TC-01)."""
        response = client.post(
            "/api/v1/coupons/apply",
            json={"coupon_code": "NOITHAT10", "subtotal": 2500000.0},
            headers=auth_headers,
        )
        assert response.status_code == 200

        body = response.get_json()
        assert body["status"] == "success"
        data = body["data"]

        assert data["coupon_code"] == "NOITHAT10"
        assert data["discount_amount"] == 250000.0
        assert data["final_total"] == 2250000.0

    def test_apply_coupon_min_order_value_not_met_rejected(self, client, auth_headers):
        """Đơn hàng 200.000đ chưa đạt giá trị tối thiểu 2M -> 400 Bad Request MIN_ORDER_VALUE_NOT_MET (TC-02)."""
        response = client.post(
            "/api/v1/coupons/apply",
            json={"coupon_code": "NOITHAT10", "subtotal": 200000.0},
            headers=auth_headers,
        )
        assert response.status_code == 400

        body = response.get_json()
        assert body["status"] == "error"
        assert body["code"] == "MIN_ORDER_VALUE_NOT_MET"
        assert body["min_order_value"] == 2000000.0

    def test_apply_expired_or_invalid_coupon_rejected(self, client, auth_headers):
        """Mã HETHAN2025 hoặc mã không tồn tại -> 400 Bad Request COUPON_EXPIRED_OR_INVALID (TC-03)."""
        response = client.post(
            "/api/v1/coupons/apply",
            json={"coupon_code": "HETHAN2025", "subtotal": 2000000.0},
            headers=auth_headers,
        )
        assert response.status_code == 400
        assert response.get_json()["code"] == "COUPON_EXPIRED_OR_INVALID"

        # Test non-existent coupon code
        response_invalid = client.post(
            "/api/v1/coupons/apply",
            json={"coupon_code": "INVALIDCODE", "subtotal": 2000000.0},
            headers=auth_headers,
        )
        assert response_invalid.status_code == 400
        assert response_invalid.get_json()["code"] == "COUPON_EXPIRED_OR_INVALID"

    def test_apply_fixed_amount_coupon_success(self, client, auth_headers):
        """Đơn hàng 5.500.000đ áp mã GIAM500K (min 5M) -> 200 OK, giảm 500.000đ, tổng 5.000.000đ."""
        response = client.post(
            "/api/v1/coupons/apply",
            json={"coupon_code": "giam500k", "subtotal": 5500000.0},
            headers=auth_headers,
        )
        assert response.status_code == 200

        data = response.get_json()["data"]
        assert data["coupon_code"] == "GIAM500K"
        assert data["discount_amount"] == 500000.0
        assert data["final_total"] == 5000000.0
