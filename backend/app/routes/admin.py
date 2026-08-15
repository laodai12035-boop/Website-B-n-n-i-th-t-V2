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
    Lấy thông tin thống kê tổng quan hệ thống dành riêng cho Admin (NT-13-CN-001).

    Query Parameters:
        time_range (str): 'today', 'this_week', 'this_month', 'this_year', 'all', 'custom'
        start_date (str): YYYY-MM-DD
        end_date (str): YYYY-MM-DD
    """
    from flask import request
    from app.services.admin_service import AdminService

    time_range = request.args.get("time_range", "this_month")
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")

    data = AdminService.get_dashboard_analytics(
        time_range=time_range,
        start_date=start_date,
        end_date=end_date,
    )

    # Tương thích ngược với key stats cũ
    data["stats"] = {
        "total_users": data["summary"]["total_users"],
        "total_orders": data["summary"]["total_orders"],
        "total_products": data["summary"]["total_products"],
        "revenue": data["summary"]["revenue_formatted"],
        "low_stock_count": data["summary"]["low_stock_count"],
        "system_status": "Hoạt động bình thường",
    }

    return _success(
        data=data,
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


# ============================================================
# PATCH/PUT /api/v1/admin/orders/<id>/status — Admin cập nhật trạng thái đơn
# ============================================================
@admin_bp.route("/orders/<int:order_id>/status", methods=["PATCH", "PUT"])
@admin_required()
def admin_update_order_status(order_id: int):
    from flask import request
    from flask_jwt_extended import get_jwt_identity
    from app.services.order_service import OrderService

    admin_id = int(get_jwt_identity())
    body = request.get_json(silent=True) or {}
    new_status = body.get("status", "").strip()
    note = body.get("note", "").strip()

    if not new_status:
        return jsonify({"status": "error", "message": "Trạng thái mới 'status' là bắt buộc.", "code": "MISSING_STATUS"}), 400

    try:
        order = OrderService.update_order_status(
            admin_id=admin_id, order_id=order_id, new_status=new_status, note=note
        )
        return _success(
            data=order,
            message=f"Đã cập nhật trạng thái đơn hàng sang '{new_status}' thành công.",
            status=200,
        )
    except ValueError as exc:
        err_str = str(exc)
        if err_str == "FORBIDDEN":
            return jsonify({"status": "error", "message": "Chỉ Quản trị viên (Admin) mới có quyền cập nhật trạng thái đơn hàng.", "code": "FORBIDDEN"}), 403
        elif err_str == "ORDER_NOT_FOUND":
            return jsonify({"status": "error", "message": "Đơn hàng không tồn tại.", "code": "ORDER_NOT_FOUND"}), 404
        elif err_str == "INVALID_STATUS":
            return jsonify({"status": "error", "message": "Trạng thái mới không hợp lệ.", "code": "INVALID_STATUS"}), 400
        elif err_str == "INVALID_STATUS_TRANSITION_SAME":
            return jsonify({"status": "error", "message": "Đơn hàng đã ở trạng thái này.", "code": "INVALID_STATUS_TRANSITION"}), 400
        elif err_str == "INVALID_STATUS_TRANSITION_FINAL":
            return jsonify({
                "status": "error",
                "message": "Không thể thay đổi trạng thái của đơn hàng đã ở giai đoạn hoàn thành hoặc đã hủy.",
                "code": "INVALID_STATUS_TRANSITION",
            }), 400
        elif err_str == "INVALID_STATUS_TRANSITION":
            return jsonify({
                "status": "error",
                "message": "Chuyển đổi trạng thái đơn hàng không hợp lệ theo quy trình.",
                "code": "INVALID_STATUS_TRANSITION",
            }), 400
        return jsonify({"status": "error", "message": err_str, "code": "BAD_REQUEST"}), 400


# ============================================================
# POST /api/v1/admin/products — Admin thêm sản phẩm mới (NT-08-CN-003)
# ============================================================
@admin_bp.route("/products", methods=["POST"])
@admin_required()
def create_product():
    """
    Quản trị viên thêm sản phẩm mới (NT-08-CN-003).

    Responses:
        201: Thêm sản phẩm thành công
        400: Dữ liệu không hợp lệ (VALIDATION_ERROR)
        401: Chưa đăng nhập
        403: Không có quyền Admin (FORBIDDEN)
    """
    from flask import request
    from marshmallow import ValidationError
    from app.schemas.product_schema import product_schema
    from app.services.product_service import ProductService

    json_data = request.get_json(silent=True) or {}

    try:
        data = product_schema.load(json_data)
    except ValidationError as exc:
        return jsonify({
            "status": "error",
            "message": "Dữ liệu sản phẩm không hợp lệ.",
            "code": "VALIDATION_ERROR",
            "errors": exc.messages
        }), 400

    new_product = ProductService.create_product(data=data)
    return _success(
        data=new_product,
        message="Thêm sản phẩm mới thành công.",
        status=201,
    )


# ============================================================
# GET /api/v1/admin/products — Admin lấy danh sách sản phẩm
# ============================================================
@admin_bp.route("/products", methods=["GET"])
@admin_required()
def get_admin_products():
    """
    Lấy danh sách tất cả sản phẩm cho trang quản trị Admin.
    """
    from flask import request
    from app.services.product_service import ProductService

    search_query = request.args.get("search", type=str)
    category = request.args.get("category", type=str)
    page = request.args.get("page", default=1, type=int)
    limit = request.args.get("limit", default=20, type=int)

    result = ProductService.search_products(
        search_query=search_query,
        category=category,
        page=page,
        limit=limit,
    )

    return _success(
        data=result,
        message="Lấy danh sách sản phẩm quản trị thành công",
        status=200,
    )


# ============================================================
# PUT /api/v1/admin/products/<int:product_id> — Admin sửa sản phẩm (NT-08-CN-004)
# ============================================================
@admin_bp.route("/products/<int:product_id>", methods=["PUT"])
@admin_required()
def update_product(product_id: int):
    """
    Quản trị viên chỉnh sửa thông tin sản phẩm (NT-08-CN-004).

    Responses:
        200: Cập nhật sản phẩm thành công
        400: Dữ liệu không hợp lệ (VALIDATION_ERROR)
        403: Không có quyền Admin (FORBIDDEN)
        404: Sản phẩm không tồn tại (PRODUCT_NOT_FOUND)
    """
    from flask import request
    from marshmallow import ValidationError
    from app.schemas.product_schema import product_schema
    from app.services.product_service import ProductService

    json_data = request.get_json(silent=True) or {}

    try:
        data = product_schema.load(json_data)
    except ValidationError as exc:
        return jsonify({
            "status": "error",
            "message": "Dữ liệu sản phẩm không hợp lệ.",
            "code": "VALIDATION_ERROR",
            "errors": exc.messages
        }), 400

    try:
        updated = ProductService.update_product(product_id=product_id, data=data)
        return _success(
            data=updated,
            message="Cập nhật thông tin sản phẩm thành công.",
            status=200,
        )
    except ValueError as exc:
        err_str = str(exc)
        if err_str == "PRODUCT_NOT_FOUND":
            return jsonify({
                "status": "error",
                "message": "Không tìm thấy sản phẩm.",
                "code": "PRODUCT_NOT_FOUND"
            }), 404
        return jsonify({"status": "error", "message": err_str, "code": "BAD_REQUEST"}), 400


# ============================================================
# DELETE /api/v1/admin/products/<int:product_id> — Admin ngừng bán (NT-08-CN-004)
# ============================================================
@admin_bp.route("/products/<int:product_id>", methods=["DELETE"])
@admin_required()
def delete_product(product_id: int):
    """
    Quản trị viên chuyển sản phẩm sang trạng thái Ngừng kinh doanh (NT-08-CN-004).

    Responses:
        200: Ngừng bán sản phẩm thành công
        403: Không có quyền Admin (FORBIDDEN)
        404: Sản phẩm không tồn tại (PRODUCT_NOT_FOUND)
    """
    from app.services.product_service import ProductService

    try:
        ProductService.delete_product(product_id=product_id)
        return _success(
            data={"id": product_id, "is_active": False},
            message="Đã chuyển sản phẩm sang trạng thái ngừng kinh doanh.",
            status=200,
        )
    except ValueError as exc:
        err_str = str(exc)
        if err_str == "PRODUCT_NOT_FOUND":
            return jsonify({
                "status": "error",
                "message": "Không tìm thấy sản phẩm.",
                "code": "PRODUCT_NOT_FOUND"
            }), 404
        return jsonify({"status": "error", "message": err_str, "code": "BAD_REQUEST"}), 400


# ============================================================
# POST /api/v1/admin/combos — Admin tạo combo mới (NT-08-CN-006)
# ============================================================
@admin_bp.route("/combos", methods=["POST"])
@admin_required()
def create_combo():
    """
    Quản trị viên tạo combo/bộ sản phẩm mới (NT-08-CN-006).

    Responses:
        201: Tạo combo thành công
        400: Dữ liệu không hợp lệ hoặc chứa sản phẩm ngừng bán/không tồn tại
        403: Không có quyền Admin (FORBIDDEN)
    """
    from flask import request
    from app.services.combo_service import ComboService

    json_data = request.get_json(silent=True) or {}

    try:
        new_combo = ComboService.create_combo(data=json_data)
        return _success(
            data=new_combo,
            message="Tạo bộ sản phẩm combo thành công.",
            status=201,
        )
    except ValueError as exc:
        err_str = str(exc)
        if err_str == "PRODUCT_INACTIVE_OR_NOT_FOUND":
            return jsonify({
                "status": "error",
                "message": "Không thể tạo combo chứa sản phẩm đã ngừng bán hoặc không tồn tại.",
                "code": "PRODUCT_INACTIVE_OR_NOT_FOUND"
            }), 400
        elif err_str in ("INVALID_NAME", "INVALID_ITEMS", "INVALID_DISCOUNT"):
            msg_map = {
                "INVALID_NAME": "Tên combo không được để trống.",
                "INVALID_ITEMS": "Vui lòng chọn ít nhất 1 sản phẩm hợp lệ cho combo.",
                "INVALID_DISCOUNT": "Phần trăm giảm giá phải từ 0% đến 100%.",
            }
            return jsonify({
                "status": "error",
                "message": msg_map.get(err_str, "Dữ liệu combo không hợp lệ."),
                "code": "VALIDATION_ERROR"
            }), 400
        return jsonify({"status": "error", "message": err_str, "code": "BAD_REQUEST"}), 400


# ============================================================
# GET /api/v1/admin/combos — Admin lấy danh sách tất cả combo
# ============================================================
@admin_bp.route("/combos", methods=["GET"])
@admin_required()
def get_admin_combos():
    """
    Lấy danh sách tất cả combo cho trang quản trị Admin.
    """
    from app.services.combo_service import ComboService

    combos = ComboService.get_all_admin_combos()
    return _success(
        data=combos,
        message="Lấy danh sách combo quản trị thành công.",
        status=200,
    )


# ============================================================
# POST /api/v1/admin/inventory/import — Admin nhập kho sản phẩm (NT-09-CN-001)
# ============================================================
@admin_bp.route("/inventory/import", methods=["POST"])
@admin_required()
def import_stock():
    """
    Quản trị viên lập phiếu nhập kho cho 1 sản phẩm (NT-09-CN-001).

    Responses:
        201: Nhập kho thành công (Tồn kho sản phẩm được cộng dồn)
        400: Số lượng nhập âm hoặc bằng 0 (VALIDATION_ERROR)
        404: Sản phẩm không tồn tại (PRODUCT_NOT_FOUND)
        403: Không có quyền Admin (FORBIDDEN)
    """
    from flask import request
    from flask_jwt_extended import get_jwt_identity
    from app.services.stock_service import StockService

    admin_id = int(get_jwt_identity())
    json_data = request.get_json(silent=True) or {}

    try:
        receipt = StockService.import_stock(data=json_data, admin_id=admin_id)
        return _success(
            data=receipt,
            message=f"Nhập kho thành công {receipt['added_quantity']} sản phẩm. Tồn kho mới: {receipt['new_stock']}.",
            status=201,
        )
    except ValueError as exc:
        err_str = str(exc)
        if err_str == "PRODUCT_NOT_FOUND":
            return jsonify({
                "status": "error",
                "message": "Không tìm thấy sản phẩm cần nhập kho.",
                "code": "PRODUCT_NOT_FOUND"
            }), 404
        elif err_str == "INVALID_QUANTITY":
            return jsonify({
                "status": "error",
                "message": "Số lượng nhập kho phải là số nguyên lớn hơn 0.",
                "code": "VALIDATION_ERROR"
            }), 400
        return jsonify({"status": "error", "message": err_str, "code": "BAD_REQUEST"}), 400


# ============================================================
# GET /api/v1/admin/inventory/receipts — Danh sách phiếu nhập kho
# ============================================================
@admin_bp.route("/inventory/receipts", methods=["GET"])
@admin_required()
def get_stock_receipts():
    """
    Quản trị viên xem lịch sử các phiếu nhập kho.
    """
    from flask import request
    from app.services.stock_service import StockService

    product_id_str = request.args.get("product_id")
    product_id = int(product_id_str) if product_id_str and product_id_str.isdigit() else None

    receipts = StockService.get_stock_receipts(product_id=product_id)
    return _success(
        data=receipts,
        message="Lấy lịch sử phiếu nhập kho thành công.",
        status=200,
    )


# ============================================================
# GET /api/v1/admin/inventory/low-stock-warnings — Cảnh báo tồn kho thấp
# ============================================================
@admin_bp.route("/inventory/low-stock-warnings", methods=["GET"])
@admin_required()
def get_low_stock_warnings():
    """
    Quản trị viên nhận danh sách cảnh báo tồn kho thấp QTN-08.
    """
    from app.services.stock_service import StockService
    result = StockService.get_low_stock_products()
    return _success(
        data=result,
        message="Lấy danh sách cảnh báo tồn kho thấp thành công.",
        status=200,
    )


# ============================================================
# GET /api/v1/admin/reviews — Quản lý bình luận đánh giá
# ============================================================
@admin_bp.route("/reviews", methods=["GET"])
@admin_required()
def get_admin_reviews():
    """
    Quản trị viên lấy danh sách tất cả các bình luận đánh giá sản phẩm (NT-10-CN-001).
    """
    from flask import request
    from app.services.review_service import ReviewService

    status_filter = request.args.get("status", "all").strip().lower()
    product_id_str = request.args.get("product_id")
    product_id = int(product_id_str) if product_id_str and product_id_str.isdigit() else None
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 20))

    result = ReviewService.get_admin_reviews(
        status_filter=status_filter,
        product_id=product_id,
        page=page,
        limit=limit,
    )
    return _success(
        data=result,
        message="Lấy danh sách bình luận đánh giá thành công.",
        status=200,
    )


# ============================================================
# GET /api/v1/admin/reviews/stats — Thống kê đánh giá sản phẩm
# ============================================================
@admin_bp.route("/reviews/stats", methods=["GET"])
@admin_required()
def get_admin_review_stats():
    """
    Quản trị viên xem báo cáo thống kê đánh giá theo từng sản phẩm (NT-10-CN-002).
    """
    from flask import request
    from app.services.review_service import ReviewService

    search = request.args.get("search")
    sort_by = request.args.get("sort_by", "reviews_desc")

    result = ReviewService.get_product_review_stats(search=search, sort_by=sort_by)
    return _success(
        data=result,
        message="Lấy dữ liệu thống kê đánh giá sản phẩm thành công.",
        status=200,
    )


# ============================================================
# PUT /api/v1/admin/reviews/<int:review_id>/moderate — Duyệt/Ẩn bình luận
# ============================================================
@admin_bp.route("/reviews/<int:review_id>/moderate", methods=["PUT"])
@admin_required()
def moderate_review(review_id: int):
    """
    Quản trị viên duyệt (is_approved=True) hoặc ẩn (is_approved=False) bình luận (NT-10-CN-001).
    """
    from flask import request
    from app.services.review_service import ReviewService

    data = request.get_json(silent=True) or {}
    if "is_approved" not in data and "status" not in data:
        return jsonify({
            "status": "error",
            "message": "Vui lòng cung cấp tham số is_approved hoặc status.",
            "code": "MISSING_IS_APPROVED_PARAM"
        }), 400

    is_approved = data.get("is_approved")
    if is_approved is None and "status" in data:
        is_approved = data["status"] == "approved"

    try:
        updated_review = ReviewService.moderate_review(review_id=review_id, is_approved=bool(is_approved))
        msg = "Duyệt hiển thị bình luận thành công." if updated_review["is_approved"] else "Đã ẩn bình luận thành công."
        return _success(data=updated_review, message=msg, status=200)
    except ValueError as exc:
        err_str = str(exc)
        if err_str == "REVIEW_NOT_FOUND":
            return jsonify({
                "status": "error",
                "message": "Không tìm thấy bình luận đánh giá.",
                "code": "REVIEW_NOT_FOUND"
            }), 404
        return jsonify({"status": "error", "message": err_str, "code": "BAD_REQUEST"}), 400


# ============================================================
# BANNER MANAGEMENT ENDPOINTS (NT-11-CN-001)
# ============================================================
@admin_bp.route("/banners", methods=["GET"])
@admin_required()
def get_admin_banners():
    """
    Quản trị viên lấy danh sách tất cả các banner quảng cáo (NT-11-CN-001).
    """
    from app.services.banner_service import BannerService
    banners = BannerService.get_all_banners_admin()
    return _success(
        data=banners,
        message="Lấy danh sách tất cả banner thành công.",
        status=200,
    )


@admin_bp.route("/banners", methods=["POST"])
@admin_required()
def create_admin_banner():
    """
    Quản trị viên tạo banner quảng cáo mới (NT-11-CN-001).
    """
    from flask import request
    from datetime import datetime
    from app.services.banner_service import BannerService

    data = request.get_json(silent=True) or {}
    image_url = data.get("image_url")
    title = data.get("title", "Banner Quảng Cáo")
    subtitle = data.get("subtitle")
    link_url = data.get("link_url")
    display_order = data.get("display_order", 0)
    is_active = data.get("is_active", True)

    start_date = None
    if data.get("start_date"):
        try:
            start_date = datetime.fromisoformat(data["start_date"].replace("Z", "+00:00"))
        except ValueError:
            pass

    end_date = None
    if data.get("end_date"):
        try:
            end_date = datetime.fromisoformat(data["end_date"].replace("Z", "+00:00"))
        except ValueError:
            pass

    try:
        new_banner = BannerService.create_banner(
            title=title,
            image_url=image_url,
            subtitle=subtitle,
            link_url=link_url,
            display_order=display_order,
            is_active=is_active,
            start_date=start_date,
            end_date=end_date,
        )
        return _success(
            data=new_banner,
            message="Thêm banner quảng cáo mới thành công.",
            status=201,
        )
    except ValueError as exc:
        err_str = str(exc)
        if err_str == "MISSING_IMAGE_URL":
            return jsonify({
                "status": "error",
                "message": "Vui lòng chọn/nhập đường dẫn hình ảnh banner.",
                "code": "MISSING_IMAGE_URL"
            }), 400
        return jsonify({"status": "error", "message": err_str, "code": "BAD_REQUEST"}), 400


@admin_bp.route("/banners/<int:banner_id>", methods=["PUT"])
@admin_required()
def update_admin_banner(banner_id: int):
    """
    Quản trị viên chỉnh sửa banner (NT-11-CN-001).
    """
    from flask import request
    from datetime import datetime
    from app.services.banner_service import BannerService

    data = request.get_json(silent=True) or {}

    if "start_date" in data and isinstance(data["start_date"], str):
        try:
            data["start_date"] = datetime.fromisoformat(data["start_date"].replace("Z", "+00:00"))
        except ValueError:
            data["start_date"] = None

    if "end_date" in data and isinstance(data["end_date"], str):
        try:
            data["end_date"] = datetime.fromisoformat(data["end_date"].replace("Z", "+00:00"))
        except ValueError:
            data["end_date"] = None

    try:
        updated = BannerService.update_banner(banner_id=banner_id, data=data)
        return _success(
            data=updated,
            message="Cập nhật thông tin banner thành công.",
            status=200,
        )
    except ValueError as exc:
        err_str = str(exc)
        if err_str == "BANNER_NOT_FOUND":
            return jsonify({
                "status": "error",
                "message": "Không tìm thấy banner quảng cáo.",
                "code": "BANNER_NOT_FOUND"
            }), 404
        if err_str == "MISSING_IMAGE_URL":
            return jsonify({
                "status": "error",
                "message": "Vui lòng chọn/nhập đường dẫn hình ảnh banner.",
                "code": "MISSING_IMAGE_URL"
            }), 400
        return jsonify({"status": "error", "message": err_str, "code": "BAD_REQUEST"}), 400


@admin_bp.route("/banners/<int:banner_id>", methods=["DELETE"])
@admin_required()
def delete_admin_banner(banner_id: int):
    """
    Quản trị viên xóa banner (NT-11-CN-001).
    """
    from app.services.banner_service import BannerService
    try:
        BannerService.delete_banner(banner_id=banner_id)
        return _success(
            data={"banner_id": banner_id},
            message="Xóa banner quảng cáo thành công.",
            status=200,
        )
    except ValueError as exc:
        err_str = str(exc)
        if err_str == "BANNER_NOT_FOUND":
            return jsonify({
                "status": "error",
                "message": "Không tìm thấy banner quảng cáo.",
                "code": "BANNER_NOT_FOUND"
            }), 404
        return jsonify({"status": "error", "message": err_str, "code": "BAD_REQUEST"}), 400


# ============================================================
# COUPON MANAGEMENT ENDPOINTS (NT-11-CN-002, QTN-01)
# ============================================================
@admin_bp.route("/coupons", methods=["GET"])
@admin_required()
def get_admin_coupons():
    """
    Quản trị viên lấy danh sách tất cả mã giảm giá (NT-11-CN-002).
    """
    from app.services.coupon_service import CouponService
    coupons = CouponService.get_all_coupons_admin()
    return _success(
        data=coupons,
        message="Lấy danh sách mã giảm giá thành công.",
        status=200,
    )


@admin_bp.route("/coupons", methods=["POST"])
@admin_required()
def create_admin_coupon():
    """
    Quản trị viên tạo mã giảm giá mới (NT-11-CN-002, QTN-01).
    """
    from flask import request
    from datetime import datetime
    from app.services.coupon_service import CouponService

    data = request.get_json(silent=True) or {}
    code = data.get("code")
    discount_type = data.get("discount_type", "percent")
    discount_value = data.get("discount_value")
    description = data.get("description")
    min_order_value = data.get("min_order_value", 0.0)
    max_discount = data.get("max_discount")
    is_active = data.get("is_active", True)

    start_date = None
    if data.get("start_date"):
        try:
            start_date = datetime.fromisoformat(data["start_date"].replace("Z", "+00:00"))
        except ValueError:
            pass

    end_date = None
    if data.get("end_date"):
        try:
            end_date = datetime.fromisoformat(data["end_date"].replace("Z", "+00:00"))
        except ValueError:
            pass

    if not code or not str(code).strip():
        return jsonify({
            "status": "error",
            "message": "Vui lòng nhập mã giảm giá.",
            "code": "COUPON_CODE_EMPTY"
        }), 400

    if discount_value is None or float(discount_value) <= 0:
        return jsonify({
            "status": "error",
            "message": "Giá trị giảm phải lớn hơn 0.",
            "code": "INVALID_DISCOUNT_VALUE"
        }), 400

    try:
        new_coupon = CouponService.create_coupon(
            code=code,
            discount_type=discount_type,
            discount_value=discount_value,
            description=description,
            min_order_value=min_order_value,
            max_discount=max_discount,
            is_active=is_active,
            start_date=start_date,
            end_date=end_date,
        )
        return _success(
            data=new_coupon,
            message="Tạo mã giảm giá mới thành công.",
            status=201,
        )
    except ValueError as exc:
        err_str = str(exc)
        if err_str == "COUPON_CODE_EXISTS":
            return jsonify({
                "status": "error",
                "message": "Mã giảm giá này đã tồn tại trong hệ thống.",
                "code": "COUPON_CODE_EXISTS"
            }), 400
        if err_str == "INVALID_DISCOUNT_PERCENT":
            return jsonify({
                "status": "error",
                "message": "Tỷ lệ giảm giá không được vượt quá 100%.",
                "code": "INVALID_DISCOUNT_PERCENT"
            }), 400
        return jsonify({"status": "error", "message": err_str, "code": "BAD_REQUEST"}), 400


@admin_bp.route("/coupons/<int:coupon_id>", methods=["PUT"])
@admin_required()
def update_admin_coupon(coupon_id: int):
    """
    Quản trị viên cập nhật mã giảm giá (NT-11-CN-002).
    """
    from flask import request
    from datetime import datetime
    from app.services.coupon_service import CouponService

    data = request.get_json(silent=True) or {}

    if "start_date" in data and isinstance(data["start_date"], str):
        try:
            data["start_date"] = datetime.fromisoformat(data["start_date"].replace("Z", "+00:00"))
        except ValueError:
            data["start_date"] = None

    if "end_date" in data and isinstance(data["end_date"], str):
        try:
            data["end_date"] = datetime.fromisoformat(data["end_date"].replace("Z", "+00:00"))
        except ValueError:
            data["end_date"] = None

    try:
        updated = CouponService.update_coupon(coupon_id=coupon_id, data=data)
        return _success(
            data=updated,
            message="Cập nhật mã giảm giá thành công.",
            status=200,
        )
    except ValueError as exc:
        err_str = str(exc)
        if err_str == "COUPON_NOT_FOUND":
            return jsonify({
                "status": "error",
                "message": "Không tìm thấy mã giảm giá.",
                "code": "COUPON_NOT_FOUND"
            }), 404
        if err_str == "COUPON_CODE_EXISTS":
            return jsonify({
                "status": "error",
                "message": "Mã giảm giá này đã tồn tại trong hệ thống.",
                "code": "COUPON_CODE_EXISTS"
            }), 400
        return jsonify({"status": "error", "message": err_str, "code": "BAD_REQUEST"}), 400


@admin_bp.route("/coupons/<int:coupon_id>", methods=["DELETE"])
@admin_required()
def delete_admin_coupon(coupon_id: int):
    """
    Quản trị viên xóa mã giảm giá (NT-11-CN-002).
    """
    from app.services.coupon_service import CouponService
    try:
        CouponService.delete_coupon(coupon_id=coupon_id)
        return _success(
            data={"coupon_id": coupon_id},
            message="Xóa mã giảm giá thành công.",
            status=200,
        )
    except ValueError as exc:
        err_str = str(exc)
        if err_str == "COUPON_NOT_FOUND":
            return jsonify({
                "status": "error",
                "message": "Không tìm thấy mã giảm giá.",
                "code": "COUPON_NOT_FOUND"
            }), 404
        return jsonify({"status": "error", "message": err_str, "code": "BAD_REQUEST"}), 400


# ============================================================
# CUSTOMERS MANAGEMENT ENDPOINT (NT-12-CN-001)
# ============================================================
@admin_bp.route("/customers", methods=["GET"])
@admin_required()
def get_admin_customers():
    """
    Quản trị viên xem danh sách khách hàng đã đăng ký kèm thông tin tổng số đơn hàng (NT-12-CN-001).
    """
    from flask import request
    from app.services.admin_service import AdminService

    search = request.args.get("search")
    status = request.args.get("status", "all")
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 20))

    result = AdminService.get_admin_customers(
        search=search,
        status=status,
        page=page,
        limit=limit,
    )
    return _success(
        data=result,
        message="Lấy danh sách khách hàng thành công.",
        status=200,
    )


@admin_bp.route("/customers/<int:customer_id>/status", methods=["PUT"])
@admin_required()
def toggle_admin_customer_status(customer_id: int):
    """
    Quản trị viên khóa hoặc mở khóa tài khoản khách hàng (NT-12-CN-002).
    """
    from flask import request
    from app.services.admin_service import AdminService

    body = request.get_json() or {}
    if "is_active" not in body or body["is_active"] is None:
        return jsonify({
            "status": "error",
            "message": "Trường is_active là bắt buộc (true/false).",
            "code": "MISSING_IS_ACTIVE"
        }), 400

    is_active = bool(body["is_active"])
    try:
        updated_customer = AdminService.toggle_customer_status(
            customer_id=customer_id,
            is_active=is_active,
        )
        msg = "Khóa tài khoản khách hàng thành công." if not is_active else "Mở khóa tài khoản khách hàng thành công."
        return _success(
            data=updated_customer,
            message=msg,
            status=200,
        )
    except ValueError as exc:
        err_str = str(exc)
        if err_str == "CUSTOMER_NOT_FOUND":
            return jsonify({
                "status": "error",
                "message": "Không tìm thấy khách hàng trong hệ thống.",
                "code": "CUSTOMER_NOT_FOUND"
            }), 404
        return jsonify({"status": "error", "message": err_str, "code": "BAD_REQUEST"}), 400


@admin_bp.route("/customers", methods=["POST"])
@admin_required()
def create_admin_customer():
    """
    Quản trị viên thêm tài khoản người dùng / admin mới.
    """
    from flask import request
    from app.services.admin_service import AdminService

    body = request.get_json() or {}
    try:
        new_account = AdminService.create_admin_account(body)
        return _success(
            data=new_account,
            message="Tạo tài khoản mới thành công.",
            status=201,
        )
    except ValueError as exc:
        err_str = str(exc)
        msg_map = {
            "EMAIL_REQUIRED": "Email là bắt buộc.",
            "EMAIL_ALREADY_EXISTS": "Email này đã được đăng ký trong hệ thống.",
            "FULL_NAME_REQUIRED": "Họ tên là bắt buộc.",
            "PASSWORD_TOO_SHORT": "Mật khẩu phải có ít nhất 6 ký tự.",
        }
        return jsonify({
            "status": "error",
            "message": msg_map.get(err_str, err_str),
            "code": err_str,
        }), 400


@admin_bp.route("/customers/<int:customer_id>/role", methods=["PUT"])
@admin_required()
def update_admin_customer_role(customer_id: int):
    """
    Quản trị viên phân quyền tài khoản (user/admin).
    """
    from flask import request
    from app.services.admin_service import AdminService

    body = request.get_json() or {}
    role = body.get("role")
    if not role:
        return jsonify({
            "status": "error",
            "message": "Vai trò (role) là bắt buộc.",
            "code": "MISSING_ROLE"
        }), 400

    try:
        updated_customer = AdminService.update_customer_role(customer_id, role)
        return _success(
            data=updated_customer,
            message=f"Phân quyền tài khoản thành '{role}' thành công.",
            status=200,
        )
    except ValueError as exc:
        err_str = str(exc)
        if err_str == "CUSTOMER_NOT_FOUND":
            return jsonify({
                "status": "error",
                "message": "Không tìm thấy tài khoản.",
                "code": "CUSTOMER_NOT_FOUND"
            }), 404
        return jsonify({"status": "error", "message": err_str, "code": "BAD_REQUEST"}), 400


# ============================================================
# GET /api/v1/admin/analytics/categories — Thống kê theo danh mục (NT-13-CN-002)
# ============================================================
@admin_bp.route("/analytics/categories", methods=["GET"])
@admin_required()
def get_category_analytics():
    """
    Lấy thống kê số lượng sản phẩm bán ra và doanh thu theo từng danh mục (NT-13-CN-002).

    Query Parameters:
        time_range (str): 'today', 'this_week', 'this_month', 'this_year', 'all', 'custom'
        start_date (str): YYYY-MM-DD
        end_date (str): YYYY-MM-DD
    """
    from flask import request
    from app.services.admin_service import AdminService

    time_range = request.args.get("time_range", "this_month")
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")

    data = AdminService.get_category_analytics(
        time_range=time_range,
        start_date=start_date,
        end_date=end_date,
    )

    return _success(
        data=data,
        message="Lấy thống kê sản phẩm theo danh mục thành công.",
        status=200,
    )











