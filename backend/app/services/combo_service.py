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

    @staticmethod
    def get_all_admin_combos() -> List[Dict[str, Any]]:
        """Lấy tất cả các combo cho trang quản trị Admin."""
        combos = db.session.query(Combo).order_by(Combo.id.desc()).all()
        return [c.to_dict() for c in combos]

    @staticmethod
    def create_combo(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Admin tạo combo mới (NT-08-CN-006).

        Args:
            data: {
                "name": str,
                "description": Optional[str],
                "discount_percent": float,
                "items": List[Dict[str, int]]
            }

        Returns:
            Dict thông tin combo vừa tạo.

        Raises:
            ValueError:
                - "INVALID_NAME": Tên combo không được để trống
                - "INVALID_ITEMS": Danh sách sản phẩm rỗng
                - "INVALID_DISCOUNT": % giảm giá không hợp lệ
                - "PRODUCT_INACTIVE_OR_NOT_FOUND": Có sản phẩm ngưng bán hoặc không tồn tại (TC-02)
        """
        name = data.get("name", "").strip() if data.get("name") else ""
        if not name:
            raise ValueError("INVALID_NAME")

        try:
            discount_percent = float(data.get("discount_percent", 0.0))
        except (ValueError, TypeError):
            raise ValueError("INVALID_DISCOUNT")

        if discount_percent < 0 or discount_percent > 100:
            raise ValueError("INVALID_DISCOUNT")

        items_input = data.get("items", [])
        if not items_input or not isinstance(items_input, list):
            raise ValueError("INVALID_ITEMS")

        validated_items = []
        for item in items_input:
            p_id = item.get("product_id")
            qty = item.get("quantity", 1)
            if not p_id or qty <= 0:
                raise ValueError("INVALID_ITEMS")

            product = db.session.query(Product).filter(Product.id == p_id).first()
            if not product or not product.is_active:
                raise ValueError("PRODUCT_INACTIVE_OR_NOT_FOUND")

            validated_items.append((p_id, qty))

        # Tạo Combo mới
        new_combo = Combo(
            name=name,
            description=data.get("description", "").strip() if data.get("description") else None,
            discount_percent=discount_percent,
            is_active=data.get("is_active", True),
        )
        db.session.add(new_combo)
        db.session.flush()

        # Tạo các ComboItem
        for p_id, qty in validated_items:
            combo_item = ComboItem(
                combo_id=new_combo.id,
                product_id=p_id,
                quantity=qty,
            )
            db.session.add(combo_item)

        db.session.commit()
        return new_combo.to_dict()

