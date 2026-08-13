"""
tests/test_admin_review_stats.py — Test cases cho Xem thống kê đánh giá sản phẩm (NT-10-CN-002).

Story: NT-10-CN-002 — Xem thống kê đánh giá sản phẩm
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: Admin xem trang thống kê đánh giá sản phẩm có 10 đánh giá (8 lượt 5★, 2 lượt 4★) ➔ 200 OK (Điểm trung bình và lượt đánh giá hiển thị chính xác)
- TC-02: Sản phẩm chưa có đánh giá ➔ 200 OK (Trả về total_reviews = 0, an toàn không lỗi chia 0)
- TC-03: Người dùng thường không có quyền xem thống kê đánh giá Admin ➔ 403 FORBIDDEN
"""

import pytest
from flask_jwt_extended import create_access_token
from app import create_app
from app.extensions import db, bcrypt
from app.models.user import User
from app.models.product import Product
from app.models.review import Review


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
            full_name="Quản Trị Viên Stats",
            email="adminstats@example.com",
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
            full_name="Đặng Văn E",
            email="usere@example.com",
            phone="0905554444",
            password_hash=bcrypt.generate_password_hash("UserPassword123@").decode("utf-8"),
            role="user",
            is_active=True,
        )
        db.session.add(user)
        db.session.commit()
        token = create_access_token(identity=str(user.id))
        return {"id": user.id, "email": user.email, "token": token}


class TestAdminReviewStatsNT10CN002:
    """Bộ kiểm thử cho chức năng Xem Thống Kê Đánh Giá Sản Phẩm (NT-10-CN-002)."""

    def test_tc01_admin_get_review_stats_success(self, app, client, admin_user):
        """TC-01: Sản phẩm có 10 đánh giá (8 lượt 5★, 2 lượt 4★) ➔ Điểm trung bình và lượt đánh giá hiển thị đúng."""
        with app.app_context():
            p1 = Product(
                name="Bàn Ăn 6 Ghế Gỗ Sồi Nga Stats",
                slug="ban-an-6-ghe-go-soi-nga-stats",
                price=18500000.0,
                category="ban",
                stock=10,
                rating=4.8,
                rating_count=10,
                is_active=True,
            )
            db.session.add(p1)
            db.session.flush()

            # Tạo 10 users và 10 reviews (8 lượt 5 sao, 2 lượt 4 sao)
            for i in range(1, 11):
                u = User(
                    full_name=f"Khách Hàng {i}",
                    email=f"cust{i}@example.com",
                    phone=f"090000000{i}",
                    password_hash=bcrypt.generate_password_hash("Pass123@").decode("utf-8"),
                    role="user",
                    is_active=True,
                )
                db.session.add(u)
                db.session.flush()

                rating_val = 5 if i <= 8 else 4
                r = Review(
                    user_id=u.id,
                    product_id=p1.id,
                    rating=rating_val,
                    comment=f"Đánh giá sản phẩm chất lượng #{i}",
                    is_approved=True,
                )
                db.session.add(r)

            db.session.commit()
            product_id = p1.id

        # Admin gọi API Thống kê đánh giá
        response = client.get(
            "/api/v1/admin/reviews/stats",
            headers={"Authorization": f"Bearer {admin_user['token']}"},
        )
        assert response.status_code == 200
        res_data = response.get_json()["data"]

        # 1. Kiểm tra chỉ số Overview
        overview = res_data["overview"]
        assert overview["total_reviews"] == 10
        assert overview["approved_reviews"] == 10
        assert overview["hidden_reviews"] == 0
        assert overview["overall_average_rating"] == 4.8
        assert overview["star_distribution"]["5"] == 8
        assert overview["star_distribution"]["4"] == 2

        # 2. Kiểm tra chỉ số Product Stats
        products = res_data["products"]
        p_stat = next((p for p in products if p["id"] == product_id), None)
        assert p_stat is not None
        assert p_stat["total_reviews"] == 10
        assert p_stat["average_rating"] == 4.8
        assert p_stat["satisfaction_rate"] == 100.0

    def test_tc02_review_stats_product_without_reviews(self, app, client, admin_user):
        """TC-02: Sản phẩm chưa có đánh giá nào ➔ Trả về total_reviews = 0, an toàn không lỗi chia cho 0."""
        with app.app_context():
            p_empty = Product(
                name="Tủ Giày Thông Minh 3 Tầng Empty",
                slug="tu-giay-thong-minh-3-tang-empty",
                price=2400000.0,
                category="tu",
                stock=5,
                rating=5.0,
                rating_count=0,
                is_active=True,
            )
            db.session.add(p_empty)
            db.session.commit()
            product_id = p_empty.id

        response = client.get(
            "/api/v1/admin/reviews/stats",
            headers={"Authorization": f"Bearer {admin_user['token']}"},
        )
        assert response.status_code == 200
        products = response.get_json()["data"]["products"]

        p_stat = next((p for p in products if p["id"] == product_id), None)
        assert p_stat is not None
        assert p_stat["total_reviews"] == 0
        assert p_stat["approved_reviews"] == 0
        assert p_stat["satisfaction_rate"] == 0.0

    def test_tc03_regular_user_access_stats_forbidden(self, client, regular_user):
        """TC-03: Người dùng thường không có quyền truy cập API Thống kê Admin ➔ 403 FORBIDDEN."""
        response = client.get(
            "/api/v1/admin/reviews/stats",
            headers={"Authorization": f"Bearer {regular_user['token']}"},
        )
        assert response.status_code == 403
        assert response.get_json()["code"] == "FORBIDDEN"
