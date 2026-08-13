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


def put_address(client, token, address_id, payload):
    """Helper gửi request PUT /api/v1/addresses/<address_id>."""
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return client.put(f"/api/v1/addresses/{address_id}", data=json.dumps(payload), headers=headers)


def delete_address_api(client, token, address_id):
    """Helper gửi request DELETE /api/v1/addresses/<address_id>."""
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return client.delete(f"/api/v1/addresses/{address_id}", headers=headers)


def patch_default_address(client, token, address_id):
    """Helper gửi request PATCH /api/v1/addresses/<address_id>/default."""
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return client.patch(f"/api/v1/addresses/{address_id}/default", headers=headers)


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


# ============================================================
# Test Cases cho NT-07-CN-002: Sửa và Xóa địa chỉ giao hàng
# ============================================================

class TestUpdateAndDeleteAddress:
    """Các test case cho NT-07-CN-002 Sửa và xóa địa chỉ giao hàng."""

    @pytest.fixture
    def seed_two_addresses(self, app, seed_user):
        """Tạo sẵn 2 địa chỉ cho seed_user."""
        with app.app_context():
            addr1 = Address(
                user_id=seed_user["id"],
                recipient_name="Địa chỉ 1 (Mặc định)",
                phone="0901111111",
                province="TP. Hồ Chí Minh",
                district="Quận 1",
                ward="Phường Bến Nghé",
                detail_address="100 Nguyễn Huệ",
                is_default=True,
            )
            addr2 = Address(
                user_id=seed_user["id"],
                recipient_name="Địa chỉ 2",
                phone="0902222222",
                province="Hà Nội",
                district="Hoàn Kiếm",
                ward="Phường Tràng Tiền",
                detail_address="200 Tràng Tiền",
                is_default=False,
            )
            db.session.add_all([addr1, addr2])
            db.session.commit()
            return [addr1.id, addr2.id]

    @pytest.fixture
    def other_user_token(self, app):
        """Tạo user thứ 2 để kiểm thử phân quyền 403."""
        with app.app_context():
            user2 = User(
                full_name="User Khác",
                email="other@example.com",
                phone="0909998877",
                password_hash=bcrypt.generate_password_hash("Password123@").decode("utf-8"),
                role="user",
                is_active=True,
            )
            db.session.add(user2)
            db.session.commit()
            return create_access_token(identity=str(user2.id))

    def test_tc01_update_address_success(self, client, seed_user, seed_two_addresses):
        """TC-01: Sửa thông tin địa chỉ giao hàng thành công ➔ 200 OK."""
        addr1_id = seed_two_addresses[0]
        payload = {
            "recipient_name": "Nguyễn Văn Anh (Đã sửa)",
            "phone": "0909876543",
            "province": "TP. Hồ Chí Minh",
            "district": "Quận 3",
            "ward": "Phường Võ Thị Sáu",
            "detail_address": "456 Điện Biên Phủ",
            "is_default": True,
        }

        res = put_address(client, seed_user["token"], addr1_id, payload)
        assert res.status_code == 200

        body = res.get_json()
        assert body["status"] == "success"
        assert body["data"]["recipient_name"] == "Nguyễn Văn Anh (Đã sửa)"
        assert body["data"]["phone"] == "0909876543"
        assert body["data"]["district"] == "Quận 3"

    def test_tc01b_update_address_set_default(self, client, seed_user, seed_two_addresses):
        """TC-01b: Chuyển địa chỉ 2 thành mặc định ➔ Địa chỉ 1 tự động mất cờ mặc định."""
        addr2_id = seed_two_addresses[1]
        payload = {
            "recipient_name": "Địa chỉ 2 (Set Default)",
            "phone": "0902222222",
            "province": "Hà Nội",
            "district": "Hoàn Kiếm",
            "ward": "Phường Tràng Tiền",
            "detail_address": "200 Tràng Tiền",
            "is_default": True,  # Chuyển địa chỉ 2 thành mặc định
        }

        res = put_address(client, seed_user["token"], addr2_id, payload)
        assert res.status_code == 200

        # Kiểm tra danh sách địa chỉ của user
        list_res = get_addresses(client, seed_user["token"])
        addrs = list_res.get_json()["data"]

        # Địa chỉ 2 phải có is_default=True
        addr2_data = next(a for a in addrs if a["id"] == addr2_id)
        assert addr2_data["is_default"] is True

        # Địa chỉ 1 phải bị gán is_default=False
        addr1_id = seed_two_addresses[0]
        addr1_data = next(a for a in addrs if a["id"] == addr1_id)
        assert addr1_data["is_default"] is False

    def test_tc01c_update_address_other_user_forbidden(self, client, seed_two_addresses, other_user_token):
        """TC-01c: Người dùng khác cố sửa địa chỉ ➔ 403 FORBIDDEN_ACCESS."""
        addr1_id = seed_two_addresses[0]
        payload = {
            "recipient_name": "Hacker",
            "phone": "0901234567",
            "province": "TP. HCM",
            "district": "Quận 1",
            "ward": "Phường Bến Nghé",
            "detail_address": "Chôm địa chỉ",
        }

        res = put_address(client, other_user_token, addr1_id, payload)
        assert res.status_code == 403
        body = res.get_json()
        assert body["code"] == "FORBIDDEN_ACCESS"

    def test_tc02_delete_address_success(self, client, seed_user, seed_two_addresses):
        """TC-02: Xóa một địa chỉ giao hàng thành công ➔ 200 OK."""
        addr2_id = seed_two_addresses[1]  # Xóa địa chỉ 2 (địa chỉ không mặc định)

        res = delete_address_api(client, seed_user["token"], addr2_id)
        assert res.status_code == 200

        body = res.get_json()
        assert body["status"] == "success"

        # Kiểm tra địa chỉ 2 đã bị xóa khỏi DB
        list_res = get_addresses(client, seed_user["token"])
        remaining_addrs = list_res.get_json()["data"]
        assert len(remaining_addrs) == 1
        assert remaining_addrs[0]["id"] == seed_two_addresses[0]

    def test_tc02b_delete_default_address_promotes_next(self, client, seed_user, seed_two_addresses):
        """TC-02b: Xóa địa chỉ đang là mặc định ➔ Tự động đôn địa chỉ còn lại làm mặc định mới."""
        addr1_id = seed_two_addresses[0]  # Địa chỉ 1 đang là mặc định

        res = delete_address_api(client, seed_user["token"], addr1_id)
        assert res.status_code == 200

        # Kiểm tra địa chỉ 2 còn lại tự động trở thành mặc định (is_default=True)
        list_res = get_addresses(client, seed_user["token"])
        remaining_addrs = list_res.get_json()["data"]
        assert len(remaining_addrs) == 1
        assert remaining_addrs[0]["id"] == seed_two_addresses[1]
        assert remaining_addrs[0]["is_default"] is True

    def test_tc02c_delete_address_other_user_forbidden(self, client, seed_two_addresses, other_user_token):
        """TC-02c: Người dùng khác cố xóa địa chỉ ➔ 403 FORBIDDEN_ACCESS."""
        addr1_id = seed_two_addresses[0]

        res = delete_address_api(client, other_user_token, addr1_id)
        assert res.status_code == 403
        body = res.get_json()
        assert body["code"] == "FORBIDDEN_ACCESS"


