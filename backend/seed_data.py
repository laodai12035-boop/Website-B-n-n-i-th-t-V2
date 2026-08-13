"""
seed_data.py — Script nạp dữ liệu mẫu (Seed Data) cho dự án Website Bán đồ nội thất V2.

Phục vụ Test các tính năng Epic 6:
- Quản lý & Xem lịch sử đơn hàng (NT-06-CN-001)
- Xem chi tiết & Trạng thái đơn hàng (NT-06-CN-002)
- Hủy đơn hàng & Hoàn tồn kho QTN-03 (NT-06-CN-003)
- Yêu cầu đổi/trả hàng QTN-05 (NT-06-CN-004)
- Admin lọc & quản lý đơn hàng (NT-06-CN-005)
- Admin cập nhật trạng thái đơn hàng (NT-06-CN-006)

Tài khoản mặc định được tạo:
- Khách hàng 1: user@example.com / Password123@
- Khách hàng 2: user2@example.com / Password123@
- Quản trị viên: admin@example.com / Password123@
"""

import sys
import os
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash

# Đảm bảo import được app Flask
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.product import Product
from app.models.order import Order, OrderItem
from app.models.return_request import ReturnRequest
from app.models.coupon import Coupon
from app.models.combo import Combo, ComboItem

app = create_app(os.getenv("FLASK_ENV", "development"))


