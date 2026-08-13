"""
tests/test_categories.py — Test cases cho chức năng Thêm danh mục sản phẩm (NT-08-CN-001).

Story: NT-08-CN-001 — Thêm danh mục sản phẩm (Admin)
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: Admin tạo danh mục hợp lệ ("Phòng ngủ") ➔ 201 Created
- TC-02: Admin tạo danh mục trùng tên đã tồn tại ➔ 400 Bad Request (CATEGORY_EXISTS)
- TC-03: Người dùng thường cố tạo danh mục ➔ 403 Forbidden (FORBIDDEN)
- TC-04: Chưa đăng nhập ➔ 401 Unauthorized
- TC-05: Nhập tên danh mục rỗng/thiếu ➔ 400 Bad Request (VALIDATION_ERROR)
- TC-06: Lấy danh sách danh mục (Public API) ➔ 200 OK
"""

import json
import pytest
from flask_jwt_extended import create_access_token
from app import create_app
from app.extensions import db, bcrypt
from app.models.user import User
from app.models.category import Category


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
    """Tạo tài khoản Admin trong DB và sinh JWT access token."""
    with app.app_context():
        admin = User(
            full_name="Quản Trị Viên",
            email="admin@example.com",
            phone="0901112233",
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
    """Tạo tài khoản Khách hàng thường trong DB và sinh JWT access token."""
    with app.app_context():
        user = User(
            full_name="Khách Hàng Thường",
            email="user@example.com",
            phone="0909998877",
            password_hash=bcrypt.generate_password_hash("UserPassword123@").decode("utf-8"),
            role="user",
            is_active=True,
        )
        db.session.add(user)
        db.session.commit()
        token = create_access_token(identity=str(user.id))
        return {"id": user.id, "email": user.email, "token": token}


def post_admin_category(client, token, payload):
    """Helper gửi request POST /api/v1/admin/categories."""
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return client.post("/api/v1/admin/categories", data=json.dumps(payload), headers=headers)


def get_categories_api(client):
    """Helper gửi request GET /api/v1/categories."""
    return client.get("/api/v1/categories")


class TestAddCategory:
    """Các test case cho NT-08-CN-001 Thêm danh mục sản phẩm."""

    def test_tc01_admin_create_category_success(self, client, admin_user):
        """TC-01: Admin nhập tên danh mục hợp lệ "Phòng ngủ" ➔ 201 Created."""
        payload = {
            "name": "Phòng ngủ",
            "description": "Các sản phẩm giường, tủ quần áo, bàn trang điểm",
            "icon": "🛏️",
        }

        res = post_admin_category(client, admin_user["token"], payload)
        assert res.status_code == 201

        body = res.get_json()
        assert body["status"] == "success"
        assert body["data"]["name"] == "Phòng ngủ"
        assert body["data"]["slug"] == "phong-ngu"
        assert body["data"]["icon"] == "🛏️"

    def test_tc02_create_duplicate_category_returns_400(self, client, admin_user):
        """TC-02: Admin cố tạo danh mục có tên đã tồn tại ➔ 400 Bad Request (CATEGORY_EXISTS)."""
        payload = {
            "name": "Phòng ăn gia đình",
            "description": "Nội thất phòng ăn gia đình",
            "icon": "🍽️",
        }

        # Tạo lần 1 thành công
        res1 = post_admin_category(client, admin_user["token"], payload)
        assert res1.status_code == 201

        # Tạo lần 2 trùng tên (kể cả viết hoa/viết thường)
        payload_duplicate = {
            "name": "PHÒNG ĂN GIA ĐÌNH",
            "description": "Mô tả khác",
        }
        res2 = post_admin_category(client, admin_user["token"], payload_duplicate)
        assert res2.status_code == 400

        body = res2.get_json()
        assert body["code"] == "CATEGORY_EXISTS"
        assert body["message"] == "Tên danh mục đã tồn tại."

    def test_tc03_regular_user_create_category_forbidden(self, client, regular_user):
        """TC-03: Tài khoản người dùng thường cố tạo danh mục ➔ 403 FORBIDDEN."""
        payload = {
            "name": "Danh mục lậu",
            "description": "User thường thử tạo",
        }

        res = post_admin_category(client, regular_user["token"], payload)
        assert res.status_code == 403

        body = res.get_json()
        assert body["code"] == "FORBIDDEN"

    def test_tc04_unauthenticated_create_category_returns_401(self, client):
        """TC-04: Chưa đăng nhập (không gửi Token) ➔ 401 Unauthorized."""
        payload = {
            "name": "Danh mục vô danh",
        }

        res = post_admin_category(client, None, payload)
        assert res.status_code == 401

    def test_tc05_missing_name_returns_400(self, client, admin_user):
        """TC-05: Thiếu tên danh mục / Tên rỗng ➔ 400 Bad Request (VALIDATION_ERROR)."""
        payload = {
            "name": "  ",
            "description": "Tên chỉ toàn dấu cách",
        }

        res = post_admin_category(client, admin_user["token"], payload)
        assert res.status_code == 400

        body = res.get_json()
        assert body["code"] == "VALIDATION_ERROR"

    def test_tc06_get_categories_success(self, client):
        """TC-06: Khách hàng truy cập Public API lấy danh sách danh mục ➔ 200 OK."""
        res = get_categories_api(client)
        assert res.status_code == 200

        body = res.get_json()
        assert body["status"] == "success"
        assert isinstance(body["data"], list)
        assert len(body["data"]) > 0
