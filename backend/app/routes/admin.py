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

    from app.services.stock_service import StockService

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
    low_stock_res = StockService.get_low_stock_products()

    dashboard_data = {
        "stats": {
            "total_users": total_users,
            "total_orders": total_orders,
            "total_products": total_products,
            "revenue": formatted_revenue,
            "low_stock_count": low_stock_res["count"],
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








