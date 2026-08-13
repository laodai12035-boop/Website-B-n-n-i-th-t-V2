"""
routes/addresses.py — HTTP handlers cho Quản lý Địa chỉ giao hàng (NT-07).
"""

import logging
from flask import Blueprint, request, jsonify
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.schemas.address_schema import address_schema
from app.services.address_service import AddressService

logger = logging.getLogger(__name__)

addresses_bp = Blueprint("addresses", __name__)


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
# GET /api/v1/addresses — Lấy danh sách địa chỉ giao hàng của User
# ============================================================
@addresses_bp.route("", methods=["GET"])
@jwt_required()
def get_user_addresses():
    """
    Lấy danh sách địa chỉ giao hàng của tài khoản đang đăng nhập.

    Header:
        Authorization: Bearer <user_token>

    Responses:
        200: Trả về danh sách địa chỉ
        401: Chưa đăng nhập
    """
    user_id = int(get_jwt_identity())
    address_list = AddressService.get_user_addresses(user_id)
    return _success(
        data=address_list,
        message="Lấy danh sách địa chỉ giao hàng thành công.",
        status=200,
    )


# ============================================================
# POST /api/v1/addresses — Thêm địa chỉ giao hàng mới (NT-07-CN-001)
# ============================================================
@addresses_bp.route("", methods=["POST"])
@jwt_required()
def create_address():
    """
    Thêm địa chỉ giao hàng mới cho tài khoản (NT-07-CN-001).

    Request Body (JSON):
        recipient_name (str): Họ tên người nhận (bắt buộc)
        phone (str):          Số điện thoại VN (10 chữ số, bắt đầu 0)
        province (str):       Tỉnh/Thành phố (bắt buộc)
        district (str):       Quận/Huyện (bắt buộc)
        ward (str):           Phường/Xã (bắt buộc)
        detail_address (str): Địa chỉ chi tiết (bắt buộc)
        is_default (bool):    Đánh dấu làm mặc định (tùy chọn)

    Header:
        Authorization: Bearer <user_token>

    Responses:
        201: Thêm địa chỉ mới thành công
        400: Dữ liệu không hợp lệ (VALIDATION_ERROR / MAX_ADDRESSES_REACHED)
        401: Chưa đăng nhập
    """
    user_id = int(get_jwt_identity())
    json_data = request.get_json(silent=True) or {}

    # 1. Validate request schema
    try:
        data = address_schema.load(json_data)
    except ValidationError as exc:
        return _error(
            message="Dữ liệu không hợp lệ",
            code="VALIDATION_ERROR",
            status=400,
            errors=exc.messages,
        )

    # 2. Gọi AddressService tạo địa chỉ
    try:
        new_address = AddressService.create_address(user_id=user_id, data=data)
        return _success(
            data=new_address,
            message="Thêm địa chỉ giao hàng mới thành công.",
            status=201,
        )
    except ValueError as exc:
        err_str = str(exc)
        if err_str == "MAX_ADDRESSES_REACHED":
            return _error(
                message="Tài khoản của bạn đã đạt giới hạn tối đa 10 địa chỉ giao hàng.",
                code="MAX_ADDRESSES_REACHED",
                status=400,
            )
        return _error(message=err_str, code="BAD_REQUEST", status=400)


# ============================================================
# PUT /api/v1/addresses/<int:address_id> — Sửa địa chỉ (NT-07-CN-002)
# ============================================================
@addresses_bp.route("/<int:address_id>", methods=["PUT"])
@jwt_required()
def update_address(address_id: int):
    """
    Sửa thông tin địa chỉ giao hàng (NT-07-CN-002).

    Responses:
        200: Cập nhật địa chỉ thành công
        400: Dữ liệu không hợp lệ (VALIDATION_ERROR)
        403: Không có quyền thao tác (FORBIDDEN_ACCESS)
        404: Địa chỉ không tồn tại (ADDRESS_NOT_FOUND)
    """
    user_id = int(get_jwt_identity())
    json_data = request.get_json(silent=True) or {}

    try:
        data = address_schema.load(json_data)
    except ValidationError as exc:
        return _error(
            message="Dữ liệu không hợp lệ",
            code="VALIDATION_ERROR",
            status=400,
            errors=exc.messages,
        )

    try:
        updated = AddressService.update_address(user_id=user_id, address_id=address_id, data=data)
        return _success(
            data=updated,
            message="Cập nhật thông tin địa chỉ giao hàng thành công.",
            status=200,
        )
    except PermissionError:
        return _error(
            message="Bạn không có quyền thao tác trên địa chỉ giao hàng này.",
            code="FORBIDDEN_ACCESS",
            status=403,
        )
    except ValueError as exc:
        if str(exc) == "ADDRESS_NOT_FOUND":
            return _error(
                message="Không tìm thấy địa chỉ giao hàng.",
                code="ADDRESS_NOT_FOUND",
                status=404,
            )
        return _error(message=str(exc), code="BAD_REQUEST", status=400)


# ============================================================
# DELETE /api/v1/addresses/<int:address_id> — Xóa địa chỉ (NT-07-CN-002)
# ============================================================
@addresses_bp.route("/<int:address_id>", methods=["DELETE"])
@jwt_required()
def delete_address(address_id: int):
    """
    Xóa địa chỉ giao hàng (NT-07-CN-002).

    Responses:
        200: Xóa địa chỉ thành công
        403: Không có quyền xóa địa chỉ của người khác (FORBIDDEN_ACCESS)
        404: Địa chỉ không tồn tại (ADDRESS_NOT_FOUND)
    """
    user_id = int(get_jwt_identity())

    try:
        AddressService.delete_address(user_id=user_id, address_id=address_id)
        return _success(
            data={"id": address_id},
            message="Xóa địa chỉ giao hàng thành công.",
            status=200,
        )
    except PermissionError:
        return _error(
            message="Bạn không có quyền xóa địa chỉ giao hàng này.",
            code="FORBIDDEN_ACCESS",
            status=403,
        )
    except ValueError as exc:
        if str(exc) == "ADDRESS_NOT_FOUND":
            return _error(
                message="Không tìm thấy địa chỉ giao hàng.",
                code="ADDRESS_NOT_FOUND",
                status=404,
            )
        return _error(message=str(exc), code="BAD_REQUEST", status=400)

