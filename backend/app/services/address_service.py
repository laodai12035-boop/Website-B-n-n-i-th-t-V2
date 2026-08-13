"""
services/address_service.py — Business Logic xử lý Quản lý địa chỉ giao hàng (NT-07).
"""

import logging
from typing import Dict, Any, List
from app.extensions import db
from app.models.address import Address

logger = logging.getLogger(__name__)

MAX_ADDRESSES_PER_USER = 10


class AddressService:
    """Service xử lý các tác vụ thêm, sửa, xóa, lấy danh sách địa chỉ giao hàng."""

    @staticmethod
    def get_user_addresses(user_id: int) -> List[Dict[str, Any]]:
        """
        Lấy danh sách toàn bộ địa chỉ giao hàng của người dùng.
        Sắp xếp: Địa chỉ mặc định lên đầu (is_default=True), sau đó theo thời gian tạo mới nhất.
        """
        addresses = (
            db.session.query(Address)
            .filter(Address.user_id == user_id)
            .order_by(Address.is_default.desc(), Address.created_at.desc())
            .all()
        )
        return [a.to_dict() for a in addresses]

    @staticmethod
    def create_address(user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Thêm địa chỉ giao hàng mới cho người dùng (NT-07-CN-001).

        Args:
            user_id: ID người dùng từ JWT Token
            data: Dữ liệu địa chỉ đã validate từ schema

        Returns:
            Dict thông tin địa chỉ vừa tạo.

        Raises:
            ValueError("MAX_ADDRESSES_REACHED"): Khi người dùng đã có đủ 10 địa chỉ.
        """
        # 1. Kiểm tra giới hạn 10 địa chỉ/user
        existing_count = (
            db.session.query(Address)
            .filter(Address.user_id == user_id)
            .count()
        )

        if existing_count >= MAX_ADDRESSES_PER_USER:
            raise ValueError("MAX_ADDRESSES_REACHED")

        # 2. Quy tắc tự động mặc định cho địa chỉ đầu tiên
        set_default = data.get("is_default", False)
        if existing_count == 0:
            set_default = True

        # 3. Nếu địa chỉ này là mặc định, bỏ cờ mặc định của tất cả địa chỉ cũ
        if set_default:
            db.session.query(Address).filter(Address.user_id == user_id).update(
                {Address.is_default: False}, synchronize_session=False
            )

        # 4. Tạo đối tượng Address mới
        new_address = Address(
            user_id=user_id,
            recipient_name=data["recipient_name"].strip(),
            phone=data["phone"].strip(),
            province=data["province"].strip(),
            district=data["district"].strip(),
            ward=data["ward"].strip(),
            detail_address=data["detail_address"].strip(),
            is_default=set_default,
        )

        db.session.add(new_address)
        db.session.commit()

        logger.info("Created new address id=%s for user_id=%s (is_default=%s)", new_address.id, user_id, set_default)
        return new_address.to_dict()
