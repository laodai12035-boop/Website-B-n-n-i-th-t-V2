"""
tests/test_auth_register.py — Test cases cho chức năng đăng ký tài khoản.

Story: NT-01-CN-001 — Đăng ký tài khoản
CV:    CV-04 — Kiểm thử

Test Strategy:
- Dùng SQLite in-memory (TestingConfig) → không cần XAMPP chạy để test
- Mỗi test tạo + cleanup DB schema mới → test độc lập nhau
- Covers: TC-01 (happy path), TC-02 (email trùng), TC-03 (mật khẩu ngắn),
          TC-04 (email sai format), TC-05 (thiếu field), TC-06 (phone sai format)
"""

import json
import pytest
from app import create_app
from app.extensions import db


# ============================================================
# Fixtures
# ============================================================

@pytest.fixture(scope="function")
def app():
    """Tạo Flask app với TestingConfig (SQLite in-memory) cho mỗi test."""
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
def valid_payload():
    """Dữ liệu đăng ký hợp lệ dùng làm base cho các test."""
    return {
        "full_name": "Nguyễn Văn A",
        "email": "test@example.com",
        "phone": "0901234567",
        "password": "Abc12345",
    }


# ============================================================
# Helper
# ============================================================

def post_register(client, payload):
    """Helper gọi API register và trả về response."""
    return client.post(
        "/api/v1/auth/register",
        data=json.dumps(payload),
        content_type="application/json",
    )


# ============================================================
# TC-01: Luồng thành công (Happy Path)
# ============================================================

class TestRegisterSuccess:
    """TC-01: Đăng ký thành công với thông tin đầy đủ hợp lệ."""

    def test_returns_201(self, client, valid_payload):
        """API phải trả về status 201 khi đăng ký thành công."""
        response = post_register(client, valid_payload)
        assert response.status_code == 201

    def test_response_structure(self, client, valid_payload):
        """Response phải có status='success', data.email, message."""
        response = post_register(client, valid_payload)
        body = response.get_json()

        assert body["status"] == "success"
        assert "data" in body
        assert body["data"]["email"] == valid_payload["email"]
        assert "message" in body

    def test_password_not_in_response(self, client, valid_payload):
        """Mật khẩu và hash KHÔNG được xuất hiện trong response."""
        response = post_register(client, valid_payload)
        body_str = response.get_data(as_text=True)

        assert "password" not in body_str
        assert "hash" not in body_str

    def test_user_saved_in_db(self, client, valid_payload, app):
        """User phải được lưu vào DB sau khi đăng ký thành công."""
        from app.models.user import User

        post_register(client, valid_payload)

        with app.app_context():
            user = User.query.filter_by(email=valid_payload["email"]).first()
            assert user is not None
            assert user.full_name == valid_payload["full_name"]
            assert user.phone == valid_payload["phone"]
            assert user.role == "user"
            assert user.is_active is True

    def test_password_is_hashed(self, client, valid_payload, app):
        """Mật khẩu phải được lưu dạng hash, không phải plaintext."""
        from app.models.user import User

        post_register(client, valid_payload)

        with app.app_context():
            user = User.query.filter_by(email=valid_payload["email"]).first()
            assert user.password_hash != valid_payload["password"]
            assert user.password_hash.startswith("$2b$")  # bcrypt hash prefix

    def test_email_normalized_to_lowercase(self, client, valid_payload, app):
        """Email phải được normalize thành lowercase khi lưu."""
        from app.models.user import User

        payload = {**valid_payload, "email": "Test@EXAMPLE.COM"}
        post_register(client, payload)

        with app.app_context():
            user = User.query.filter_by(email="test@example.com").first()
            assert user is not None


# ============================================================
# TC-02: Email đã tồn tại
# ============================================================

