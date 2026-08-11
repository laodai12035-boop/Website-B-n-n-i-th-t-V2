"""
tests/test_auth_forgot_reset_password.py — Test cases cho chức năng Quên và Đặt lại mật khẩu.

Story: NT-01-CN-004 — Quên và đổi mật khẩu
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: Yêu cầu reset password với email tồn tại -> 200 OK + reset_token
- TC-02: Yêu cầu reset password với email không tồn tại -> 404 USER_NOT_FOUND
- TC-03: Đặt lại mật khẩu thành công với token hợp lệ -> Mật khẩu mới dùng đăng nhập được
- TC-04: Đặt lại mật khẩu với token rác / không hợp lệ -> 400 INVALID_TOKEN
- TC-05: Đặt lại mật khẩu với mật khẩu quá ngắn (< 8 chars) -> 400 VALIDATION_ERROR
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
def seed_user(app):
    """Tạo sẵn 1 user trong DB để test forgot/reset password."""
    with app.app_context():
        hashed_password = bcrypt.generate_password_hash("OldPassword123").decode("utf-8")
        user = User(
            full_name="User Test Reset",
            email="reset_user@example.com",
            phone="0903334455",
            password_hash=hashed_password,
            role="user",
            is_active=True,
        )
        db.session.add(user)
        db.session.commit()
        return user.id


# ============================================================
# Helpers
# ============================================================

def post_forgot_password(client, email):
    """Helper gọi API POST /api/v1/auth/forgot-password."""
    return client.post(
        "/api/v1/auth/forgot-password",
        data=json.dumps({"email": email}),
        content_type="application/json",
    )


def post_reset_password(client, token, new_password):
    """Helper gọi API POST /api/v1/auth/reset-password."""
    return client.post(
        "/api/v1/auth/reset-password",
        data=json.dumps({"token": token, "new_password": new_password}),
        content_type="application/json",
    )


def post_login(client, email, password):
    """Helper gọi API POST /api/v1/auth/login."""
    return client.post(
        "/api/v1/auth/login",
        data=json.dumps({"email": email, "password": password}),
        content_type="application/json",
    )


# ============================================================
# TC-01: Yêu cầu đặt lại mật khẩu thành công
# ============================================================

class TestForgotPassword:
    """TC-01 & TC-02: Kiểm thử API Yêu cầu đặt lại mật khẩu."""

    def test_forgot_password_success(self, client, seed_user):
        """TC-01: Email tồn tại trả về status 200 OK + reset_token."""
        response = post_forgot_password(client, "reset_user@example.com")
        assert response.status_code == 200

        body = response.get_json()
        assert body["status"] == "success"
        assert "reset_token" in body["data"]

    def test_forgot_password_case_insensitive_email(self, client, seed_user):
        """Gửi email dạng uppercase vẫn được xử lý hợp lệ."""
        response = post_forgot_password(client, "RESET_USER@EXAMPLE.COM")
        assert response.status_code == 200

    def test_forgot_password_non_existing_email(self, client):
        """TC-02: Email không tồn tại trả về 404 USER_NOT_FOUND."""
        response = post_forgot_password(client, "nonexistent@example.com")
        assert response.status_code == 404

        body = response.get_json()
        assert body["status"] == "error"
        assert body["code"] == "USER_NOT_FOUND"

    def test_forgot_password_invalid_email_format(self, client):
        """Email không đúng định dạng trả về 400 VALIDATION_ERROR."""
        response = post_forgot_password(client, "invalid-email")
        assert response.status_code == 400


# ============================================================
# TC-03 & TC-04: Đặt lại mật khẩu mới
# ============================================================

class TestResetPassword:
    """TC-03 & TC-04: Kiểm thử API Đặt lại mật khẩu mới."""

    def test_reset_password_success_and_login_with_new_password(self, client, seed_user):
        """TC-03: Đặt lại mật khẩu thành công và dùng mật khẩu mới để đăng nhập."""
        # 1. Yêu cầu reset password lấy token
        forgot_res = post_forgot_password(client, "reset_user@example.com")
        token = forgot_res.get_json()["data"]["reset_token"]

        # 2. Đặt mật khẩu mới "NewPassword123"
        reset_res = post_reset_password(client, token, "NewPassword123")
        assert reset_res.status_code == 200
        assert reset_res.get_json()["status"] == "success"

        # 3. Thử đăng nhập lại bằng MẬT KHẨU CŨ -> Phải thất bại (401)
        login_old_res = post_login(client, "reset_user@example.com", "OldPassword123")
        assert login_old_res.status_code == 401

        # 4. Thử đăng nhập lại bằng MẬT KHẨU MỚI -> Phải thành công (200)
        login_new_res = post_login(client, "reset_user@example.com", "NewPassword123")
        assert login_new_res.status_code == 200

    def test_reset_password_invalid_token(self, client, seed_user):
        """TC-04: Token rác / không hợp lệ trả về 400 INVALID_TOKEN."""
        response = post_reset_password(client, "garbage_token_string", "NewPassword123")
        assert response.status_code == 400

        body = response.get_json()
        assert body["status"] == "error"
        assert body["code"] == "INVALID_TOKEN"

    def test_reset_password_short_new_password(self, client, seed_user):
        """TC-05: Mật khẩu mới dưới 8 ký tự trả về 400 VALIDATION_ERROR."""
        forgot_res = post_forgot_password(client, "reset_user@example.com")
        token = forgot_res.get_json()["data"]["reset_token"]

        response = post_reset_password(client, token, "Short1")
        assert response.status_code == 400

        body = response.get_json()
        assert body["code"] == "VALIDATION_ERROR"
