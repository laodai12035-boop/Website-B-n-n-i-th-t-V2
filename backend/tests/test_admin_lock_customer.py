"""
tests/test_admin_lock_customer.py — Test cases cho Khóa và mở khóa tài khoản khách hàng (NT-12-CN-002).

Story: NT-12-CN-002 — Khóa và mở khóa tài khoản khách hàng
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: Admin khóa tài khoản đang hoạt động ➔ Khách đăng nhập bị từ chối (403 ACCOUNT_LOCKED) (Mức độ Cao)
- TC-02: Admin mở khóa tài khoản đang bị khóa ➔ Khách đăng nhập trở lại bình thường (200 OK) (Mức độ Trung bình)
- TC-03: Khóa tài khoản không tồn tại trong hệ thống ➔ 404 CUSTOMER_NOT_FOUND
- TC-04: Khách hàng thường không có quyền truy cập API Admin Customer Status ➔ 403 FORBIDDEN
"""

import pytest
from flask_jwt_extended import create_access_token
from app import create_app
from app.extensions import db, bcrypt
from app.models.user import User


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
            full_name="Quản Trị Viên Khóa Tài Khoản",
            email="adminlock@example.com",
            phone="0901112222",
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
            full_name="Đặng Văn L",
            email="userl@example.com",
            phone="0904443333",
            password_hash=bcrypt.generate_password_hash("UserPassword123@").decode("utf-8"),
            role="user",
            is_active=True,
        )
        db.session.add(user)
        db.session.commit()
        token = create_access_token(identity=str(user.id))
        return {"id": user.id, "email": user.email, "token": token}


class TestAdminLockCustomerNT12CN002:
    """Bộ kiểm thử cho chức năng Khóa & Mở khóa tài khoản khách hàng (NT-12-CN-002)."""

    def test_tc01_admin_lock_customer_prevents_login(self, app, client, admin_user):
        """TC-01: Admin khóa tài khoản ➔ Tài khoản chuyển trạng thái khóa, khách hàng không đăng nhập được (403 ACCOUNT_LOCKED)."""
        # 1. Tạo tài khoản khách hàng đang hoạt động
        with app.app_context():
            user = User(
                full_name="Khách Hàng Cần Khóa",
                email="target_lock@example.com",
                phone="0988000111",
                password_hash=bcrypt.generate_password_hash("CustomerPass123@").decode("utf-8"),
                role="user",
                is_active=True,
            )
            db.session.add(user)
            db.session.commit()
            target_id = user.id

        # 2. Kiểm tra đăng nhập trước khi khóa ➔ Đăng nhập thành công 200 OK
        res_login_before = client.post(
            "/api/v1/auth/login",
            json={"email": "target_lock@example.com", "password": "CustomerPass123@"},
        )
        assert res_login_before.status_code == 200

        # 3. Admin thực hiện khóa tài khoản (is_active = False)
        res_lock = client.put(
            f"/api/v1/admin/customers/{target_id}/status",
            json={"is_active": False},
            headers={"Authorization": f"Bearer {admin_user['token']}"},
        )
        assert res_lock.status_code == 200
        assert res_lock.get_json()["data"]["is_active"] is False

        # 4. Khách hàng thử đăng nhập lại ➔ Bị từ chối 403 ACCOUNT_LOCKED
        res_login_after = client.post(
            "/api/v1/auth/login",
            json={"email": "target_lock@example.com", "password": "CustomerPass123@"},
        )
        assert res_login_after.status_code == 403
        assert res_login_after.get_json()["code"] == "ACCOUNT_LOCKED"

    def test_tc02_admin_unlock_customer_allows_login(self, app, client, admin_user):
        """TC-02: Admin mở khóa tài khoản ➔ Tài khoản hoạt động trở lại, đăng nhập bình thường (200 OK)."""
        # 1. Tạo tài khoản khách hàng đang bị khóa
        with app.app_context():
            user = User(
                full_name="Khách Hàng Cần Mở Khóa",
                email="target_unlock@example.com",
                phone="0988000222",
                password_hash=bcrypt.generate_password_hash("CustomerPass123@").decode("utf-8"),
                role="user",
                is_active=False,
            )
            db.session.add(user)
            db.session.commit()
            target_id = user.id

        # 2. Đăng nhập thử ➔ Bị từ chối 403 ACCOUNT_LOCKED
        res_locked = client.post(
            "/api/v1/auth/login",
            json={"email": "target_unlock@example.com", "password": "CustomerPass123@"},
        )
        assert res_locked.status_code == 403

        # 3. Admin mở khóa tài khoản (is_active = True)
        res_unlock = client.put(
            f"/api/v1/admin/customers/{target_id}/status",
            json={"is_active": True},
            headers={"Authorization": f"Bearer {admin_user['token']}"},
        )
        assert res_unlock.status_code == 200
        assert res_unlock.get_json()["data"]["is_active"] is True

        # 4. Khách hàng đăng nhập lại ➔ Thành công 200 OK
        res_success = client.post(
            "/api/v1/auth/login",
            json={"email": "target_unlock@example.com", "password": "CustomerPass123@"},
        )
        assert res_success.status_code == 200
        assert "token" in res_success.get_json()["data"]

    def test_tc03_lock_non_existent_customer_returns_404(self, client, admin_user):
        """TC-03: Khóa tài khoản không tồn tại ➔ 404 CUSTOMER_NOT_FOUND."""
        res = client.put(
            "/api/v1/admin/customers/99999/status",
            json={"is_active": False},
            headers={"Authorization": f"Bearer {admin_user['token']}"},
        )
        assert res.status_code == 404
        assert res.get_json()["code"] == "CUSTOMER_NOT_FOUND"

    def test_tc04_regular_user_lock_customer_forbidden(self, client, regular_user):
        """TC-04: Khách hàng thường không có quyền truy cập API Admin Customer Status ➔ 403 FORBIDDEN."""
        res = client.put(
            "/api/v1/admin/customers/1/status",
            json={"is_active": False},
            headers={"Authorization": f"Bearer {regular_user['token']}"},
        )
        assert res.status_code == 403
        assert res.get_json()["code"] == "FORBIDDEN"
