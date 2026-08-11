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

from flask_jwt_extended import jwt_required, get_jwt_identity

from app.schemas.auth_schema import register_schema, login_schema
from app.services.auth_service import AuthService
from app.models.user import User

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


# ============================================================
# POST /api/v1/auth/login — Đăng nhập hệ thống
# ============================================================
@auth_bp.route("/login", methods=["POST"])
def login():
    """
    Đăng nhập hệ thống.

    Request body (JSON):
        email (str):    Email đăng nhập
        password (str): Mật khẩu

    Responses:
        200: Đăng nhập thành công, trả về { token, user }
        400: Dữ liệu không hợp lệ (VALIDATION_ERROR)
        401: Sai email hoặc mật khẩu (INVALID_CREDENTIALS)
        403: Tài khoản bị khóa (ACCOUNT_LOCKED)
    """
    json_data = request.get_json(silent=True)
    if not json_data:
        return _error(
            message="Request body phải là JSON hợp lệ",
            code="INVALID_JSON",
            status=400,
        )

    try:
        data = login_schema.load(json_data)
    except ValidationError as exc:
        return _error(
            message="Dữ liệu không hợp lệ",
            code="VALIDATION_ERROR",
            status=400,
            errors=exc.messages,
        )

    try:
        token, user = AuthService.login(
            email=data["email"],
            password=data["password"],
        )
    except ValueError as exc:
        err_msg = str(exc)
        if err_msg == "INVALID_CREDENTIALS":
            return _error(
                message="Email hoặc mật khẩu không chính xác",
                code="INVALID_CREDENTIALS",
                status=401,
            )
        elif err_msg == "ACCOUNT_LOCKED":
            return _error(
                message="Tài khoản của bạn đã bị khóa. Vui lòng liên hệ bộ phận hỗ trợ.",
                code="ACCOUNT_LOCKED",
                status=403,
            )
        return _error(message=err_msg, code="BUSINESS_ERROR", status=400)

    return _success(
        data={
            "token": token,
            "user": user.to_dict(),
        },
        message="Đăng nhập thành công",
        status=200,
    )


# ============================================================
# GET /api/v1/auth/me — Lấy thông tin user hiện tại từ Token
# ============================================================
@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_me():
    """
    Lấy thông tin người dùng hiện tại từ JWT Token.

    Header:
        Authorization: Bearer <token>

    Responses:
        200: Trả về thông tin user
        401: Token không hợp lệ hoặc hết hạn
        404: Không tìm thấy user
    """
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))

    if not user or not user.is_active:
        return _error(
            message="Tài khoản không tồn tại hoặc đã bị khóa",
            code="UNAUTHORIZED",
            status=401,
        )

    return _success(
        data={"user": user.to_dict()},
        message="Lấy thông tin người dùng thành công",
        status=200,
    )

