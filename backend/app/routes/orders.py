"""
app/routes/orders.py — REST API Endpoints cho Đơn hàng (NT-05-CN-001 COD, NT-05-CN-002 QR).

End-points:
- POST /api/v1/orders/cod — Đặt hàng Thanh toán khi nhận hàng (COD)
- POST /api/v1/orders/qr  — Đặt hàng Thanh toán QR ngân hàng
- GET  /api/v1/orders     — Danh sách đơn hàng người dùng
- GET  /api/v1/orders/<id>     — Chi tiết đơn hàng
- GET  /api/v1/orders/<id>/qr  — Lấy trạng thái QR (polling)
- PATCH /api/v1/orders/<id>/confirm-payment — Admin xác nhận thanh toán QR
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.services.order_service import OrderService
from app.services.qr_payment_service import QRPaymentService

orders_bp = Blueprint("orders", __name__, url_prefix="/api/v1/orders")


def _success(data=None, message="Thành công", status=200):
    res = {"status": "success", "message": message}
    if data is not None:
        res["data"] = data
    return jsonify(res), status


# ============================================================
# POST /api/v1/orders/cod — Tạo đơn hàng COD
# ============================================================
@orders_bp.route("/cod", methods=["POST"])
@jwt_required()
def create_cod_order():
    user_id = int(get_jwt_identity())
    body = request.get_json() or {}

    recipient_name = body.get("recipient_name", "").strip()
    recipient_phone = body.get("recipient_phone", "").strip()
    shipping_address = body.get("shipping_address", "").strip()
    note = body.get("note")
    coupon_code = body.get("coupon_code")

    if not recipient_name or not recipient_phone or not shipping_address:
        return jsonify({
            "status": "error",
            "message": "Vui lòng điền đầy đủ Họ tên, Số điện thoại và Địa chỉ giao hàng.",
            "code": "MISSING_SHIPPING_INFO",
        }), 400

    try:
        order = OrderService.create_cod_order(
            user_id=user_id,
            recipient_name=recipient_name,
            recipient_phone=recipient_phone,
            shipping_address=shipping_address,
            note=note,
            coupon_code=coupon_code,
        )
    except ValueError as exc:
        err_str = str(exc)
        if err_str == "CART_EMPTY":
            return jsonify({"status": "error", "message": "Giỏ hàng của bạn đang trống", "code": "CART_EMPTY"}), 400
        elif err_str.startswith("EXCEED_STOCK:"):
            parts = err_str.split(":")
            pname = parts[1] if len(parts) > 1 else "Sản phẩm"
            stock = parts[2] if len(parts) > 2 else "0"
            return jsonify({
                "status": "error",
                "message": f"Sản phẩm {pname} vượt quá tồn kho (còn lại: {stock} sản phẩm).",
                "code": "EXCEED_STOCK",
            }), 400
        elif err_str.startswith("MIN_ORDER_VALUE_NOT_MET:"):
            return jsonify({"status": "error", "message": "Mã giảm giá chưa đạt giá trị đơn hàng tối thiểu.", "code": "MIN_ORDER_VALUE_NOT_MET"}), 400
        elif err_str == "COUPON_EXPIRED_OR_INVALID":
            return jsonify({"status": "error", "message": "Mã giảm giá không hợp lệ hoặc đã hết hạn.", "code": "COUPON_EXPIRED_OR_INVALID"}), 400
        return jsonify({"status": "error", "message": err_str, "code": "BAD_REQUEST"}), 400

    return _success(data=order, message="Đặt hàng COD thành công", status=201)


# ============================================================
# GET /api/v1/orders — Danh sách đơn hàng người dùng
# ============================================================
@orders_bp.route("", methods=["GET"])
@jwt_required()
def get_user_orders():
    user_id = int(get_jwt_identity())
    status_filter = request.args.get("status")
    orders = OrderService.get_user_orders(user_id, status_filter=status_filter)
    return _success(data=orders, status=200)


# ============================================================
# GET /api/v1/orders/<int:order_id> — Chi tiết đơn hàng
# ============================================================
@orders_bp.route("/<int:order_id>", methods=["GET"])
@jwt_required()
def get_order_detail(order_id: int):
    user_id = int(get_jwt_identity())
    try:
        order = OrderService.get_order_detail(user_id, order_id)
    except ValueError as exc:
        err_code = str(exc)
        if err_code == "FORBIDDEN":
            return jsonify({
                "status": "error",
                "message": "Bạn không có quyền truy cập thông tin đơn hàng này.",
                "code": "FORBIDDEN",
            }), 403
        return jsonify({
            "status": "error",
            "message": "Đơn hàng không tồn tại.",
            "code": "ORDER_NOT_FOUND",
        }), 404

    return _success(data=order, status=200)


# ============================================================
# POST /api/v1/orders/qr — Tạo đơn Thanh toán QR ngân hàng
# ============================================================
@orders_bp.route("/qr", methods=["POST"])
@jwt_required()
def create_qr_order():
    user_id = int(get_jwt_identity())
    body = request.get_json() or {}

    recipient_name = body.get("recipient_name", "").strip()
    recipient_phone = body.get("recipient_phone", "").strip()
    shipping_address = body.get("shipping_address", "").strip()
    note = body.get("note")
    coupon_code = body.get("coupon_code")

    if not recipient_name or not recipient_phone or not shipping_address:
        return jsonify({
            "status": "error",
            "message": "Vui lòng điền đầy đủ Họ tên, Số điện thoại và Địa chỉ giao hàng.",
            "code": "MISSING_SHIPPING_INFO",
        }), 400

    try:
        result = QRPaymentService.create_qr_order(
            user_id=user_id,
            recipient_name=recipient_name,
            recipient_phone=recipient_phone,
            shipping_address=shipping_address,
            note=note,
            coupon_code=coupon_code,
        )
    except ValueError as exc:
        err_str = str(exc)
        if err_str == "CART_EMPTY":
            return jsonify({"status": "error", "message": "Giỏ hàng đang trống", "code": "CART_EMPTY"}), 400
        elif err_str.startswith("EXCEED_STOCK:"):
            parts = err_str.split(":")
            pname = parts[1] if len(parts) > 1 else "Sản phẩm"
            stock = parts[2] if len(parts) > 2 else "0"
            return jsonify({"status": "error", "message": f"Sản phẩm {pname} vượt quá tồn kho (còn lại: {stock}).", "code": "EXCEED_STOCK"}), 400
        elif err_str.startswith("MIN_ORDER_VALUE_NOT_MET:"):
            return jsonify({"status": "error", "message": "Mã giảm giá chưa đạt giá trị đơn hàng tối thiểu.", "code": "MIN_ORDER_VALUE_NOT_MET"}), 400
        return jsonify({"status": "error", "message": err_str, "code": "BAD_REQUEST"}), 400

    return _success(data=result, message="Đặt hàng QR thành công", status=201)


# ============================================================
# GET /api/v1/orders/<id>/qr — Lấy trạng thái QR (polling)
# ============================================================
@orders_bp.route("/<int:order_id>/qr", methods=["GET"])
@jwt_required()
def get_qr_status(order_id: int):
    user_id = int(get_jwt_identity())
    try:
        result = QRPaymentService.get_qr_status(order_id, user_id)
    except ValueError:
        return jsonify({"status": "error", "message": "Đơn hàng không tồn tại", "code": "ORDER_NOT_FOUND"}), 404
    return _success(data=result, status=200)


# ============================================================
# PATCH /api/v1/orders/<id>/confirm-payment — Admin xác nhận thanh toán
# ============================================================
@orders_bp.route("/<int:order_id>/confirm-payment", methods=["PATCH"])
@jwt_required()
def confirm_qr_payment(order_id: int):
    from app.models.user import User
    user_id = int(get_jwt_identity())
    admin = db.session.query(User).filter(User.id == user_id).first()
    if not admin or admin.role != "admin":
        return jsonify({"status": "error", "message": "Chỉ Admin được xác nhận thanh toán.", "code": "FORBIDDEN"}), 403

    try:
        order = QRPaymentService.confirm_payment(order_id)
    except ValueError as exc:
        err_str = str(exc)
        if err_str == "ORDER_NOT_FOUND":
            return jsonify({"status": "error", "message": "Đơn hàng không tồn tại", "code": "ORDER_NOT_FOUND"}), 404
        if err_str == "ALREADY_PAID":
            return jsonify({"status": "error", "message": "Đơn hàng này đã được xác nhận thanh toán.", "code": "ALREADY_PAID"}), 409
        return jsonify({"status": "error", "message": err_str, "code": "BAD_REQUEST"}), 400

    return _success(data=order, message="Xác nhận thanh toán thành công", status=200)


# ============================================================
# POST/PUT /api/v1/orders/<id>/cancel — Hủy đơn hàng (QTN-03, QTN-04)
# ============================================================
@orders_bp.route("/<int:order_id>/cancel", methods=["POST", "PUT"])
@jwt_required()
def cancel_order(order_id: int):
    user_id = int(get_jwt_identity())
    body = request.get_json(silent=True) or {}
    reason = body.get("reason", "").strip()

    try:
        order = OrderService.cancel_order(user_id=user_id, order_id=order_id, reason=reason)
        return _success(data=order, message="Đã hủy đơn hàng thành công và hoàn lại số lượng tồn kho.", status=200)
    except ValueError as exc:
        err_str = str(exc)
        if err_str == "ORDER_NOT_FOUND":
            return jsonify({"status": "error", "message": "Đơn hàng không tồn tại.", "code": "ORDER_NOT_FOUND"}), 404
        elif err_str == "FORBIDDEN":
            return jsonify({"status": "error", "message": "Bạn không có quyền hủy đơn hàng này.", "code": "FORBIDDEN"}), 403
        elif err_str == "ORDER_ALREADY_CANCELLED":
            return jsonify({"status": "error", "message": "Đơn hàng này đã được hủy trước đó.", "code": "ORDER_ALREADY_CANCELLED"}), 400
        elif err_str == "CANNOT_CANCEL_SHIPPED_ORDER":
            return jsonify({
                "status": "error",
                "message": "Đơn hàng đã qua giai đoạn có thể hủy. Không thể hủy đơn khi đã giao cho vận chuyển.",
                "code": "CANNOT_CANCEL_SHIPPED_ORDER",
            }), 400
        return jsonify({"status": "error", "message": err_str, "code": "BAD_REQUEST"}), 400


# ============================================================
# PUT /api/v1/orders/<id>/status — Admin cập nhật trạng thái đơn (NT-06-CN-006)
# ============================================================
@orders_bp.route("/<int:order_id>/status", methods=["PUT", "PATCH"])
@jwt_required()
def update_order_status(order_id: int):
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


