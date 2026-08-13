"""
tests/test_admin_reviews.py — Test cases cho Duyệt và ẩn bình luận đánh giá (NT-10-CN-001).

Story: NT-10-CN-001 — Duyệt và ẩn bình luận đánh giá
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: Admin duyệt bình luận hợp lệ (is_approved=True) ➔ 200 OK, bình luận hiển thị công khai trên trang sản phẩm
- TC-02: Admin ẩn bình luận vi phạm (is_approved=False) ➔ 200 OK, bình luận không còn hiển thị công khai trên trang sản phẩm
- TC-03: Duyệt/ẩn bình luận ID không tồn tại ➔ 404 REVIEW_NOT_FOUND
- TC-04: Người dùng thường không có quyền duyệt/ẩn bình luận Admin ➔ 403 FORBIDDEN
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
            full_name="Quản Trị Viên Reviews",
            email="adminreviews@example.com",
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
            full_name="Lê Văn C",
            email="userc@example.com",
            phone="0907776666",
            password_hash=bcrypt.generate_password_hash("UserPassword123@").decode("utf-8"),
            role="user",
            is_active=True,
        )
        db.session.add(user)
        db.session.commit()
        token = create_access_token(identity=str(user.id))
        return {"id": user.id, "email": user.email, "token": token}


@pytest.fixture
def sample_product_and_reviews(app, regular_user):
    """Tạo 1 sản phẩm và 2 bình luận (1 approved, 1 hidden)."""
    with app.app_context():
        product = Product(
            name="Sofa Da Bò Ý Cao Cấp Mod",
            slug="sofa-da-bo-y-cao-cap-mod",
            price=25000000.0,
            category="ghe",
            stock=10,
            rating=5.0,
            rating_count=1,
            is_active=True,
        )
        db.session.add(product)
        db.session.flush()

        # Review 1: Approved (5 sao)
        r1 = Review(
            user_id=regular_user["id"],
            product_id=product.id,
            rating=5,
            comment="Sản phẩm rất đẹp và sang trọng!",
            is_approved=True,
        )
        db.session.add(r1)
        db.session.commit()

        return {"product_id": product.id, "r1_id": r1.id}


class TestAdminReviewsNT10CN001:
    """Bộ kiểm thử cho chức năng Duyệt và Ẩn Bình Luận Đánh Giá (NT-10-CN-001)."""

    def test_tc01_admin_approve_hidden_review_success(self, app, client, admin_user, regular_user, sample_product_and_reviews):
        """TC-01: Admin duyệt bình luận đang bị ẩn ➔ Bình luận hiển thị công khai trên sản phẩm."""
        product_id = sample_product_and_reviews["product_id"]

        # 1. Tạo bình luận bị ẩn (is_approved = False)
        with app.app_context():
            u2 = User(
                full_name="Trần Thị D",
                email="userd@example.com",
                phone="0906665555",
                password_hash=bcrypt.generate_password_hash("Password123@").decode("utf-8"),
                role="user",
                is_active=True,
            )
            db.session.add(u2)
            db.session.flush()

            r2 = Review(
                user_id=u2.id,
                product_id=product_id,
                rating=4,
                comment="Bình luận chờ duyệt hợp lệ",
                is_approved=False,
            )
            db.session.add(r2)
            db.session.commit()
            r2_id = r2.id

        # 2. Trước khi duyệt ➔ Không xuất hiện trong danh sách reviews công khai của sản phẩm
        res_public_before = client.get(f"/api/v1/products/{product_id}/reviews").get_json()["data"]
        assert not any(r["id"] == r2_id for r in res_public_before["reviews"])

        # 3. Admin duyệt bình luận
        res_mod = client.put(
            f"/api/v1/admin/reviews/{r2_id}/moderate",
            json={"is_approved": True},
            headers={"Authorization": f"Bearer {admin_user['token']}"},
        )
        assert res_mod.status_code == 200
        assert res_mod.get_json()["data"]["is_approved"] is True

        # 4. Sau khi duyệt ➔ Xuất hiện công khai trên sản phẩm
        res_public_after = client.get(f"/api/v1/products/{product_id}/reviews").get_json()["data"]
        assert any(r["id"] == r2_id for r in res_public_after["reviews"])

    def test_tc02_admin_hide_violated_review_success(self, client, admin_user, sample_product_and_reviews):
        """TC-02: Admin ẩn bình luận vi phạm ➔ Bình luận bị ẩn khỏi trang sản phẩm công khai."""
        product_id = sample_product_and_reviews["product_id"]
        r1_id = sample_product_and_reviews["r1_id"]

        # 1. Ban đầu r1 đang hiển thị công khai
        res_before = client.get(f"/api/v1/products/{product_id}/reviews").get_json()["data"]
        assert any(r["id"] == r1_id for r in res_before["reviews"])

        # 2. Admin ẩn bình luận
        res_mod = client.put(
            f"/api/v1/admin/reviews/{r1_id}/moderate",
            json={"is_approved": False},
            headers={"Authorization": f"Bearer {admin_user['token']}"},
        )
        assert res_mod.status_code == 200
        assert res_mod.get_json()["data"]["is_approved"] is False

        # 3. Sau khi ẩn ➔ Không còn xuất hiện công khai
        res_after = client.get(f"/api/v1/products/{product_id}/reviews").get_json()["data"]
        assert not any(r["id"] == r1_id for r in res_after["reviews"])

    def test_tc03_moderate_non_existing_review_returns_404(self, client, admin_user):
        """TC-03: Duyệt/Ẩn bình luận không tồn tại (ID 99999) ➔ Trả về 404 REVIEW_NOT_FOUND."""
        res_mod = client.put(
            "/api/v1/admin/reviews/99999/moderate",
            json={"is_approved": True},
            headers={"Authorization": f"Bearer {admin_user['token']}"},
        )
        assert res_mod.status_code == 404
        assert res_mod.get_json()["code"] == "REVIEW_NOT_FOUND"

    def test_tc04_regular_user_access_admin_reviews_forbidden(self, client, regular_user):
        """TC-04: Người dùng thường không có quyền truy cập API Admin reviews ➔ Trả về 403 FORBIDDEN."""
        res_get = client.get(
            "/api/v1/admin/reviews",
            headers={"Authorization": f"Bearer {regular_user['token']}"},
        )
        assert res_get.status_code == 403
        assert res_get.get_json()["code"] == "FORBIDDEN"

        res_put = client.put(
            "/api/v1/admin/reviews/1/moderate",
            json={"is_approved": False},
            headers={"Authorization": f"Bearer {regular_user['token']}"},
        )
        assert res_put.status_code == 403
        assert res_put.get_json()["code"] == "FORBIDDEN"
