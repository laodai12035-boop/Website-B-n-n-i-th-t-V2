"""
tests/test_admin_products.py — Test cases cho chức năng Thêm sản phẩm mới cho Admin (NT-08-CN-003).

Story: NT-08-CN-003 — Thêm sản phẩm mới
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: Admin nhập đầy đủ thông tin sản phẩm hợp lệ ➔ 201 Created (Auto-generated slug)
- TC-02: Dữ liệu không hợp lệ: Giá âm (-100,000) hoặc = 0 ➔ 400 Bad Request (VALIDATION_ERROR)
- TC-03: Dữ liệu không hợp lệ: Thiếu tên / Tên rỗng ➔ 400 Bad Request (VALIDATION_ERROR)
- TC-04: Tài khoản người dùng thường cố tạo sản phẩm ➔ 403 Forbidden (FORBIDDEN)
- TC-05: Chưa đăng nhập ➔ 401 Unauthorized
- TC-06: Admin lấy danh sách sản phẩm quản trị ➔ 200 OK
"""

import json
import pytest
from flask_jwt_extended import create_access_token
from app import create_app
from app.extensions import db, bcrypt
from app.models.user import User
from app.models.product import Product


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


def post_admin_product(client, token, payload):
    """Helper gửi request POST /api/v1/admin/products."""
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return client.post("/api/v1/admin/products", data=json.dumps(payload), headers=headers)


def get_admin_products_api(client, token):
    """Helper gửi request GET /api/v1/admin/products."""
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return client.get("/api/v1/admin/products", headers=headers)


class TestAddProduct:
    """Các test case cho NT-08-CN-003 Thêm sản phẩm mới."""

    def test_tc01_admin_create_product_success(self, client, admin_user):
        """TC-01: Admin nhập đầy đủ thông tin hợp lệ ➔ 201 Created."""
        payload = {
            "name": "Bàn Trà Gỗ Sồi Hiện Đại",
            "category": "ban",
            "price": 4500000.0,
            "discount_price": 3900000.0,
            "stock": 15,
            "dimensions": "120x60x45 cm",
            "material": "Gỗ sồi Mỹ",
            "weight_kg": 14.5,
            "image_url": "https://images.unsplash.com/photo-1533090161767-e6ffed986c88",
            "description": "Bàn trà cao cấp phòng khách Scandinavian",
        }

        res = post_admin_product(client, admin_user["token"], payload)
        assert res.status_code == 201

        body = res.get_json()
        assert body["status"] == "success"
        assert body["data"]["name"] == "Bàn Trà Gỗ Sồi Hiện Đại"
        assert body["data"]["slug"] == "ban-tra-go-soi-hien-dai"
        assert body["data"]["price"] == 4500000.0
        assert body["data"]["stock"] == 15
        assert body["data"]["material"] == "Gỗ sồi Mỹ"
        assert body["data"]["dimensions"] == "120x60x45 cm"

    def test_tc02_invalid_price_negative_returns_400(self, client, admin_user):
        """TC-02: Dữ liệu không hợp lệ — Giá âm (-100,000) hoặc = 0 ➔ 400 Bad Request (VALIDATION_ERROR)."""
        payload_neg = {
            "name": "Ghế Gỗ Âm Giá",
            "category": "ghe",
            "price": -100000.0,
            "stock": 10,
        }

        res1 = post_admin_product(client, admin_user["token"], payload_neg)
        assert res1.status_code == 400
        body1 = res1.get_json()
        assert body1["code"] == "VALIDATION_ERROR"
        assert "price" in body1["errors"]

        payload_zero = {
            "name": "Ghế Gỗ Zero Giá",
            "category": "ghe",
            "price": 0.0,
            "stock": 10,
        }

        res2 = post_admin_product(client, admin_user["token"], payload_zero)
        assert res2.status_code == 400
        body2 = res2.get_json()
        assert body2["code"] == "VALIDATION_ERROR"

    def test_tc03_missing_or_blank_name_returns_400(self, client, admin_user):
        """TC-03: Dữ liệu không hợp lệ — Thiếu tên sản phẩm / Tên chỉ có dấu cách ➔ 400 Bad Request (VALIDATION_ERROR)."""
        payload = {
            "name": "   ",
            "category": "ke",
            "price": 2000000.0,
            "stock": 5,
        }

        res = post_admin_product(client, admin_user["token"], payload)
        assert res.status_code == 400

        body = res.get_json()
        assert body["code"] == "VALIDATION_ERROR"
        assert "name" in body["errors"]

    def test_tc04_regular_user_create_product_forbidden(self, client, regular_user):
        """TC-04: Người dùng thường cố tạo sản phẩm ➔ 403 FORBIDDEN."""
        payload = {
            "name": "Sản phẩm của User",
            "category": "tu",
            "price": 1000000.0,
        }

        res = post_admin_product(client, regular_user["token"], payload)
        assert res.status_code == 403

        body = res.get_json()
        assert body["code"] == "FORBIDDEN"

    def test_tc05_unauthenticated_create_product_returns_401(self, client):
        """TC-05: Chưa đăng nhập (không gửi Token) ➔ 401 Unauthorized."""
        payload = {
            "name": "Sản phẩm vô danh",
            "category": "tu",
            "price": 1000000.0,
        }

        res = post_admin_product(client, None, payload)
        assert res.status_code == 401

    def test_tc06_get_admin_products_success(self, client, admin_user):
        """TC-06: Admin lấy danh sách sản phẩm quản trị ➔ 200 OK."""
        res = get_admin_products_api(client, admin_user["token"])
        assert res.status_code == 200

        body = res.get_json()
        assert body["status"] == "success"
        assert "items" in body["data"]
