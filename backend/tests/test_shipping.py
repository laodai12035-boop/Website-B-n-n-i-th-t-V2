"""
tests/test_shipping.py — Test cases cho chức năng Tính phí vận chuyển (QTN-07).

Story: NT-05-CN-004 — Tính phí vận chuyển theo kích thước và trọng lượng
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: Sản phẩm có đủ weight_kg + dimensions, địa chỉ HCM → 200 OK, phí đúng bảng nội thành
- TC-02: Sản phẩm thiếu weight_kg → phí mặc định 120,000 + missing_data_warning=True
- TC-03: Địa chỉ "TP.HCM" → zone = inner_city
- TC-04: Địa chỉ "Đà Nẵng" → zone = province
- TC-05: Dimensional weight > actual weight → sử dụng dimensional weight
- TC-06: Giỏ hàng rỗng → 400 CART_EMPTY
- TC-07: Thiếu shipping_address → 400 MISSING_SHIPPING_ADDRESS
- TC-08: Unauthenticated → 401
- TC-09: Sản phẩm cồng kềnh > 50kg → phí mức E
- TC-10: Hỗn hợp (1 sản phẩm có data, 1 thiếu) → warning=True, phí có tính cả data hợp lệ
"""

import pytest
from flask_jwt_extended import create_access_token
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.product import Product
from app.models.cart_item import CartItem
from app.services.shipping_service import ShippingService


# ============================================================
# Fixtures
# ============================================================

@pytest.fixture(scope="function")
def app():
    flask_app = create_app("testing")
    with flask_app.app_context():
        db.create_all()

        customer = User(
            id=1, email="customer@test.com", full_name="Khách Hàng",
            phone="0901234567", password_hash="pwd", role="user",
        )

        # Sản phẩm có đủ weight_kg + dimensions (30kg thực, dims nhỏ → dùng actual)
        product_full = Product(
            id=1, name="Bàn Ăn Gỗ Sồi", slug="ban-an-go-soi",
            price=12500000.0, stock=10, category="ban", is_active=True,
            dimensions="200x90x78", weight_kg=30.0,  # actual 30kg, dim_weight = (200*90*78)/5000=280.8 → dùng 280.8
        )

        # Sản phẩm thiếu weight_kg
        product_no_weight = Product(
            id=2, name="Đèn Sàn Trang Trí", slug="den-san",
            price=1200000.0, stock=20, category="trang-tri", is_active=True,
            dimensions="30x30x150", weight_kg=None,
        )

        # Sản phẩm cồng kềnh > 50kg
        product_heavy = Product(
            id=3, name="Tủ Quần Áo", slug="tu-quan-ao",
            price=14500000.0, stock=5, category="tu", is_active=True,
            dimensions="200x60x220", weight_kg=45.0,  # dim_weight=(200*60*220)/5000=528 → dùng 528
        )

        # Sản phẩm dimensional weight nhỏ hơn actual weight
        product_dense = Product(
            id=4, name="Đá Cẩm Thạch", slug="da-cam-thach",
            price=5000000.0, stock=5, category="trang-tri", is_active=True,
            dimensions="30x30x10", weight_kg=25.0,  # dim_weight = (30*30*10)/5000=1.8 < 25 → dùng actual 25
        )

        db.session.add_all([customer, product_full, product_no_weight, product_heavy, product_dense])
        db.session.commit()

        yield flask_app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def token(app):
    with app.app_context():
        return create_access_token(identity="1")


@pytest.fixture
def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


def seed_cart(app, product_id=1, quantity=1):
    """Seed cart item cho user_id=1."""
    with app.app_context():
        existing = db.session.query(CartItem).filter_by(user_id=1, product_id=product_id).first()
        if existing:
            existing.quantity = quantity
        else:
            db.session.add(CartItem(user_id=1, product_id=product_id, quantity=quantity))
        db.session.commit()


def clear_cart(app):
    with app.app_context():
        db.session.query(CartItem).filter_by(user_id=1).delete()
        db.session.commit()


# ============================================================
# TC-01: Sản phẩm đủ data, địa chỉ HCM → phí đúng nội thành
# ============================================================

