"""
app/routes/orders.py — REST API Endpoints cho Đơn hàng (NT-05-CN-001 COD).

End-points:
- POST /api/v1/orders/cod — Đặt hàng Thanh toán khi nhận hàng (COD)
- GET  /api/v1/orders — Danh sách đơn hàng người dùng
- GET  /api/v1/orders/<id> — Chi tiết đơn hàng
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.order_service import OrderService

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
    orders = OrderService.get_user_orders(user_id)
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
    except ValueError:
        return jsonify({"status": "error", "message": "Đơn hàng không tồn tại", "code": "ORDER_NOT_FOUND"}), 404
    return _success(data=order, status=200)
