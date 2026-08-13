"""
tests/test_admin_stock.py — Test cases cho chức năng Nhập kho sản phẩm (NT-09-CN-001).

Story: NT-09-CN-001 — Nhập kho sản phẩm
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: Admin nhập 50 sản phẩm vào kho hợp lệ ➔ 201 Created (Tồn kho sản phẩm tăng từ 10 ➔ 60)
- TC-02: Dữ liệu không hợp lệ: Số lượng nhập âm (quantity = -5) hoặc bằng 0 ➔ 400 Bad Request (VALIDATION_ERROR)
- TC-03: Nhập kho sản phẩm không tồn tại trong hệ thống ➔ 404 Not Found (PRODUCT_NOT_FOUND)
- TC-04: Tài khoản người dùng thường cố gọi API nhập kho ➔ 403 Forbidden (FORBIDDEN)
- TC-05: Admin xem danh sách lịch sử các phiếu nhập kho ➔ 200 OK
"""

import json
import pytest
from flask_jwt_extended import create_access_token
from app import create_app
from app.extensions import db, bcrypt
from app.models.user import User
from app.models.product import Product
from app.models.stock_receipt import StockReceipt


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
def sample_product(app):
    """Tạo 1 sản phẩm mẫu trong DB với tồn kho ban đầu = 10."""
    with app.app_context():
        product = Product(
            name="Sofa Gỗ Óc Chó Nhập Kho Test",
            slug="sofa-go-oc-cho-nhap-kho-test",
            price=25000000.0,
            category="ban",
            stock=10,
            is_active=True,
        )
        db.session.add(product)
        db.session.commit()
        return {"id": product.id, "name": product.name, "initial_stock": product.stock}


def post_stock_import(client, token, payload):
    """Helper gửi request POST /api/v1/admin/inventory/import."""
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return client.post("/api/v1/admin/inventory/import", data=json.dumps(payload), headers=headers)


class TestAdminStockImport:
    """Các test case cho NT-09-CN-001 Nhập kho sản phẩm (Admin)."""

    def test_tc01_admin_import_stock_success(self, client, admin_user, sample_product, app):
        """TC-01: Admin nhập 50 sản phẩm vào kho hợp lệ ➔ 201 Created (Tồn kho tăng từ 10 ➔ 60)."""
        payload = {
            "product_id": sample_product["id"],
            "quantity": 50,
            "supplier": "Xưởng Gỗ Nam Định",
            "unit_cost": 18000000.0,
            "note": "Nhập bổ sung lô hàng đợt 1 tháng 8/2026",
        }

        res = post_stock_import(client, admin_user["token"], payload)
        assert res.status_code == 201

        body = res.get_json()
        assert body["status"] == "success"
        assert body["data"]["old_stock"] == 10
        assert body["data"]["added_quantity"] == 50
        assert body["data"]["new_stock"] == 60

        # Kiểm tra tồn kho sản phẩm trực tiếp trong DB
        with app.app_context():
            p = db.session.query(Product).filter(Product.id == sample_product["id"]).first()
            assert p.stock == 60

            # Kiểm tra bản ghi StockReceipt được tạo
            receipt = db.session.query(StockReceipt).filter(StockReceipt.product_id == sample_product["id"]).first()
            assert receipt is not None
            assert receipt.quantity == 50
            assert receipt.supplier == "Xưởng Gỗ Nam Định"

    def test_tc02_import_stock_invalid_quantity_rejected(self, client, admin_user, sample_product, app):
        """TC-02: Dữ liệu không hợp lệ: Số lượng nhập âm (quantity = -5) hoặc bằng 0 ➔ 400 Bad Request (VALIDATION_ERROR)."""
        # 1. Số lượng âm
        payload_neg = {
            "product_id": sample_product["id"],
            "quantity": -5,
        }
        res1 = post_stock_import(client, admin_user["token"], payload_neg)
        assert res1.status_code == 400
        body1 = res1.get_json()
        assert body1["code"] == "VALIDATION_ERROR"
        assert "lớn hơn 0" in body1["message"].lower()

        # 2. Số lượng bằng 0
        payload_zero = {
            "product_id": sample_product["id"],
            "quantity": 0,
        }
        res2 = post_stock_import(client, admin_user["token"], payload_zero)
        assert res2.status_code == 400
        assert res2.get_json()["code"] == "VALIDATION_ERROR"

        # Đảm bảo tồn kho trong DB giữ nguyên = 10
        with app.app_context():
            p = db.session.query(Product).filter(Product.id == sample_product["id"]).first()
            assert p.stock == 10

    def test_tc03_import_stock_non_existing_product_returns_404(self, client, admin_user):
        """TC-03: Nhập kho sản phẩm không tồn tại (product_id = 99999) ➔ 404 Not Found (PRODUCT_NOT_FOUND)."""
        payload = {
            "product_id": 99999,
            "quantity": 20,
        }
        res = post_stock_import(client, admin_user["token"], payload)
        assert res.status_code == 404
        assert res.get_json()["code"] == "PRODUCT_NOT_FOUND"

    def test_tc04_regular_user_import_stock_forbidden(self, client, regular_user, sample_product):
        """TC-04: Tài khoản người dùng thường cố gọi API nhập kho ➔ 403 FORBIDDEN."""
        payload = {
            "product_id": sample_product["id"],
            "quantity": 10,
        }
        res = post_stock_import(client, regular_user["token"], payload)
        assert res.status_code == 403
        assert res.get_json()["code"] == "FORBIDDEN"

    def test_tc05_get_stock_receipts_history_success(self, client, admin_user, sample_product):
        """TC-05: Admin xem danh sách lịch sử các phiếu nhập kho ➔ 200 OK."""
        # 1. Nhập kho lần 1
        post_stock_import(client, admin_user["token"], {
            "product_id": sample_product["id"],
            "quantity": 30,
            "supplier": "Xưởng A",
        })

        # 2. Nhập kho lần 2
        post_stock_import(client, admin_user["token"], {
            "product_id": sample_product["id"],
            "quantity": 20,
            "supplier": "Xưởng B",
        })

        # 3. Lấy lịch sử phiếu nhập
        res = client.get("/api/v1/admin/inventory/receipts", headers={"Authorization": f"Bearer {admin_user['token']}"})
        assert res.status_code == 200

        body = res.get_json()
        assert body["status"] == "success"
        assert len(body["data"]) >= 2
        assert body["data"][0]["quantity"] in (30, 20)
