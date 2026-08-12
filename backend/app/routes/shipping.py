"""
app/routes/shipping.py — REST API tính phí vận chuyển (QTN-07).

Endpoints:
- POST /api/v1/shipping/calculate — Tính phí vận chuyển theo giỏ hàng + địa chỉ
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.shipping_service import ShippingService

shipping_bp = Blueprint("shipping", __name__, url_prefix="/api/v1/shipping")


def _success(data=None, message="OK", status=200):
    return jsonify({"status": "success", "message": message, "data": data}), status


# ============================================================
# POST /api/v1/shipping/calculate — Tính phí vận chuyển
# ============================================================
@shipping_bp.route("/calculate", methods=["POST"])
@jwt_required()
def calculate_shipping():
    """
    Tính phí vận chuyển dựa trên giỏ hàng hiện tại của user và địa chỉ giao hàng.

    Request Body:
        { "shipping_address": "123 Nguyễn Huệ, TP.HCM" }

    Response 200:
        {
            "fee": 85000,
            "zone": "inner_city",
            "total_weight": 30.0,
            "missing_data_warning": false,
            "breakdown": [...]
        }
    """
    user_id = int(get_jwt_identity())
    body = request.get_json() or {}
    shipping_address = body.get("shipping_address", "").strip()

    if not shipping_address:
        return jsonify({
            "status": "error",
            "message": "Vui lòng nhập địa chỉ giao hàng.",
            "code": "MISSING_SHIPPING_ADDRESS",
        }), 400

    try:
        result = ShippingService.calculate_shipping_fee(user_id, shipping_address)
    except ValueError as exc:
        if str(exc) == "CART_EMPTY":
            return jsonify({
                "status": "error",
                "message": "Giỏ hàng đang trống, không thể tính phí vận chuyển.",
                "code": "CART_EMPTY",
            }), 400
        return jsonify({"status": "error", "message": str(exc), "code": "BAD_REQUEST"}), 400

    return _success(data=result, message="Tính phí vận chuyển thành công")
