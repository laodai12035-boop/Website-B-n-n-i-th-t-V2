"""
app/services/stock_service.py — Service quản lý kho và lập phiếu nhập kho sản phẩm (NT-09-CN-001).
"""

from datetime import datetime
from typing import List, Dict, Any, Optional
from app.extensions import db
from app.models.product import Product
from app.models.stock_receipt import StockReceipt


class StockService:
    """Service xử lý nghiệp vụ nhập kho và quản lý tồn kho sản phẩm."""

    @staticmethod
    def import_stock(data: Dict[str, Any], admin_id: Optional[int] = None) -> Dict[str, Any]:
        """
        Ghi nhận phiếu nhập kho sản phẩm và cộng tích lũy tồn kho hiện tại (NT-09-CN-001).

        Args:
            data: {
                "product_id": int,
                "quantity": int,
                "import_date": Optional[str],  # ISO format string or YYYY-MM-DD
                "supplier": Optional[str],
                "unit_cost": Optional[float],
                "note": Optional[str]
            }
            admin_id: ID Admin thực hiện nhập kho

        Returns:
            Dict thông tin phiếu nhập kho và kết quả tồn kho mới.

        Raises:
            ValueError:
                - "PRODUCT_NOT_FOUND": Sản phẩm không tồn tại (404)
                - "INVALID_QUANTITY": Số lượng nhập <= 0 (400 - TC-02)
        """
        product_id = data.get("product_id")
        if not product_id:
            raise ValueError("PRODUCT_NOT_FOUND")

        product = db.session.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise ValueError("PRODUCT_NOT_FOUND")

        try:
            quantity = int(data.get("quantity", 0))
        except (ValueError, TypeError):
            raise ValueError("INVALID_QUANTITY")

        # TC-02: Số lượng nhập âm hoặc bằng 0
        if quantity <= 0:
            raise ValueError("INVALID_QUANTITY")

        # Ngày nhập kho (nếu không truyền ➔ lấy thời điểm hiện tại)
        import_date_str = data.get("import_date")
        if import_date_str:
            try:
                import_date = datetime.fromisoformat(str(import_date_str).replace("Z", "+00:00"))
            except ValueError:
                import_date = datetime.utcnow()
        else:
            import_date = datetime.utcnow()

        unit_cost = None
        if data.get("unit_cost") is not None and data.get("unit_cost") != "":
            try:
                unit_cost = float(data.get("unit_cost"))
            except (ValueError, TypeError):
                unit_cost = None

        old_stock = product.stock or 0
        new_stock = old_stock + quantity

        # 1. Cập nhật tồn kho sản phẩm (TC-01)
        product.stock = new_stock

        # 2. Tạo phiếu nhập kho StockReceipt
        receipt = StockReceipt(
            product_id=product.id,
            quantity=quantity,
            supplier=data.get("supplier", "").strip() if data.get("supplier") else None,
            unit_cost=unit_cost,
            import_date=import_date,
            note=data.get("note", "").strip() if data.get("note") else None,
            created_by=admin_id,
        )
        db.session.add(receipt)
        db.session.commit()

        receipt_dict = receipt.to_dict()
        receipt_dict["old_stock"] = old_stock
        receipt_dict["added_quantity"] = quantity
        receipt_dict["new_stock"] = new_stock

        return receipt_dict

    @staticmethod
    def get_stock_receipts(product_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Lấy danh sách tất cả các phiếu nhập kho (có thể lọc theo product_id)."""
        query = db.session.query(StockReceipt)
        if product_id:
            query = query.filter(StockReceipt.product_id == product_id)

        receipts = query.order_by(StockReceipt.id.desc()).all()
        return [r.to_dict() for r in receipts]
