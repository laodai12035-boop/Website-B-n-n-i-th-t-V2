"""
tests/test_product_reviews.py — Test cases cho chức năng Viết và xem đánh giá sản phẩm (Tuân thủ QTN-06).

Story: NT-03-CN-004 — Viết đánh giá và bình luận sản phẩm
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: Đơn hàng đã giao thành công -> Đánh giá 1-5 sao thành công (201 Created + cập nhật sao trung bình)
- TC-02: Sản phẩm chưa thuộc đơn hàng đã giao thành công (QTN-06) -> 403 Forbidden (REVIEW_NOT_ALLOWED)
- Extra: GET /api/v1/products/<id>/reviews lấy danh sách đánh giá & thống kê sao
- Extra: Số sao ngoài khoảng 1-5 sao -> 400 Bad Request (INVALID_RATING)
"""

import pytest
from flask_jwt_extended import create_access_token
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.product import Product
from app.models.order import Order, OrderItem
from app.models.review import Review


# ============================================================
# Fixtures
# ============================================================

@pytest.fixture(scope="function")
def app():
    """Tạo Flask app với TestingConfig (SQLite in-memory)."""
    flask_app = create_app("testing")
    with flask_app.app_context():
        db.create_all()

        # User 1: Khách hàng mua thành công sản phẩm 1
        user1 = User(
            id=1,
            email="buyer@example.com",
            full_name="Người Mua Hàng",
            phone="0901111111",
            password_hash="some_hashed_password",
            role="user",
        )

        # User 2: Khách hàng chưa từng mua hàng
        user2 = User(
            id=2,
            email="nonbuyer@example.com",
            full_name="Người Chưa Mua",
            phone="0902222222",
            password_hash="some_hashed_password",
            role="user",
        )

        # Product 1
        p1 = Product(
            id=1,
            name="Bộ Sofa Gỗ Óc Chó",
            slug="sofa-oc-cho",
            price=28500000.0,
            category="ghe",
            rating=5.0,
            rating_count=0,
            is_active=True,
        )

        db.session.add_all([user1, user2, p1])
        db.session.commit()

        # Order 1 (Delivered order for user 1 containing product 1)
        order_delivered = Order(id=1, user_id=1, status="delivered", total_amount=28500000.0)
        db.session.add(order_delivered)
        db.session.commit()

        item1 = OrderItem(id=1, order_id=1, product_id=1, quantity=1, price=28500000.0)
        db.session.add(item1)

        # Order 2 (Pending order for user 2 containing product 1)
        order_pending = Order(id=2, user_id=2, status="processing", total_amount=28500000.0)
        db.session.add(order_pending)
        db.session.commit()

        item2 = OrderItem(id=2, order_id=2, product_id=1, quantity=1, price=28500000.0)
        db.session.add(item2)
        db.session.commit()

        yield flask_app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Flask test client."""
    return app.test_client()


@pytest.fixture
def buyer_headers(app):
    """Token cho User 1 (Đã mua & giao thành công)."""
    with app.app_context():
        token = create_access_token(identity="1")
        return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def nonbuyer_headers(app):
    """Token cho User 2 (Đơn hàng đang xử lý processing, chưa delivered)."""
    with app.app_context():
        token = create_access_token(identity="2")
        return {"Authorization": f"Bearer {token}"}


# ============================================================
# TC-01: Luồng thành công (Quy tắc QTN-06 Thỏa mãn)
# ============================================================

class TestProductReviewSuccess:
    """TC-01: Kiểm tra viết đánh giá khi đơn hàng đã giao thành công."""

    def test_create_review_success_for_delivered_order(self, client, buyer_headers):
        """Khách hàng đã giao sản phẩm thành công gửi đánh giá 5 sao -> 201 Created (TC-01)."""
        response = client.post(
            "/api/v1/products/1/reviews",
            json={"rating": 5, "comment": "Bộ sofa rất xịn và êm ái!"},
            headers=buyer_headers,
        )
        assert response.status_code == 201

        body = response.get_json()
        assert body["status"] == "success"
        assert body["data"]["review"]["rating"] == 5
        assert body["data"]["review"]["comment"] == "Bộ sofa rất xịn và êm ái!"
        assert body["data"]["new_product_rating"] == 5.0

    def test_get_product_reviews_returns_list_and_summary(self, client, buyer_headers):
        """Lấy danh sách đánh giá sản phẩm sau khi đã gửi đánh giá (TC-01 NT-03-CN-005)."""
        # Create review first
        client.post(
            "/api/v1/products/1/reviews",
            json={"rating": 5, "comment": "Sản phẩm chất lượng!"},
            headers=buyer_headers,
        )

        response = client.get("/api/v1/products/1/reviews", headers=buyer_headers)
        assert response.status_code == 200

        body = response.get_json()
        data = body["data"]
        assert len(data["reviews"]) == 1
        assert data["summary"]["average_rating"] == 5.0
        assert data["summary"]["total_reviews"] == 1
        assert data["summary"]["rating_breakdown"]["5"] == 1


# ============================================================
# TC-02: Vi phạm quy tắc QTN-06 & Invalid Inputs
# ============================================================

class TestProductReviewEligibility:
    """TC-02: Kiểm tra từ chối đánh giá khi vi phạm QTN-06."""

    def test_create_review_rejected_for_non_delivered_order(self, client, nonbuyer_headers):
        """Đơn hàng đang xử lý (processing - chưa delivered) cố đánh giá -> 403 Forbidden (TC-02)."""
        response = client.post(
            "/api/v1/products/1/reviews",
            json={"rating": 4, "comment": "Cố đánh giá khi chưa nhận hàng"},
            headers=nonbuyer_headers,
        )
        assert response.status_code == 403

        body = response.get_json()
        assert body["status"] == "error"
        assert body["code"] == "REVIEW_NOT_ALLOWED"

    def test_create_review_unauthenticated_returns_401(self, client):
        """Chưa đăng nhập gửi đánh giá -> 401 Unauthorized."""
        response = client.post(
            "/api/v1/products/1/reviews",
            json={"rating": 5, "comment": "Chưa đăng nhập"},
        )
        assert response.status_code == 401

    def test_create_review_invalid_rating_returns_400(self, client, buyer_headers):
        """Số sao là 0 hoặc > 5 -> 400 Bad Request (INVALID_RATING)."""
        response = client.post(
            "/api/v1/products/1/reviews",
            json={"rating": 6, "comment": "Quá số sao"},
            headers=buyer_headers,
        )
        assert response.status_code == 400
        assert response.get_json()["code"] == "INVALID_RATING"
