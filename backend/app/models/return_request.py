"""
app/models/return_request.py — SQLAlchemy Model cho Yêu cầu Đổi/Trả hàng (NT-06-CN-004, QTN-05).

Bảng return_requests lưu vết các yêu cầu đổi trả hoặc bảo hành của khách hàng đối với đơn đã giao.
"""

from datetime import datetime
from app.extensions import db


class ReturnRequest(db.Model):
    """Model đại diện cho 1 yêu cầu đổi hoặc trả hàng của khách hàng."""

    __tablename__ = "return_requests"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    order_id = db.Column(
        db.Integer,
        db.ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="ID đơn hàng yêu cầu đổi trả",
    )
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="ID khách hàng gửi yêu cầu",
    )
    request_type = db.Column(
        db.String(20),
        nullable=False,
        default="return",
        comment="Loại yêu cầu: 'return' (Trả hàng hoàn tiền), 'exchange' (Đổi hàng), 'warranty' (Bảo hành)",
    )
    reason = db.Column(
        db.Text,
        nullable=False,
        comment="Lý do chi tiết khách hàng đưa ra",
    )
    proof_image_url = db.Column(
        db.Text,
        nullable=True,
        comment="URL hình ảnh minh chứng lỗi/sản phẩm",
    )
    status = db.Column(
        db.String(20),
        nullable=False,
        default="pending",
        comment="Trạng thái xử lý: 'pending' (Chờ duyệt), 'approved' (Đã duyệt), 'rejected' (Từ chối)",
    )
    admin_note = db.Column(
        db.Text,
        nullable=True,
        comment="Ghi chú phản hồi của Admin",
    )
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    order = db.relationship("Order", backref=db.backref("return_requests", lazy="select", cascade="all, delete-orphan"))
    user = db.relationship("User", backref=db.backref("return_requests", lazy="select", cascade="all, delete-orphan"))

    def __repr__(self) -> str:
        return f"<ReturnRequest id={self.id} order_id={self.order_id} type='{self.request_type}' status='{self.status}'>"

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "order_id": self.order_id,
            "order_code": self.order.order_code if self.order else None,
            "user_id": self.user_id,
            "user_name": self.user.full_name if self.user else None,
            "user_email": self.user.email if self.user else None,
            "request_type": self.request_type,
            "reason": self.reason,
            "proof_image_url": self.proof_image_url,
            "status": self.status,
            "admin_note": self.admin_note,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "order_summary": {
                "order_code": self.order.order_code,
                "total_amount": float(self.order.total_amount),
                "order_created_at": self.order.created_at.isoformat() if self.order and self.order.created_at else None,
            } if self.order else None,
        }
