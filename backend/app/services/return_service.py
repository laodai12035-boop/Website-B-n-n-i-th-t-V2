"""
app/services/return_service.py — Service quản lý Yêu cầu Đổi/Trả hàng (NT-06-CN-004, QTN-05).
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from app.extensions import db
from app.models.order import Order
from app.models.return_request import ReturnRequest
from app.models.user import User

# Quy tắc QTN-05: Thời hạn tối đa cho phép gửi yêu cầu đổi/trả (30 ngày kể từ khi nhận hàng)
MAX_RETURN_DAYS = 30


class ReturnService:
    """Service xử lý nghiệp vụ gửi và quản lý yêu cầu đổi/trả hàng."""

    @staticmethod
    def create_return_request(
        user_id: int,
        order_id: int,
        request_type: str,
        reason: str,
        proof_image_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Khách hàng gửi yêu cầu đổi/trả sản phẩm cho đơn hàng đã nhận.

        Args:
            user_id: ID khách hàng
            order_id: ID đơn hàng
            request_type: 'return' (Trả hàng), 'exchange' (Đổi hàng), 'warranty' (Bảo hành)
            reason: Lý do đổi trả
            proof_image_url: URL hình ảnh minh chứng (tùy chọn)

        Returns:
            Dict thông tin ReturnRequest vừa tạo.

        Raises:
            ValueError: ORDER_NOT_FOUND (404), FORBIDDEN (403),
                        ORDER_NOT_DELIVERED (400), EXPIRED_RETURN_PERIOD (400),
                        RETURN_REQUEST_EXISTS (400), INVALID_REQUEST_TYPE (400)
        """
        # 1. Kiểm tra đơn hàng tồn tại
        order = db.session.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise ValueError("ORDER_NOT_FOUND")

        # 2. Kiểm tra quyền sở hữu đơn hàng
        if order.user_id != user_id:
            user = db.session.query(User).filter(User.id == user_id).first()
            if not user or user.role != "admin":
                raise ValueError("FORBIDDEN")

        # 3. Kiểm tra điều kiện đã giao hàng
        if order.status != "delivered":
            raise ValueError("ORDER_NOT_DELIVERED")

        # 4. Kiểm tra điều kiện thời hạn 30 ngày (QTN-05)
        delivery_time = getattr(order, "updated_at", None) or order.created_at
        if delivery_time:
            time_elapsed = datetime.utcnow() - delivery_time
            if time_elapsed > timedelta(days=MAX_RETURN_DAYS):
                raise ValueError("EXPIRED_RETURN_PERIOD")

        # 5. Kiểm tra loại yêu cầu hợp lệ
        valid_types = ["return", "exchange", "warranty"]
        if request_type not in valid_types:
            raise ValueError("INVALID_REQUEST_TYPE")

        # 6. Kiểm tra xem đã có yêu cầu active nào cho đơn này chưa
        existing = db.session.query(ReturnRequest).filter(
            ReturnRequest.order_id == order_id,
            ReturnRequest.status.in_(["pending", "approved"]),
        ).first()
        if existing:
            raise ValueError("RETURN_REQUEST_EXISTS")

        # 7. Tạo yêu cầu đổi/trả
        req = ReturnRequest(
            order_id=order.id,
            user_id=user_id,
            request_type=request_type,
            reason=reason.strip() if reason else "Không có lý do cụ thể",
            proof_image_url=proof_image_url.strip() if proof_image_url else None,
            status="pending",
        )

        db.session.add(req)
        db.session.commit()

        return req.to_dict()

    @staticmethod
    def get_user_return_requests(user_id: int) -> List[Dict[str, Any]]:
        """Lấy danh sách yêu cầu đổi/trả của người dùng."""
        requests = (
            db.session.query(ReturnRequest)
            .filter(ReturnRequest.user_id == user_id)
            .order_by(ReturnRequest.created_at.desc())
            .all()
        )
        return [r.to_dict() for r in requests]

    @staticmethod
    def get_return_request_by_order(user_id: int, order_id: int) -> Optional[Dict[str, Any]]:
        """Lấy thông tin yêu cầu đổi/trả theo order_id."""
        req = (
            db.session.query(ReturnRequest)
            .filter(ReturnRequest.order_id == order_id)
            .order_by(ReturnRequest.created_at.desc())
            .first()
        )
        if not req:
            return None

        if req.user_id != user_id:
            user = db.session.query(User).filter(User.id == user_id).first()
            if not user or user.role != "admin":
                raise ValueError("FORBIDDEN")

        return req.to_dict()

    @staticmethod
    def get_all_return_requests() -> List[Dict[str, Any]]:
        """Admin: Lấy danh sách tất cả yêu cầu đổi/trả trong hệ thống."""
        requests = (
            db.session.query(ReturnRequest)
            .order_by(ReturnRequest.created_at.desc())
            .all()
        )
        return [r.to_dict() for r in requests]

    @staticmethod
    def update_return_request_status(
        admin_id: int, request_id: int, status: str, admin_note: Optional[str] = None
    ) -> Dict[str, Any]:
        """Admin: Duyệt hoặc Từ chối yêu cầu đổi/trả."""
        admin = db.session.query(User).filter(User.id == admin_id).first()
        if not admin or admin.role != "admin":
            raise ValueError("FORBIDDEN")

        req = db.session.query(ReturnRequest).filter(ReturnRequest.id == request_id).first()
        if not req:
            raise ValueError("REQUEST_NOT_FOUND")

        valid_statuses = ["pending", "approved", "rejected", "completed"]
        if status not in valid_statuses:
            raise ValueError("INVALID_STATUS")

        req.status = status
        if admin_note and admin_note.strip():
            req.admin_note = admin_note.strip()

        if status == "approved" and req.order:
            if req.request_type == "return":
                req.order.status = "returned"
            elif req.request_type == "exchange":
                req.order.status = "exchanged"

        db.session.commit()
        return req.to_dict()
