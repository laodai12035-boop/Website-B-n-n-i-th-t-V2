"""
tests/test_auth_logout.py — Test cases cho chức năng đăng xuất.

Story: NT-01-CN-003 — Đăng xuất
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: Đăng xuất với JWT token hợp lệ -> 200 OK + Message "Đăng xuất thành công"
- TC-02: Đăng xuất không truyền token -> 401 Unauthorized
- TC-03: Đăng xuất với token rác / sai định dạng -> 401 / 422
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
def logged_in_token(client, app):
    """Tạo user trong DB và đăng nhập để lấy JWT token hợp lệ."""
    with app.app_context():
        hashed_password = bcrypt.generate_password_hash("Password123").decode("utf-8")
        user = User(
            full_name="Nguyễn Văn Logout",
            email="logout_test@example.com",
            phone="0905556677",
            password_hash=hashed_password,
            role="user",
            is_active=True,
        )
        db.session.add(user)
        db.session.commit()

    response = client.post(
        "/api/v1/auth/login",
        data=json.dumps({"email": "logout_test@example.com", "password": "Password123"}),
        content_type="application/json",
    )
    return response.get_json()["data"]["token"]


# ============================================================
# Helpers
# ============================================================

def post_logout(client, token):
    """Helper gọi API POST /api/v1/auth/logout."""
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return client.post("/api/v1/auth/logout", headers=headers)


# ============================================================
# TC-01: Luồng thành công (Happy Path)
# ============================================================

class TestLogoutSuccess:
    """TC-01: Đăng xuất thành công với token hợp lệ."""

    def test_logout_returns_200(self, client, logged_in_token):
        """API trả về status 200 OK khi có token hợp lệ."""
        response = post_logout(client, logged_in_token)
        assert response.status_code == 200

    def test_logout_response_message(self, client, logged_in_token):
        """Response chứa message xác nhận đăng xuất thành công."""
        response = post_logout(client, logged_in_token)
        body = response.get_json()

        assert body["status"] == "success"
        assert body["message"] == "Đăng xuất thành công"


# ============================================================
# TC-02 & TC-03: Kiểm tra bảo mật (Security Checks)
# ============================================================

class TestLogoutSecurity:
    """TC-02 & TC-03: Đăng xuất không có token hoặc token sai."""

    def test_logout_without_token_returns_401(self, client):
        """Đăng xuất không có token trả về 401 Unauthorized."""
        response = post_logout(client, None)
        assert response.status_code == 401

    def test_logout_with_invalid_token(self, client):
        """Đăng xuất với token không hợp lệ trả về 401 hoặc 422."""
        response = post_logout(client, "invalid_token_string")
        assert response.status_code in (401, 422)