def test_tc01_full_data_hcm_returns_correct_inner_city_fee(client, auth_header, app):
    """
    Product 1: weight_kg=30, dims=200x90x78 → dim_weight=280.8 → charged=280.8 (>50kg → mức E)
    Zone: inner_city → fee=200,000
    """
    seed_cart(app, product_id=1, quantity=1)

    r = client.post(
        "/api/v1/shipping/calculate",
        json={"shipping_address": "123 Nguyễn Huệ, TP.HCM"},
        headers=auth_header,
    )
    assert r.status_code == 200
    data = r.get_json()["data"]
    assert data["zone"] == "inner_city"
    assert data["missing_data_warning"] is False
    assert data["fee"] == 200_000   # >50kg → Mức E nội thành
    assert data["total_weight"] > 50  # dim weight 280.8


# ============================================================
# TC-02: Sản phẩm thiếu weight_kg → phí mặc định + warning
# ============================================================

def test_tc02_missing_weight_returns_default_fee_and_warning(client, auth_header, app):
    seed_cart(app, product_id=2, quantity=1)

    r = client.post(
        "/api/v1/shipping/calculate",
        json={"shipping_address": "15 Lê Văn Lương, Đà Nẵng"},
        headers=auth_header,
    )
    assert r.status_code == 200
    data = r.get_json()["data"]
    assert data["missing_data_warning"] is True
    assert data["fee"] == 120_000  # DEFAULT_SHIPPING_FEE


# ============================================================
# TC-03: Địa chỉ TP.HCM → inner_city
# ============================================================

@pytest.mark.parametrize("address", [
    "123 Nguyễn Huệ, TP.HCM",
    "456 Lê Văn Sỹ, Tp Hồ Chí Minh",
    "789 Q.1, HCM",
    "101 Trần Hưng Đạo, Hà Nội",
])
def test_tc03_inner_city_zone_detection(address, app):
    """ShippingService.classify_zone phải trả về inner_city cho địa chỉ HCM/HN."""
    with app.app_context():
        assert ShippingService.classify_zone(address) == "inner_city"


# ============================================================
# TC-04: Địa chỉ tỉnh khác → province
# ============================================================

@pytest.mark.parametrize("address", [
    "15 Lê Duẩn, Đà Nẵng",
    "201 Hùng Vương, Huế",
    "99 Lê Hồng Phong, Bình Dương",
    "12 Trần Phú, Cần Thơ",
])
def test_tc04_province_zone_detection(address, app):
    with app.app_context():
        assert ShippingService.classify_zone(address) == "province"


# ============================================================
# TC-05: Dimensional weight > actual weight → dùng dim weight
# ============================================================

def test_tc05_dimensional_weight_larger_than_actual(client, auth_header, app):
    """
    Product 1: weight=30, dims=200x90x78 → dim_weight=280.8 > 30 → charged=280.8
    """
    seed_cart(app, product_id=1, quantity=1)

    r = client.post(
        "/api/v1/shipping/calculate",
        json={"shipping_address": "99 Lê Văn Sỹ, Đà Nẵng"},
        headers=auth_header,
    )
    assert r.status_code == 200
    data = r.get_json()["data"]
    assert data["total_weight"] > 30   # Phải dùng dim_weight (280.8) không phải actual (30)
    assert data["breakdown"][0]["charged_weight_kg"] > 30


# ============================================================
# TC-05b: Actual weight > dimensional weight → dùng actual weight
# ============================================================

def test_tc05b_actual_weight_larger_than_dimensional(client, auth_header, app):
    """
    Product 4: dims=30x30x10 → dim_weight=1.8 < weight=25 → charged=25
    """
    seed_cart(app, product_id=4, quantity=1)

    r = client.post(
        "/api/v1/shipping/calculate",
        json={"shipping_address": "99 Phổ Quang, Hà Nội"},
        headers=auth_header,
    )
    assert r.status_code == 200
    data = r.get_json()["data"]
    assert data["total_weight"] == 25.0  # Actual weight thắng
    assert data["zone"] == "inner_city"


# ============================================================
# TC-06: Giỏ hàng rỗng → 400 CART_EMPTY
# ============================================================

