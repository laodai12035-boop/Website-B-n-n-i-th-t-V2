"""
services/admin_service.py — Service xử lý nghiệp vụ Quản trị viên (Admin).
"""

from typing import Dict, Any, List
from sqlalchemy import or_
from app.extensions import db
from app.models.product import Product
from app.models.user import User


class AdminService:
    """Service xử lý các tác vụ quản trị hệ thống dành riêng cho Admin."""

    @staticmethod
    def quick_search(query_str: str) -> Dict[str, List[Dict[str, Any]]]:
        """
        Tìm kiếm nhanh các đối tượng Sản phẩm, Đơn hàng và Khách hàng cho Admin.

        Args:
            query_str: Từ khóa tìm kiếm do Admin nhập

        Returns:
            Dict chứa 3 danh sách `products`, `orders`, `customers`.
        """
        if not query_str or not query_str.strip():
            return {"products": [], "orders": [], "customers": []}

        term = f"%{query_str.strip()}%"

        # 1. Tìm Sản phẩm (Products)
        products_query = (
            db.session.query(Product)
            .filter(
                Product.is_active == True,
                or_(
                    Product.name.ilike(term),
                    Product.category.ilike(term),
                    Product.description.ilike(term),
                ),
            )
            .limit(5)
            .all()
        )
        products_list = [p.to_dict() for p in products_query]

        # 2. Tìm Khách hàng (Customers / Users with role='user')
        users_query = (
            db.session.query(User)
            .filter(
                User.role == "user",
                or_(
                    User.full_name.ilike(term),
                    User.email.ilike(term),
                    User.phone.ilike(term),
                ),
            )
            .limit(5)
            .all()
        )
        customers_list = [
            {
                "id": u.id,
                "full_name": u.full_name,
                "email": u.email,
                "phone": u.phone,
                "is_active": u.is_active,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users_query
        ]

        # 3. Đơn hàng (Orders) - Cấu trúc chờ module Đơn hàng triển khai
        orders_list = []

        return {
            "products": products_list,
            "orders": orders_list,
            "customers": customers_list,
        }
