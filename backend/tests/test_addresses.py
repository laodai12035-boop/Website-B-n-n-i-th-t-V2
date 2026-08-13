"""
tests/test_addresses.py — Test cases cho chức năng Thêm & Quản lý địa chỉ giao hàng (NT-07-CN-001).

Story: NT-07-CN-001 — Thêm địa chỉ giao hàng
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: Thêm địa chỉ hợp lệ ➔ 201 Created
- TC-01b: Địa chỉ đầu tiên ➔ Tự động nhận cờ is_default = True
- TC-02: Thiếu số điện thoại (TC-02) ➔ 400 VALIDATION_ERROR
- TC-02b: Định dạng SĐT không hợp lệ ➔ 400 VALIDATION_ERROR
- TC-03: Thêm vượt quá 10 địa chỉ ➔ 400 MAX_ADDRESSES_REACHED
- TC-04: Chưa đăng nhập ➔ 401 Unauthorized
- TC-05: Lấy danh sách địa chỉ của user ➔ 200 OK
"""

import json
import pytest
from flask_jwt_extended import create_access_token
from app import create_app
from app.extensions import db, bcrypt
from app.models.user import User
from app.models.address import Address


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
def seed_user(app):
    """Tạo user test trong DB và sinh JWT access token."""
    with app.app_context():
        user = User(
            full_name="Nguyễn Văn A",
            email="usera@example.com",
            phone="0901234567",
            password_hash=bcrypt.generate_password_hash("Password123@").decode("utf-8"),
            role="user",
            is_active=True,
        )
        db.session.add(user)
        db.session.commit()
        token = create_access_token(identity=str(user.id))
        return {"id": user.id, "email": user.email, "token": token}


def post_address(client, token, payload):
    """Helper gửi request POST /api/v1/addresses."""
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return client.post("/api/v1/addresses", data=json.dumps(payload), headers=headers)


def get_addresses(client, token):
    """Helper gửi request GET /api/v1/addresses."""
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return client.get("/api/v1/addresses", headers=headers)


class TestAddAddress:
    """Các test case cho NT-07-CN-001 Thêm địa chỉ giao hàng."""

    def test_tc01_create_address_success(self, client, seed_user):
        """TC-01: Thêm địa chỉ mới với đầy đủ thông tin hợp lệ ➔ 201 Created."""
        payload = {
            "recipient_name": "Nguyễn Văn Anh",
            "phone": "0901234567",
            "province": "TP. Hồ Chí Minh",
            "district": "Quận 1",
            "ward": "Phường Bến Nghé",
            "detail_address": "123 Nguyễn Huệ",
            "is_default": False,
        }

        res = post_address(client, seed_user["token"], payload)
        assert res.status_code == 201

        body = res.get_json()
        assert body["status"] == "success"
        assert body["data"]["recipient_name"] == "Nguyễn Văn Anh"
        assert body["data"]["phone"] == "0901234567"
        assert body["data"]["province"] == "TP. Hồ Chí Minh"
        assert body["data"]["detail_address"] == "123 Nguyễn Huệ"

    def test_tc01b_first_address_automatically_default(self, client, seed_user):
        """TC-01b: Địa chỉ đầu tiên được tạo cho user sẽ tự động nhận is_default = True."""
        payload = {
            "recipient_name": "Nguyễn Văn Anh",
            "phone": "0901234567",
            "province": "TP. Hồ Chí Minh",
            "district": "Quận 1",
            "ward": "Phường Bến Nghé",
            "detail_address": "123 Nguyễn Huệ",
            "is_default": False,  # Client gửi False nhưng backend tự đặt True vì là địa chỉ 1
        }

        res = post_address(client, seed_user["token"], payload)
        assert res.status_code == 201
        body = res.get_json()
        assert body["data"]["is_default"] is True

    def test_tc02_missing_phone_returns_400(self, client, seed_user):
        """TC-02: Thiếu số điện thoại người nhận ➔ 400 Bad Request (VALIDATION_ERROR)."""
        payload = {
            "recipient_name": "Nguyễn Văn Anh",
            # Thiếu phone
            "province": "TP. Hồ Chí Minh",
            "district": "Quận 1",
            "ward": "Phường Bến Nghé",
            "detail_address": "123 Nguyễn Huệ",
        }

        res = post_address(client, seed_user["token"], payload)
        assert res.status_code == 400
        body = res.get_json()
        assert body["code"] == "VALIDATION_ERROR"
        assert "phone" in body["errors"]

    def test_tc02b_invalid_phone_format_returns_400(self, client, seed_user):
        """TC-02b: Nhập số điện thoại không hợp lệ (ví dụ: '123') ➔ 400 Bad Request."""
        payload = {
            "recipient_name": "Nguyễn Văn Anh",
            "phone": "123",  # Không khớp regex 10 chữ số bắt đầu bằng 0
            "province": "TP. Hồ Chí Minh",
            "district": "Quận 1",
            "ward": "Phường Bến Nghé",
            "detail_address": "123 Nguyễn Huệ",
        }

        res = post_address(client, seed_user["token"], payload)
        assert res.status_code == 400
        body = res.get_json()
        assert body["code"] == "VALIDATION_ERROR"

    def test_tc03_max_addresses_limit_returns_400(self, client, seed_user, app):
        """TC-03: Khi tài khoản đã có 10 địa chỉ, cố thêm địa chỉ thứ 11 ➔ 400 MAX_ADDRESSES_REACHED."""
        with app.app_context():
            for i in range(10):
                addr = Address(
                    user_id=seed_user["id"],
                    recipient_name=f"Người nhận {i+1}",
                    phone=f"090000000{i}",
                    province="Hà Nội",
                    district="Ba Đình",
                    ward="Phường Kim Mã",
                    detail_address=f"Số {i+1} Kim Mã",
                    is_default=(i == 0),
                )
                db.session.add(addr)
            db.session.commit()

        # Cố thêm địa chỉ thứ 11
        payload = {
            "recipient_name": "Địa chỉ thứ 11",
            "phone": "0909999999",
            "province": "Hà Nội",
            "district": "Cầu Giấy",
            "ward": "Phường Dịch Vọng",
            "detail_address": "88 Xuân Thủy",
        }

        res = post_address(client, seed_user["token"], payload)
        assert res.status_code == 400
        body = res.get_json()
        assert body["code"] == "MAX_ADDRESSES_REACHED"

    def test_tc04_unauthenticated_create_address_returns_401(self, client):
        """TC-04: Chưa đăng nhập (không gửi JWT Token) ➔ 401 Unauthorized."""
        payload = {
            "recipient_name": "Khách ẩn danh",
            "phone": "0901234567",
            "province": "TP. HCM",
            "district": "Quận 1",
            "ward": "Bến Nghé",
            "detail_address": "123 Lê Lợi",
        }

        res = post_address(client, None, payload)
        assert res.status_code == 401

    def test_tc05_get_addresses_success(self, client, seed_user):
        """TC-05: Lấy danh sách địa chỉ của người dùng thành công."""
        # Thêm 1 địa chỉ
        payload = {
            "recipient_name": "Nguyễn Văn Anh",
            "phone": "0901234567",
            "province": "TP. Hồ Chí Minh",
            "district": "Quận 1",
            "ward": "Phường Bến Nghé",
            "detail_address": "123 Nguyễn Huệ",
        }
        post_address(client, seed_user["token"], payload)

        res = get_addresses(client, seed_user["token"])
        assert res.status_code == 200
        body = res.get_json()
        assert body["status"] == "success"
        assert len(body["data"]) == 1
        assert body["data"][0]["recipient_name"] == "Nguyễn Văn Anh"
