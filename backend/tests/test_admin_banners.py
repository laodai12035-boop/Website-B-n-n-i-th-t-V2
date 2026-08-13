"""
tests/test_admin_banners.py — Test cases cho Thêm, sửa, xóa banner trang chủ (NT-11-CN-001).

Story: NT-11-CN-001 — Thêm, sửa, xóa banner trang chủ
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: Admin tạo banner hợp lệ ➔ 201 Created (Banner xuất hiện trên danh sách Admin và Public API)
- TC-02: Chưa chọn ảnh banner (image_url rỗng) ➔ 400 Bad Request (MISSING_IMAGE_URL)
- TC-03: Sửa và xóa banner ➔ 200 OK
- TC-04: Người dùng thường không có quyền truy cập API Admin Banners ➔ 403 FORBIDDEN
"""

import pytest
from datetime import datetime, timedelta
from flask_jwt_extended import create_access_token
from app import create_app
from app.extensions import db, bcrypt
from app.models.user import User
from app.models.banner import Banner


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
            full_name="Quản Trị Viên Banners",
            email="adminbanner@example.com",
            phone="0901116666",
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
            full_name="Trần Văn F",
            email="userf@example.com",
            phone="0904443333",
            password_hash=bcrypt.generate_password_hash("UserPassword123@").decode("utf-8"),
            role="user",
            is_active=True,
        )
        db.session.add(user)
        db.session.commit()
        token = create_access_token(identity=str(user.id))
        return {"id": user.id, "email": user.email, "token": token}


class TestAdminBannersNT11CN001:
    """Bộ kiểm thử cho chức năng Thêm, Sửa, Xóa Banner Trang Chủ (NT-11-CN-001)."""

    def test_tc01_admin_create_banner_success(self, client, admin_user):
        """TC-01: Admin tải ảnh, nhập tiêu đề, liên kết và thời gian hiển thị hợp lệ ➔ 201 Created."""
        payload = {
          "title": "Bộ Sưu Tập Sofa Phòng Khách 2026",
          "subtitle": "Ưu đãi giảm giá 15% mùa hè",
          "image_url": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
          "link_url": "/products?category=sofa",
          "display_order": 1,
          "is_active": True,
        }

        # 1. Gọi API POST /api/v1/admin/banners
        res_create = client.post(
            "/api/v1/admin/banners",
            json=payload,
            headers={"Authorization": f"Bearer {admin_user['token']}"},
        )
        assert res_create.status_code == 201
        created_banner = res_create.get_json()["data"]
        assert created_banner["title"] == "Bộ Sưu Tập Sofa Phòng Khách 2026"
        assert created_banner["image_url"] == "https://images.unsplash.com/photo-1555041469-a586c61ea9bc"
        assert created_banner["is_active"] is True

        # 2. Kiểm tra Public API GET /api/v1/banners
        res_public = client.get("/api/v1/banners")
        assert res_public.status_code == 200
        public_items = res_public.get_json()["data"]
        assert any(b["id"] == created_banner["id"] for b in public_items)

    def test_tc02_create_banner_missing_image_url_rejected(self, client, admin_user):
        """TC-02: Chưa chọn/nhập ảnh banner (image_url rỗng) ➔ Trả về 400 Bad Request MISSING_IMAGE_URL."""
        payload = {
            "title": "Banner Không Có Ảnh",
            "image_url": "",  # Thiếu ảnh banner
            "link_url": "/products",
        }

        res_create = client.post(
            "/api/v1/admin/banners",
            json=payload,
            headers={"Authorization": f"Bearer {admin_user['token']}"},
        )
        assert res_create.status_code == 400
        assert res_create.get_json()["code"] == "MISSING_IMAGE_URL"

    def test_tc03_admin_update_and_delete_banner_success(self, app, client, admin_user):
        """TC-03: Admin chỉnh sửa tiêu đề banner và xóa banner ➔ 200 OK."""
        # 1. Tạo banner trong DB
        with app.app_context():
            b = Banner(
                title="Banner Ban Đầu",
                image_url="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace",
                link_url="/old-link",
                display_order=5,
                is_active=True,
            )
            db.session.add(b)
            db.session.commit()
            banner_id = b.id

        # 2. Cập nhật banner
        res_update = client.put(
            f"/api/v1/admin/banners/{banner_id}",
            json={
                "title": "Banner Đã Được Chỉnh Sửa",
                "link_url": "/new-link",
                "display_order": 1,
            },
            headers={"Authorization": f"Bearer {admin_user['token']}"},
        )
        assert res_update.status_code == 200
        updated_data = res_update.get_json()["data"]
        assert updated_data["title"] == "Banner Đã Được Chỉnh Sửa"
        assert updated_data["link_url"] == "/new-link"
        assert updated_data["display_order"] == 1

        # 3. Xóa banner
        res_delete = client.delete(
            f"/api/v1/admin/banners/{banner_id}",
            headers={"Authorization": f"Bearer {admin_user['token']}"},
        )
        assert res_delete.status_code == 200
        assert res_delete.get_json()["data"]["banner_id"] == banner_id

        # 4. Kiểm tra lại trong DB ➔ Banner đã xóa
        with app.app_context():
            deleted_b = db.session.query(Banner).filter(Banner.id == banner_id).first()
            assert deleted_b is None

    def test_tc04_regular_user_access_admin_banners_forbidden(self, client, regular_user):
        """TC-04: Khách hàng thường không có quyền truy cập API Admin Banners ➔ Trả về 403 FORBIDDEN."""
        res_get = client.get(
            "/api/v1/admin/banners",
            headers={"Authorization": f"Bearer {regular_user['token']}"},
        )
        assert res_get.status_code == 403
        assert res_get.get_json()["code"] == "FORBIDDEN"

        res_post = client.post(
            "/api/v1/admin/banners",
            json={"title": "Hack Banner", "image_url": "http://evil.com/img.jpg"},
            headers={"Authorization": f"Bearer {regular_user['token']}"},
        )
        assert res_post.status_code == 403
        assert res_post.get_json()["code"] == "FORBIDDEN"
