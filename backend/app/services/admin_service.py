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

        base_query = db.session.query(User)

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
            elif st == "admin":
                query = query.filter(User.role == "admin")
            elif st == "user":
                query = query.filter(User.role == "user")

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

    @staticmethod
    def create_admin_account(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Quản trị viên tạo tài khoản mới (User hoặc Admin).
        """
        from app.extensions import bcrypt

        email = (data.get("email") or "").strip().lower()
        if not email:
            raise ValueError("EMAIL_REQUIRED")

        existing_user = db.session.query(User).filter(User.email == email).first()
        if existing_user:
            raise ValueError("EMAIL_ALREADY_EXISTS")

        full_name = (data.get("full_name") or "").strip()
        if not full_name:
            raise ValueError("FULL_NAME_REQUIRED")

        password = (data.get("password") or "").strip()
        if not password or len(password) < 6:
            raise ValueError("PASSWORD_TOO_SHORT")

        phone = (data.get("phone") or "").strip() or None
        role = (data.get("role") or "user").strip().lower()
        if role not in ["user", "admin"]:
            role = "user"

        is_active = bool(data.get("is_active", True))

        password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

        new_user = User(
            full_name=full_name,
            email=email,
            phone=phone,
            password_hash=password_hash,
            role=role,
            is_active=is_active,
        )

        db.session.add(new_user)
        db.session.commit()

        return new_user.to_dict()

    @staticmethod
    def update_customer_role(customer_id: int, role: str) -> Dict[str, Any]:
        """
        Quản trị viên phân quyền tài khoản (user/admin).
        """
        user = db.session.query(User).filter(User.id == customer_id).first()
        if not user:
            raise ValueError("CUSTOMER_NOT_FOUND")

        r = (role or "").strip().lower()
        if r not in ["user", "admin"]:
            raise ValueError("INVALID_ROLE")

        user.role = r
        db.session.commit()

        return user.to_dict()

    @staticmethod
    def get_dashboard_analytics(
        time_range: str = "this_month",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Quản trị viên xem bảng điều khiển tổng quan (NT-13-CN-001).

        Args:
            time_range: 'today', 'this_week', 'this_month', 'this_year', 'all', 'custom'
            start_date: ngày bắt đầu YYYY-MM-DD (dành cho custom)
            end_date: ngày kết thúc YYYY-MM-DD (dành cho custom)

        Returns:
            Dict chứa `summary`, `order_status_counts`, `top_selling_products`, `time_range`.
        """
        from datetime import datetime, timedelta
        from sqlalchemy import func
        from app.models.order import OrderItem
        from app.services.stock_service import StockService

        now = datetime.utcnow()
        dt_start = None
        dt_end = None

        tr = (time_range or "this_month").strip().lower()

        if tr == "today":
            dt_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            dt_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)
        elif tr == "this_week":
            dt_start = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
            dt_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)
        elif tr == "this_month":
            dt_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            dt_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)
        elif tr == "this_year":
            dt_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            dt_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)
        elif tr == "custom":
            if start_date and start_date.strip():
                try:
                    dt_start = datetime.strptime(start_date.strip(), "%Y-%m-%d")
                except ValueError:
                    dt_start = None
            if end_date and end_date.strip():
                try:
                    dt_end = datetime.strptime(end_date.strip(), "%Y-%m-%d").replace(hour=23, minute=59, second=59)
                except ValueError:
                    dt_end = None

        # Base Order Query theo time range
        orders_query = db.session.query(Order)
        if dt_start:
            orders_query = orders_query.filter(Order.created_at >= dt_start)
        if dt_end:
            orders_query = orders_query.filter(Order.created_at <= dt_end)

        total_orders = orders_query.count()

        # Doanh thu thực tế (chỉ tính các đơn KHÔNG bị hủy status != 'cancelled')
        rev_query = (
            db.session.query(func.coalesce(func.sum(Order.total_amount), 0.0))
            .filter(Order.status != "cancelled")
        )
        if dt_start:
            rev_query = rev_query.filter(Order.created_at >= dt_start)
        if dt_end:
            rev_query = rev_query.filter(Order.created_at <= dt_end)

        total_revenue_val = float(rev_query.scalar() or 0.0)
        formatted_revenue = f"{int(total_revenue_val):,}đ".replace(",", ".")

        # Đếm chi tiết theo từng trạng thái đơn hàng
        status_counts = {
            "pending": orders_query.filter(Order.status == "pending").count(),
            "confirmed": orders_query.filter(Order.status == "confirmed").count(),
            "shipping": orders_query.filter(Order.status == "shipping").count(),
            "delivered": orders_query.filter(Order.status == "delivered").count(),
            "cancelled": orders_query.filter(Order.status == "cancelled").count(),
        }

        # Thống kê tổng số đối tượng toàn hệ thống
        total_users = db.session.query(User).filter(User.role == "user").count()
        total_products = db.session.query(Product).count()
        low_stock_res = StockService.get_low_stock_products()

        # Top 5 Sản phẩm bán chạy nhất (Bỏ qua đơn bị hủy)
        top_products_query = (
            db.session.query(
                OrderItem.product_id,
                func.coalesce(Product.name, OrderItem.product_name).label("name"),
                Product.image_url.label("image_url"),
                Product.price.label("price"),
                func.sum(OrderItem.quantity).label("sold_count"),
                func.sum(OrderItem.quantity * OrderItem.price).label("revenue"),
            )
            .join(Order, OrderItem.order_id == Order.id)
            .outerjoin(Product, OrderItem.product_id == Product.id)
            .filter(Order.status != "cancelled")
        )

        if dt_start:
            top_products_query = top_products_query.filter(Order.created_at >= dt_start)
        if dt_end:
            top_products_query = top_products_query.filter(Order.created_at <= dt_end)

        top_products_rows = (
            top_products_query.group_by(
                OrderItem.product_id,
                Product.name,
                OrderItem.product_name,
                Product.image_url,
                Product.price,
            )
            .order_by(func.sum(OrderItem.quantity).desc())
            .limit(5)
            .all()
        )

        top_selling_products = [
            {
                "product_id": tp.product_id,
                "name": tp.name or f"Sản phẩm #{tp.product_id}",
                "image_url": tp.image_url,
                "price": float(tp.price or 0.0),
                "sold_count": int(tp.sold_count or 0),
                "revenue": float(tp.revenue or 0.0),
                "revenue_formatted": f"{int(tp.revenue or 0):,}đ".replace(",", "."),
            }
            for tp in top_products_rows
        ]

        return {
            "time_range": tr,
            "start_date": dt_start.isoformat() if dt_start else None,
            "end_date": dt_end.isoformat() if dt_end else None,
            "summary": {
                "total_revenue": total_revenue_val,
                "revenue_formatted": formatted_revenue,
                "total_orders": total_orders,
                "total_users": total_users,
                "total_products": total_products,
                "low_stock_count": low_stock_res["count"],
            },
            "order_status_counts": status_counts,
            "top_selling_products": top_selling_products,
        }

    @staticmethod
    def get_category_analytics(
        time_range: str = "this_month",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Xem thống kê sản phẩm theo danh mục (NT-13-CN-002).

        Args:
            time_range: 'today', 'this_week', 'this_month', 'this_year', 'all', 'custom'
            start_date: YYYY-MM-DD
            end_date: YYYY-MM-DD

        Returns:
            Dict thông kê số lượng bán và doanh thu theo danh mục sản phẩm.
        """
        from datetime import datetime, timedelta
        from sqlalchemy import func
        from app.models.order import OrderItem
        from app.models.category import Category

        now = datetime.utcnow()
        dt_start = None
        dt_end = None

        tr = (time_range or "this_month").strip().lower()

        if tr == "today":
            dt_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            dt_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)
        elif tr == "this_week":
            dt_start = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
            dt_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)
        elif tr == "this_month":
            dt_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            dt_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)
        elif tr == "this_year":
            dt_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            dt_end = now.replace(hour=23, minute=59, second=59, microsecond=999999)
        elif tr == "custom":
            if start_date and start_date.strip():
                try:
                    dt_start = datetime.strptime(start_date.strip(), "%Y-%m-%d")
                except ValueError:
                    dt_start = None
            if end_date and end_date.strip():
                try:
                    dt_end = datetime.strptime(end_date.strip(), "%Y-%m-%d").replace(hour=23, minute=59, second=59)
                except ValueError:
                    dt_end = None

        # Query thống kê số bán và doanh thu group theo Product.category
        sales_query = (
            db.session.query(
                Product.category.label("category_name"),
                func.sum(OrderItem.quantity).label("total_sold"),
                func.sum(OrderItem.quantity * OrderItem.price).label("total_revenue"),
            )
            .join(OrderItem, OrderItem.product_id == Product.id)
            .join(Order, OrderItem.order_id == Order.id)
            .filter(Order.status != "cancelled")
        )

        if dt_start:
            sales_query = sales_query.filter(Order.created_at >= dt_start)
        if dt_end:
            sales_query = sales_query.filter(Order.created_at <= dt_end)

        sales_rows = sales_query.group_by(Product.category).all()
        sales_dict = {
            r.category_name: {
                "total_sold": int(r.total_sold or 0),
                "total_revenue": float(r.total_revenue or 0.0),
            }
            for r in sales_rows if r.category_name
        }

        # Thu thập danh sách tất cả các danh mục để bao quát cả danh mục chưa bán được sản phẩm nào (TC-02)
        all_categories = db.session.query(Category.name).filter(Category.is_active == True).all()
        category_names = set([c.name for c in all_categories] + list(sales_dict.keys()))

        overall_revenue = sum(data["total_revenue"] for data in sales_dict.values())
        overall_sold = sum(data["total_sold"] for data in sales_dict.values())

        categories_result = []
        for cat_name in sorted(category_names):
            data = sales_dict.get(cat_name, {"total_sold": 0, "total_revenue": 0.0})
            rev = data["total_revenue"]
            sold = data["total_sold"]
            pct = round((rev / overall_revenue) * 100, 1) if overall_revenue > 0 else 0.0

            categories_result.append({
                "category_name": cat_name,
                "total_sold": sold,
                "total_revenue": rev,
                "revenue_formatted": f"{int(rev):,}đ".replace(",", "."),
                "revenue_percentage": pct,
            })

        # Sắp xếp danh mục theo doanh thu giảm dần
        categories_result.sort(key=lambda x: x["total_revenue"], reverse=True)

        return {
            "time_range": tr,
            "start_date": dt_start.isoformat() if dt_start else None,
            "end_date": dt_end.isoformat() if dt_end else None,
            "overall_revenue": overall_revenue,
            "overall_revenue_formatted": f"{int(overall_revenue):,}đ".replace(",", "."),
            "overall_sold": overall_sold,
            "categories": categories_result,
        }