def seed_database():
    with app.app_context():
        print("==> Bat dau nap du lieu mau (Seed Data)...")

        # 1. Tạo Users (Admin & Khách hàng)
        users_data = [
            {
                "email": "user@example.com",
                "full_name": "Nguyễn Văn Anh",
                "phone": "0901234567",
                "password": "Password123@",
                "role": "user",
            },
            {
                "email": "user2@example.com",
                "full_name": "Trần Thị Bình",
                "phone": "0909876543",
                "password": "Password123@",
                "role": "user",
            },
            {
                "email": "admin@example.com",
                "full_name": "Quản Trị Viên (Admin)",
                "phone": "0900000000",
                "password": "Password123@",
                "role": "admin",
            },
        ]

        seeded_users = {}
        for u in users_data:
            existing = db.session.query(User).filter(User.email == u["email"]).first()
            if not existing:
                pwd_hash = generate_password_hash(u["password"])
                user_obj = User(
                    email=u["email"],
                    full_name=u["full_name"],
                    phone=u["phone"],
                    password_hash=pwd_hash,
                    role=u["role"],
                    is_active=True,
                )
                db.session.add(user_obj)
                db.session.flush()
                seeded_users[u["email"]] = user_obj
                print(f"  -> Created User: {u['email']} ({u['role']})")
            else:
                seeded_users[u["email"]] = existing
                print(f"  -> Existing User: {u['email']}")

        db.session.commit()

        # 2. Tạo Products mẫu nếu chưa có
        products_data = [
            {
                "id": 1,
                "name": "Bộ Sofa Gỗ Óc Chó Cao Cấp",
                "slug": "bo-sofa-go-oc-cho-cao-cap",
                "category": "ghe",
                "price": 28500000.0,
                "discount_price": 25000000.0,
                "stock": 10,
                "dimensions": "220x90x85",
                "weight_kg": 25.0,
                "image_url": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
            },
            {
                "id": 2,
                "name": "Ghế Sofa Văng Da Hiện Đại",
                "slug": "ghe-sofa-vang-da-hien-dai",
                "category": "ghe",
                "price": 15800000.0,
                "discount_price": None,
                "stock": 12,
                "dimensions": "180x80x75",
                "weight_kg": 18.0,
                "image_url": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7",
            },
            {
                "id": 3,
                "name": "Bàn Ăn Gỗ Sồi 6 Ghế",
                "slug": "ban-an-go-soi-6-ghe",
                "category": "ban",
                "price": 12500000.0,
                "discount_price": 10900000.0,
                "stock": 15,
                "dimensions": "200x90x78",
                "weight_kg": 35.0,
                "image_url": "https://images.unsplash.com/photo-1617806118233-18e1de247200",
            },
            {
                "id": 4,
                "name": "Bàn Làm Việc Chân Sắt Tối Giản",
                "slug": "ban-lam-viec-chan-sat-toi-gian",
                "category": "ban",
                "price": 2450000.0,
                "discount_price": None,
                "stock": 25,
                "dimensions": "140x60x75",
                "weight_kg": 12.0,
                "image_url": "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd",
            },
            {
                "id": 5,
                "name": "Kệ Sách Gỗ Khung Kim Loại",
                "slug": "ke-sach-go-khung-kim-loai",
                "category": "ke",
                "price": 3200000.0,
                "discount_price": 2800000.0,
                "stock": 20,
                "dimensions": "80x30x180",
                "weight_kg": 8.0,
                "image_url": "https://images.unsplash.com/photo-1594620302200-9a762244a156",
            },
            {
                "id": 6,
                "name": "Kệ Tivi Gỗ Tự Nhiên Modern",
                "slug": "ke-tivi-go-tu-nhien-modern",
                "category": "ke",
                "price": 6800000.0,
                "discount_price": None,
                "stock": 8,
                "dimensions": "160x40x55",
                "weight_kg": 15.0,
                "image_url": "https://images.unsplash.com/photo-1595428774223-ef52624120d2",
            },
            {
                "id": 7,
                "name": "Tủ Quần Áo 4 Cánh Cửa Lùa",
                "slug": "tu-quan-ao-4-canh-cua-lua",
                "category": "tu",
                "price": 14500000.0,
                "discount_price": 12900000.0,
                "stock": 6,
                "dimensions": "200x60x220",
                "weight_kg": 45.0,
                "image_url": "https://images.unsplash.com/photo-1558997519-83ea9252edf8",
            },
            {
                "id": 8,
                "name": "Đèn Sàn Trang Trí Đọc Sách Scandinavian",
                "slug": "den-san-trang-tri-doc-sach-scandinavian",
                "category": "trang-tri",
                "price": 1200000.0,
                "discount_price": 950000.0,
                "stock": 30,
                "dimensions": "30x30x150",
                "weight_kg": 2.5,
                "image_url": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c",
            },
        ]

        seeded_products = {}
        for p in products_data:
            existing_p = db.session.query(Product).filter(Product.slug == p["slug"]).first()
            if not existing_p:
                prod = Product(
                    name=p["name"],
                    slug=p["slug"],
                    category=p["category"],
                    price=p["price"],
                    discount_price=p["discount_price"],
                    stock=p["stock"],
                    dimensions=p["dimensions"],
                    weight_kg=p["weight_kg"],
                    image_url=p["image_url"],
                    is_active=True,
                )
                db.session.add(prod)
                db.session.flush()
                seeded_products[p["id"]] = prod
                print(f"  -> Created Product: {p['name']}")
            else:
                seeded_products[p["id"]] = existing_p

        db.session.commit()

        # 3. Nạp danh sách Đơn hàng Mẫu cho Epic 6
        now = datetime.utcnow()
        user1 = seeded_users["user@example.com"]
        user2 = seeded_users["user2@example.com"]

        orders_sample = [
            # Đơn 1: Chờ xác nhận (pending) - COD
            {
                "order_code": "ORD-20260810-1001",
                "user_id": user1.id,
                "recipient_name": "Nguyễn Văn Anh",
                "recipient_phone": "0901234567",
                "shipping_address": "123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM",
                "note": "Giao vào giờ hành chính, gọi trước 15 phút.",
                "payment_method": "COD",
                "payment_status": "unpaid",
                "status": "pending",
                "subtotal": 28500000.0,
                "discount_amount": 0.0,
                "shipping_fee": 120000.0,
                "total_amount": 28620000.0,
                "created_at": now - timedelta(days=2),
                "items": [
                    {"product_id": seeded_products[1].id, "product_name": seeded_products[1].name, "price": 28500000.0, "quantity": 1}
                ]
            },
            # Đơn 2: Đã xác nhận (confirmed) - VietQR Paid
            {
                "order_code": "ORD-20260811-1002",
                "user_id": user1.id,
                "recipient_name": "Nguyễn Văn Anh",
                "recipient_phone": "0901234567",
                "shipping_address": "123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM",
                "note": "Đã chuyển khoản VietQR thành công",
                "payment_method": "QR_BANK",
                "payment_status": "paid",
                "status": "confirmed",
                "subtotal": 10900000.0,
                "discount_amount": 0.0,
                "shipping_fee": 50000.0,
                "total_amount": 10950000.0,
                "created_at": now - timedelta(days=1),
                "items": [
                    {"product_id": seeded_products[3].id, "product_name": seeded_products[3].name, "price": 10900000.0, "quantity": 1}
                ]
            },
            # Đơn 3: Đang giao (shipping) - COD
            {
                "order_code": "ORD-20260811-1003",
                "user_id": user2.id,
                "recipient_name": "Trần Thị Bình",
                "recipient_phone": "0909876543",
                "shipping_address": "456 Lê Lợi, Phường 1, Hải Châu, Đà Nẵng",
                "note": "Hàng cồng kềnh, cần hỗ trợ 2 người bê lên tầng 2",
                "payment_method": "COD",
                "payment_status": "unpaid",
                "status": "shipping",
                "subtotal": 8100000.0,
                "discount_amount": 0.0,
                "shipping_fee": 50000.0,
                "total_amount": 8150000.0,
                "created_at": now - timedelta(days=1, hours=12),
                "items": [
                    {"product_id": seeded_products[4].id, "product_name": seeded_products[4].name, "price": 2450000.0, "quantity": 2},
                    {"product_id": seeded_products[5].id, "product_name": seeded_products[5].name, "price": 3200000.0, "quantity": 1}
                ]
            },
            # Đơn 4: Giao thành công (delivered) - VietQR Paid (Tạo 7 ngày trước - Còn hạn đổi trả QTN-05)
            {
                "order_code": "ORD-20260805-1004",
                "user_id": user1.id,
                "recipient_name": "Nguyễn Văn Anh",
                "recipient_phone": "0901234567",
                "shipping_address": "123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM",
                "note": "Khách đã nghiệm thu nguyên vẹn",
                "payment_method": "QR_BANK",
                "payment_status": "paid",
                "status": "delivered",
                "subtotal": 12900000.0,
                "discount_amount": 0.0,
                "shipping_fee": 50000.0,
                "total_amount": 12950000.0,
                "created_at": now - timedelta(days=7),
                "items": [
                    {"product_id": seeded_products[7].id, "product_name": seeded_products[7].name, "price": 12900000.0, "quantity": 1}
                ],
                "return_request": {
                    "request_type": "exchange",
                    "reason": "Nẹp viền cánh tủ bị trầy xước nhẹ trong quá trình vận chuyển, mong muốn hỗ trợ đổi nẹp mới.",
                    "proof_image_url": "https://images.unsplash.com/photo-1558997519-83ea9252edf8",
                    "status": "pending",
                }
            },
            # Đơn 5: Giao thành công (delivered) - COD (Tạo 70 ngày trước - HẾT HẠN đổi trả QTN-05)
            {
                "order_code": "ORD-20260601-1005",
                "user_id": user1.id,
                "recipient_name": "Nguyễn Văn Anh",
                "recipient_phone": "0901234567",
                "shipping_address": "123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM",
                "note": "Đã hoàn tất thanh toán tiền mặt",
                "payment_method": "COD",
                "payment_status": "paid",
                "status": "delivered",
                "subtotal": 1900000.0,
                "discount_amount": 0.0,
                "shipping_fee": 50000.0,
                "total_amount": 1950000.0,
                "created_at": now - timedelta(days=70),
                "items": [
                    {"product_id": seeded_products[8].id, "product_name": seeded_products[8].name, "price": 950000.0, "quantity": 2}
                ]
            },
            # Đơn 6: Đã hủy (cancelled) - COD
            {
                "order_code": "ORD-20260809-1006",
                "user_id": user2.id,
                "recipient_name": "Trần Thị Bình",
                "recipient_phone": "0909876543",
                "shipping_address": "456 Lê Lợi, Hải Châu, Đà Nẵng",
                "note": "Lý do hủy: Khách hàng đổi ý muốn mua màu khác",
                "payment_method": "COD",
                "payment_status": "unpaid",
                "status": "cancelled",
                "subtotal": 6800000.0,
                "discount_amount": 0.0,
                "shipping_fee": 50000.0,
                "total_amount": 6850000.0,
                "created_at": now - timedelta(days=3),
                "items": [
                    {"product_id": seeded_products[6].id, "product_name": seeded_products[6].name, "price": 6800000.0, "quantity": 1}
                ]
            },
        ]

        for order_info in orders_sample:
            existing_ord = db.session.query(Order).filter(Order.order_code == order_info["order_code"]).first()
            if not existing_ord:
                ord_obj = Order(
                    order_code=order_info["order_code"],
                    user_id=order_info["user_id"],
                    recipient_name=order_info["recipient_name"],
                    recipient_phone=order_info["recipient_phone"],
                    shipping_address=order_info["shipping_address"],
                    note=order_info["note"],
                    payment_method=order_info["payment_method"],
                    payment_status=order_info["payment_status"],
                    status=order_info["status"],
                    subtotal=order_info["subtotal"],
                    discount_amount=order_info["discount_amount"],
                    shipping_fee=order_info["shipping_fee"],
                    total_amount=order_info["total_amount"],
                    created_at=order_info["created_at"],
                )
                db.session.add(ord_obj)
                db.session.flush()

                for item in order_info["items"]:
                    item_obj = OrderItem(
                        order_id=ord_obj.id,
                        product_id=item["product_id"],
                        product_name=item["product_name"],
                        price=item["price"],
                        quantity=item["quantity"],
                    )
                    db.session.add(item_obj)

                # Nếu có yêu cầu đổi trả
                if "return_request" in order_info:
                    ret_info = order_info["return_request"]
                    ret_obj = ReturnRequest(
                        order_id=ord_obj.id,
                        user_id=ord_obj.user_id,
                        request_type=ret_info["request_type"],
                        reason=ret_info["reason"],
                        proof_image_url=ret_info["proof_image_url"],
                        status=ret_info["status"],
                        created_at=now - timedelta(days=2),
                    )
                    db.session.add(ret_obj)

                print(f"  -> Created Order: {ord_obj.order_code} ({ord_obj.status})")
            else:
                print(f"  -> Existing Order: {order_info['order_code']}")

        db.session.commit()
        print("\n=== DU LIEU MAU DA DUOC NAP THANH CONG! ===")
        print("--------------------------------------------------")
        print("Tai khoan Khach hang 1 : user@example.com / Password123@")
        print("Tai khoan Khach hang 2 : user2@example.com / Password123@")
        print("Tai khoan Quan tri vien: admin@example.com / Password123@")
        print("--------------------------------------------------")


if __name__ == "__main__":
    seed_database()
