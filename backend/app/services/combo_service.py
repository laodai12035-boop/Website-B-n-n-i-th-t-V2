"""
app/services/combo_service.py — Service xử lý logic nghiệp vụ cho Combo / Bộ sản phẩm (NT-05-CN-005).
"""

from typing import List, Dict, Any, Optional
from app.extensions import db
from app.models.combo import Combo, ComboItem
from app.models.product import Product
from app.models.cart_item import CartItem


class ComboService:
    """Service quản lý combo và thêm combo vào giỏ hàng."""

    @staticmethod
    def get_active_combos() -> List[Dict[str, Any]]:
        """Lấy danh sách tất cả các combo đang active."""
        combos = db.session.query(Combo).filter(Combo.is_active == True).all()
        return [c.to_dict() for c in combos]

    @staticmethod
    def get_combo_by_id(combo_id: int) -> Optional[Dict[str, Any]]:
        """Lấy chi tiết 1 combo theo ID."""
        combo = db.session.query(Combo).filter(Combo.id == combo_id, Combo.is_active == True).first()
        if not combo:
            return None
        return combo.to_dict()

    @staticmethod
    def get_combos_by_product_id(product_id: int) -> List[Dict[str, Any]]:
        """Lấy các combo active có chứa sản phẩm cụ thể (để hiển thị trên trang chi tiết sản phẩm)."""
        combo_items = (
            db.session.query(ComboItem)
            .join(Combo, ComboItem.combo_id == Combo.id)
            .filter(ComboItem.product_id == product_id, Combo.is_active == True)
            .all()
        )
        combo_ids = list(set(ci.combo_id for ci in combo_items))
        if not combo_ids:
            return []

        combos = db.session.query(Combo).filter(Combo.id.in_(combo_ids), Combo.is_active == True).all()
        return [c.to_dict() for c in combos]

    @staticmethod
    def add_combo_to_cart(combo_id: int, user_id: int) -> Dict[str, Any]:
        """
        Thêm toàn bộ sản phẩm trong combo vào giỏ hàng của user với giá ưu đãi combo.

        Args:
            combo_id: ID combo
            user_id: ID khách hàng

        Returns:
            Dict chứa chi tiết combo vừa thêm và danh sách các mặt hàng đã vào giỏ.

        Raises:
            ValueError: COMBO_NOT_FOUND (404), COMBO_INACTIVE (400), COMBO_OUT_OF_STOCK (400)
        """
        combo = db.session.query(Combo).filter(Combo.id == combo_id).first()
        if not combo:
            raise ValueError("COMBO_NOT_FOUND")

        if not combo.is_active:
            raise ValueError("COMBO_INACTIVE")

        if not combo.items:
            raise ValueError("COMBO_EMPTY")

        # 1. Kiểm tra tồn kho của tất cả các sản phẩm thành phần
        insufficient_products = []
        item_products = []

        for item in combo.items:
            product = db.session.query(Product).filter(
                Product.id == item.product_id, Product.is_active == True
            ).first()

            if not product:
                insufficient_products.append({"product_id": item.product_id, "reason": "NOT_AVAILABLE"})
                continue

            if product.stock < item.quantity:
                insufficient_products.append({
                    "product_id": product.id,
                    "product_name": product.name,
                    "requested": item.quantity,
                    "available": product.stock,
                    "reason": "OUT_OF_STOCK",
                })
            else:
                item_products.append((item, product))

        if insufficient_products:
            raise ValueError("COMBO_OUT_OF_STOCK")

        # 2. Thêm hoặc cập nhật từng sản phẩm trong giỏ hàng
        added_items = []
        for item, product in item_products:
            cart_item = db.session.query(CartItem).filter_by(
                user_id=user_id, product_id=product.id
            ).first()

            if cart_item:
                cart_item.quantity += item.quantity
            else:
                cart_item = CartItem(
                    user_id=user_id,
                    product_id=product.id,
                    quantity=item.quantity,
                )
                db.session.add(cart_item)

            added_items.append({
                "product_id": product.id,
                "product_name": product.name,
                "quantity_added": item.quantity,
            })

        db.session.commit()

        combo_dict = combo.to_dict()
        return {
            "combo_id": combo.id,
            "combo_name": combo.name,
            "discount_percent": combo.discount_percent,
            "combo_total": combo_dict["combo_total"],
            "savings": combo_dict["savings"],
            "added_items": added_items,
        }
