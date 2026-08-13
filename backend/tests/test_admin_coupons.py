"""
tests/test_admin_coupons.py — Test cases cho Tạo mã giảm giá (NT-11-CN-002, QTN-01).

Story: NT-11-CN-002 — Tạo mã giảm giá
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: Admin tạo mã giảm giá "NOITHAT10" 10% đơn từ 2.000.000đ ➔ 201 Created (Sẵn sàng cho khách áp dụng)
- TC-02: Mã giảm giá đã tồn tại (Tạo mã trùng) ➔ 400 Bad Request (COUPON_CODE_EXISTS)
- TC-03: Sửa và xóa mã giảm giá ➔ 200 OK
- TC-04: Người dùng thường không có quyền truy cập API Admin Coupons ➔ 403 FORBIDDEN
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
            full_name="Quản Trị Viên Coupons",
            email="admincoupon@example.com",
            phone="0901117777",
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
            full_name="Nguyễn Văn G",
            email="userg@example.com",
            phone="0905554444",
            password_hash=bcrypt.generate_password_hash("UserPassword123@").decode("utf-8"),
            role="user",
            is_active=True,
        )
        db.session.add(user)
        db.session.commit()
        token = create_access_token(identity=str(user.id))
        return {"id": user.id, "email": user.email, "token": token}


class TestAdminCouponsNT11CN002:
    """Bộ kiểm thử cho chức năng Tạo & Quản lý Mã giảm giá (NT-11-CN-002, QTN-01)."""

    def test_tc01_admin_create_coupon_success(self, client, admin_user, regular_user):
        """TC-01: Admin tạo mã giảm giá NOITHAT10 giảm 10% đơn tối thiểu 2.000.000đ ➔ 201 Created."""
        payload = {
            "code": "NOITHAT10",
            "discount_type": "percent",
            "discount_value": 10.0,
            "min_order_value": 2000000.0,
            "max_discount": 1000000.0,
            "description": "Giảm 10% cho đơn hàng từ 2 triệu",
            "is_active": True,
        }

        # 1. Gọi API POST /api/v1/admin/coupons
        res_create = client.post(
            "/api/v1/admin/coupons",
            json=payload,
            headers={"Authorization": f"Bearer {admin_user['token']}"},
        )
        assert res_create.status_code == 201
        created_coupon = res_create.get_json()["data"]
        assert created_coupon["code"] == "NOITHAT10"
        assert created_coupon["discount_type"] == "percent"
        assert created_coupon["discount_value"] == 10.0
        assert created_coupon["min_order_value"] == 2000000.0

        # 2. Khách hàng áp dụng mã NOITHAT10 với đơn 2.500.000đ ➔ Áp dụng thành công (QTN-01)
        res_apply = client.post(
            "/api/v1/coupons/apply",
            json={"code": "NOITHAT10", "subtotal": 2500000.0},
            headers={"Authorization": f"Bearer {regular_user['token']}"},
        )
        assert res_apply.status_code == 200
        apply_data = res_apply.get_json()["data"]
        assert apply_data["discount_amount"] == 250000.0  # 10% của 2.500.000đ
        assert apply_data["final_total"] == 2250000.0

    def test_tc02_create_coupon_duplicate_code_rejected(self, app, client, admin_user):
        """TC-02: Mã giảm giá đã tồn tại (Tạo mã trùng) ➔ 400 Bad Request COUPON_CODE_EXISTS."""
        # 1. Tạo sẵn mã NOITHAT10 trong DB
        with app.app_context():
            c = Coupon(
                code="NOITHAT10",
                discount_type="percent",
                discount_value=10.0,
                min_order_value=1000000.0,
                is_active=True,
            )
            db.session.add(c)
            db.session.commit()

        # 2. Thử tạo lại mã NOITHAT10 (viết thường hay viết hoa đều bị phát hiện trùng)
        payload = {
            "code": "noithat10",  # Trùng mã
            "discount_type": "fixed",
            "discount_value": 100000.0,
            "min_order_value": 500000.0,
        }

        res_create = client.post(
            "/api/v1/admin/coupons",
            json=payload,
            headers={"Authorization": f"Bearer {admin_user['token']}"},
        )
        assert res_create.status_code == 400
        assert res_create.get_json()["code"] == "COUPON_CODE_EXISTS"

    def test_tc03_admin_update_and_delete_coupon_success(self, app, client, admin_user):
        """TC-03: Admin chỉnh sửa mô tả/mức giảm và xóa mã giảm giá ➔ 200 OK."""
        # 1. Tạo mã trong DB
        with app.app_context():
            c = Coupon(
                code="GIAM300K",
                discount_type="fixed",
                discount_value=300000.0,
                min_order_value=3000000.0,
                is_active=True,
            )
            db.session.add(c)
            db.session.commit()
            coupon_id = c.id

        # 2. Cập nhật mã
        res_update = client.put(
            f"/api/v1/admin/coupons/{coupon_id}",
            json={
                "discount_value": 500000.0,
                "min_order_value": 5000000.0,
                "description": "Đã nâng mức giảm lên 500k",
            },
            headers={"Authorization": f"Bearer {admin_user['token']}"},
        )
        assert res_update.status_code == 200
        updated_data = res_update.get_json()["data"]
        assert updated_data["discount_value"] == 500000.0
        assert updated_data["min_order_value"] == 5000000.0

        # 3. Xóa mã
        res_delete = client.delete(
            f"/api/v1/admin/coupons/{coupon_id}",
            headers={"Authorization": f"Bearer {admin_user['token']}"},
        )
        assert res_delete.status_code == 200
        assert res_delete.get_json()["data"]["coupon_id"] == coupon_id

        # 4. Kiểm tra lại trong DB ➔ Mã đã bị xóa
        with app.app_context():
            deleted_c = db.session.query(Coupon).filter(Coupon.id == coupon_id).first()
            assert deleted_c is None

    def test_tc04_regular_user_access_admin_coupons_forbidden(self, client, regular_user):
        """TC-04: Khách hàng thường không có quyền truy cập API Admin Coupons ➔ Trả về 403 FORBIDDEN."""
        res_get = client.get(
            "/api/v1/admin/coupons",
            headers={"Authorization": f"Bearer {regular_user['token']}"},
        )
        assert res_get.status_code == 403
        assert res_get.get_json()["code"] == "FORBIDDEN"

        res_post = client.post(
            "/api/v1/admin/coupons",
            json={"code": "HACK2026", "discount_type": "percent", "discount_value": 50.0},
            headers={"Authorization": f"Bearer {regular_user['token']}"},
        )
        assert res_post.status_code == 403
        assert res_post.get_json()["code"] == "FORBIDDEN"
