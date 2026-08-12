"""
app/routes/cart.py — Blueprint API cho Quản lý Giỏ hàng (Bảo mật JWT & Tuân thủ QTN-02).
"""

import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.services.cart_service import CartService

logger = logging.getLogger(__name__)

cart_bp = Blueprint("cart", __name__, url_prefix="/api/v1/cart")


def _success(data=None, message="Success", status=200):
    return jsonify({"status": "success", "message": message, "data": data}), status


# ============================================================
# GET /api/v1/cart — Lấy giỏ hàng người dùng
# ============================================================
@cart_bp.route("", methods=["GET"])
@jwt_required()
def get_cart():
    user_id = int(get_jwt_identity())
    cart = CartService.get_cart(user_id)
    return _success(data=cart, message="Lấy giỏ hàng thành công", status=200)


# ============================================================
# POST /api/v1/cart/items — Thêm sản phẩm vào giỏ (QTN-02)
# ============================================================
@cart_bp.route("/items", methods=["POST"])
@jwt_required()
def add_to_cart():
    user_id = int(get_jwt_identity())
    body = request.get_json() or {}

    product_id = body.get("product_id")
    quantity = body.get("quantity", 1)

    if not product_id or not isinstance(product_id, int):
        return jsonify({"status": "error", "message": "Vui lòng chọn sản phẩm hợp lệ", "code": "INVALID_PRODUCT"}), 400

    if not isinstance(quantity, int) or quantity <= 0:
        return jsonify({"status": "error", "message": "Số lượng thêm vào giỏ phải lớn hơn 0", "code": "INVALID_QUANTITY"}), 400

    try:
        updated_cart = CartService.add_to_cart(user_id, product_id, quantity)
    except ValueError as exc:
        err_str = str(exc)
        if err_str.startswith("EXCEED_STOCK:"):
            stock = err_str.split(":")[1]
            return jsonify({
                "status": "error",
                "message": f"Số lượng đặt vượt quá tồn kho hiện có (Tồn kho còn: {stock} sản phẩm).",
                "code": "EXCEED_STOCK",
                "available_stock": int(stock),
            }), 400
        elif err_str == "PRODUCT_NOT_FOUND":
            return jsonify({"status": "error", "message": "Sản phẩm không tồn tại hoặc đã bị ẩn", "code": "PRODUCT_NOT_FOUND"}), 404
        elif err_str == "INVALID_QUANTITY":
            return jsonify({"status": "error", "message": "Số lượng không hợp lệ", "code": "INVALID_QUANTITY"}), 400
        return jsonify({"status": "error", "message": err_str, "code": "BAD_REQUEST"}), 400

    return _success(data=updated_cart, message="Đã thêm sản phẩm vào giỏ hàng", status=200)


# ============================================================
# PUT /api/v1/cart/items/<int:product_id> — Cập nhật số lượng (QTN-02)
# ============================================================
@cart_bp.route("/items/<int:product_id>", methods=["PUT"])
@jwt_required()
def update_cart_item(product_id: int):
    user_id = int(get_jwt_identity())
    body = request.get_json() or {}

    quantity = body.get("quantity")
    if quantity is None or not isinstance(quantity, int):
        return jsonify({"status": "error", "message": "Vui lòng nhập số lượng hợp lệ", "code": "INVALID_QUANTITY"}), 400

    try:
        updated_cart = CartService.update_quantity(user_id, product_id, quantity)
    except ValueError as exc:
        err_str = str(exc)
        if err_str.startswith("EXCEED_STOCK:"):
            stock = err_str.split(":")[1]
            return jsonify({
                "status": "error",
                "message": f"Số lượng đặt vượt quá tồn kho hiện có (Tồn kho còn: {stock} sản phẩm).",
                "code": "EXCEED_STOCK",
                "available_stock": int(stock),
            }), 400
        elif err_str == "PRODUCT_NOT_FOUND":
            return jsonify({"status": "error", "message": "Sản phẩm không tồn tại", "code": "PRODUCT_NOT_FOUND"}), 404
        elif err_str == "CART_ITEM_NOT_FOUND":
            return jsonify({"status": "error", "message": "Sản phẩm chưa có trong giỏ hàng", "code": "CART_ITEM_NOT_FOUND"}), 404
        return jsonify({"status": "error", "message": err_str, "code": "BAD_REQUEST"}), 400

    return _success(data=updated_cart, message="Đã cập nhật số lượng giỏ hàng", status=200)


# ============================================================
# DELETE /api/v1/cart/items/<int:product_id> — Xóa item khỏi giỏ
# ============================================================
@cart_bp.route("/items/<int:product_id>", methods=["DELETE"])
@jwt_required()
def remove_cart_item(product_id: int):
    user_id = int(get_jwt_identity())
    updated_cart = CartService.remove_item(user_id, product_id)
    return _success(data=updated_cart, message="Đã xóa sản phẩm khỏi giỏ hàng", status=200)


# ============================================================
# DELETE /api/v1/cart/clear — Xóa sạch giỏ hàng
# ============================================================
@cart_bp.route("/clear", methods=["DELETE"])
@jwt_required()
def clear_cart():
    user_id = int(get_jwt_identity())
    updated_cart = CartService.clear_cart(user_id)
    return _success(data=updated_cart, message="Đã xóa toàn bộ giỏ hàng", status=200)
