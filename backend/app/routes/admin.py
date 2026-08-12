"""
routes/admin.py — HTTP handlers cho Admin Endpoints.

Toàn bộ các endpoint trong Blueprint này được bảo vệ bởi @admin_required() theo QTN-09.
Chỉ người dùng có role == 'admin' mới được phép truy cập.
"""

import logging
from flask import Blueprint, jsonify

from app.extensions import db
from app.models.user import User
from app.services.admin_service import AdminService
from app.utils.decorators import admin_required

logger = logging.getLogger(__name__)

admin_bp = Blueprint("admin", __name__)


def _success(data: dict, message: str, status: int = 200):
    """Helper trả về response thành công chuẩn."""
    return jsonify({"status": "success", "data": data, "message": message}), status


# ============================================================
# GET /api/v1/admin/dashboard — Thống kê tổng quan khu vực Admin
# ============================================================
@admin_bp.route("/dashboard", methods=["GET"])
@admin_required()
def get_dashboard():
    """
    Lấy thông tin thống kê tổng quan hệ thống dành riêng cho Admin (QTN-09).

    Header:
        Authorization: Bearer <admin_token>

    Responses:
        200: Trả về thống kê tổng quan
        401: Chưa đăng nhập
        403: Không có quyền Admin (code: FORBIDDEN)
    """
    from app.models.product import Product
    from app.models.order import Order
    from sqlalchemy.sql import func

    total_users = db.session.query(User).count()
    total_orders = db.session.query(Order).count()
    total_products = db.session.query(Product).count()

    total_revenue_val = (
        db.session.query(func.sum(Order.total_amount))
        .filter(Order.payment_status == "paid")
        .scalar()
        or 0.0
    )

    formatted_revenue = f"{int(total_revenue_val):,}đ".replace(",", ".")

    dashboard_data = {
        "stats": {
            "total_users": total_users,
            "total_orders": total_orders,
            "total_products": total_products,
            "revenue": formatted_revenue,
            "system_status": "Hoạt động bình thường",
        }
    }

    return _success(
        data=dashboard_data,
        message="Lấy thông tin dashboard quản trị thành công",
        status=200,
    )


# ============================================================
# GET /api/v1/admin/quick-search — Tìm kiếm nhanh cho Admin
# ============================================================
@admin_bp.route("/quick-search", methods=["GET"])
@admin_required()
def quick_search():
    """
    Tìm kiếm nhanh sản phẩm, đơn hàng, khách hàng cho Admin.

    Query Parameters:
        q (str): Từ khóa tra cứu

    Header:
        Authorization: Bearer <admin_token>

    Responses:
        200: Trả về kết quả phân nhóm products, orders, customers
        401: Chưa đăng nhập
        403: Không có quyền Admin (code: FORBIDDEN)
    """
    from flask import request

    query_str = request.args.get("q", default="", type=str)
    search_results = AdminService.quick_search(query_str)

    return _success(
        data=search_results,
        message="Tra cứu tìm kiếm nhanh Admin thành công",
        status=200,
    )


# ============================================================
# GET /api/v1/admin/orders — Admin xem và lọc danh sách đơn hàng (NT-06-CN-005)
# ============================================================
@admin_bp.route("/orders", methods=["GET"])
@admin_required()
def get_admin_orders():
    """
    Admin xem và lọc danh sách đơn hàng theo trạng thái, từ khóa, khoảng thời gian. (NT-06-CN-005)

    Query Parameters:
        status (str): Trạng thái đơn ('all', 'pending', 'confirmed', 'shipping', 'delivered', 'cancelled')
        q / search (str): Từ khóa tìm kiếm (mã đơn, tên/sĐT/địa chỉ nhận)
        start_date (str): Ngày bắt đầu YYYY-MM-DD
        end_date (str): Ngày kết thúc YYYY-MM-DD
        page (int): Trang hiện tại (mặc định 1)
        limit (int): Số bản ghi/trang (mặc định 20)

    Header:
        Authorization: Bearer <admin_token>

    Responses:
        200: Trả về danh sách đơn hàng, pagination metadata & summary thống kê
        401: Chưa đăng nhập
        403: Không có quyền Admin (code: FORBIDDEN)
    """
    from flask import request

    status_filter = request.args.get("status", default="all", type=str)
    search_query = request.args.get("q", default=request.args.get("search", default="", type=str), type=str)
    start_date = request.args.get("start_date", default=None, type=str)
    end_date = request.args.get("end_date", default=None, type=str)
    page = request.args.get("page", default=1, type=int)
    limit = request.args.get("limit", default=request.args.get("per_page", default=20, type=int), type=int)

    result = AdminService.get_admin_orders(
        status_filter=status_filter,
        search_query=search_query,
        start_date=start_date,
        end_date=end_date,
        page=page,
        limit=limit,
    )

    return _success(
        data=result,
        message="Lấy danh sách đơn hàng cho Admin thành công",
        status=200,
    )


