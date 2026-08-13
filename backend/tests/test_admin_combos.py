"""
tests/test_admin_combos.py — Test cases cho chức năng Tạo combo hoặc bộ sản phẩm (NT-08-CN-006).

Story: NT-08-CN-006 — Tạo combo hoặc bộ sản phẩm
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: Admin chọn các sản phẩm thành phần active và đặt giá combo ➔ 201 Created (Combo Bộ bàn ăn 6 ghế)
- TC-02: Dữ liệu không hợp lệ: 1 sản phẩm thành phần đã ngừng bán (is_active = False) ➔ 400 Bad Request (PRODUCT_INACTIVE_OR_NOT_FOUND)
- TC-03: Dữ liệu không hợp lệ: Tên rỗng / % chiết khấu âm / danh sách items rỗng ➔ 400 Bad Request (VALIDATION_ERROR)
- TC-04: Tài khoản người dùng thường cố gọi API tạo combo ➔ 403 Forbidden (FORBIDDEN)
- TC-05: Public API GET /api/v1/combos trả về đúng thông tin combo vừa tạo ➔ 200 OK
"""

import json
import pytest
from flask_jwt_extended import create_access_token
from app import create_app
from app.extensions import db, bcrypt
from app.models.user import User
from app.models.product import Product
from app.models.combo import Combo


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


@pytest.fixture
def active_products(app):
    """Tạo các sản phẩm mẫu trong DB (Bàn ăn & Ghế ăn active)."""
    with app.app_context():
        p1 = Product(
            name="Bàn Ăn Gỗ Sồi Scandinavian",
            slug="ban-an-go-soi-scandinavian",
            price=12000000.0,
            category="ban",
            stock=10,
            is_active=True,
        )
        p2 = Product(
            name="Ghế Ăn Gỗ Nệm Da",
            slug="ghe-an-go-nem-da",
            price=1500000.0,
            category="ghe",
            stock=50,
            is_active=True,
        )
        p_inactive = Product(
            name="Ghế Ăn Đã Ngừng Bán",
            slug="ghe-an-da-ngung-ban",
            price=1000000.0,
            category="ghe",
            stock=0,
            is_active=False,
        )
        db.session.add_all([p1, p2, p_inactive])
        db.session.commit()
        return {"p1": p1.id, "p2": p2.id, "p_inactive": p_inactive.id}


def post_admin_combo(client, token, payload):
    """Helper gửi request POST /api/v1/admin/combos."""
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return client.post("/api/v1/admin/combos", data=json.dumps(payload), headers=headers)


class TestAdminCreateCombo:
    """Các test case cho NT-08-CN-006 Tạo combo hoặc bộ sản phẩm (Admin)."""

    def test_tc01_admin_create_combo_success(self, client, admin_user, active_products):
        """TC-01: Admin chọn các sản phẩm thành phần active và đặt giá/giảm giá combo ➔ 201 Created."""
        payload = {
            "name": "Combo Bộ Bàn Ăn 6 Ghế Scandinavian",
            "description": "Bộ bàn ăn 6 ghế gỗ sồi tự nhiên sang trọng",
            "discount_percent": 15.0,
            "items": [
                {"product_id": active_products["p1"], "quantity": 1},
                {"product_id": active_products["p2"], "quantity": 6},
            ],
        }

        res = post_admin_combo(client, admin_user["token"], payload)
        assert res.status_code == 201

        body = res.get_json()
        assert body["status"] == "success"
        assert body["data"]["name"] == "Combo Bộ Bàn Ăn 6 Ghế Scandinavian"
        assert body["data"]["discount_percent"] == 15.0
        assert len(body["data"]["items"]) == 2

        # Kiểm tra tính toán tổng tiền
        # Bàn (12m) + 6 Ghế (6 * 1.5m = 9m) = 21,000,000đ gốc
        # Giảm 15% ➔ 17,850,000đ
        assert body["data"]["original_total"] == 21000000.0
        assert body["data"]["combo_total"] == 17850000.0

    def test_tc02_create_combo_with_inactive_product_rejected(self, client, admin_user, active_products):
        """TC-02: Một sản phẩm thành phần đã ngừng bán (is_active = False) ➔ 400 Bad Request (PRODUCT_INACTIVE_OR_NOT_FOUND)."""
        payload = {
            "name": "Combo Chứa Sản Phẩm Ngừng Bán",
            "discount_percent": 10.0,
            "items": [
                {"product_id": active_products["p1"], "quantity": 1},
                {"product_id": active_products["p_inactive"], "quantity": 2},
            ],
        }

        res = post_admin_combo(client, admin_user["token"], payload)
        assert res.status_code == 400

        body = res.get_json()
        assert body["code"] == "PRODUCT_INACTIVE_OR_NOT_FOUND"
        assert "ngừng bán" in body["message"].lower() or "không tồn tại" in body["message"].lower()

    def test_tc03_invalid_combo_data_returns_400(self, client, admin_user, active_products):
        """TC-03: Dữ liệu không hợp lệ (Tên rỗng / % giảm âm / Items rỗng) ➔ 400 Bad Request (VALIDATION_ERROR)."""
        # 1. Tên rỗng
        payload_empty_name = {
            "name": "   ",
            "discount_percent": 10.0,
            "items": [{"product_id": active_products["p1"], "quantity": 1}],
        }
        res1 = post_admin_combo(client, admin_user["token"], payload_empty_name)
        assert res1.status_code == 400
        assert res1.get_json()["code"] == "VALIDATION_ERROR"

        # 2. Chiết khấu âm
        payload_neg_disc = {
            "name": "Combo Chiết Khấu Âm",
            "discount_percent": -10.0,
            "items": [{"product_id": active_products["p1"], "quantity": 1}],
        }
        res2 = post_admin_combo(client, admin_user["token"], payload_neg_disc)
        assert res2.status_code == 400
        assert res2.get_json()["code"] == "VALIDATION_ERROR"

        # 3. Items rỗng
        payload_empty_items = {
            "name": "Combo Rỗng",
            "discount_percent": 10.0,
            "items": [],
        }
        res3 = post_admin_combo(client, admin_user["token"], payload_empty_items)
        assert res3.status_code == 400
        assert res3.get_json()["code"] == "VALIDATION_ERROR"

    def test_tc04_regular_user_create_combo_forbidden(self, client, regular_user, active_products):
        """TC-04: Người dùng thường cố tạo combo ➔ 403 FORBIDDEN."""
        payload = {
            "name": "Combo Của User Thường",
            "discount_percent": 10.0,
            "items": [{"product_id": active_products["p1"], "quantity": 1}],
        }

        res = post_admin_combo(client, regular_user["token"], payload)
        assert res.status_code == 403
        assert res.get_json()["code"] == "FORBIDDEN"

    def test_tc05_public_api_returns_created_combo(self, client, admin_user, active_products):
        """TC-05: Public API GET /api/v1/combos hiển thị đúng combo vừa tạo ➔ 200 OK."""
        # 1. Admin tạo combo
        payload = {
            "name": "Bộ Phòng Ăn Ưu Đãi",
            "discount_percent": 20.0,
            "items": [{"product_id": active_products["p1"], "quantity": 1}],
        }
        post_admin_combo(client, admin_user["token"], payload)

        # 2. Khách gọi Public API
        res = client.get("/api/v1/combos")
        assert res.status_code == 200

        body = res.get_json()
        assert body["status"] == "success"
        combo_names = [c["name"] for c in body["data"]]
        assert "Bộ Phòng Ăn Ưu Đãi" in combo_names
