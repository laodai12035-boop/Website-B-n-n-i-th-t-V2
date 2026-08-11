"""
tests/test_admin_quick_search.py — Test cases cho chức năng Tìm kiếm nhanh trong trang Quản trị (Admin).

Story: NT-02-CN-005 — Tìm kiếm nhanh (Admin)
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: Admin tìm kiếm nhanh từ khóa sản phẩm / khách hàng -> 200 OK + Trả đúng kết quả theo nhóm
- Security: User thường gọi API quick-search -> 403 Forbidden
- Security: Request không có token -> 401 Unauthorized
"""

import pytest
from flask_jwt_extended import create_access_token
from app import create_app
from app.extensions import db, bcrypt
from app.models.user import User
from app.models.product import Product


# ============================================================
# Fixtures
# ============================================================

@pytest.fixture(scope="function")
def app():
    """Tạo Flask app với TestingConfig (SQLite in-memory)."""
    flask_app = create_app("testing")
    with flask_app.app_context():
        db.create_all()

        # Seed 1 Admin & 1 Customer
        pwd_hash = bcrypt.generate_password_hash("Password123!").decode("utf-8")
        admin = User(
            full_name="Quản Trị Viên",
            email="admin@example.com",
            phone="0901111111",
            password_hash=pwd_hash,
            role="admin",
            is_active=True,
        )
        customer = User(
            full_name="Khách Hàng Nguyễn Văn A",
            email="customer@example.com",
            phone="0902222222",
            password_hash=pwd_hash,
            role="user",
            is_active=True,
        )

        # Seed 2 Sản phẩm
        p1 = Product(
            name="Bộ Sofa Gỗ Óc Chó",
            slug="sofa-oc-cho",
            description="Bộ ghế sofa phòng khách cao cấp.",
            price=25000000.0,
            category="ghe",
            is_active=True,
        )
        p2 = Product(
            name="Bàn Làm Việc Scandinavian",
            slug="ban-lam-viec",
            description="Bàn học và làm việc mạ vàng.",
            price=2450000.0,
            category="ban",
            is_active=True,
        )

        db.session.add_all([admin, customer, p1, p2])
        db.session.commit()

        yield flask_app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Flask test client."""
    return app.test_client()


@pytest.fixture
def admin_headers(app):
    """Headers chứa JWT Token của Admin."""
    with app.app_context():
        token = create_access_token(identity="1", additional_claims={"role": "admin"})
        return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def user_headers(app):
    """Headers chứa JWT Token của Customer (role='user')."""
    with app.app_context():
        token = create_access_token(identity="2", additional_claims={"role": "user"})
        return {"Authorization": f"Bearer {token}"}


# ============================================================
# TC-01: Admin tìm kiếm nhanh thành công (Happy Path)
# ============================================================

class TestAdminQuickSearchSuccess:
    """TC-01: Kiểm tra Admin tìm kiếm nhanh trả về dữ liệu chuẩn."""

    def test_search_product_keyword_returns_200_and_products(self, client, admin_headers):
        """Admin tìm từ khóa 'sofa' trả về 200 OK và đúng sản phẩm Sofa trong nhóm products (TC-01)."""
        response = client.get("/api/v1/admin/quick-search?q=sofa", headers=admin_headers)
        assert response.status_code == 200

        body = response.get_json()
        assert body["status"] == "success"
        data = body["data"]

        assert "products" in data
        assert "customers" in data
        assert "orders" in data

        assert len(data["products"]) == 1
        assert data["products"][0]["name"] == "Bộ Sofa Gỗ Óc Chó"

    def test_search_customer_keyword_returns_200_and_customers(self, client, admin_headers):
        """Admin tìm từ khóa 'customer@example.com' trả về khách hàng tương ứng (TC-01)."""
        response = client.get("/api/v1/admin/quick-search?q=customer", headers=admin_headers)
        assert response.status_code == 200

        body = response.get_json()
        customers = body["data"]["customers"]
        assert len(customers) == 1
        assert customers[0]["email"] == "customer@example.com"

    def test_empty_query_returns_empty_groups(self, client, admin_headers):
        """Từ khóa rỗng trả về HTTP 200 OK với các mảng rỗng."""
        response = client.get("/api/v1/admin/quick-search?q=", headers=admin_headers)
        assert response.status_code == 200

        body = response.get_json()
        assert body["data"]["products"] == []
        assert body["data"]["customers"] == []


# ============================================================
# Security Tests: Kiểm tra phân quyền truy cập
# ============================================================

class TestAdminQuickSearchSecurity:
    """Kiểm tra phân quyền bảo mật API tìm kiếm Admin."""

    def test_customer_token_returns_403(self, client, user_headers):
        """Customer gọi API search Admin trả về 403 Forbidden."""
        response = client.get("/api/v1/admin/quick-search?q=sofa", headers=user_headers)
        assert response.status_code == 403

        body = response.get_json()
        assert body["status"] == "error"
        assert body["code"] == "FORBIDDEN"

    def test_unauthenticated_returns_401(self, client):
        """Không truyền Authorization token trả về 401 Unauthorized."""
        response = client.get("/api/v1/admin/quick-search?q=sofa")
        assert response.status_code == 401
