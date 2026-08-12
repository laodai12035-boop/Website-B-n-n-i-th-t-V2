"""
app/routes/wishlist.py — Blueprint quản lý sản phẩm yêu thích (Wishlist).

Tất cả các API trong blueprint này đều yêu cầu đăng nhập (@jwt_required()).
"""

import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.services.wishlist_service import WishlistService

logger = logging.getLogger(__name__)

wishlist_bp = Blueprint("wishlist", __name__)


def _success(data=None, message="Thành công", status=200):
    return jsonify({"status": "success", "data": data or {}, "message": message}), status


def _error(message="Đã xảy ra lỗi", code="BAD_REQUEST", status=400):
    return jsonify({"status": "error", "message": message, "code": code}), status


# ============================================================
# GET /api/v1/wishlist — Xem danh sách sản phẩm yêu thích
# ============================================================
@wishlist_bp.route("", methods=["GET"])
@jwt_required()
def get_wishlist():
    """
    Lấy danh sách các sản phẩm yêu thích của người dùng hiện tại.
    """
    user_id = int(get_jwt_identity())
    items = WishlistService.get_user_wishlist(user_id)
    return _success(
        data={"items": items, "total": len(items)},
        message="Lấy danh sách sản phẩm yêu thích thành công",
        status=200,
    )


# ============================================================
# POST /api/v1/wishlist — Thêm hoặc Bỏ yêu thích sản phẩm (Toggle)
# ============================================================
@wishlist_bp.route("", methods=["POST"])
@jwt_required()
def toggle_wishlist():
    """
    Thêm hoặc xóa sản phẩm khỏi danh sách yêu thích.

    Body:
        product_id (int, required): ID sản phẩm
    """
    user_id = int(get_jwt_identity())
    body = request.get_json() or {}
    product_id = body.get("product_id")

    if not product_id:
        return _error("Thiếu product_id trong request body", code="MISSING_PRODUCT_ID", status=400)

    try:
        result = WishlistService.toggle_wishlist(user_id, int(product_id))
    except ValueError as exc:
        if str(exc) == "PRODUCT_NOT_FOUND":
            return _error("Sản phẩm không tồn tại hoặc đã ngưng kinh doanh", code="PRODUCT_NOT_FOUND", status=404)
        return _error(str(exc), code="BAD_REQUEST", status=400)

    status_code = 201 if result["is_wishlisted"] else 200
    return _success(data=result, message=result["message"], status=status_code)


# ============================================================
# DELETE /api/v1/wishlist/<int:product_id> — Xóa trực tiếp khỏi yêu thích
# ============================================================
@wishlist_bp.route("/<int:product_id>", methods=["DELETE"])
@jwt_required()
def remove_from_wishlist(product_id: int):
    """
    Xóa sản phẩm khỏi danh sách yêu thích theo ID.
    """
    user_id = int(get_jwt_identity())
    removed = WishlistService.remove_from_wishlist(user_id, product_id)
    if not removed:
        return _error("Sản phẩm không có trong danh sách yêu thích", code="ITEM_NOT_IN_WISHLIST", status=404)

    return _success(
        data={"product_id": product_id},
        message="Đã xóa sản phẩm khỏi danh sách yêu thích",
        status=200,
    )
