"""
tests/test_auth_login.py — Test cases cho chức năng đăng nhập hệ thống.

Story: NT-01-CN-002 — Đăng nhập hệ thống
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: Đăng nhập thành công với email & mật khẩu đúng (200 OK + JWT token)
- TC-02: Đăng nhập với mật khẩu sai hoặc email không tồn tại (401 INVALID_CREDENTIALS)
- TC-03: Đăng nhập với tài khoản bị khóa is_active=False (403 ACCOUNT_LOCKED)
- Extra: GET /auth/me với token hợp lệ / không hợp lệ
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
    """Tạo Flask app với TestingConfig (SQLite in-memory) cho từng test case."""
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
def seed_user(app):
    """Tạo sẵn 1 user active trong DB để test login."""
    with app.app_context():
        hashed_password = bcrypt.generate_password_hash("Password123").decode("utf-8")
        user = User(
            full_name="Nguyễn Văn B",
            email="userb@example.com",
            phone="0909876543",
            password_hash=hashed_password,
            role="user",
            is_active=True,
        )
        db.session.add(user)
        db.session.commit()
        return user.id


@pytest.fixture
def seed_locked_user(app):
    """Tạo sẵn 1 user bị khóa (is_active=False) trong DB."""
    with app.app_context():
        hashed_password = bcrypt.generate_password_hash("Password123").decode("utf-8")
        user = User(
            full_name="User Bị Khóa",
            email="locked@example.com",
            phone="0901112233",
            password_hash=hashed_password,
            role="user",
            is_active=False,
        )
        db.session.add(user)
        db.session.commit()
        return user.id


# ============================================================
# Helpers
# ============================================================

def post_login(client, email, password):
    """Helper gọi API POST /api/v1/auth/login."""
    return client.post(
        "/api/v1/auth/login",
        data=json.dumps({"email": email, "password": password}),
        content_type="application/json",
    )


def get_me(client, token):
    """Helper gọi API GET /api/v1/auth/me kèm Bearer token."""
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return client.get("/api/v1/auth/me", headers=headers)


# ============================================================
# TC-01: Luồng thành công (Happy Path)
# ============================================================

class TestLoginSuccess:
    """TC-01: Đăng nhập thành công với tài khoản và mật khẩu đúng."""

    def test_login_returns_200(self, client, seed_user):
        """API trả về HTTP status 200."""
        response = post_login(client, "userb@example.com", "Password123")
        assert response.status_code == 200

    def test_login_returns_token_and_user(self, client, seed_user):
        """Response phải chứa JWT token và thông tin user."""
        response = post_login(client, "userb@example.com", "Password123")
        body = response.get_json()

        assert body["status"] == "success"
        assert "token" in body["data"]
        assert body["data"]["user"]["email"] == "userb@example.com"
        assert body["data"]["user"]["full_name"] == "Nguyễn Văn B"

    def test_login_case_insensitive_email(self, client, seed_user):
        """Đăng nhập với email viết hoa/thường đều thành công."""
        response = post_login(client, "USERB@EXAMPLE.COM", "Password123")
        assert response.status_code == 200


# ============================================================
# TC-02: Dữ liệu không hợp lệ / Sai mật khẩu
# ============================================================

class TestLoginInvalidCredentials:
    """TC-02: Mật khẩu sai hoặc Email không tồn tại -> 401 INVALID_CREDENTIALS."""

    def test_wrong_password_returns_401(self, client, seed_user):
        """Mật khẩu sai phải trả 401."""
        response = post_login(client, "userb@example.com", "WrongPassword")
        assert response.status_code == 401

        body = response.get_json()
        assert body["status"] == "error"
        assert body["code"] == "INVALID_CREDENTIALS"

    def test_non_existing_email_returns_401(self, client):
        """Email không tồn tại phải trả 401."""
        response = post_login(client, "nobody@example.com", "Password123")
        assert response.status_code == 401

        body = response.get_json()
        assert body["code"] == "INVALID_CREDENTIALS"

    def test_empty_email_or_password_returns_400(self, client):
        """Thiếu email hoặc mật khẩu phải trả 400 VALIDATION_ERROR."""
        response = post_login(client, "", "Password123")
        assert response.status_code == 400


# ============================================================
# TC-03: Tài khoản bị khóa (is_active=False)
# ============================================================

class TestLoginAccountLocked:
    """TC-03: Đăng nhập với tài khoản bị khóa -> 403 ACCOUNT_LOCKED."""

    def test_locked_account_returns_403(self, client, seed_locked_user):
        """Đăng nhập đúng email & pass của tài khoản bị khóa phải trả 403."""
        response = post_login(client, "locked@example.com", "Password123")
        assert response.status_code == 403

        body = response.get_json()
        assert body["status"] == "error"
        assert body["code"] == "ACCOUNT_LOCKED"
        assert "bị khóa" in body["message"]


# ============================================================
# Integration: GET /api/v1/auth/me
# ============================================================

class TestGetMeEndpoint:
    """Kiểm tra API lấy thông tin user hiện tại qua JWT token."""

    def test_get_me_with_valid_token(self, client, seed_user):
        """Request kèm token hợp lệ trả về 200 OK và data user."""
        # 1. Login lấy token
        login_res = post_login(client, "userb@example.com", "Password123")
        token = login_res.get_json()["data"]["token"]

        # 2. Call /auth/me
        me_res = get_me(client, token)
        assert me_res.status_code == 200

        body = me_res.get_json()
        assert body["data"]["user"]["email"] == "userb@example.com"

    def test_get_me_without_token(self, client):
        """Request không kèm token trả về 401."""
        me_res = get_me(client, None)
        assert me_res.status_code == 401

    def test_get_me_with_invalid_token(self, client):
        """Request kèm token không hợp lệ trả về 401 hoặc 422."""
        me_res = get_me(client, "invalid.token.here")
        assert me_res.status_code in (401, 422)
