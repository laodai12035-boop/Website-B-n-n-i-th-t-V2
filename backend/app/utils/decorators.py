"""
utils/decorators.py — Custom Flask Decorators cho Phân quyền (Authorization).

Thực thi Quy tắc nghiệp vụ QTN-09:
Chỉ tài khoản có vai trò 'admin' mới được truy cập khu vực quản trị.
"""

import logging
from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models.user import User

logger = logging.getLogger(__name__)


def admin_required():
    """
    Decorator kiểm tra tài khoản có vai trò Quản trị viên (Admin) — QTN-09.

    Tự động bao gồm @jwt_required().

    Responses:
        401: Thiếu hoặc Token hết hạn (xử lý từ jwt_required)
        403: Không phải Admin hoặc tài khoản bị khóa (code: FORBIDDEN)
    """
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            current_user_id = get_jwt_identity()
            user = db.session.get(User, int(current_user_id))

            if not user or not user.is_active or user.role != "admin":
                logger.warning(
                    "[QTN-09 SECURITY ALERT] Unauthorized admin access attempt: user_id=%s role=%s IP=%s path=%s",
                    current_user_id,
                    user.role if user else "None",
                    request.remote_addr,
                    request.path,
                )
                return (
                    jsonify(
                        {
                            "status": "error",
                            "message": "Bạn không có quyền truy cập khu vực quản trị",
                            "code": "FORBIDDEN",
                        }
                    ),
                    403,
                )

            return fn(*args, **kwargs)

        return wrapper

    return decorator
