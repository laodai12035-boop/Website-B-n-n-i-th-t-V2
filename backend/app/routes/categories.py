"""
routes/categories.py — HTTP handlers cho Danh mục sản phẩm (NT-08-CN-001).
"""

import logging
from flask import Blueprint, request, jsonify
from marshmallow import ValidationError

from app.schemas.category_schema import category_schema
from app.services.category_service import CategoryService
from app.utils.decorators import admin_required

logger = logging.getLogger(__name__)

categories_bp = Blueprint("categories", __name__)


def _success(data: dict, message: str, status: int = 200):
    """Helper trả về response thành công chuẩn."""
    return jsonify({"status": "success", "data": data, "message": message}), status


def _error(message: str, code: str, status: int, errors: dict = None):
    """Helper trả về response lỗi chuẩn."""
    body = {"status": "error", "message": message, "code": code}
    if errors:
        body["errors"] = errors
    return jsonify(body), status


# ============================================================
# GET /api/v1/categories — Public API lấy danh sách danh mục
# ============================================================
@categories_bp.route("/categories", methods=["GET"])
def get_categories():
    """
    Lấy danh sách tất cả danh mục sản phẩm (Public).

    Responses:
        200: Trả về danh sách danh mục
    """
    category_list = CategoryService.get_all_categories()
    return _success(
        data=category_list,
        message="Lấy danh sách danh mục sản phẩm thành công.",
        status=200,
    )


# ============================================================
# POST /api/v1/admin/categories — Admin thêm danh mục (NT-08-CN-001)
# ============================================================
@categories_bp.route("/admin/categories", methods=["POST"])
@admin_required()
def create_category():
    """
    Quản trị viên thêm danh mục sản phẩm mới (NT-08-CN-001).

    Request Body (JSON):
        name (str): Tên danh mục (bắt buộc, không trùng)
        description (str): Mô tả chi tiết (tùy chọn)
        icon (str): Icon/Emoji biểu tượng (tùy chọn)

    Header:
        Authorization: Bearer <admin_token>

    Responses:
        201: Thêm danh mục thành công
        400: Dữ liệu rỗng (VALIDATION_ERROR) / Trùng tên danh mục (CATEGORY_EXISTS)
        401: Chưa đăng nhập
        403: Không có quyền Admin (FORBIDDEN)
    """
    json_data = request.get_json(silent=True) or {}

    # 1. Validate request schema
    try:
        data = category_schema.load(json_data)
    except ValidationError as exc:
        return _error(
            message="Dữ liệu danh mục không hợp lệ.",
            code="VALIDATION_ERROR",
            status=400,
            errors=exc.messages,
        )

    # 2. Gọi CategoryService tạo danh mục
    try:
        new_category = CategoryService.create_category(data=data)
        return _success(
            data=new_category,
            message="Thêm danh mục sản phẩm mới thành công.",
            status=201,
        )
    except ValueError as exc:
        if str(exc) == "CATEGORY_EXISTS":
            return _error(
                message="Tên danh mục đã tồn tại.",
                code="CATEGORY_EXISTS",
                status=400,
            )
        return _error(message=str(exc), code="BAD_REQUEST", status=400)


# ============================================================
# PUT /api/v1/admin/categories/<int:category_id> — Admin sửa danh mục (NT-08-CN-002)
# ============================================================
@categories_bp.route("/admin/categories/<int:category_id>", methods=["PUT"])
@admin_required()
def update_category(category_id: int):
    """
    Quản trị viên chỉnh sửa danh mục sản phẩm (NT-08-CN-002).

    Responses:
        200: Cập nhật danh mục thành công
        400: Dữ liệu không hợp lệ (VALIDATION_ERROR / CATEGORY_EXISTS)
        403: Không có quyền Admin (FORBIDDEN)
        404: Danh mục không tồn tại (CATEGORY_NOT_FOUND)
    """
    json_data = request.get_json(silent=True) or {}

    try:
        data = category_schema.load(json_data)
    except ValidationError as exc:
        return _error(
            message="Dữ liệu danh mục không hợp lệ.",
            code="VALIDATION_ERROR",
            status=400,
            errors=exc.messages,
        )

    try:
        updated = CategoryService.update_category(category_id=category_id, data=data)
        return _success(
            data=updated,
            message="Cập nhật danh mục sản phẩm thành công.",
            status=200,
        )
    except ValueError as exc:
        err_str = str(exc)
        if err_str == "CATEGORY_NOT_FOUND":
            return _error(
                message="Không tìm thấy danh mục sản phẩm.",
                code="CATEGORY_NOT_FOUND",
                status=404,
            )
        elif err_str == "CATEGORY_EXISTS":
            return _error(
                message="Tên danh mục đã tồn tại.",
                code="CATEGORY_EXISTS",
                status=400,
            )
        return _error(message=err_str, code="BAD_REQUEST", status=400)


# ============================================================
# DELETE /api/v1/admin/categories/<int:category_id> — Admin xóa danh mục (NT-08-CN-002)
# ============================================================
@categories_bp.route("/admin/categories/<int:category_id>", methods=["DELETE"])
@admin_required()
def delete_category(category_id: int):
    """
    Quản trị viên xóa danh mục sản phẩm (NT-08-CN-002).
    Chỉ cho phép xóa khi danh mục không còn sản phẩm nào.

    Responses:
        200: Xóa danh mục thành công
        400: Danh mục còn sản phẩm (CATEGORY_HAS_PRODUCTS)
        403: Không có quyền Admin (FORBIDDEN)
        404: Danh mục không tồn tại (CATEGORY_NOT_FOUND)
    """
    try:
        CategoryService.delete_category(category_id=category_id)
        return _success(
            data={"id": category_id},
            message="Xóa danh mục sản phẩm thành công.",
            status=200,
        )
    except ValueError as exc:
        err_str = str(exc)
        if err_str == "CATEGORY_NOT_FOUND":
            return _error(
                message="Không tìm thấy danh mục sản phẩm.",
                code="CATEGORY_NOT_FOUND",
                status=404,
            )
        elif err_str.startswith("CATEGORY_HAS_PRODUCTS:"):
            count = err_str.split(":")[1]
            return _error(
                message=f"Không thể xóa danh mục này vì còn {count} sản phẩm đang sử dụng. Vui lòng di chuyển hoặc xóa sản phẩm trước.",
                code="CATEGORY_HAS_PRODUCTS",
                status=400,
            )
        return _error(message=err_str, code="BAD_REQUEST", status=400)

