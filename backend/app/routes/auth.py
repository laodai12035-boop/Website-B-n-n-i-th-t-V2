"""
routes/auth.py — HTTP handlers cho Authentication endpoints.

Layer này chỉ:
1. Parse và validate request (dùng Schema)
2. Gọi Service để xử lý business logic
3. Format response chuẩn và trả về HTTP status code

KHÔNG chứa business logic — đó là việc của AuthService.
"""

import logging
from flask import Blueprint, request, jsonify
from marshmallow import ValidationError

from app.schemas.auth_schema import register_schema
from app.services.auth_service import AuthService

logger = logging.getLogger(__name__)

auth_bp = Blueprint("auth", __name__)


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
# POST /api/v1/auth/register — Đăng ký tài khoản
# ============================================================
@auth_bp.route("/register", methods=["POST"])
def register():
    """
    Đăng ký tài khoản mới.

    Request body (JSON):
        full_name (str): Họ tên đầy đủ
        email (str):     Email hợp lệ, chưa đăng ký
        phone (str):     Số điện thoại VN (10 chữ số, bắt đầu 0)
        password (str):  Mật khẩu tối thiểu 8 ký tự

    Responses:
        201: Tài khoản tạo thành công
        400: Dữ liệu không hợp lệ (VALIDATION_ERROR)
        409: Email đã tồn tại (EMAIL_EXISTS)
        500: Lỗi server (SERVER_ERROR)
    """
    # 1. Parse JSON body
    json_data = request.get_json(silent=True)
    if not json_data:
        return _error(
            message="Request body phải là JSON hợp lệ",
            code="INVALID_JSON",
            status=400,
        )

    # 2. Validate schema (server-side — bắt buộc dù client đã validate)
    try:
        data = register_schema.load(json_data)
    except ValidationError as exc:
        return _error(
            message="Dữ liệu không hợp lệ",
            code="VALIDATION_ERROR",
            status=400,
            errors=exc.messages,
        )

    # 3. Gọi service — toàn bộ business logic ở đây
    try:
        user = AuthService.register(
            full_name=data["full_name"],
            email=data["email"],
            phone=data["phone"],
            password=data["password"],
        )
    except ValueError as exc:
        if str(exc) == "EMAIL_EXISTS":
            return _error(
                message="Email này đã được sử dụng",
                code="EMAIL_EXISTS",
                status=409,
            )
        return _error(message=str(exc), code="BUSINESS_ERROR", status=400)
    except RuntimeError:
        # Lỗi DB đã được log trong service
        return _error(
            message="Đã xảy ra lỗi, vui lòng thử lại sau",
            code="SERVER_ERROR",
            status=500,
        )

    # 4. Response thành công
    return _success(
        data=user.to_public_dict(),
        message="Đăng ký tài khoản thành công",
        status=201,
    )
