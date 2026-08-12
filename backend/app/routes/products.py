"""
routes/products.py — HTTP Route Handlers cho Sản phẩm.

Public API: Không yêu cầu Authentication.
"""

import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.services.product_service import ProductService
from app.services.review_service import ReviewService

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


# ============================================================
# GET /api/v1/products/<int:product_id> — Xem chi tiết 1 sản phẩm
# ============================================================
@products_bp.route("/<int:product_id>", methods=["GET"])
def get_product_detail(product_id: int):
    """
    Lấy thông tin chi tiết của một sản phẩm theo ID.

    Path Parameter:
        product_id (int): ID của sản phẩm

    Responses:
        200: Trả về chi tiết sản phẩm
        404: Sản phẩm không tồn tại hoặc đã bị ngưng bán (code: PRODUCT_NOT_FOUND)
    """
    ProductService.seed_initial_products()

    try:
        product_detail = ProductService.get_product_by_id(product_id)
    except ValueError as exc:
        if str(exc) == "PRODUCT_NOT_FOUND":
            return jsonify(
                {
                    "status": "error",
                    "message": "Sản phẩm không còn tồn tại hoặc đã bị ngừng kinh doanh",
                    "code": "PRODUCT_NOT_FOUND",
                }
            ), 404
        return jsonify({"status": "error", "message": str(exc), "code": "NOT_FOUND"}), 404

    return _success(
        data={"product": product_detail},
        message="Lấy thông tin chi tiết sản phẩm thành công",
        status=200,
    )


# ============================================================
# GET /api/v1/products/<int:product_id>/related — Sản phẩm liên quan
# ============================================================
@products_bp.route("/<int:product_id>/related", methods=["GET"])
def get_related_products(product_id: int):
    """
    Lấy danh sách các sản phẩm liên quan (gợi ý mua kèm cùng danh mục).

    Path Parameter:
        product_id (int): ID của sản phẩm đang xem

    Query Parameter:
        limit (int, optional): Số lượng sản phẩm gợi ý (mặc định 4)

    Responses:
        200: Trả về danh sách related_products
        404: Sản phẩm gốc không tồn tại (code: PRODUCT_NOT_FOUND)
    """
    limit = request.args.get("limit", default=4, type=int)
    ProductService.seed_initial_products()

    try:
        related = ProductService.get_related_products(product_id, limit=limit)
    except ValueError as exc:
        if str(exc) == "PRODUCT_NOT_FOUND":
            return jsonify(
                {
                    "status": "error",
                    "message": "Sản phẩm gốc không tồn tại hoặc đã bị ngừng kinh doanh",
                    "code": "PRODUCT_NOT_FOUND",
                }
            ), 404
        return jsonify({"status": "error", "message": str(exc), "code": "NOT_FOUND"}), 404

    return _success(
        data={"related_products": related},
        message="Lấy danh sách sản phẩm liên quan thành công",
        status=200,
    )


# ============================================================
# GET /api/v1/products/<int:product_id>/reviews — Lấy danh sách đánh giá
# ============================================================
@products_bp.route("/<int:product_id>/reviews", methods=["GET"])
@jwt_required(optional=True)
def get_product_reviews(product_id: int):
    """
    Lấy danh sách đánh giá và nhận xét của sản phẩm kèm phân bổ sao.
    """
    current_user = get_jwt_identity()
    user_id = int(current_user) if current_user else None

    data = ReviewService.get_product_reviews(product_id, current_user_id=user_id)
    return _success(
        data=data,
        message="Lấy danh sách đánh giá sản phẩm thành công",
        status=200,
    )


# ============================================================
# POST /api/v1/products/<int:product_id>/reviews — Viết đánh giá (QTN-06)
# ============================================================
@products_bp.route("/<int:product_id>/reviews", methods=["POST"])
@jwt_required()
def create_product_review(product_id: int):
    """
    Đăng đánh giá kèm số sao (1-5) cho sản phẩm (Tuân thủ QTN-06).

    Request Body:
        rating (int, required): Số sao (1 đến 5)
        comment (str, optional): Nội dung nhận xét
    """
    user_id = int(get_jwt_identity())
    body = request.get_json() or {}

    rating = body.get("rating")
    comment = body.get("comment", "")

    if rating is None or not isinstance(rating, int):
        return jsonify(
            {"status": "error", "message": "Vui lòng chọn số sao đánh giá hợp lệ (1-5)", "code": "INVALID_RATING"}
        ), 400

    try:
        result = ReviewService.create_review(user_id, product_id, rating, comment)
    except ValueError as exc:
        err_msg = str(exc)
        if err_msg == "REVIEW_NOT_ALLOWED":
            return jsonify(
                {
                    "status": "error",
                    "message": "Bạn chỉ được viết đánh giá cho sản phẩm thuộc đơn hàng đã giao thành công (QTN-06).",
                    "code": "REVIEW_NOT_ALLOWED",
                }
            ), 403
        elif err_msg == "PRODUCT_NOT_FOUND":
            return jsonify(
                {"status": "error", "message": "Sản phẩm không tồn tại hoặc đã bị ngừng kinh doanh", "code": "PRODUCT_NOT_FOUND"}
            ), 404
        elif err_msg == "INVALID_RATING":
            return jsonify(
                {"status": "error", "message": "Số sao đánh giá phải từ 1 đến 5 sao", "code": "INVALID_RATING"}
            ), 400
        return jsonify({"status": "error", "message": err_msg, "code": "BAD_REQUEST"}), 400

    return _success(data=result, message="Đăng đánh giá sản phẩm thành công", status=201)





