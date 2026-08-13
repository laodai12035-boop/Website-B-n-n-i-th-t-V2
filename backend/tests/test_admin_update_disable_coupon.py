"""
tests/test_admin_update_disable_coupon.py — Test cases cho Sửa và vô hiệu hóa mã giảm giá (NT-11-CN-003, QTN-01).

Story: NT-11-CN-003 — Sửa và vô hiệu hóa mã giảm giá
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: Admin vô hiệu hóa mã giảm giá ➔ Khách không thể áp dụng mã nữa (400 COUPON_EXPIRED_OR_INVALID)
- TC-02: Admin sửa điều kiện đơn tối thiểu (QTN-01) ➔ Đơn hàng tiếp theo được áp dụng theo mức tối thiểu mới
- TC-03: Admin lùi ngày hết hạn để dừng sớm ➔ Mã ngừng cho áp dụng ngay lập tức
- TC-04: Người dùng thường không có quyền truy cập API sửa/vô hiệu hóa ➔ 403 FORBIDDEN
"""

import pytest
from datetime import datetime, timedelta
from flask_jwt_extended import create_access_token
from app import create_app
from app.extensions import db, bcrypt
from app.models.user import User
from app.models.coupon import Coupon


@pytest.fixture(scope="function")
def app():
    """Tạo Flask app với TestingConfig cho từng test case."""
    flask_app = create_app("testing")
    with flask_app.app_context():
        db.create_all()
        yield flask_app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Flask test client."""
    return app.test_client()


@pytest.fixture
def admin_user(app):
    """Tạo tài khoản Admin trong DB."""
    with app.app_context():
        admin = User(
            full_name="Quản Trị Viên Vô Hiệu Hóa",
            email="admindisable@example.com",
            phone="0901118888",
            password_hash=bcrypt.generate_password_hash("AdminPassword123@").decode("utf-8"),
            role="admin",
            is_active=True,
        )
        db.session.add(admin)
        db.session.commit()
        token = create_access_token(identity=str(admin.id))
        return {"id": admin.id, "email": admin.email, "token": token}


@pytest.fixture
def regular_user(app):
    """Tạo tài khoản Khách hàng thường trong DB."""
    with app.app_context():
        user = User(
            full_name="Đỗ Văn H",
            email="userh@example.com",
            phone="0906665555",
            password_hash=bcrypt.generate_password_hash("UserPassword123@").decode("utf-8"),
            role="user",
            is_active=True,
        )
        db.session.add(user)
        db.session.commit()
        token = create_access_token(identity=str(user.id))
        return {"id": user.id, "email": user.email, "token": token}


class TestAdminUpdateDisableCouponNT11CN003:
    """Bộ kiểm thử cho chức năng Sửa & Vô hiệu hóa Mã giảm giá (NT-11-CN-003, QTN-01)."""

    def test_tc01_disable_coupon_prevents_customer_from_applying(self, app, client, admin_user, regular_user):
        """TC-01: Admin vô hiệu hóa mã (is_active=False) ➔ Mã lập tức không còn áp dụng được cho khách."""
        # 1. Tạo sẵn mã đang chạy trong DB
        with app.app_context():
            c = Coupon(
                code="KM100K",
                discount_type="fixed",
                discount_value=100000.0,
                min_order_value=500000.0,
                is_active=True,
            )
            db.session.add(c)
            db.session.commit()
            coupon_id = c.id

        # 2. Khách áp dụng mã ➔ Áp dụng thành công
        res_before = client.post(
            "/api/v1/coupons/apply",
            json={"code": "KM100K", "subtotal": 1000000.0},
            headers={"Authorization": f"Bearer {regular_user['token']}"},
        )
        assert res_before.status_code == 200

        # 3. Admin vô hiệu hóa mã (is_active = False)
        res_disable = client.put(
            f"/api/v1/admin/coupons/{coupon_id}",
            json={"is_active": False},
            headers={"Authorization": f"Bearer {admin_user['token']}"},
        )
        assert res_disable.status_code == 200
        assert res_disable.get_json()["data"]["is_active"] is False

        # 4. Khách thử áp dụng lại ➔ Bị từ chối 400 COUPON_EXPIRED_OR_INVALID
        res_after = client.post(
            "/api/v1/coupons/apply",
            json={"code": "KM100K", "subtotal": 1000000.0},
            headers={"Authorization": f"Bearer {regular_user['token']}"},
        )
        assert res_after.status_code == 400
        assert res_after.get_json()["code"] == "COUPON_EXPIRED_OR_INVALID"

    def test_tc02_update_min_order_value_enforces_new_limit_qtn01(self, app, client, admin_user, regular_user):
        """TC-02: Admin sửa điều kiện đơn tối thiểu từ 1tr lên 5tr ➔ Đơn 2tr bị từ chối MIN_ORDER_VALUE_NOT_MET."""
        with app.app_context():
            c = Coupon(
                code="KM50K",
                discount_type="fixed",
                discount_value=50000.0,
                min_order_value=1000000.0,
                is_active=True,
            )
            db.session.add(c)
            db.session.commit()
            coupon_id = c.id

        # Admin tăng min_order_value lên 5.000.000đ
        res_update = client.put(
            f"/api/v1/admin/coupons/{coupon_id}",
            json={"min_order_value": 5000000.0},
            headers={"Authorization": f"Bearer {admin_user['token']}"},
        )
        assert res_update.status_code == 200
        assert res_update.get_json()["data"]["min_order_value"] == 5000000.0

        # Khách áp dụng mã với đơn 2.000.000đ ➔ Bị từ chối MIN_ORDER_VALUE_NOT_MET
        res_rejected = client.post(
            "/api/v1/coupons/apply",
            json={"code": "KM50K", "subtotal": 2000000.0},
            headers={"Authorization": f"Bearer {regular_user['token']}"},
        )
        assert res_rejected.status_code == 400
        assert res_rejected.get_json()["code"] == "MIN_ORDER_VALUE_NOT_MET"

        # Khách áp dụng mã với đơn 6.000.000đ ➔ Áp dụng thành công
        res_success = client.post(
            "/api/v1/coupons/apply",
            json={"code": "KM50K", "subtotal": 6000000.0},
            headers={"Authorization": f"Bearer {regular_user['token']}"},
        )
        assert res_success.status_code == 200

    def test_tc03_update_end_date_early_stop_prevents_applying(self, app, client, admin_user, regular_user):
        """TC-03: Admin lùi end_date về quá khứ để dừng sớm chương trình ➔ Mã ngừng cho áp dụng ngay."""
        with app.app_context():
            c = Coupon(
                code="HE2026",
                discount_type="percent",
                discount_value=15.0,
                min_order_value=1000000.0,
                is_active=True,
            )
            db.session.add(c)
            db.session.commit()
            coupon_id = c.id

        # Admin lùi ngày hết hạn về quá khứ (ngày hôm qua)
        yesterday_iso = (datetime.utcnow() - timedelta(days=1)).isoformat()
        res_update = client.put(
            f"/api/v1/admin/coupons/{coupon_id}",
            json={"end_date": yesterday_iso},
            headers={"Authorization": f"Bearer {admin_user['token']}"},
        )
        assert res_update.status_code == 200

        # Khách thử áp dụng ➔ Trả về 400 COUPON_EXPIRED_OR_INVALID
        res_apply = client.post(
            "/api/v1/coupons/apply",
            json={"code": "HE2026", "subtotal": 2000000.0},
            headers={"Authorization": f"Bearer {regular_user['token']}"},
        )
        assert res_apply.status_code == 400
        assert res_apply.get_json()["code"] == "COUPON_EXPIRED_OR_INVALID"

    def test_tc04_regular_user_update_coupon_forbidden(self, client, regular_user):
        """TC-04: Khách hàng thường không có quyền sửa/vô hiệu hóa mã ➔ 403 FORBIDDEN."""
        res_put = client.put(
            "/api/v1/admin/coupons/1",
            json={"is_active": False},
            headers={"Authorization": f"Bearer {regular_user['token']}"},
        )
        assert res_put.status_code == 403
        assert res_put.get_json()["code"] == "FORBIDDEN"
