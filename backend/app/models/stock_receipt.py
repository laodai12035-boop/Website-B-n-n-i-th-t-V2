"""
app/models/stock_receipt.py — SQLAlchemy model cho Phiếu nhập kho (NT-09-CN-001).
"""

from datetime import datetime
from app.extensions import db


class StockReceipt(db.Model):
    """Model lưu phiếu nhập kho sản phẩm."""

    __tablename__ = "stock_receipts"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    product_id = db.Column(
        db.Integer,
        db.ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Sản phẩm được nhập kho",
    )
    quantity = db.Column(db.Integer, nullable=False, comment="Số lượng nhập kho (> 0)")
    supplier = db.Column(db.String(200), nullable=True, comment="Nhà cung cấp / Xưởng sản xuất")
    unit_cost = db.Column(db.Float, nullable=True, comment="Giá nhập kho 1 đơn vị")
    import_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, comment="Ngày giờ nhập kho")
    note = db.Column(db.Text, nullable=True, comment="Ghi chú phiếu nhập")
    created_by = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        comment="Admin tạo phiếu",
    )
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    product = db.relationship("Product", backref="stock_receipts", lazy="joined")
    creator = db.relationship("User", backref="created_stock_receipts", lazy="joined")

    def __repr__(self) -> str:
        return f"<StockReceipt id={self.id} product_id={self.product_id} qty={self.quantity}>"

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "product_id": self.product_id,
            "product_name": self.product.name if self.product else None,
            "product_image": self.product.image_url if self.product else None,
            "quantity": self.quantity,
            "supplier": self.supplier,
            "unit_cost": self.unit_cost,
            "import_date": self.import_date.isoformat() if self.import_date else None,
            "note": self.note,
            "created_by": self.created_by,
            "creator_name": self.creator.full_name if self.creator else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
