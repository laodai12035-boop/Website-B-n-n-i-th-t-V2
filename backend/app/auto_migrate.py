"""
app/auto_migrate.py — Tự động cập nhật Schema MySQL XAMPP khi ứng dụng khởi chạy.
Đảm bảo các bảng MySQL cũ tự động được bổ sung các cột mới mà không bị lỗi Column 1054.
"""

from sqlalchemy import inspect, text
from app.extensions import db


def run_auto_migrations(app):
    """Kiểm tra và tự động cập nhật bảng MySQL XAMPP (Chỉ chạy ở môi trường Dev/Prod, bỏ qua Testing)."""
    if app.config.get("TESTING"):
        return

    with app.app_context():
        try:
            # 1. Tạo tất cả các bảng mới nếu chưa có (coupons, cart_items, v.v.)
            db.create_all()

            inspector = inspect(db.engine)

            # 2. Cập nhật bảng orders nếu thiếu cột order_code
            if inspector.has_table("orders"):
                columns = [c["name"] for c in inspector.get_columns("orders")]
                alter_statements = []

                if "order_code" not in columns:
                    alter_statements.append("ADD COLUMN order_code VARCHAR(50) NULL")
                if "recipient_name" not in columns:
                    alter_statements.append("ADD COLUMN recipient_name VARCHAR(100) NULL")
                if "recipient_phone" not in columns:
                    alter_statements.append("ADD COLUMN recipient_phone VARCHAR(20) NULL")
                if "shipping_address" not in columns:
                    alter_statements.append("ADD COLUMN shipping_address VARCHAR(255) NULL")
                if "note" not in columns:
                    alter_statements.append("ADD COLUMN note VARCHAR(255) NULL")
                if "payment_method" not in columns:
                    alter_statements.append("ADD COLUMN payment_method VARCHAR(20) NOT NULL DEFAULT 'COD'")
                if "payment_status" not in columns:
                    alter_statements.append("ADD COLUMN payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid'")
                if "subtotal" not in columns:
                    alter_statements.append("ADD COLUMN subtotal DOUBLE NOT NULL DEFAULT 0.0")
                if "discount_amount" not in columns:
                    alter_statements.append("ADD COLUMN discount_amount DOUBLE NOT NULL DEFAULT 0.0")
                if "qr_expire_at" not in columns:
                    alter_statements.append("ADD COLUMN qr_expire_at DATETIME NULL")
                if "shipping_fee" not in columns:
                    alter_statements.append("ADD COLUMN shipping_fee DOUBLE NOT NULL DEFAULT 0.0")

                if alter_statements:
                    sql = f"ALTER TABLE orders {', '.join(alter_statements)}"
                    db.session.execute(text(sql))
                    db.session.commit()
                    print("[AutoMigrate] Updated table orders columns successfully.")

            # 3. Cập nhật bảng order_items nếu thiếu cột product_name / subtotal
            if inspector.has_table("order_items"):
                columns = [c["name"] for c in inspector.get_columns("order_items")]
                alter_statements = []

                if "product_name" not in columns:
                    alter_statements.append("ADD COLUMN product_name VARCHAR(200) NULL")
                if "subtotal" not in columns:
                    alter_statements.append("ADD COLUMN subtotal DOUBLE NOT NULL DEFAULT 0.0")

                if alter_statements:
                    sql = f"ALTER TABLE order_items {', '.join(alter_statements)}"
                    db.session.execute(text(sql))
                    db.session.commit()
                    print("[AutoMigrate] Updated table order_items columns successfully.")

            # 5. Cập nhật bảng products nếu thiếu cột weight_kg (QTN-07) hoặc warranty_months / warranty_terms (NT-08-CN-005)
            if inspector.has_table("products"):
                columns = [c["name"] for c in inspector.get_columns("products")]
                alter_statements = []

                if "weight_kg" not in columns:
                    alter_statements.append("ADD COLUMN weight_kg FLOAT NULL")
                if "warranty_months" not in columns:
                    alter_statements.append("ADD COLUMN warranty_months INT DEFAULT 12")
                if "warranty_terms" not in columns:
                    alter_statements.append("ADD COLUMN warranty_terms TEXT NULL")

                if alter_statements:
                    sql = f"ALTER TABLE products {', '.join(alter_statements)}"
                    db.session.execute(text(sql))
                    db.session.commit()
                    print("[AutoMigrate] Updated table products columns (weight_kg, warranty_months, warranty_terms) successfully.")

            # 4. Seed dữ liệu coupons nếu chưa có
            if inspector.has_table("coupons"):
                from app.models.coupon import Coupon
                if db.session.query(Coupon).count() == 0:
                    c1 = Coupon(
                        id=1,
                        code="NOITHAT10",
                        description="Giảm 10% cho đơn hàng từ 2.000.000đ",
                        discount_type="percent",
                        discount_value=10.0,
                        min_order_value=2000000.0,
                        max_discount=1000000.0,
                        is_active=True,
                    )
                    c2 = Coupon(
                        id=2,
                        code="GIAM500K",
                        description="Giảm trực tiếp 500.000đ cho đơn từ 5.000.000đ",
                        discount_type="fixed",
                        discount_value=500000.0,
                        min_order_value=5000000.0,
                        is_active=True,
                    )
                    c3 = Coupon(
                        id=3,
                        code="HETHAN2025",
                        description="Mã ưu đãi đã hết hạn sử dụng",
                        discount_type="percent",
                        discount_value=20.0,
                        min_order_value=1000000.0,
                        is_active=False,
                    )
                    db.session.add_all([c1, c2, c3])
                    db.session.commit()
                    print("[AutoMigrate] Seeded sample coupons successfully.")

            # 6. Seed dữ liệu combos nếu chưa có
            if inspector.has_table("combos") and inspector.has_table("combo_items"):
                from app.models.combo import Combo, ComboItem
                if db.session.query(Combo).count() == 0:
                    cb1 = Combo(
                        id=1,
                        name="Bộ Trọn Gói Phòng Khách Sang Trọng",
                        description="Bộ Combo gồm 01 Bộ Sofa Gỗ Óc Chó và 01 Kệ Tivi Gỗ Tự Nhiên với ưu đãi giảm giá 15% khi mua trọn bộ.",
                        discount_percent=15.0,
                        is_active=True,
                    )
                    cb2 = Combo(
                        id=2,
                        name="Bộ Góc Làm Việc Tối Giản",
                        description="Bộ Combo gồm 01 Bàn Làm Việc Chân Sắt và 01 Kệ Sách Gỗ Khung Kim Loại giảm ngay 10%.",
                        discount_percent=10.0,
                        is_active=True,
                    )
                    db.session.add_all([cb1, cb2])
                    db.session.commit()

                    item1 = ComboItem(id=1, combo_id=1, product_id=1, quantity=1)
                    item2 = ComboItem(id=2, combo_id=1, product_id=6, quantity=1)
                    item3 = ComboItem(id=3, combo_id=2, product_id=4, quantity=1)
                    item4 = ComboItem(id=4, combo_id=2, product_id=5, quantity=1)
                    db.session.add_all([item1, item2, item3, item4])
                    db.session.commit()
                    print("[AutoMigrate] Seeded sample combos successfully.")

        except Exception as e:
            print(f"[AutoMigrate Error] {e}")

