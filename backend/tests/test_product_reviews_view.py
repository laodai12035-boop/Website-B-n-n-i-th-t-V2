"""
tests/test_product_reviews_view.py — Test cases cho chức năng Xem đánh giá và lọc theo số sao.

Story: NT-03-CN-005 — Xem đánh giá của sản phẩm
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: Sản phẩm có nhận xét -> Lấy danh sách nhận xét & điểm sao trung bình tính đúng (200 OK)
- TC-02: Lọc nhận xét theo số sao (param ?star=5 / ?star=4) -> Trả về đúng các nhận xét có số sao tương ứng
- TC-03: Sản phẩm chưa có nhận xét nào -> 200 OK + reviews: [], average_rating: 5.0, total_reviews: 0
"""

import pytest
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

        user1 = User(id=1, email="user1@example.com", full_name="User 1", password_hash="pwd")
        user2 = User(id=2, email="user2@example.com", full_name="User 2", password_hash="pwd")
        user3 = User(id=3, email="user3@example.com", full_name="User 3", password_hash="pwd")

        p1 = Product(id=1, name="Bộ Sofa Gỗ Óc Chó", slug="sofa-oc-cho", price=28500000.0, category="ghe", is_active=True)
        p2_empty = Product(id=2, name="Kệ Sách Độc Bản", slug="ke-sach", price=4500000.0, category="ke", is_active=True)

        db.session.add_all([user1, user2, user3, p1, p2_empty])
        db.session.commit()

        # Seed reviews for product 1: 2 reviews with 5 stars, 1 review with 4 stars -> Avg rating = 4.7
        r1 = Review(id=1, user_id=1, product_id=1, rating=5, comment="Rất tuyệt vời!", is_approved=True)
        r2 = Review(id=2, user_id=2, product_id=1, rating=5, comment="Chất lượng 5 sao", is_approved=True)
        r3 = Review(id=3, user_id=3, product_id=1, rating=4, comment="Hài lòng với sản phẩm", is_approved=True)

        db.session.add_all([r1, r2, r3])
        db.session.commit()

        yield flask_app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Flask test client."""
    return app.test_client()


# ============================================================
# TC-01, TC-02 & TC-03: Tests
# ============================================================

class TestProductReviewsView:
    """Kiểm thử tính năng xem và lọc đánh giá sản phẩm."""

    def test_get_reviews_returns_200_and_summary_breakdown(self, client):
        """Lấy danh sách nhận xét cho sản phẩm ID=1 -> 200 OK + đúng điểm trung bình (TC-01)."""
        response = client.get("/api/v1/products/1/reviews")
        assert response.status_code == 200

        body = response.get_json()
        assert body["status"] == "success"
        data = body["data"]

        assert len(data["reviews"]) == 3
        summary = data["summary"]
        assert summary["total_reviews"] == 3
        assert summary["average_rating"] == 4.7
        assert summary["rating_breakdown"]["5"] == 2
        assert summary["rating_breakdown"]["4"] == 1
        assert summary["rating_breakdown"]["3"] == 0

    def test_filter_reviews_by_5_stars(self, client):
        """Lọc nhận xét param ?star=5 -> Chỉ trả về các nhận xét 5 sao (TC-02)."""
        response = client.get("/api/v1/products/1/reviews?star=5")
        assert response.status_code == 200

        body = response.get_json()
        data = body["data"]

        assert len(data["reviews"]) == 2
        assert all(r["rating"] == 5 for r in data["reviews"])
        # Stats breakdown should still reflect total product reviews
        assert data["summary"]["total_reviews"] == 3

    def test_filter_reviews_by_4_stars(self, client):
        """Lọc nhận xét param ?star=4 -> Chỉ trả về các nhận xét 4 sao (TC-02)."""
        response = client.get("/api/v1/products/1/reviews?star=4")
        assert response.status_code == 200

        body = response.get_json()
        data = body["data"]

        assert len(data["reviews"]) == 1
        assert data["reviews"][0]["rating"] == 4

    def test_filter_reviews_by_1_star_returns_empty_matching_list(self, client):
        """Lọc nhận xét param ?star=1 cho sản phẩm không có 1 sao -> Trả về reviews: [] (TC-02)."""
        response = client.get("/api/v1/products/1/reviews?star=1")
        assert response.status_code == 200

        body = response.get_json()
        assert body["data"]["reviews"] == []

    def test_product_with_no_reviews_returns_zero_count(self, client):
        """Sản phẩm ID=2 chưa có nhận xét nào -> 200 OK + reviews: [] (TC-03)."""
        response = client.get("/api/v1/products/2/reviews")
        assert response.status_code == 200

        body = response.get_json()
        data = body["data"]

        assert data["reviews"] == []
        assert data["summary"]["total_reviews"] == 0
        assert data["summary"]["average_rating"] == 5.0
