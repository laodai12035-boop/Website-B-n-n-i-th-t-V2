"""
app/routes/banners.py — Public HTTP handlers cho Banners Trang Chủ.
"""

import logging
from flask import Blueprint, jsonify
from app.services.banner_service import BannerService

logger = logging.getLogger(__name__)

banners_bp = Blueprint("banners", __name__)


def _success(data: dict, message: str, status: int = 200):
    return jsonify({"status": "success", "data": data, "message": message}), status


@banners_bp.route("", methods=["GET"])
def get_public_banners():
    """
    Lấy danh sách các banner quảng cáo trang chủ đang hoạt động (Public API).
    """
    banners = BannerService.get_public_banners()
    return _success(
        data=banners,
        message="Lấy danh sách banner trang chủ thành công.",
        status=200,
    )
