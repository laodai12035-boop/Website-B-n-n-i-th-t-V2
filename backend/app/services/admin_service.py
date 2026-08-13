import math
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy import or_
from app.extensions import db
from app.models.product import Product
from app.models.user import User
from app.models.order import Order


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

        # 3. Đơn hàng (Orders)
        orders_query = (
            db.session.query(Order)
            .filter(
                or_(
                    Order.order_code.ilike(term),
                    Order.recipient_name.ilike(term),
                    Order.recipient_phone.ilike(term),
                    Order.shipping_address.ilike(term),
                )
            )
            .order_by(Order.created_at.desc())
            .limit(5)
            .all()
        )
        orders_list = [o.to_dict() for o in orders_query]

        return {
            "products": products_list,
            "orders": orders_list,
            "customers": customers_list,
        }

    @staticmethod
    def get_admin_orders(
        status_filter: Optional[str] = None,
        search_query: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        page: int = 1,
        limit: int = 20,
    ) -> Dict[str, Any]:
        """
        Lấy danh sách đơn hàng dành cho Admin với các bộ lọc linh hoạt.

        Args:
            status_filter: Trạng thái đơn ('all', 'pending', 'confirmed', 'shipping', 'delivered', 'cancelled')
            search_query: Từ khóa tìm kiếm (mã đơn, tên/sĐT/địa chỉ nhận)
            start_date: Ngày bắt đầu (YYYY-MM-DD)
            end_date: Ngày kết thúc (YYYY-MM-DD)
            page: Trang hiện tại (1-indexed)
            limit: Số bản ghi trên 1 trang

        Returns:
            Dict chứa danh sách `orders`, metadata `pagination` và thống kê `summary`.
        """
        base_query = db.session.query(Order)

        # Tính thống kê tổng quan theo từng trạng thái
        summary = {
            "total": base_query.count(),
            "pending": base_query.filter(Order.status == "pending").count(),
            "confirmed": base_query.filter(Order.status == "confirmed").count(),
            "shipping": base_query.filter(Order.status == "shipping").count(),
            "delivered": base_query.filter(Order.status == "delivered").count(),
            "cancelled": base_query.filter(Order.status == "cancelled").count(),
        }

        query = base_query

        # 1. Lọc theo trạng thái
        if status_filter and status_filter.strip() and status_filter.strip() != "all":
            query = query.filter(Order.status == status_filter.strip())

        # 2. Tìm kiếm theo từ khóa
        if search_query and search_query.strip():
            term = f"%{search_query.strip()}%"
            query = query.filter(
                or_(
                    Order.order_code.ilike(term),
                    Order.recipient_name.ilike(term),
                    Order.recipient_phone.ilike(term),
                    Order.shipping_address.ilike(term),
                )
            )

        # 3. Lọc theo từ ngày - đến ngày
        if start_date and start_date.strip():
            try:
                dt_start = datetime.strptime(start_date.strip(), "%Y-%m-%d")
                query = query.filter(Order.created_at >= dt_start)
            except ValueError:
                pass

        if end_date and end_date.strip():
            try:
                dt_end = datetime.strptime(end_date.strip(), "%Y-%m-%d").replace(
                    hour=23, minute=59, second=59
                )
                query = query.filter(Order.created_at <= dt_end)
            except ValueError:
                pass

        # 4. Phân trang
        page = max(1, page)
        limit = max(1, min(100, limit))
        total_items = query.count()
        total_pages = max(1, math.ceil(total_items / limit))

        orders = (
            query.order_by(Order.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )

        return {
            "orders": [o.to_dict() for o in orders],
            "pagination": {
                "page": page,
                "limit": limit,
                "total_items": total_items,
                "total_pages": total_pages,
            },
            "summary": summary,
        }

    @staticmethod
    def get_admin_customers(
        search: Optional[str] = None,
        status: Optional[str] = None,
        page: int = 1,
        limit: int = 20,
    ) -> Dict[str, Any]:
        """
        Quản trị viên lấy danh sách khách hàng kèm số đơn hàng và tổng chi tiêu (NT-12-CN-001).

        Args:
            search: Từ khóa tìm kiếm (tên, email, sĐT)
            status: Lọc trạng thái ('all', 'active', 'inactive')
            page: Trang hiện tại (1-indexed)
            limit: Số bản ghi trên 1 trang

        Returns:
            Dict chứa `customers`, `pagination` và `summary`.
        """
        from sqlalchemy import case, func

        base_query = db.session.query(User).filter(User.role == "user")

        summary = {
            "total_customers": base_query.count(),
            "active_customers": base_query.filter(User.is_active == True).count(),
            "inactive_customers": base_query.filter(User.is_active == False).count(),
        }

        query = base_query

        # 1. Lọc theo trạng thái active/inactive
        if status and status.strip().lower() != "all":
            st = status.strip().lower()
            if st == "active":
                query = query.filter(User.is_active == True)
            elif st == "inactive":
                query = query.filter(User.is_active == False)

        # 2. Tìm kiếm theo từ khóa
        if search and search.strip():
            term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    User.full_name.ilike(term),
                    User.email.ilike(term),
                    User.phone.ilike(term),
                )
            )

        # 3. Phân trang
        page = max(1, page)
        limit = max(1, min(100, limit))
        total_items = query.count()
        total_pages = max(1, math.ceil(total_items / limit))

        users = (
            query.order_by(User.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )

        customer_list = []
        for u in users:
            # Thống kê tổng số đơn hàng, tổng chi tiêu (trừ đơn bị hủy) và ngày đặt đơn gần nhất
            orders_stats = (
                db.session.query(
                    func.count(Order.id).label("total_orders"),
                    func.coalesce(
                        func.sum(case((Order.status != "cancelled", Order.total_amount), else_=0)), 0
                    ).label("total_spent"),
                    func.max(Order.created_at).label("last_order_at"),
                )
                .filter(Order.user_id == u.id)
                .first()
            )

            total_orders = int(orders_stats.total_orders) if orders_stats and orders_stats.total_orders else 0
            total_spent = float(orders_stats.total_spent) if orders_stats and orders_stats.total_spent else 0.0
            last_order_at = orders_stats.last_order_at.isoformat() if orders_stats and orders_stats.last_order_at else None

            customer_list.append({
                "id": u.id,
                "full_name": u.full_name,
                "email": u.email,
                "phone": u.phone,
                "role": u.role,
                "is_active": u.is_active,
                "total_orders": total_orders,
                "total_spent": total_spent,
                "last_order_at": last_order_at,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            })

        return {
            "customers": customer_list,
            "pagination": {
                "page": page,
                "limit": limit,
                "total_items": total_items,
                "total_pages": total_pages,
            },
            "summary": summary,
        }

    @staticmethod
    def toggle_customer_status(customer_id: int, is_active: bool) -> Dict[str, Any]:
        """
        Quản trị viên khóa hoặc mở khóa tài khoản khách hàng (NT-12-CN-002).

        Args:
            customer_id: ID khách hàng cần khóa/mở khóa
            is_active: Trạng thái mới (True = Hoạt động, False = Khóa)

        Returns:
            Dict thông tin tài khoản khách hàng sau khi cập nhật.

        Raises:
            ValueError("CUSTOMER_NOT_FOUND"): Khách hàng không tồn tại trong hệ thống.
        """
        user = db.session.query(User).filter(User.id == customer_id).first()
        if not user:
            raise ValueError("CUSTOMER_NOT_FOUND")

        user.is_active = bool(is_active)
        db.session.commit()

        return {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "is_active": user.is_active,
            "updated_at": datetime.utcnow().isoformat(),
        }

