"""
tests/test_combo.py — Test cases cho chức năng Đặt hàng Combo bộ sản phẩm (NT-05-CN-005).

Story: NT-05-CN-005 — Đặt hàng combo hoặc bộ sản phẩm
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: Thêm combo thành công khi tất cả sản phẩm thành phần đủ tồn kho → 200 OK, các sản phẩm được thêm vào giỏ.
- TC-02: Thêm combo thất bại khi 1 sản phẩm thành phần hết hàng (stock=0 hoặc stock < qty) → 400 COMBO_OUT_OF_STOCK.
- TC-03: Thêm combo không tồn tại → 404 COMBO_NOT_FOUND.
- TC-04: Thêm combo đã ngưng hoạt động (is_active=False) → 400 COMBO_INACTIVE.
- TC-05: Khách hàng chưa đăng nhập thêm combo vào giỏ → 401 Unauthorized.
- TC-06: GET /api/v1/combos/by-product/<id> trả về danh sách combo có chứa sản phẩm đó.
- TC-07: GET /api/v1/combos trả về danh sách các combo đang active.
- TC-08: GET /api/v1/combos/<id> trả về thông tin chi tiết combo, tổng giá gốc, tổng giá combo và tiết kiệm.
- TC-09: Thêm cùng 1 combo 2 lần → cộng dồn số lượng sản phẩm trong giỏ hàng (không duplicate).
"""

import pytest
from flask_jwt_extended import create_access_token
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.product import Product
from app.models.combo import Combo, ComboItem
from app.models.cart_item import CartItem


# ============================================================
# Fixtures
# ============================================================

@pytest.fixture(scope="function")
def app():
    """Tạo Flask app với TestingConfig (SQLite in-memory)."""
    flask_app = create_app("testing")
    with flask_app.app_context():
        db.create_all()

        customer = User(
            id=1,
            email="customer@example.com",
            full_name="Khách Hàng Test Combo",
            phone="0901234567",
            password_hash="pwd",
            role="user",
        )

        p1 = Product(
            id=1,
            name="Bộ Sofa Gỗ Óc Chó",
            slug="sofa-oc-cho",
            price=28500000.0,
            discount_price=25000000.0,
            stock=5,
            category="ghe",
            is_active=True,
        )

        p2 = Product(
            id=2,
            name="Kệ Tivi Gỗ Tự Nhiên",
            slug="ke-tivi",
            price=6800000.0,
            stock=10,
            category="ke",
            is_active=True,
        )

        p3_out_of_stock = Product(
            id=3,
            name="Tủ Quần Áo Đã Hết Hàng",
            slug="tu-quan-ao-het-hang",
            price=14500000.0,
            stock=0,  # Hết hàng
            category="tu",
            is_active=True,
        )

        db.session.add_all([customer, p1, p2, p3_out_of_stock])
        db.session.commit()

        # Combo 1: Active, 15% discount, gồm p1 (qty=1) và p2 (qty=1)
        combo1 = Combo(
            id=1,
            name="Bộ Trọn Gói Phòng Khách Sang Trọng",
            description="Combo gồm Sofa và Kệ TV",
            discount_percent=15.0,
            is_active=True,
        )

        # Combo 2: Out of stock combo (chứa p3 có stock=0)
        combo2_outofstock = Combo(
            id=2,
            name="Bộ Combo Phòng Nối Hết Hàng",
            description="Combo có sản phẩm hết hàng",
            discount_percent=20.0,
            is_active=True,
        )

        # Combo 3: Inactive combo
        combo3_inactive = Combo(
            id=3,
            name="Bộ Combo Đã Khóa",
            description="Combo bị tắt bởi Admin",
            discount_percent=10.0,
            is_active=False,
        )

        db.session.add_all([combo1, combo2_outofstock, combo3_inactive])
        db.session.commit()

        # Add combo items
        ci1 = ComboItem(id=1, combo_id=1, product_id=1, quantity=1)
        ci2 = ComboItem(id=2, combo_id=1, product_id=2, quantity=1)

        ci3 = ComboItem(id=3, combo_id=2, product_id=1, quantity=1)
        ci4 = ComboItem(id=4, combo_id=2, product_id=3, quantity=1)  # p3 hết hàng

        ci5 = ComboItem(id=5, combo_id=3, product_id=2, quantity=1)

        db.session.add_all([ci1, ci2, ci3, ci4, ci5])
        db.session.commit()

        yield flask_app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def customer_token(app):
    with app.app_context():
        return create_access_token(identity="1")


@pytest.fixture
def auth_headers(customer_token):
    return {"Authorization": f"Bearer {customer_token}"}


