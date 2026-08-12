"""
app/services/wishlist_service.py — Service xử lý logic Sản phẩm yêu thích (Wishlist).
"""

import logging
from typing import Dict, Any, List
from app.extensions import db
from app.models.wishlist import Wishlist
from app.models.product import Product

logger = logging.getLogger(__name__)


class WishlistService:
    """Service quản lý danh sách sản phẩm yêu thích của người dùng."""

    @staticmethod
    def get_user_wishlist(user_id: int) -> List[Dict[str, Any]]:
        """
        Lấy danh sách các sản phẩm đang được yêu thích của người dùng.

        Args:
            user_id: ID của người dùng

        Returns:
            List các product dictionary.
        """
        items = (
            db.session.query(Wishlist)
            .join(Product, Wishlist.product_id == Product.id)
            .filter(Wishlist.user_id == user_id, Product.is_active == True)
            .order_by(Wishlist.created_at.desc())
            .all()
        )
        return [w.product.to_dict() for w in items if w.product]

    @staticmethod
    def toggle_wishlist(user_id: int, product_id: int) -> Dict[str, Any]:
        """
        Thêm hoặc xóa sản phẩm khỏi danh sách yêu thích (Toggle mode).

        Args:
            user_id: ID của người dùng
            product_id: ID của sản phẩm

        Returns:
            Dict chứa { "is_wishlisted": bool, "message": str }

        Raises:
            ValueError("PRODUCT_NOT_FOUND"): Nếu sản phẩm không tồn tại.
        """
        product = (
            db.session.query(Product)
            .filter(Product.id == product_id, Product.is_active == True)
            .first()
        )
        if not product:
            raise ValueError("PRODUCT_NOT_FOUND")

        existing = (
            db.session.query(Wishlist)
            .filter(Wishlist.user_id == user_id, Wishlist.product_id == product_id)
            .first()
        )

        if existing:
            db.session.delete(existing)
            db.session.commit()
            return {
                "is_wishlisted": False,
                "message": "Đã xóa sản phẩm khỏi danh sách yêu thích",
                "product_id": product_id,
            }
        else:
            new_item = Wishlist(user_id=user_id, product_id=product_id)
            db.session.add(new_item)
            db.session.commit()
            return {
                "is_wishlisted": True,
                "message": "Đã thêm sản phẩm vào danh sách yêu thích",
                "product_id": product_id,
            }

    @staticmethod
    def remove_from_wishlist(user_id: int, product_id: int) -> bool:
        """
        Xóa trực tiếp sản phẩm khỏi danh sách yêu thích.

        Args:
            user_id: ID của người dùng
            product_id: ID của sản phẩm cần xóa

        Returns:
            bool: True nếu xóa thành công, False nếu sản phẩm chưa có trong danh sách.
        """
        existing = (
            db.session.query(Wishlist)
            .filter(Wishlist.user_id == user_id, Wishlist.product_id == product_id)
            .first()
        )
        if existing:
            db.session.delete(existing)
            db.session.commit()
            return True
        return False
