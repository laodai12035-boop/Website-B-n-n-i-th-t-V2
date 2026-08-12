"""
app/routes/coupons.py — REST API Endpoints cho Mã giảm giá (QTN-01).

End-points:
- POST /api/v1/coupons/apply — Áp dụng mã giảm giá vào đơn/giỏ hàng
- GET  /api/v1/coupons/active — Lấy danh sách mã giảm giá khả dụng
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.services.coupon_service import CouponService

coupons_bp = Blueprint("coupons", __name__, url_prefix="/api/v1/coupons")


def _success(data=None, message="Thành công", status=200):
    res = {"status": "success", "message": message}
    if data is not None:
        res["data"] = data
    return jsonify(res), status


# ============================================================
# POST /api/v1/coupons/apply — Áp dụng mã giảm giá QTN-01
# ============================================================
@coupons_bp.route("/apply", methods=["POST"])
@jwt_required()
def apply_coupon():
    body = request.get_json() or {}
    coupon_code = body.get("coupon_code", "").strip()
    subtotal = body.get("subtotal")

    if not coupon_code:
        return jsonify({"status": "error", "message": "Vui lòng nhập mã giảm giá", "code": "COUPON_EMPTY"}), 400

    if subtotal is None or not isinstance(subtotal, (int, float)) or subtotal <= 0:
        return jsonify({"status": "error", "message": "Giá trị đơn hàng không hợp lệ", "code": "INVALID_SUBTOTAL"}), 400

    try:
        result = CouponService.validate_and_apply(coupon_code, float(subtotal))
    except ValueError as exc:
        err_str = str(exc)
        if err_str.startswith("MIN_ORDER_VALUE_NOT_MET:"):
            min_val = float(err_str.split(":")[1])
            formatted_min = f"{min_val:,.0f}đ".replace(",", ".")
            return jsonify({
                "status": "error",
                "message": f"Đơn hàng chưa đạt giá trị tối thiểu {formatted_min} để áp dụng mã giảm giá này.",
                "code": "MIN_ORDER_VALUE_NOT_MET",
                "min_order_value": min_val,
            }), 400
        elif err_str == "COUPON_EXPIRED_OR_INVALID":
            return jsonify({
                "status": "error",
                "message": "Mã giảm giá không hợp lệ hoặc đã hết hạn sử dụng.",
                "code": "COUPON_EXPIRED_OR_INVALID",
            }), 400
        return jsonify({"status": "error", "message": err_str, "code": "BAD_REQUEST"}), 400

    return _success(data=result, message="Áp dụng mã giảm giá thành công", status=200)


# ============================================================
# GET /api/v1/coupons/active — Lấy danh sách mã khả dụng
# ============================================================
@coupons_bp.route("/active", methods=["GET"])
def get_active_coupons():
    coupons = CouponService.get_active_coupons()
    return _success(data=coupons, status=200)