# ============================================================
# TC-01: Thêm combo thành công khi tất cả sản phẩm đủ tồn kho
# ============================================================

def test_tc01_add_combo_to_cart_success(client, auth_headers, app):
    r = client.post("/api/v1/combos/1/add-to-cart", headers=auth_headers)
    assert r.status_code == 200

    body = r.get_json()
    assert body["status"] == "success"
    data = body["data"]
    assert data["combo_id"] == 1
    assert data["discount_percent"] == 15.0
    assert len(data["added_items"]) == 2

    # Verify database cart_items
    with app.app_context():
        cart_items = db.session.query(CartItem).filter_by(user_id=1).all()
        assert len(cart_items) == 2
        product_ids = [item.product_id for item in cart_items]
        assert 1 in product_ids
        assert 2 in product_ids


# ============================================================
# TC-02: Thêm combo thất bại khi 1 sản phẩm hết hàng
# ============================================================

def test_tc02_add_combo_out_of_stock_rejected(client, auth_headers):
    # Combo 2 có chứa p3 có stock=0
    r = client.post("/api/v1/combos/2/add-to-cart", headers=auth_headers)
    assert r.status_code == 400

    body = r.get_json()
    assert body["status"] == "error"
    assert body["code"] == "COMBO_OUT_OF_STOCK"


# ============================================================
# TC-03: Thêm combo không tồn tại -> 404
# ============================================================

def test_tc03_add_non_existing_combo_returns_404(client, auth_headers):
    r = client.post("/api/v1/combos/9999/add-to-cart", headers=auth_headers)
    assert r.status_code == 404
    assert r.get_json()["code"] == "COMBO_NOT_FOUND"


# ============================================================
# TC-04: Thêm combo inactive -> 400
# ============================================================

def test_tc04_add_inactive_combo_rejected(client, auth_headers):
    # Combo 3 is_active=False
    r = client.post("/api/v1/combos/3/add-to-cart", headers=auth_headers)
    assert r.status_code == 400
    assert r.get_json()["code"] == "COMBO_INACTIVE"


# ============================================================
# TC-05: Khách chưa đăng nhập -> 401
# ============================================================

def test_tc05_unauthenticated_cannot_add_combo(client):
    r = client.post("/api/v1/combos/1/add-to-cart")
    assert r.status_code == 401


# ============================================================
# TC-06: GET /api/v1/combos/by-product/<id>
# ============================================================

def test_tc06_get_combos_by_product_id(client):
    # Product 1 nằm trong Combo 1 (active) và Combo 2 (active)
    r = client.get("/api/v1/combos/by-product/1")
    assert r.status_code == 200

    body = r.get_json()
    assert body["status"] == "success"
    combos = body["data"]
    assert len(combos) >= 1
    combo_ids = [c["id"] for c in combos]
    assert 1 in combo_ids


# ============================================================
# TC-07: GET /api/v1/combos (List active combos)
# ============================================================

def test_tc07_get_active_combos_list(client):
    r = client.get("/api/v1/combos")
    assert r.status_code == 200

    body = r.get_json()
    combos = body["data"]
    # Only combo 1 and combo 2 are active (combo 3 is inactive)
    assert len(combos) == 2
    for c in combos:
        assert c["is_active"] is True


# ============================================================
# TC-08: GET /api/v1/combos/<id> (Detail & Savings calculation)
# ============================================================

def test_tc08_get_combo_detail_calculations(client):
    r = client.get("/api/v1/combos/1")
    assert r.status_code == 200

    data = r.get_json()["data"]
    assert data["id"] == 1
    assert data["discount_percent"] == 15.0
    # Original total = p1 (25,000,000) + p2 (6,800,000) = 31,800,000
    assert data["original_total"] == 31_800_000.0
    # Savings should be > 0
    assert data["savings"] > 0
    assert data["combo_total"] < data["original_total"]


# ============================================================
# TC-09: Thêm cùng 1 combo 2 lần -> cộng dồn quantity
# ============================================================

def test_tc09_add_combo_twice_accumulates_quantity(client, auth_headers, app):
    # Lần 1
    client.post("/api/v1/combos/1/add-to-cart", headers=auth_headers)
    # Lần 2
    client.post("/api/v1/combos/1/add-to-cart", headers=auth_headers)

    with app.app_context():
        cart_items = db.session.query(CartItem).filter_by(user_id=1).all()
        assert len(cart_items) == 2
        for item in cart_items:
            assert item.quantity == 2  # Product 1 & Product 2 quantity accumulated from 1 to 2
