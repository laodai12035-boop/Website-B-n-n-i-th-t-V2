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
    min_price = request.args.get("min_price", type=float)
    max_price = request.args.get("max_price", type=float)
    sort = request.args.get("sort", default="newest", type=str)
    page = request.args.get("page", default=1, type=int)
    limit = request.args.get("limit", default=12, type=int)

    # Tự động seed sản phẩm nếu DB trống (phục vụ dev & testing)
    ProductService.seed_initial_products()

    result = ProductService.search_products(
        search_query=search_query,
        category=category,
        min_price=min_price,
        max_price=max_price,
        sort=sort,
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


# ============================================================
# POST /api/v1/products/compare — So sánh 2-3 sản phẩm
# ============================================================
@products_bp.route("/compare", methods=["POST"])
def compare_products():
    """
    So sánh thông số 2 đến 3 sản phẩm.

    Request Body (JSON):
        product_ids (list): Danh sách ID các sản phẩm cần so sánh (vd: [1, 2, 3])

    Responses:
        200: Trả về danh sách thông số các sản phẩm
        400: Thiếu product_ids / Ít hơn 2 sản phẩm / Nhiều hơn 3 sản phẩm (COMPARE_LIMIT_EXCEEDED)
    """
    json_data = request.get_json(silent=True) or {}
    product_ids = json_data.get("product_ids", [])

    if not isinstance(product_ids, list):
        return jsonify(
            {
                "status": "error",
                "message": "product_ids phải là dạng danh sách array",
                "code": "INVALID_INPUT",
            }
        ), 400

    try:
        products = ProductService.compare_products(product_ids)
    except ValueError as exc:
        err_code = str(exc)
        if err_code == "COMPARE_LIMIT_EXCEEDED":
            return jsonify(
                {
                    "status": "error",
                    "message": "Đã đạt giới hạn so sánh tối đa (chỉ được so sánh tối đa 3 sản phẩm)",
                    "code": "COMPARE_LIMIT_EXCEEDED",
                }
            ), 400
        elif err_code == "INVALID_COMPARE_COUNT":
            return jsonify(
                {
                    "status": "error",
                    "message": "Vui lòng chọn ít nhất 2 sản phẩm để so sánh",
                    "code": "INVALID_COMPARE_COUNT",
                }
            ), 400
        return jsonify({"status": "error", "message": err_code, "code": "BAD_REQUEST"}), 400

    return _success(
        data={"products": products},
        message="Lấy thông tin so sánh sản phẩm thành công",
        status=200,
    )


