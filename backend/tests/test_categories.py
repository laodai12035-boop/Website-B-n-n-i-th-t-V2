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


def put_admin_category(client, token, category_id, payload):
    """Helper gửi request PUT /api/v1/admin/categories/<id>."""
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return client.put(f"/api/v1/admin/categories/{category_id}", data=json.dumps(payload), headers=headers)


def delete_admin_category(client, token, category_id):
    """Helper gửi request DELETE /api/v1/admin/categories/<id>."""
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return client.delete(f"/api/v1/admin/categories/{category_id}", headers=headers)


class TestUpdateAndDeleteCategory:
    """Các test case cho NT-08-CN-002 Sửa và xóa danh mục sản phẩm."""

    def test_tc01_admin_update_category_success(self, client, admin_user):
        """TC-01: Admin sửa thông tin danh mục hợp lệ ➔ 200 OK."""
        # 1. Tạo danh mục mới
        create_res = post_admin_category(client, admin_user["token"], {"name": "Phòng bé yêu", "icon": "🧸"})
        cat_id = create_res.get_json()["data"]["id"]

        # 2. Cập nhật thông tin mới
        update_payload = {
            "name": "Phòng trẻ em cao cấp",
            "description": "Các món đồ xinh xắn cho bé",
            "icon": "🎨",
        }
        res = put_admin_category(client, admin_user["token"], cat_id, update_payload)
        assert res.status_code == 200

        body = res.get_json()
        assert body["status"] == "success"
        assert body["data"]["name"] == "Phòng trẻ em cao cấp"
        assert body["data"]["slug"] == "phong-tre-em-cao-cap"
        assert body["data"]["icon"] == "🎨"

    def test_tc01b_update_duplicate_name_returns_400(self, client, admin_user):
        """TC-01b: Admin sửa tên danh mục thành tên của danh mục khác đã có ➔ 400 CATEGORY_EXISTS."""
        # Tạo danh mục A & B
        cat_a = post_admin_category(client, admin_user["token"], {"name": "Danh mục A"}).get_json()["data"]
        cat_b = post_admin_category(client, admin_user["token"], {"name": "Danh mục B"}).get_json()["data"]

        # Sửa B thành tên của A
        res = put_admin_category(client, admin_user["token"], cat_b["id"], {"name": "DANH MỤC A"})
        assert res.status_code == 400

        body = res.get_json()
        assert body["code"] == "CATEGORY_EXISTS"

    def test_tc02_delete_empty_category_success(self, client, admin_user):
        """TC-02: Admin xóa danh mục rỗng (chưa có sản phẩm) ➔ 200 OK."""
        # Tạo danh mục rỗng
        cat = post_admin_category(client, admin_user["token"], {"name": "Danh mục sắp xóa"}).get_json()["data"]

        # Xóa danh mục
        res = delete_admin_category(client, admin_user["token"], cat["id"])
        assert res.status_code == 200

        body = res.get_json()
        assert body["status"] == "success"

    def test_tc02b_delete_category_with_products_rejected(self, client, admin_user, app):
        """TC-02b: Admin xóa danh mục đang có sản phẩm ➔ 400 CATEGORY_HAS_PRODUCTS."""
        with app.app_context():
            from app.models.product import Product
            # Tạo 1 danh mục mới
            cat = Category(name="Danh mục có hàng", slug="danh-muc-co-hang", is_active=True)
            db.session.add(cat)
            db.session.flush()

            # Gắn 1 sản phẩm vào danh mục này
            p = Product(name="Sản phẩm thử nghiệm", slug="san-pham-thu-nghiem", category=cat.slug, price=100000.0, stock=5)
            db.session.add(p)
            db.session.commit()
            cat_id = cat.id

        # Thử xóa danh mục này qua API
        res = delete_admin_category(client, admin_user["token"], cat_id)
        assert res.status_code == 400

        body = res.get_json()
        assert body["code"] == "CATEGORY_HAS_PRODUCTS"
        assert "Không thể xóa danh mục này vì còn 1 sản phẩm" in body["message"]

    def test_tc03_regular_user_update_delete_forbidden(self, client, regular_user, admin_user):
        """TC-03: Người dùng thường cố sửa hoặc xóa danh mục ➔ 403 FORBIDDEN."""
        cat = post_admin_category(client, admin_user["token"], {"name": "Danh mục cấm"}).get_json()["data"]

        # Sửa
        res_put = put_admin_category(client, regular_user["token"], cat["id"], {"name": "Sửa lậu"})
        assert res_put.status_code == 403
        assert res_put.get_json()["code"] == "FORBIDDEN"

        # Xóa
        res_del = delete_admin_category(client, regular_user["token"], cat["id"])
        assert res_del.status_code == 403
        assert res_del.get_json()["code"] == "FORBIDDEN"

    def test_tc04_update_delete_non_existing_returns_404(self, client, admin_user):
        """TC-04: Sửa/xóa danh mục với ID không tồn tại ➔ 404 CATEGORY_NOT_FOUND."""
        non_id = 999999

        res_put = put_admin_category(client, admin_user["token"], non_id, {"name": "Tên mới"})
        assert res_put.status_code == 404
        assert res_put.get_json()["code"] == "CATEGORY_NOT_FOUND"

        res_del = delete_admin_category(client, admin_user["token"], non_id)
        assert res_del.status_code == 404
        assert res_del.get_json()["code"] == "CATEGORY_NOT_FOUND"

