"""
tests/test_auto_stock_sync.py — Test cases cho chức năng Tự động trừ và hoàn kho theo trạng thái đơn hàng (NT-09-CN-002, QTN-03).

Story: NT-09-CN-002 — Tự động trừ và hoàn kho theo trạng thái đơn hàng
Quy tắc: QTN-03 — Trừ/hoàn kho theo trạng thái đơn hàng
CV:    CV-04 — Kiểm thử

Test Cases:
- TC-01: Tự động trừ tồn kho khi đơn hàng chuyển sang trạng thái đã xác nhận / thanh toán ➔ 200 OK (Tồn kho sản phẩm giảm đúng số lượng đơn)
- TC-02: Tự động hoàn kho khi đơn hàng bị hủy ➔ 200 OK (Tồn kho sản phẩm được cộng lại đúng số lượng đơn)
- TC-03: Hủy đơn hàng chưa từng bị trừ kho ➔ Tồn kho không bị cộng lặp lại (stock_deducted = False)
- TC-04: Chuyển trạng thái nhiều lần (confirmed ➔ shipping ➔ delivered) ➔ Tồn kho chỉ trừ đúng 1 lần duy nhất (Idempotent)
"""

import pytest
from flask_jwt_extended import create_access_token
from app import create_app
from app.extensions import db, bcrypt
from app.models.user import User
from app.models.product import Product
from app.models.order import Order, OrderItem
from app.services.order_service import OrderService
from app.services.stock_service import StockService


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
            full_name="Quản Trị Viên",
            email="admin@example.com",
            phone="0901112233",
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
    """Tạo tài khoản Khách hàng trong DB."""
    with app.app_context():
        user = User(
            full_name="Nguyễn Văn Anh",
            email="user@example.com",
            phone="0901234567",
            password_hash=bcrypt.generate_password_hash("UserPassword123@").decode("utf-8"),
            role="user",
            is_active=True,
        )
        db.session.add(user)
        db.session.commit()
        token = create_access_token(identity=str(user.id))
        return {"id": user.id, "email": user.email, "token": token}


@pytest.fixture
def sample_products(app):
    """Tạo 2 sản phẩm mẫu trong DB với tồn kho = 50 và 30."""
    with app.app_context():
        p1 = Product(
            name="Bàn Ăn Gỗ Sồi 6 Ghế",
            slug="ban-an-go-soi-6-ghe",
            price=12000000.0,
            category="ban",
            stock=50,
            is_active=True,
        )
        p2 = Product(
            name="Ghế Ăn Gỗ Nệm Da",
            slug="ghe-an-go-nem-da-auto",
            price=1500000.0,
            category="ghe",
            stock=30,
            is_active=True,
        )
        db.session.add_all([p1, p2])
        db.session.commit()
        return {"p1_id": p1.id, "p2_id": p2.id}


