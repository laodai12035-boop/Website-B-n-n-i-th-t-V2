"""
app/services/cart_service.py — Service xử lý Giỏ hàng và quy tắc QTN-02 (Không bán vượt tồn kho).
"""

import logging
from typing import Dict, Any, List
from app.extensions import db
from app.models.cart_item import CartItem
from app.models.product import Product

logger = logging.getLogger(__name__)


class CartService:
    """Service xử lý logic Giỏ hàng và kiểm tra tồn kho QTN-02."""

    @staticmethod
    def get_cart(user_id: int) -> Dict[str, Any]:
        """
        Lấy thông tin giỏ hàng của người dùng.

        Args:
            user_id: ID người dùng

        Returns:
            Dict gồm items list, cart_count, subtotal
        """
        cart_items = (
            db.session.query(CartItem)
            .filter(CartItem.user_id == user_id)
            .order_by(CartItem.added_at.desc())
            .all()
        )

        items_data = [item.to_dict() for item in cart_items]
        cart_count = sum(item.quantity for item in cart_items)
        subtotal = round(sum(float(item.to_dict()["subtotal"]) for item in cart_items), 2)

        return {
            "items": items_data,
            "cart_count": cart_count,
            "subtotal": subtotal,
        }

    @staticmethod
    def add_to_cart(user_id: int, product_id: int, quantity: int = 1) -> Dict[str, Any]:
        """
        Thêm sản phẩm vào giỏ hàng (Tuân thủ QTN-02).

        Args:
            user_id: ID người dùng
            product_id: ID sản phẩm
            quantity: Số lượng thêm (mặc định 1)

        Returns:
            Dict chứa giỏ hàng cập nhật.

        Raises:
            ValueError("INVALID_QUANTITY"): Số lượng không hợp lệ (<= 0).
            ValueError("PRODUCT_NOT_FOUND"): Sản phẩm không tồn tại hoặc ngưng kinh doanh.
            ValueError("EXCEED_STOCK:<stock>"): Vi phạm QTN-02 (Số lượng vượt tồn kho).
        """
        if quantity <= 0:
            raise ValueError("INVALID_QUANTITY")

        product = (
            db.session.query(Product)
            .filter(Product.id == product_id, Product.is_active == True)
            .first()
        )
        if not product:
            raise ValueError("PRODUCT_NOT_FOUND")

        existing_item = (
            db.session.query(CartItem)
            .filter(CartItem.user_id == user_id, CartItem.product_id == product_id)
            .first()
        )

        current_qty = existing_item.quantity if existing_item else 0
        target_qty = current_qty + quantity

        # Kiểm tra QTN-02 (Không bán vượt tồn kho)
        if target_qty > product.stock:
            raise ValueError(f"EXCEED_STOCK:{product.stock}")

        if existing_item:
            existing_item.quantity = target_qty
        else:
            new_item = CartItem(user_id=user_id, product_id=product_id, quantity=target_qty)
            db.session.add(new_item)

        db.session.commit()
        return CartService.get_cart(user_id)

    @staticmethod
    def update_quantity(user_id: int, product_id: int, quantity: int) -> Dict[str, Any]:
        """
        Cập nhật số lượng của một sản phẩm trong giỏ hàng (Tuân thủ QTN-02).
        Nếu số lượng <= 0 -> Tự động xóa sản phẩm khỏi giỏ hàng.

        Args:
            user_id: ID người dùng
            product_id: ID sản phẩm
            quantity: Số lượng mới

        Returns:
            Dict chứa thông tin giỏ hàng cập nhật.
        """
        if quantity <= 0:
            return CartService.remove_item(user_id, product_id)

        product = (
            db.session.query(Product)
            .filter(Product.id == product_id, Product.is_active == True)
            .first()
        )
        if not product:
            raise ValueError("PRODUCT_NOT_FOUND")

        existing_item = (
            db.session.query(CartItem)
            .filter(CartItem.user_id == user_id, CartItem.product_id == product_id)
            .first()
        )
        if not existing_item:
            raise ValueError("CART_ITEM_NOT_FOUND")

        # Kiểm tra QTN-02
        if quantity > product.stock:
            raise ValueError(f"EXCEED_STOCK:{product.stock}")

        existing_item.quantity = quantity
        db.session.commit()

        return CartService.get_cart(user_id)

    @staticmethod
    def remove_item(user_id: int, product_id: int) -> Dict[str, Any]:
        """
        Xóa sản phẩm khỏi giỏ hàng.
        """
        db.session.query(CartItem).filter(
            CartItem.user_id == user_id, CartItem.product_id == product_id
        ).delete()
        db.session.commit()
        return CartService.get_cart(user_id)

    @staticmethod
    def clear_cart(user_id: int) -> Dict[str, Any]:
        """
        Xóa sạch giỏ hàng của người dùng.
        """
        db.session.query(CartItem).filter(CartItem.user_id == user_id).delete()
        db.session.commit()
        return CartService.get_cart(user_id)
