"""
tests/test_low_stock_warning.py — Test cases cho Cảnh báo tồn kho thấp (NT-09-CN-003, QTN-08).

Story: NT-09-CN-003 — Cảnh báo tồn kho thấp
Quy tắc: QTN-08 — Cảnh báo tồn kho thấp
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: Tồn kho giảm xuống dưới ngưỡng tối thiểu (ngưỡng 10, tồn còn 5) ➔ 200 OK (Cảnh báo hiển thị trên Bảng điều khiển Admin)
- TC-02: Tồn kho trên ngưỡng tối thiểu (ngưỡng 10, tồn còn 20) ➔ 200 OK (Không hiển thị cảnh báo)
- TC-03: Nhập kho nâng tồn kho vượt ngưỡng ➔ Cảnh báo tự động biến mất
- TC-04: Người dùng thường không có quyền xem cảnh báo tồn kho Admin ➔ 403 FORBIDDEN
"""

import pytest
from flask_jwt_extended import create_access_token
from app import create_app
from app.extensions import db, bcrypt
from app.models.user import User
from app.models.product import Product
from app.services.stock_service import StockService


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
    """Tạo tài khoản Admin trong DB."""
    with app.app_context():
        admin = User(
            full_name="Quản Trị Viên Kho",
            email="adminstock@example.com",
            phone="0901119999",
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
    """Tạo tài khoản Khách hàng thường trong DB."""
    with app.app_context():
        user = User(
            full_name="Nguyễn Văn B",
            email="userb@example.com",
            phone="0908887777",
            password_hash=bcrypt.generate_password_hash("UserPassword123@").decode("utf-8"),
            role="user",
            is_active=True,
        )
        db.session.add(user)
        db.session.commit()
        token = create_access_token(identity=str(user.id))
        return {"id": user.id, "email": user.email, "token": token}


class TestLowStockWarningQTN08:
    """Bộ kiểm thử cho chức năng Cảnh báo tồn kho thấp (QTN-08)."""

    def test_tc01_low_stock_warning_triggered_below_threshold(self, app, client, admin_user):
        """TC-01: Sản phẩm có stock=5 < min_stock_threshold=10 ➔ Xuất hiện trong danh sách cảnh báo tồn kho thấp."""
        with app.app_context():
            p_low = Product(
                name="Tủ Quần Áo Gỗ Sồi 3 Cánh Low Stock",
                slug="tu-quan-ao-go-soi-3-canh-low",
                price=15000000.0,
                category="tu",
                stock=5,
                min_stock_threshold=10,
                is_active=True,
            )
            db.session.add(p_low)
            db.session.commit()

        # Gọi API Cảnh báo tồn kho thấp
        response = client.get(
            "/api/v1/admin/inventory/low-stock-warnings",
            headers={"Authorization": f"Bearer {admin_user['token']}"},
        )
        assert response.status_code == 200
        res_data = response.get_json()["data"]

        assert res_data["count"] >= 1
        items = res_data["items"]
        item_found = next((i for i in items if i["slug"] == "tu-quan-ao-go-soi-3-canh-low"), None)

        assert item_found is not None
        assert item_found["stock"] == 5
        assert item_found["min_stock_threshold"] == 10
        assert item_found["deficit"] == 5
        assert item_found["alert_level"] == "warning"

    def test_tc02_no_warning_above_threshold(self, app, client, admin_user):
        """TC-02: Sản phẩm có stock=20 >= min_stock_threshold=10 ➔ Không xuất hiện trong danh sách cảnh báo."""
        with app.app_context():
            p_safe = Product(
                name="Kệ Tivi Gỗ Xoan Đào Safe Stock",
                slug="ke-tivi-go-xoan-dao-safe",
                price=6500000.0,
                category="ke",
                stock=20,
                min_stock_threshold=10,
                is_active=True,
            )
            db.session.add(p_safe)
            db.session.commit()

        response = client.get(
            "/api/v1/admin/inventory/low-stock-warnings",
            headers={"Authorization": f"Bearer {admin_user['token']}"},
        )
        assert response.status_code == 200
        items = response.get_json()["data"]["items"]

        # Đảm bảo p_safe không nằm trong danh sách cảnh báo
        item_found = next((i for i in items if i["slug"] == "ke-tivi-go-xoan-dao-safe"), None)
        assert item_found is None

    def test_tc03_stock_import_clears_warning(self, app, client, admin_user):
        """TC-03: Nhập kho sản phẩm làm stock từ 5 ➔ 25 (>= 10) ➔ Cảnh báo tự động biến mất."""
        with app.app_context():
            p_refill = Product(
                name="Bàn Trà Tròn Scandinavian Refill",
                slug="ban-tra-tron-scandinavian-refill",
                price=3200000.0,
                category="ban",
                stock=5,
                min_stock_threshold=10,
                is_active=True,
            )
            db.session.add(p_refill)
            db.session.commit()
            product_id = p_refill.id

        # 1. Trước khi nhập kho ➔ Đang có trong cảnh báo
        warnings_before = client.get(
            "/api/v1/admin/inventory/low-stock-warnings",
            headers={"Authorization": f"Bearer {admin_user['token']}"},
        ).get_json()["data"]["items"]
        assert any(i["id"] == product_id for i in warnings_before)

        # 2. Lập phiếu nhập kho thêm 20 sản phẩm
        import_res = client.post(
            "/api/v1/admin/inventory/import",
            json={
                "product_id": product_id,
                "quantity": 20,
                "supplier": "Xưởng Gỗ An Cường",
                "unit_cost": 2000000,
                "note": "Bổ sung hàng tồn kho theo cảnh báo QTN-08",
            },
            headers={"Authorization": f"Bearer {admin_user['token']}"},
        )
        assert import_res.status_code == 201

        # 3. Sau khi nhập kho ➔ Cảnh báo biến mất
        warnings_after = client.get(
            "/api/v1/admin/inventory/low-stock-warnings",
            headers={"Authorization": f"Bearer {admin_user['token']}"},
        ).get_json()["data"]["items"]
        assert not any(i["id"] == product_id for i in warnings_after)

    def test_tc04_regular_user_access_low_stock_forbidden(self, client, regular_user):
        """TC-04: Người dùng thường không thể truy cập API cảnh báo tồn kho của Admin ➔ 403 FORBIDDEN."""
        response = client.get(
            "/api/v1/admin/inventory/low-stock-warnings",
            headers={"Authorization": f"Bearer {regular_user['token']}"},
        )
        assert response.status_code == 403
        assert response.get_json()["code"] == "FORBIDDEN"