def test_tc06_empty_cart_returns_400(client, auth_header, app):
    clear_cart(app)
    r = client.post(
        "/api/v1/shipping/calculate",
        json={"shipping_address": "123 Nguyễn Huệ, TP.HCM"},
        headers=auth_header,
    )
    assert r.status_code == 400
    assert r.get_json()["code"] == "CART_EMPTY"


# ============================================================
# TC-07: Thiếu shipping_address → 400 MISSING_SHIPPING_ADDRESS
# ============================================================

def test_tc07_missing_address_returns_400(client, auth_header, app):
    seed_cart(app, product_id=1, quantity=1)
    r = client.post(
        "/api/v1/shipping/calculate",
        json={},
        headers=auth_header,
    )
    assert r.status_code == 400
    assert r.get_json()["code"] == "MISSING_SHIPPING_ADDRESS"


# ============================================================
# TC-08: Unauthenticated → 401
# ============================================================

def test_tc08_unauthenticated_returns_401(client, app):
    seed_cart(app, product_id=1, quantity=1)
    r = client.post(
        "/api/v1/shipping/calculate",
        json={"shipping_address": "123 Nguyễn Huệ, TP.HCM"},
    )
    assert r.status_code == 401


# ============================================================
# TC-09: Sản phẩm cồng kềnh (dim_weight > 50kg) → mức E
# ============================================================

def test_tc09_bulky_product_applies_tier_e(client, auth_header, app):
    """
    Product 3: dims=200x60x220 → dim_weight=(200*60*220)/5000=528 → > 50kg → Mức E
    Province: 350,000
    """
    seed_cart(app, product_id=3, quantity=1)

    r = client.post(
        "/api/v1/shipping/calculate",
        json={"shipping_address": "55 Lê Lợi, Đà Nẵng"},
        headers=auth_header,
    )
    assert r.status_code == 200
    data = r.get_json()["data"]
    assert data["zone"] == "province"
    assert data["fee"] == 350_000   # Mức E tỉnh
    assert data["total_weight"] > 50


# ============================================================
# TC-10: Hỗn hợp products (1 có data, 1 thiếu) → warning=True
# ============================================================

def test_tc10_mixed_products_warning_true(client, auth_header, app):
    clear_cart(app)
    seed_cart(app, product_id=1, quantity=1)  # Có đủ data
    seed_cart(app, product_id=2, quantity=1)  # Thiếu weight_kg

    r = client.post(
        "/api/v1/shipping/calculate",
        json={"shipping_address": "123 Nguyễn Huệ, TP.HCM"},
        headers=auth_header,
    )
    assert r.status_code == 200
    data = r.get_json()["data"]
    # Phải có warning vì có 1 sản phẩm thiếu data
    assert data["missing_data_warning"] is True
    # total_weight vẫn tính được từ product có data
    assert data["total_weight"] > 0
    assert len(data["breakdown"]) == 2


# ============================================================
# Unit Tests: ShippingService helper methods
# ============================================================

class TestShippingServiceHelpers:
    def test_parse_dimensions_standard(self, app):
        with app.app_context():
            result = ShippingService.parse_dimensions("200x90x78")
            assert result == (200.0, 90.0, 78.0)

    def test_parse_dimensions_with_spaces(self, app):
        with app.app_context():
            result = ShippingService.parse_dimensions("200 x 90 x 78")
            assert result == (200.0, 90.0, 78.0)

    def test_parse_dimensions_none(self, app):
        with app.app_context():
            assert ShippingService.parse_dimensions(None) is None
            assert ShippingService.parse_dimensions("") is None

    def test_dimensional_weight_formula(self, app):
        with app.app_context():
            # 200 * 90 * 78 / 5000 = 280.8
            result = ShippingService.get_dimensional_weight(200, 90, 78)
            assert abs(result - 280.8) < 0.001

    def test_fee_tier_a(self, app):
        with app.app_context():
            fee = ShippingService.get_fee_by_weight(3.0, "inner_city")
            assert fee == 35_000

    def test_fee_tier_e_province(self, app):
        with app.app_context():
            fee = ShippingService.get_fee_by_weight(100.0, "province")
            assert fee == 350_000
