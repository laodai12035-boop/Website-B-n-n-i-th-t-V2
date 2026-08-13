"""
tests/test_admin_customers.py — Test cases cho Xem danh sách khách hàng (NT-12-CN-001).

Story: NT-12-CN-001 — Xem danh sách khách hàng
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: Admin xem danh sách khách hàng hiển thị đầy đủ, chính xác kèm tổng số đơn hàng ➔ 200 OK
- TC-02: Tìm kiếm (theo tên/email/sĐT) và Lọc theo trạng thái ➔ 200 OK
- TC-03: Phân trang danh sách khách hàng ➔ 200 OK
- TC-04: Người dùng thường không có quyền truy cập API Admin Customers ➔ 403 FORBIDDEN
"""

import pytest
from datetime import datetime
from flask_jwt_extended import create_access_token
from app import create_app
from app.extensions import db, bcrypt
from app.models.user import User
from app.models.order import Order


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
            full_name="Quản Trị Viên Khách Hàng",
            email="admincustomer@example.com",
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
            full_name="Nguyễn Văn K",
            email="userk@example.com",
            phone="0907778888",
            password_hash=bcrypt.generate_password_hash("UserPassword123@").decode("utf-8"),
            role="user",
            is_active=True,
        )
        db.session.add(user)
        db.session.commit()
        token = create_access_token(identity=str(user.id))
        return {"id": user.id, "email": user.email, "token": token}


class TestAdminCustomersNT12CN001:
    """Bộ kiểm thử cho chức năng Xem danh sách khách hàng (NT-12-CN-001)."""

    def test_tc01_admin_get_customers_list_success(self, app, client, admin_user):
        """TC-01: Admin vào trang danh sách khách hàng ➔ Hiển thị đầy đủ, chính xác kèm tổng số đơn hàng."""
        # 1. Seed 3 khách hàng & các đơn hàng
        with app.app_context():
            pwd = bcrypt.generate_password_hash("Pass123@").decode("utf-8")
            u1 = User(full_name="Khách Hàng Một", email="khach1@example.com", phone="0911000001", password_hash=pwd, role="user", is_active=True)
            u2 = User(full_name="Khách Hàng Hai", email="khach2@example.com", phone="0911000002", password_hash=pwd, role="user", is_active=True)
            u3 = User(full_name="Khách Hàng Ba", email="khach3@example.com", phone="0911000003", password_hash=pwd, role="user", is_active=False)
            db.session.add_all([u1, u2, u3])
            db.session.commit()

            # Tạo 2 đơn hàng cho u1
            o1 = Order(order_code="ORD001", user_id=u1.id, recipient_name="KH1", recipient_phone="0911000001", total_amount=1500000.0, status="confirmed")
            o2 = Order(order_code="ORD002", user_id=u1.id, recipient_name="KH1", recipient_phone="0911000001", total_amount=2500000.0, status="delivered")
            db.session.add_all([o1, o2])
            db.session.commit()

        # 2. Admin gọi API GET /api/v1/admin/customers
        res = client.get(
            "/api/v1/admin/customers",
            headers={"Authorization": f"Bearer {admin_user['token']}"},
        )
        assert res.status_code == 200
        data = res.get_json()["data"]

        assert "customers" in data
        assert "pagination" in data
        assert "summary" in data

        customers = data["customers"]
        # Phải chứa u1, u2, u3 (3 người dùng role=user)
        assert len(customers) >= 3

        # Kiểm tra thông tin u1
        kh1_info = next(c for c in customers if c["email"] == "khach1@example.com")
        assert kh1_info["full_name"] == "Khách Hàng Một"
        assert kh1_info["total_orders"] == 2
        assert kh1_info["total_spent"] == 4000000.0  # 1.5tr + 2.5tr
        assert kh1_info["last_order_at"] is not None

    def test_tc02_search_and_filter_customers(self, app, client, admin_user):
        """TC-02: Tìm kiếm (tên/email/sĐT) và Lọc trạng thái khách hàng ➔ 200 OK."""
        with app.app_context():
            pwd = bcrypt.generate_password_hash("Pass123@").decode("utf-8")
            u1 = User(full_name="Lê Văn Thắng", email="thang@example.com", phone="0988111222", password_hash=pwd, role="user", is_active=True)
            u2 = User(full_name="Phạm Thị Mai", email="mai@example.com", phone="0988333444", password_hash=pwd, role="user", is_active=False)
            db.session.add_all([u1, u2])
            db.session.commit()

        # Tìm kiếm theo tên "Thắng"
        res_search = client.get(
            "/api/v1/admin/customers?search=Thắng",
            headers={"Authorization": f"Bearer {admin_user['token']}"},
        )
        assert res_search.status_code == 200
        search_items = res_search.get_json()["data"]["customers"]
        assert len(search_items) == 1
        assert search_items[0]["email"] == "thang@example.com"

        # Lọc trạng thái inactive
        res_inactive = client.get(
            "/api/v1/admin/customers?status=inactive",
            headers={"Authorization": f"Bearer {admin_user['token']}"},
        )
        assert res_inactive.status_code == 200
        inactive_items = res_inactive.get_json()["data"]["customers"]
        assert any(c["email"] == "mai@example.com" for c in inactive_items)

    def test_tc03_pagination_admin_customers(self, app, client, admin_user):
        """TC-03: Phân trang danh sách khách hàng ➔ 200 OK."""
        with app.app_context():
            pwd = bcrypt.generate_password_hash("Pass123@").decode("utf-8")
            users = [
                User(full_name=f"Khách #{i}", email=f"user_page_{i}@example.com", phone=f"090000000{i}", password_hash=pwd, role="user", is_active=True)
                for i in range(5)
            ]
            db.session.add_all(users)
            db.session.commit()

        res_p1 = client.get(
            "/api/v1/admin/customers?page=1&limit=2",
            headers={"Authorization": f"Bearer {admin_user['token']}"},
        )
        assert res_p1.status_code == 200
        p1_data = res_p1.get_json()["data"]
        assert len(p1_data["customers"]) == 2
        assert p1_data["pagination"]["page"] == 1
        assert p1_data["pagination"]["limit"] == 2
        assert p1_data["pagination"]["total_pages"] >= 3

    def test_tc04_regular_user_access_admin_customers_forbidden(self, client, regular_user):
        """TC-04: Khách hàng thường không có quyền truy cập API Admin Customers ➔ 403 FORBIDDEN."""
        res = client.get(
            "/api/v1/admin/customers",
            headers={"Authorization": f"Bearer {regular_user['token']}"},
        )
        assert res.status_code == 403
        assert res.get_json()["code"] == "FORBIDDEN"
