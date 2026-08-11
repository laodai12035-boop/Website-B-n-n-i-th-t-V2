"""
tests/test_admin_access.py — Test cases cho Chức năng Phân quyền Trang Quản trị (QTN-09).

Story: NT-01-CN-006 — Giới hạn quyền truy cập trang quản trị
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: Tài khoản Admin có quyền truy cập trang/API quản trị -> 200 OK
- TC-02: Tài khoản Khách hàng (User) cố truy cập API quản trị -> 403 FORBIDDEN
- TC-03: Không đăng nhập (thiếu token) -> 401 UNAUTHORIZED
"""

import json
import pytest
from app import create_app
from app.extensions import db, bcrypt
from app.models.user import User


# ============================================================
# Fixtures
# ============================================================

@pytest.fixture(scope="function")
def app():
    """Tạo Flask app với TestingConfig (SQLite in-memory)."""
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
def admin_token(client, app):
    """Tạo user vai trò ADMIN trong DB và lấy JWT Token."""
    with app.app_context():
        hashed_password = bcrypt.generate_password_hash("AdminPass123").decode("utf-8")
        admin = User(
            full_name="Quản Trị Viên Hệ Thống",
            email="admin@example.com",
            phone="0909998877",
            password_hash=hashed_password,
            role="admin",
            is_active=True,
        )
        db.session.add(admin)
        db.session.commit()

    login_res = client.post(
        "/api/v1/auth/login",
        data=json.dumps({"email": "admin@example.com", "password": "AdminPass123"}),
        content_type="application/json",
    )
    return login_res.get_json()["data"]["token"]


@pytest.fixture
def customer_token(client, app):
    """Tạo user vai trò USER (Khách hàng) trong DB và lấy JWT Token."""
    with app.app_context():
        hashed_password = bcrypt.generate_password_hash("UserPass123").decode("utf-8")
        user = User(
            full_name="Khách Hàng Thường",
            email="customer@example.com",
            phone="0901234567",
            password_hash=hashed_password,
            role="user",
            is_active=True,
        )
        db.session.add(user)
        db.session.commit()

    login_res = client.post(
        "/api/v1/auth/login",
        data=json.dumps({"email": "customer@example.com", "password": "UserPass123"}),
        content_type="application/json",
    )
    return login_res.get_json()["data"]["token"]


# ============================================================
# Helpers
# ============================================================

def get_admin_dashboard(client, token):
    """Helper gọi API GET /api/v1/admin/dashboard."""
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return client.get("/api/v1/admin/dashboard", headers=headers)


# ============================================================
# TC-01: Admin truy cập thành công (Happy Path)
# ============================================================

class TestAdminAccessSuccess:
    """TC-01: Kiểm tra tài khoản vai trò Admin truy cập trang quản trị thành công."""

    def test_admin_can_access_dashboard(self, client, admin_token):
        """Admin có quyền truy cập /admin/dashboard -> 200 OK."""
        response = get_admin_dashboard(client, admin_token)
        assert response.status_code == 200

        body = response.get_json()
        assert body["status"] == "success"
        assert "stats" in body["data"]
        assert "total_users" in body["data"]["stats"]


# ============================================================
# TC-02 & TC-03: Từ chối truy cập (Sad Paths - QTN-09)
# ============================================================

class TestAdminAccessDenied:
    """TC-02 & TC-03: Từ chối truy cập với Khách hàng hoặc chưa đăng nhập."""

    def test_customer_cannot_access_dashboard(self, client, customer_token):
        """TC-02: Khách hàng (role='user') bị từ chối truy cập -> 403 FORBIDDEN."""
        response = get_admin_dashboard(client, customer_token)
        assert response.status_code == 403

        body = response.get_json()
        assert body["status"] == "error"
        assert body["code"] == "FORBIDDEN"

    def test_unauthenticated_cannot_access_dashboard(self, client):
        """TC-03: Không có token bị từ chối -> 401 UNAUTHORIZED."""
        response = get_admin_dashboard(client, None)
        assert response.status_code == 401
