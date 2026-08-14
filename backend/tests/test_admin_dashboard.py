"""
tests/test_admin_dashboard.py — Test cases cho Xem bảng điều khiển tổng quan (NT-13-CN-001).

Story: NT-13-CN-001 — Xem bảng điều khiển tổng quan
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: Admin xem bảng điều khiển khi có dữ liệu đơn hàng ➔ Thống kê doanh thu, số đơn, sản phẩm bán chạy hiển thị chính xác (Mức độ Cao)
- TC-02: Admin xem bảng điều khiển khi chưa có đơn hàng trong khoảng thời gian ➔ Hiển thị số liệu bằng 0, top products rỗng, không lỗi (Mức độ Thấp)
- TC-03: Kiểm thử các bộ lọc khoảng thời gian (today, this_week, this_month, this_year, all) ➔ 200 OK
- TC-04: Khách hàng thường không có quyền truy cập API Admin Dashboard ➔ 403 FORBIDDEN
"""

import pytest
from datetime import datetime, timedelta
from flask_jwt_extended import create_access_token
from app import create_app
from app.extensions import db, bcrypt
from app.models.user import User
from app.models.product import Product
from app.models.order import Order, OrderItem


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
            full_name="Quản Trị Viên Dashboard",
            email="admindash@example.com",
            phone="0901117777",
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
            full_name="Bùi Văn M",
            email="userm@example.com",
            phone="0905556666",
            password_hash=bcrypt.generate_password_hash("UserPassword123@").decode("utf-8"),
            role="user",
            is_active=True,
        )
        db.session.add(user)
        db.session.commit()
        token = create_access_token(identity=str(user.id))
        return {"id": user.id, "email": user.email, "token": token}


class TestAdminDashboardNT13CN001:
    """Bộ kiểm thử cho chức năng Xem Bảng điều khiển tổng quan (NT-13-CN-001)."""

    def test_tc01_admin_dashboard_with_orders_success(self, app, client, admin_user, regular_user):
        """TC-01: Admin xem bảng điều khiển khi có dữ liệu ➔ Doanh thu, số đơn, top sản phẩm bán chạy hiển thị chính xác (Mức độ Cao)."""
        with app.app_context():
            p1 = Product(name="Ghế Sofa Cao Cấp", slug="ghe-sofa-cao-cap-dash", category="Sofa", price=3000000.0, stock=10, is_active=True)
            p2 = Product(name="Bàn Ăn Gỗ Sồi", slug="ban-an-go-soi-dash", category="Bàn ăn", price=2000000.0, stock=5, is_active=True)
            db.session.add_all([p1, p2])
            db.session.commit()
            p1_id = p1.id
            p2_id = p2.id

            # Đơn hàng 1: Confirmed, 2 p1 + 1 p2 = 8,000,000đ
            o1 = Order(
                order_code="DASH001",
                user_id=regular_user["id"],
                recipient_name="Khách 1",
                recipient_phone="0905556666",
                total_amount=8000000.0,
                status="confirmed",
            )
            db.session.add(o1)
            db.session.commit()

            item1 = OrderItem(order_id=o1.id, product_id=p1_id, product_name="Ghế Sofa Cao Cấp", quantity=2, price=3000000.0, subtotal=6000000.0)
            item2 = OrderItem(order_id=o1.id, product_id=p2_id, product_name="Bàn Ăn Gỗ Sồi", quantity=1, price=2000000.0, subtotal=2000000.0)
            db.session.add_all([item1, item2])

            # Đơn hàng 2: Cancelled (hủy), total 5,000,000đ ➔ Không tính vào doanh thu
            o2 = Order(
                order_code="DASH002",
                user_id=regular_user["id"],
                recipient_name="Khách 1",
                recipient_phone="0905556666",
                total_amount=5000000.0,
                status="cancelled",
            )
            db.session.add(o2)
            db.session.commit()

        # Admin gọi API Dashboard tháng này
        res = client.get(
            "/api/v1/admin/dashboard?time_range=this_month",
            headers={"Authorization": f"Bearer {admin_user['token']}"},
        )
        assert res.status_code == 200
        data = res.get_json()["data"]

        summary = data["summary"]
        assert summary["total_revenue"] == 8000000.0  # Không bao gồm đơn bị hủy
        assert summary["total_orders"] == 2
        assert "revenue_formatted" in summary

        # Kiểm tra top selling products (p1 bán 2 cái đứng đầu, p2 bán 1 cái đứng 2)
        top_products = data["top_selling_products"]
        assert len(top_products) >= 2
        assert top_products[0]["product_id"] == p1_id
        assert top_products[0]["sold_count"] == 2

    def test_tc02_admin_dashboard_empty_data(self, client, admin_user):
        """TC-02: Chưa có đơn hàng trong khoảng thời gian chọn ➔ Hiển thị số liệu bằng 0, top products rỗng, không lỗi (Mức độ Thấp)."""
        res = client.get(
            "/api/v1/admin/dashboard?time_range=today",
            headers={"Authorization": f"Bearer {admin_user['token']}"},
        )
        assert res.status_code == 200
        data = res.get_json()["data"]

        summary = data["summary"]
        assert summary["total_revenue"] == 0.0
        assert summary["total_orders"] == 0
        assert data["top_selling_products"] == []

    def test_tc03_admin_dashboard_time_range_filters(self, client, admin_user):
        """TC-03: Lọc theo mốc thời gian khác nhau (today, this_week, this_month, this_year, all) ➔ 200 OK."""
        for tr in ["today", "this_week", "this_month", "this_year", "all"]:
            res = client.get(
                f"/api/v1/admin/dashboard?time_range={tr}",
                headers={"Authorization": f"Bearer {admin_user['token']}"},
            )
            assert res.status_code == 200
            assert res.get_json()["data"]["time_range"] == tr

    def test_tc04_regular_user_dashboard_forbidden(self, client, regular_user):
        """TC-04: Khách hàng thường không có quyền truy cập Dashboard Admin ➔ 403 FORBIDDEN."""
        res = client.get(
            "/api/v1/admin/dashboard",
            headers={"Authorization": f"Bearer {regular_user['token']}"},
        )
        assert res.status_code == 403
        assert res.get_json()["code"] == "FORBIDDEN"
