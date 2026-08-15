"""
app/routes/returns.py — REST API cho Yêu cầu Đổi/Trả hàng (NT-06-CN-004, QTN-05).

Endpoints:
- POST  /api/v1/returns — Gửi yêu cầu đổi/trả
- GET   /api/v1/returns/my-requests — Lấy danh sách yêu cầu của tôi
- GET   /api/v1/returns/order/<order_id> — Lấy chi tiết yêu cầu theo đơn
- GET   /api/v1/returns/admin — Lấy danh sách tất cả yêu cầu (Admin)
- PATCH /api/v1/returns/admin/<request_id> — Duyệt/Từ chối yêu cầu (Admin)
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.return_service import ReturnService

returns_bp = Blueprint("returns", __name__, url_prefix="/api/v1/returns")


def _success(data=None, message="Thành công", status=200):
    return jsonify({"status": "success", "message": message, "data": data}), status


def _error(message="Lỗi", code="BAD_REQUEST", status=400):
    return jsonify({"status": "error", "message": message, "code": code}), status


# ============================================================
# POST /api/v1/returns — Khách gửi yêu cầu đổi/trả (QTN-05)
# ============================================================
@returns_bp.route("", methods=["POST"])
@jwt_required()
def create_return_request():
    user_id = int(get_jwt_identity())
    body = request.get_json(silent=True) or {}

    order_id = body.get("order_id")
    request_type = body.get("request_type", "return")
    reason = body.get("reason", "").strip()
    proof_image_url = body.get("proof_image_url")

    if not order_id:
        return _error(message="Mã đơn hàng order_id là bắt buộc.", code="MISSING_ORDER_ID", status=400)

    if not reason:
        return _error(message="Vui lòng cung cấp lý do đổi/trả sản phẩm.", code="MISSING_REASON", status=400)

    try:
        req = ReturnService.create_return_request(
            user_id=user_id,
            order_id=order_id,
            request_type=request_type,
            reason=reason,
            proof_image_url=proof_image_url,
        )
        return _success(
            data=req,
            message="Đã gửi yêu cầu đổi/trả hàng thành công. Yêu cầu của bạn đã được ghi nhận và chuyển cho Admin xử lý.",
            status=201,
        )
    except ValueError as exc:
        err_str = str(exc)
        if err_str == "ORDER_NOT_FOUND":
            return _error(message="Đơn hàng không tồn tại.", code="ORDER_NOT_FOUND", status=404)
        elif err_str == "FORBIDDEN":
            return _error(message="Bạn không có quyền gửi yêu cầu đổi/trả cho đơn hàng này.", code="FORBIDDEN", status=403)
        elif err_str == "ORDER_NOT_DELIVERED":
            return _error(
                message="Yêu cầu đổi/trả chỉ áp dụng cho các đơn hàng đã giao thành công.",
                code="ORDER_NOT_DELIVERED",
                status=400,
            )
        elif err_str == "EXPIRED_RETURN_PERIOD":
            return _error(
                message="Đơn hàng đã quá thời hạn 30 ngày đổi/trả theo quy định QTN-05.",
                code="EXPIRED_RETURN_PERIOD",
                status=400,
            )
        elif err_str == "RETURN_REQUEST_EXISTS":
            return _error(
                message="Đơn hàng này đã có yêu cầu đổi/trả đang được xử lý.",
                code="RETURN_REQUEST_EXISTS",
                status=400,
            )
        elif err_str == "INVALID_REQUEST_TYPE":
            return _error(message="Loại yêu cầu không hợp lệ (hợp lệ: return, exchange, warranty).", code="INVALID_REQUEST_TYPE", status=400)
        return _error(message=err_str, code="BAD_REQUEST", status=400)


# ============================================================
# GET /api/v1/returns/my-requests — Danh sách yêu cầu của tôi
# ============================================================
@returns_bp.route("/my-requests", methods=["GET"])
@jwt_required()
def get_my_return_requests():
    user_id = int(get_jwt_identity())
    requests = ReturnService.get_user_return_requests(user_id)
    return _success(data=requests, message="Lấy danh sách yêu cầu đổi/trả thành công", status=200)


# ============================================================
# GET /api/v1/returns/order/<order_id> — Yêu cầu đổi trả của đơn
# ============================================================
@returns_bp.route("/order/<int:order_id>", methods=["GET"])
@jwt_required()
def get_return_request_by_order(order_id: int):
    user_id = int(get_jwt_identity())
    try:
        req = ReturnService.get_return_request_by_order(user_id=user_id, order_id=order_id)
        return _success(data=req, status=200)
    except ValueError as exc:
        if str(exc) == "FORBIDDEN":
            return _error(message="Bạn không có quyền truy cập yêu cầu đổi/trả này.", code="FORBIDDEN", status=403)
        return _error(message=str(exc), code="BAD_REQUEST", status=400)


# ============================================================
# GET /api/v1/returns/admin — Admin danh sách tất cả yêu cầu
# ============================================================
@returns_bp.route("/admin", methods=["GET"])
@jwt_required()
def admin_get_all_return_requests():
    from app.models.user import User
    from app.extensions import db
    user_id = int(get_jwt_identity())
    admin = db.session.query(User).filter(User.id == user_id).first()
    if not admin or admin.role != "admin":
        return _error(message="Chỉ Admin được truy cập.", code="FORBIDDEN", status=403)

    requests = ReturnService.get_all_return_requests()
    return _success(data=requests, status=200)


# ============================================================
# PATCH/PUT /api/v1/returns/admin/<request_id> — Admin cập nhật
# ============================================================
@returns_bp.route("/admin/<int:request_id>", methods=["PATCH", "PUT"])
@jwt_required()
def admin_update_return_request(request_id: int):
    admin_id = int(get_jwt_identity())
    body = request.get_json(silent=True) or {}
    status = body.get("status")
    admin_note = body.get("admin_note")

    if not status:
        return _error(message="Trạng thái status là bắt buộc.", code="MISSING_STATUS", status=400)

    try:
        req = ReturnService.update_return_request_status(
            admin_id=admin_id,
            request_id=request_id,
            status=status,
            admin_note=admin_note,
        )
        return _success(data=req, message="Cập nhật trạng thái yêu cầu đổi/trả thành công", status=200)
    except ValueError as exc:
        err_str = str(exc)
        if err_str == "FORBIDDEN":
            return _error(message="Chỉ Admin mới có quyền thực hiện.", code="FORBIDDEN", status=403)
        elif err_str == "REQUEST_NOT_FOUND":
            return _error(message="Không tìm thấy yêu cầu đổi/trả.", code="REQUEST_NOT_FOUND", status=404)
        return _error(message=err_str, code="BAD_REQUEST", status=400)