class TestAutoStockSyncQTN03:
    """Các test case cho QTN-03 & NT-09-CN-002 Tự động trừ/hoàn kho."""

    def test_tc01_deduct_stock_on_order_confirmation(self, app, admin_user, regular_user, sample_products):
        """TC-01: Admin chuyển đơn sang confirmed ➔ Tồn kho các sản phẩm trong đơn bị trừ đúng theo số lượng."""
        with app.app_context():
            # 1. Tạo đơn hàng với cờ stock_deducted = False (giả lập đơn pending chưa trừ kho)
            order = Order(
                order_code="ORD-TEST-001",
                user_id=regular_user["id"],
                recipient_name="Nguyễn Văn Anh",
                recipient_phone="0901234567",
                shipping_address="123 Nguyễn Huệ",
                status="pending",
                stock_deducted=False,
                total_amount=15000000.0,
            )
            db.session.add(order)
            db.session.flush()

            # Item 1: Bàn ăn (x1), Item 2: Ghế ăn (x2)
            item1 = OrderItem(order_id=order.id, product_id=sample_products["p1_id"], quantity=1, price=12000000.0)
            item2 = OrderItem(order_id=order.id, product_id=sample_products["p2_id"], quantity=2, price=1500000.0)
            db.session.add_all([item1, item2])
            db.session.commit()
            order_id = order.id

        # 2. Admin cập nhật trạng thái đơn sang 'confirmed'
        updated_order = OrderService.update_order_status(
            admin_id=admin_user["id"],
            order_id=order_id,
            new_status="confirmed",
        )
        assert updated_order["status"] == "confirmed"
        assert updated_order["stock_deducted"] is True

        # 3. Kiểm tra tồn kho sản phẩm trong DB
        with app.app_context():
            p1 = db.session.query(Product).filter(Product.id == sample_products["p1_id"]).first()
            p2 = db.session.query(Product).filter(Product.id == sample_products["p2_id"]).first()

            # Bàn ăn: 50 - 1 = 49
            assert p1.stock == 49
            # Ghế ăn: 30 - 2 = 28
            assert p2.stock == 28

    def test_tc02_restore_stock_on_order_cancellation(self, app, admin_user, regular_user, sample_products):
        """TC-02: Đơn hàng bị hủy sau khi đã trừ kho ➔ Tồn kho được hoàn lại đúng số lượng."""
        with app.app_context():
            # 1. Giả lập đơn hàng đã ở trạng thái confirmed (đã trừ kho stock_deducted = True)
            # Tồn kho ban đầu của p1=50, p2=30. Khi đơn được trừ kho: p1=48 (đơn có 2 bàn), p2=26 (đơn có 4 ghế)
            p1 = db.session.query(Product).filter(Product.id == sample_products["p1_id"]).first()
            p2 = db.session.query(Product).filter(Product.id == sample_products["p2_id"]).first()
            p1.stock = 48
            p2.stock = 26

            order = Order(
                order_code="ORD-TEST-002",
                user_id=regular_user["id"],
                recipient_name="Nguyễn Văn Anh",
                recipient_phone="0901234567",
                shipping_address="123 Nguyễn Huệ",
                status="confirmed",
                stock_deducted=True,
                total_amount=30000000.0,
            )
            db.session.add(order)
            db.session.flush()

            item1 = OrderItem(order_id=order.id, product_id=sample_products["p1_id"], quantity=2, price=12000000.0)
            item2 = OrderItem(order_id=order.id, product_id=sample_products["p2_id"], quantity=4, price=1500000.0)
            db.session.add_all([item1, item2])
            db.session.commit()
            order_id = order.id

        # 2. Hủy đơn hàng
        cancelled_order = OrderService.cancel_order(
            user_id=regular_user["id"],
            order_id=order_id,
            reason="Khách hàng thay đổi nhu cầu",
        )
        assert cancelled_order["status"] == "cancelled"
        assert cancelled_order["stock_deducted"] is False

        # 3. Kiểm tra tồn kho sản phẩm được hoàn lại
        with app.app_context():
            p1 = db.session.query(Product).filter(Product.id == sample_products["p1_id"]).first()
            p2 = db.session.query(Product).filter(Product.id == sample_products["p2_id"]).first()

            # Bàn ăn: 48 + 2 = 50
            assert p1.stock == 50
            # Ghế ăn: 26 + 4 = 30
            assert p2.stock == 30

    def test_tc03_cancel_undeducted_order_does_not_double_restore(self, app, regular_user, sample_products):
        """TC-03: Đơn hàng chưa trừ kho (stock_deducted = False) khi bị hủy không bị cộng kho lặp lại."""
        with app.app_context():
            order = Order(
                order_code="ORD-TEST-003",
                user_id=regular_user["id"],
                recipient_name="Nguyễn Văn Anh",
                recipient_phone="0901234567",
                shipping_address="123 Nguyễn Huệ",
                status="pending",
                stock_deducted=False,
                total_amount=12000000.0,
            )
            db.session.add(order)
            db.session.flush()

            item1 = OrderItem(order_id=order.id, product_id=sample_products["p1_id"], quantity=5, price=12000000.0)
            db.session.add(item1)
            db.session.commit()
            order_id = order.id

        # Hủy đơn chưa từng trừ kho
        OrderService.cancel_order(user_id=regular_user["id"], order_id=order_id)

        # Đảm bảo tồn kho p1 giữ nguyên = 50 (không bị cộng nhầm lên 55)
        with app.app_context():
            p1 = db.session.query(Product).filter(Product.id == sample_products["p1_id"]).first()
            assert p1.stock == 50

    def test_tc04_multiple_status_transitions_idempotent(self, app, admin_user, regular_user, sample_products):
        """TC-04: Đơn hàng chuyển qua nhiều trạng thái (confirmed -> shipping -> delivered) chỉ trừ kho 1 lần duy nhất."""
        with app.app_context():
            order = Order(
                order_code="ORD-TEST-004",
                user_id=regular_user["id"],
                recipient_name="Nguyễn Văn Anh",
                recipient_phone="0901234567",
                shipping_address="123 Nguyễn Huệ",
                status="pending",
                stock_deducted=False,
                total_amount=12000000.0,
            )
            db.session.add(order)
            db.session.flush()

            item1 = OrderItem(order_id=order.id, product_id=sample_products["p1_id"], quantity=3, price=12000000.0)
            db.session.add(item1)
            db.session.commit()
            order_id = order.id

        # 1. Chuyển sang confirmed -> Trừ kho (50 -> 47)
        OrderService.update_order_status(admin_id=admin_user["id"], order_id=order_id, new_status="confirmed")
        with app.app_context():
            p1 = db.session.query(Product).filter(Product.id == sample_products["p1_id"]).first()
            assert p1.stock == 47

        # 2. Chuyển sang shipping -> Bỏ qua trừ kho lặp lại (vẫn 47)
        OrderService.update_order_status(admin_id=admin_user["id"], order_id=order_id, new_status="shipping")
        with app.app_context():
            p1 = db.session.query(Product).filter(Product.id == sample_products["p1_id"]).first()
            assert p1.stock == 47

        # 3. Chuyển sang delivered -> Bỏ qua trừ kho lặp lại (vẫn 47)
        OrderService.update_order_status(admin_id=admin_user["id"], order_id=order_id, new_status="delivered")
        with app.app_context():
            p1 = db.session.query(Product).filter(Product.id == sample_products["p1_id"]).first()
            assert p1.stock == 47