class TestRegisterDuplicateEmail:
    """TC-02: Đăng ký với email đã tồn tại phải trả lỗi 409."""

    def test_returns_409(self, client, valid_payload):
        """Lần 2 dùng cùng email phải trả về 409."""
        post_register(client, valid_payload)  # Lần 1 — thành công
        response = post_register(client, valid_payload)  # Lần 2 — trùng email

        assert response.status_code == 409

    def test_error_code_email_exists(self, client, valid_payload):
        """Response phải có code='EMAIL_EXISTS'."""
        post_register(client, valid_payload)
        response = post_register(client, valid_payload)
        body = response.get_json()

        assert body["status"] == "error"
        assert body["code"] == "EMAIL_EXISTS"

    def test_case_insensitive_email_check(self, client, valid_payload):
        """Kiểm tra trùng email không phân biệt hoa thường."""
        post_register(client, valid_payload)

        # Thử đăng ký với email uppercase
        payload2 = {**valid_payload, "email": valid_payload["email"].upper()}
        response = post_register(client, payload2)

        assert response.status_code == 409


# ============================================================
# TC-03: Mật khẩu không đủ độ dài
# ============================================================

class TestRegisterWeakPassword:
    """TC-03: Mật khẩu dưới 8 ký tự phải trả lỗi 400."""

    def test_short_password_returns_400(self, client, valid_payload):
        """Mật khẩu 7 ký tự phải bị từ chối."""
        payload = {**valid_payload, "password": "Abc123"}  # 6 ký tự
        response = post_register(client, payload)

        assert response.status_code == 400

    def test_short_password_error_code(self, client, valid_payload):
        """Response phải có code='VALIDATION_ERROR' và errors.password."""
        payload = {**valid_payload, "password": "short"}
        response = post_register(client, payload)
        body = response.get_json()

        assert body["code"] == "VALIDATION_ERROR"
        assert "password" in body.get("errors", {})

    def test_exact_8_chars_password_accepted(self, client, valid_payload):
        """Mật khẩu đúng 8 ký tự phải được chấp nhận."""
        payload = {**valid_payload, "password": "Abc12345"}  # đúng 8
        response = post_register(client, payload)

        assert response.status_code == 201


# ============================================================
# TC-04: Email sai định dạng
# ============================================================

class TestRegisterInvalidEmail:
    """TC-04: Email sai format phải trả lỗi 400."""

    @pytest.mark.parametrize("bad_email", [
        "notanemail",
        "missing@",
        "@nodomain.com",
        "no spaces@test.com",
        "",
    ])
    def test_invalid_email_returns_400(self, client, valid_payload, bad_email):
        """Các định dạng email không hợp lệ đều phải bị từ chối."""
        payload = {**valid_payload, "email": bad_email}
        response = post_register(client, payload)

        assert response.status_code == 400

    def test_invalid_email_error_in_response(self, client, valid_payload):
        """Response phải chứa lỗi cho field email."""
        payload = {**valid_payload, "email": "invalid-email"}
        response = post_register(client, payload)
        body = response.get_json()

        assert body["code"] == "VALIDATION_ERROR"
        assert "email" in body.get("errors", {})


# ============================================================
# TC-05: Thiếu field bắt buộc
# ============================================================

class TestRegisterMissingFields:
    """TC-05: Thiếu field bắt buộc phải trả lỗi 400."""

    @pytest.mark.parametrize("missing_field", [
        "full_name", "email", "phone", "password"
    ])
    def test_missing_required_field(self, client, valid_payload, missing_field):
        """Thiếu bất kỳ field bắt buộc nào đều phải trả 400."""
        payload = {k: v for k, v in valid_payload.items() if k != missing_field}
        response = post_register(client, payload)

        assert response.status_code == 400

    def test_empty_body_returns_400(self, client):
        """Request body rỗng phải trả 400."""
        response = client.post(
            "/api/v1/auth/register",
            data="",
            content_type="application/json",
        )
        assert response.status_code == 400


# ============================================================
# TC-06: Số điện thoại sai format
# ============================================================

class TestRegisterInvalidPhone:
    """TC-06: Số điện thoại không đúng format VN."""

    @pytest.mark.parametrize("bad_phone", [
        "123456789",    # Không bắt đầu bằng 0
        "090123456",    # 9 chữ số
        "09012345678",  # 11 chữ số
        "090-123-4567", # Có dấu gạch
        "abcdefghij",   # Không phải số
    ])
    def test_invalid_phone_returns_400(self, client, valid_payload, bad_phone):
        """Số điện thoại sai format phải bị từ chối."""
        payload = {**valid_payload, "phone": bad_phone}
        response = post_register(client, payload)

        assert response.status_code == 400