# ============================================================
# Test Cases cho NT-07-CN-003: Đặt địa chỉ giao hàng mặc định
# ============================================================

class TestSetDefaultAddress:
    """Các test case cho NT-07-CN-003 Đặt địa chỉ giao hàng mặc định."""

    def test_tc01_set_as_default_success(self, client, seed_user, app):
        """TC-01: Gửi PATCH /addresses/:id/default đặt địa chỉ 2 thành mặc định thành công ➔ 200 OK."""
        with app.app_context():
            addr1 = Address(
                user_id=seed_user["id"],
                recipient_name="Địa chỉ 1",
                phone="0901111111",
                province="TP. HCM",
                district="Quận 1",
                ward="Phường Bến Nghé",
                detail_address="100 Lê Duẩn",
                is_default=True,
            )
            addr2 = Address(
                user_id=seed_user["id"],
                recipient_name="Địa chỉ 2",
                phone="0902222222",
                province="Hà Nội",
                district="Cầu Giấy",
                ward="Phường Dịch Vọng",
                detail_address="200 Cầu Giấy",
                is_default=False,
            )
            db.session.add_all([addr1, addr2])
            db.session.commit()
            addr1_id = addr1.id
            addr2_id = addr2.id

        res = patch_default_address(client, seed_user["token"], addr2_id)
        assert res.status_code == 200

        body = res.get_json()
        assert body["status"] == "success"
        assert body["data"]["is_default"] is True

        # Kiểm tra danh sách địa chỉ: addr2 là default, addr1 không còn default
        list_res = get_addresses(client, seed_user["token"])
        addrs = list_res.get_json()["data"]
        a1 = next(a for a in addrs if a["id"] == addr1_id)
        a2 = next(a for a in addrs if a["id"] == addr2_id)
        assert a1["is_default"] is False
        assert a2["is_default"] is True

    def test_tc01b_set_as_default_other_user_forbidden(self, client, seed_user, app):
        """TC-01b: Người dùng khác cố đặt địa chỉ không thuộc sở hữu làm mặc định ➔ 403 FORBIDDEN_ACCESS."""
        with app.app_context():
            other_user = User(
                full_name="User Khác 2",
                email="other2@example.com",
                phone="0908887766",
                password_hash=bcrypt.generate_password_hash("Password123@").decode("utf-8"),
                role="user",
                is_active=True,
            )
            db.session.add(other_user)
            db.session.commit()
            other_token = create_access_token(identity=str(other_user.id))

            addr = Address(
                user_id=seed_user["id"],
                recipient_name="Địa chỉ user 1",
                phone="0901111111",
                province="TP. HCM",
                district="Quận 1",
                ward="Bến Nghé",
                detail_address="1 Lê Lợi",
                is_default=True,
            )
            db.session.add(addr)
            db.session.commit()
            addr_id = addr.id

        res = patch_default_address(client, other_token, addr_id)
        assert res.status_code == 403
        body = res.get_json()
        assert body["code"] == "FORBIDDEN_ACCESS"

    def test_tc01c_set_as_default_non_existing_returns_404(self, client, seed_user):
        """TC-01c: Đặt địa chỉ không tồn tại làm mặc định ➔ 404 NOT_FOUND."""
        res = patch_default_address(client, seed_user["token"], 999999)
        assert res.status_code == 404
        body = res.get_json()
        assert body["code"] == "ADDRESS_NOT_FOUND"


