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
    # Đếm tổng số user trong DB
    total_users = db.session.query(User).count()

    dashboard_data = {
        "stats": {
            "total_users": total_users,
            "total_orders": 0,
            "total_products": 0,
            "revenue": "0đ",
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

