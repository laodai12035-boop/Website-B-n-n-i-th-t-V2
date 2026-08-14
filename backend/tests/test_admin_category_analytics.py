"""
tests/test_admin_category_analytics.py — Test cases cho Xem thống kê sản phẩm theo danh mục (NT-13-CN-002).

Story: NT-13-CN-002 — Xem thống kê sản phẩm theo danh mục
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: Admin xem thống kê sản phẩm theo danh mục khi có đơn hàng ➔ Trả về số bán và doanh thu theo danh mục chính xác (Mức độ Trung bình)
- TC-02: Danh mục chưa phát sinh đơn ➔ Hiển thị total_sold = 0, total_revenue = 0.0, không lỗi (Mức độ Thấp)
- TC-03: Bộ lọc khoảng thời gian time_range ➔ Trả kết quả 200 OK tương ứng
- TC-04: Khách hàng thường không có quyền truy cập API Thống kê Danh mục ➔ 403 FORBIDDEN
"""

import pytest
from flask_jwt_extended import create_access_token
from app import create_app
from app.extensions import db, bcrypt
from app.models.user import User
from app.models.product import Product
from app.models.category import Category
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
            full_name="Quản Trị Viên Category Analytics",
            email="admincat@example.com",
            phone="0901118888",
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
            full_name="Hoàng Văn N",
            email="usern@example.com",
            phone="0907778888",
            password_hash=bcrypt.generate_password_hash("UserPassword123@").decode("utf-8"),
            role="user",
            is_active=True,
        )
        db.session.add(user)
        db.session.commit()
        token = create_access_token(identity=str(user.id))
        return {"id": user.id, "email": user.email, "token": token}


class TestAdminCategoryAnalyticsNT13CN002:
    """Bộ kiểm thử cho chức năng Xem thống kê sản phẩm theo danh mục (NT-13-CN-002)."""

    def test_tc01_get_category_analytics_with_orders_success(self, app, client, admin_user, regular_user):
        """TC-01: Có đơn hàng hoàn tất gắn sản phẩm thuộc danh mục ➔ Số lượng bán và doanh thu theo danh mục hiển thị chính xác (Mức độ Trung bình)."""
        with app.app_context():
            cat1 = Category(name="Sofa", slug="sofa-cat", is_active=True)
            cat2 = Category(name="Bàn ăn", slug="ban-an-cat", is_active=True)
            db.session.add_all([cat1, cat2])
            db.session.commit()

            p1 = Product(name="Sofa Băng Da", slug="sofa-bang-da-cat", category="Sofa", price=5000000.0, stock=10, is_active=True)
            p2 = Product(name="Bàn Ăn 6 Ghế", slug="ban-an-6-ghe-cat", category="Bàn ăn", price=3000000.0, stock=5, is_active=True)
            db.session.add_all([p1, p2])
            db.session.commit()

            p1_id = p1.id
            p2_id = p2.id

            # Đơn 1: Confirmed (2 Sofa + 1 Bàn ăn)
            o1 = Order(
                order_code="CAT001",
                user_id=regular_user["id"],
                recipient_name="Khách 1",
                recipient_phone="0907778888",
                total_amount=13000000.0,
                status="confirmed",
            )
            db.session.add(o1)
            db.session.commit()

            item1 = OrderItem(order_id=o1.id, product_id=p1_id, product_name="Sofa Băng Da", quantity=2, price=5000000.0, subtotal=10000000.0)
            item2 = OrderItem(order_id=o1.id, product_id=p2_id, product_name="Bàn Ăn 6 Ghế", quantity=1, price=3000000.0, subtotal=3000000.0)
            db.session.add_all([item1, item2])

            # Đơn 2: Cancelled (1 Sofa 5,000,000đ) ➔ Bị loại khỏi thống kê
            o2 = Order(
                order_code="CAT002",
                user_id=regular_user["id"],
                recipient_name="Khách 1",
                recipient_phone="0907778888",
                total_amount=5000000.0,
                status="cancelled",
            )
            db.session.add(o2)
            db.session.commit()

            item3 = OrderItem(order_id=o2.id, product_id=p1_id, product_name="Sofa Băng Da", quantity=1, price=5000000.0, subtotal=5000000.0)
            db.session.add(item3)
            db.session.commit()

        # Admin gọi API Thống kê theo Danh mục
        res = client.get(
            "/api/v1/admin/analytics/categories?time_range=this_month",
            headers={"Authorization": f"Bearer {admin_user['token']}"},
        )
        assert res.status_code == 200
        data = res.get_json()["data"]

        assert data["overall_revenue"] == 13000000.0
        assert data["overall_sold"] == 3

        categories = {c["category_name"]: c for c in data["categories"]}
        assert "Sofa" in categories
        assert categories["Sofa"]["total_sold"] == 2
        assert categories["Sofa"]["total_revenue"] == 10000000.0

        assert "Bàn ăn" in categories
        assert categories["Bàn ăn"]["total_sold"] == 1
        assert categories["Bàn ăn"]["total_revenue"] == 3000000.0

    def test_tc02_get_category_analytics_empty_data(self, app, client, admin_user):
        """TC-02: Chưa có đơn hàng cho danh mục ➔ Trả về total_sold = 0, total_revenue = 0.0, không lỗi (Mức độ Thấp)."""
        with app.app_context():
            c1 = Category(name="Đèn trang trí", slug="den-trang-tri-cat", is_active=True)
            db.session.add(c1)
            db.session.commit()

        res = client.get(
            "/api/v1/admin/analytics/categories?time_range=today",
            headers={"Authorization": f"Bearer {admin_user['token']}"},
        )
        assert res.status_code == 200
        data = res.get_json()["data"]

        assert data["overall_revenue"] == 0.0
        assert data["overall_sold"] == 0
        categories = {c["category_name"]: c for c in data["categories"]}
        assert "Đèn trang trí" in categories
        assert categories["Đèn trang trí"]["total_sold"] == 0
        assert categories["Đèn trang trí"]["total_revenue"] == 0.0

    def test_tc03_get_category_analytics_time_range_filter(self, client, admin_user):
        """TC-03: Kiểm thử lọc mốc thời gian khác nhau (today, this_week, this_month, this_year, all) ➔ 200 OK."""
        for tr in ["today", "this_week", "this_month", "this_year", "all"]:
            res = client.get(
                f"/api/v1/admin/analytics/categories?time_range={tr}",
                headers={"Authorization": f"Bearer {admin_user['token']}"},
            )
            assert res.status_code == 200
            assert res.get_json()["data"]["time_range"] == tr

    def test_tc04_regular_user_category_analytics_forbidden(self, client, regular_user):
        """TC-04: Khách hàng thường không có quyền truy cập API Thống kê Danh mục ➔ 403 FORBIDDEN."""
        res = client.get(
            "/api/v1/admin/analytics/categories",
            headers={"Authorization": f"Bearer {regular_user['token']}"},
        )
        assert res.status_code == 403
        assert res.get_json()["code"] == "FORBIDDEN"
