"""
routes/products.py — HTTP Route Handlers cho Sản phẩm.

Public API: Không yêu cầu Authentication.
"""

import logging
from flask import Blueprint, request, jsonify
from app.services.product_service import ProductService

logger = logging.getLogger(__name__)

products_bp = Blueprint("products", __name__)


def _success(data: dict, message: str, status: int = 200):
    """Helper trả về response thành công chuẩn."""
    return jsonify({"status": "success", "data": data, "message": message}), status


# ============================================================
# GET /api/v1/products — Danh sách & Tìm kiếm sản phẩm
# ============================================================
@products_bp.route("", methods=["GET"])
def get_products():
    """
    Lấy danh sách và tìm kiếm sản phẩm.

    Query Params:
        search (str):   Từ khóa tìm kiếm (tên hoặc mô tả)
        category (str): Danh mục (ban, ghe, ke, tu, trang-tri)
        page (int):     Trang hiện tại (default 1)
        limit (int):    Số items mỗi trang (default 12)

    Responses:
        200: Trả về danh sách items và pagination metadata
    """
    search_query = request.args.get("search", type=str)
    category = request.args.get("category", type=str)
    page = request.args.get("page", default=1, type=int)
    limit = request.args.get("limit", default=12, type=int)

    # Tự động seed sản phẩm nếu DB trống (phục vụ dev & testing)
    ProductService.seed_initial_products()

    result = ProductService.search_products(
        search_query=search_query,
        category=category,
        page=page,
        limit=limit,
    )

    return _success(
        data=result,
        message="Lấy danh sách sản phẩm thành công",
        status=200,
    )


# ============================================================
# GET /api/v1/products/categories — Thống kê danh mục sản phẩm
# ============================================================
@products_bp.route("/categories", methods=["GET"])
def get_categories():
    """
    Lấy danh sách các danh mục sản phẩm kèm số lượng items.

    Responses:
        200: Trả về list danh mục
    """
    ProductService.seed_initial_products()
    categories = ProductService.get_categories_summary()

    return _success(
        data={"categories": categories},
        message="Lấy danh sách danh mục sản phẩm thành công",
        status=200,
    )

