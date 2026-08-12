"""
app/routes/combos.py — REST API cho chức năng Đặt hàng Combo (NT-05-CN-005).

Endpoints:
- GET  /api/v1/combos — Lấy danh sách combo active
- GET  /api/v1/combos/<id> — Chi tiết 1 combo
- GET  /api/v1/combos/by-product/<product_id> — Lấy danh sách combo chứa sản phẩm cụ thể
- POST /api/v1/combos/<id>/add-to-cart — Thêm trọn bộ combo vào giỏ hàng (JWT Required)
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.combo_service import ComboService

combos_bp = Blueprint("combos", __name__, url_prefix="/api/v1/combos")


def _success(data=None, message="OK", status=200):
    return jsonify({"status": "success", "message": message, "data": data}), status


def _error(message="Error", code="BAD_REQUEST", status=400):
    return jsonify({"status": "error", "message": message, "code": code}), status


# ============================================================
# GET /api/v1/combos — Lấy danh sách combo active
# ============================================================
@combos_bp.route("", methods=["GET"])
def get_active_combos():
    combos = ComboService.get_active_combos()
    return _success(data=combos, message="Lấy danh sách combo thành công")


# ============================================================
# GET /api/v1/combos/by-product/<product_id> — Combos chứa product
# ============================================================
@combos_bp.route("/by-product/<int:product_id>", methods=["GET"])
def get_combos_by_product(product_id: int):
    combos = ComboService.get_combos_by_product_id(product_id)
    return _success(data=combos, message="Lấy combo theo sản phẩm thành công")


# ============================================================
# GET /api/v1/combos/<id> — Chi tiết 1 combo
# ============================================================
@combos_bp.route("/<int:combo_id>", methods=["GET"])
def get_combo_detail(combo_id: int):
    combo = ComboService.get_combo_by_id(combo_id)
    if not combo:
        return _error(message="Không tìm thấy bộ sản phẩm combo.", code="COMBO_NOT_FOUND", status=404)
    return _success(data=combo, message="Lấy chi tiết combo thành công")


# ============================================================
# POST /api/v1/combos/<id>/add-to-cart — Thêm combo vào giỏ hàng
# ============================================================
@combos_bp.route("/<int:combo_id>/add-to-cart", methods=["POST"])
@jwt_required()
def add_combo_to_cart(combo_id: int):
    user_id = int(get_jwt_identity())
    try:
        result = ComboService.add_combo_to_cart(combo_id=combo_id, user_id=user_id)
        return _success(data=result, message=f"Đã thêm trọn bộ combo '{result['combo_name']}' vào giỏ hàng!")
    except ValueError as exc:
        err_code = str(exc)
        if err_code == "COMBO_NOT_FOUND":
            return _error(message="Không tìm thấy combo yêu cầu.", code="COMBO_NOT_FOUND", status=404)
        elif err_code == "COMBO_INACTIVE":
            return _error(message="Bộ sản phẩm combo này hiện đang ngưng áp dụng.", code="COMBO_INACTIVE", status=400)
        elif err_code == "COMBO_OUT_OF_STOCK":
            return _error(
                message="Combo tạm thời không khả dụng do có sản phẩm thành phần đã hết hàng.",
                code="COMBO_OUT_OF_STOCK",
                status=400,
            )
        elif err_code == "COMBO_EMPTY":
            return _error(message="Combo không chứa sản phẩm nào.", code="COMBO_EMPTY", status=400)
        return _error(message=err_code, code="BAD_REQUEST", status=400)
