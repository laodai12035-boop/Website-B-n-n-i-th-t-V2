"""
tests/test_auth_update_profile.py — Test cases cho chức năng Cập nhật thông tin cá nhân.

Story: NT-01-CN-005 — Cập nhật thông tin cá nhân
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: Cập nhật Họ tên và SĐT hợp lệ -> 200 OK + DB cập nhật thông tin mới
- TC-02: Cập nhật SĐT không đúng định dạng VN -> 400 VALIDATION_ERROR
- Extra: Cập nhật avatar_url, Họ tên rỗng/ngắn, không truyền token -> 401
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
def logged_in_user(client, app):
    """Tạo user trong DB và đăng nhập để lấy JWT token hợp lệ."""
    with app.app_context():
        hashed_password = bcrypt.generate_password_hash("Password123").decode("utf-8")
        user = User(
            full_name="Nguyễn Văn Gốc",
            email="original_user@example.com",
            phone="0901112233",
            password_hash=hashed_password,
            role="user",
            is_active=True,
        )
        db.session.add(user)
        db.session.commit()
        user_id = user.id

    login_res = client.post(
        "/api/v1/auth/login",
        data=json.dumps({"email": "original_user@example.com", "password": "Password123"}),
        content_type="application/json",
    )
    token = login_res.get_json()["data"]["token"]
    return {"token": token, "user_id": user_id}


# ============================================================
# Helpers
# ============================================================

def put_profile(client, token, payload):
    """Helper gọi API PUT /api/v1/auth/profile."""
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return client.put(
        "/api/v1/auth/profile",
        data=json.dumps(payload),
        content_type="application/json",
        headers=headers,
    )


# ============================================================
# TC-01: Cập nhật thành công (Happy Path)
# ============================================================

class TestUpdateProfileSuccess:
    """TC-01: Cập nhật thông tin cá nhân với dữ liệu hợp lệ."""

    def test_update_profile_returns_200(self, client, logged_in_user):
        """API trả về status 200 OK khi cập nhật thành công."""
        payload = {
            "full_name": "Nguyễn Văn Mới",
            "phone": "0987654321",
            "avatar_url": "https://example.com/avatar.jpg",
        }
        response = put_profile(client, logged_in_user["token"], payload)
        assert response.status_code == 200

    def test_update_profile_db_updated(self, client, logged_in_user, app):
        """Thông tin cá nhân trong DB phải được cập nhật đúng."""
        payload = {
            "full_name": "Nguyễn Văn Mới",
            "phone": "0987654321",
            "avatar_url": "https://example.com/avatar.jpg",
        }
        put_profile(client, logged_in_user["token"], payload)

        with app.app_context():
            user = db.session.get(User, logged_in_user["user_id"])
            assert user.full_name == "Nguyễn Văn Mới"
            assert user.phone == "0987654321"
            assert user.avatar_url == "https://example.com/avatar.jpg"

    def test_update_profile_response_structure(self, client, logged_in_user):
        """Response trả về object User mới đã được serialize."""
        payload = {
            "full_name": "Trần Thị B",
            "phone": "0912345678",
        }
        response = put_profile(client, logged_in_user["token"], payload)
        body = response.get_json()

        assert body["status"] == "success"
        assert body["data"]["user"]["full_name"] == "Trần Thị B"
        assert body["data"]["user"]["phone"] == "0912345678"


# ============================================================
# TC-02: Dữ liệu không hợp lệ (Sad Paths)
# ============================================================

class TestUpdateProfileInvalidData:
    """TC-02: Cập nhật với SĐT hoặc Họ tên không hợp lệ -> 400 VALIDATION_ERROR."""

    @pytest.mark.parametrize("bad_phone", [
        "123456789",    # Không bắt đầu bằng 0
        "090123",       # Ít hơn 10 chữ số
        "090123456789", # Nhiều hơn 10 chữ số
        "abcdefghij",   # Chuỗi ký tự
    ])
    def test_invalid_phone_format_returns_400(self, client, logged_in_user, bad_phone):
        """SĐT không đúng định dạng VN phải trả 400 VALIDATION_ERROR."""
        payload = {
            "full_name": "Nguyễn Văn A",
            "phone": bad_phone,
        }
        response = put_profile(client, logged_in_user["token"], payload)
        assert response.status_code == 400

        body = response.get_json()
        assert body["status"] == "error"
        assert body["code"] == "VALIDATION_ERROR"
        assert "phone" in body.get("errors", {})

    def test_short_full_name_returns_400(self, client, logged_in_user):
        """Họ tên dưới 2 ký tự phải bị từ chối."""
        payload = {
            "full_name": "A",
            "phone": "0901112233",
        }
        response = put_profile(client, logged_in_user["token"], payload)
        assert response.status_code == 400

        body = response.get_json()
        assert "full_name" in body.get("errors", {})

    def test_update_profile_without_token_returns_401(self, client):
        """Cập nhật không truyền token trả về 401 Unauthorized."""
        payload = {
            "full_name": "Nguyễn Văn A",
            "phone": "0901112233",
        }
        response = put_profile(client, None, payload)
        assert response.status_code == 401


class TestUploadAvatarFromLocal:
    """Kiểm thử tính năng chọn và tải tệp ảnh avatar từ máy tính (NT-01-CN-005)."""

    def test_upload_avatar_file_success(self, client, logged_in_user):
        """Tải tệp ảnh hợp lệ -> 200 OK + Trả về URL avatar."""
        import io
        data = {
            "avatar": (io.BytesIO(b"fake image data content"), "my_photo.png")
        }
        res = client.post(
            "/api/v1/auth/upload-avatar",
            data=data,
            content_type="multipart/form-data",
            headers={"Authorization": f"Bearer {logged_in_user['token']}"},
        )
        assert res.status_code == 200
        body = res.get_json()
        assert body["status"] == "success"
        assert "avatar_url" in body["data"]

    def test_upload_avatar_invalid_file_extension(self, client, logged_in_user):
        """Tải tệp đuôi .exe không được hỗ trợ -> 400 INVALID_FILE_TYPE."""
        import io
        data = {
            "avatar": (io.BytesIO(b"binary exe content"), "malicious_script.exe")
        }
        res = client.post(
            "/api/v1/auth/upload-avatar",
            data=data,
            content_type="multipart/form-data",
            headers={"Authorization": f"Bearer {logged_in_user['token']}"},
        )
        assert res.status_code == 400
        assert res.get_json()["code"] == "INVALID_FILE_TYPE"

    def test_upload_avatar_no_file(self, client, logged_in_user):
        """Không gửi tệp avatar -> 400 NO_FILE_PROVIDED."""
        res = client.post(
            "/api/v1/auth/upload-avatar",
            data={},
            content_type="multipart/form-data",
            headers={"Authorization": f"Bearer {logged_in_user['token']}"},
        )
        assert res.status_code == 400
        assert res.get_json()["code"] == "NO_FILE_PROVIDED"
