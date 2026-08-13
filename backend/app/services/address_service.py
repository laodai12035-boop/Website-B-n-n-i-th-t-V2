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

    @staticmethod
    def update_address(user_id: int, address_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sửa thông tin địa chỉ giao hàng (NT-07-CN-002).

        Args:
            user_id: ID người dùng từ JWT Token
            address_id: ID địa chỉ cần chỉnh sửa
            data: Dữ liệu đã validate từ AddressSchema

        Returns:
            Dict thông tin địa chỉ sau khi cập nhật.

        Raises:
            ValueError("ADDRESS_NOT_FOUND"): Địa chỉ không tồn tại.
            PermissionError("FORBIDDEN_ACCESS"): Địa chỉ thuộc về người dùng khác.
        """
        address = db.session.query(Address).filter(Address.id == address_id).first()
        if not address:
            raise ValueError("ADDRESS_NOT_FOUND")

        if address.user_id != user_id:
            raise PermissionError("FORBIDDEN_ACCESS")

        set_default = data.get("is_default", address.is_default)

        # Nếu đặt làm mặc định ➔ Bỏ mặc định các địa chỉ khác của user
        if set_default and not address.is_default:
            db.session.query(Address).filter(Address.user_id == user_id).update(
                {Address.is_default: False}, synchronize_session=False
            )

        address.recipient_name = data["recipient_name"].strip()
        address.phone = data["phone"].strip()
        address.province = data["province"].strip()
        address.district = data["district"].strip()
        address.ward = data["ward"].strip()
        address.detail_address = data["detail_address"].strip()
        address.is_default = set_default

        db.session.commit()
        logger.info("Updated address id=%s for user_id=%s", address_id, user_id)
        return address.to_dict()

    @staticmethod
    def delete_address(user_id: int, address_id: int) -> bool:
        """
        Xóa địa chỉ giao hàng (NT-07-CN-002).

        Args:
            user_id: ID người dùng từ JWT Token
            address_id: ID địa chỉ cần xóa

        Returns:
            True nếu xóa thành công.

        Raises:
            ValueError("ADDRESS_NOT_FOUND"): Địa chỉ không tồn tại.
            PermissionError("FORBIDDEN_ACCESS"): Địa chỉ thuộc về người dùng khác.
        """
        address = db.session.query(Address).filter(Address.id == address_id).first()
        if not address:
            raise ValueError("ADDRESS_NOT_FOUND")

        if address.user_id != user_id:
            raise PermissionError("FORBIDDEN_ACCESS")

        was_default = address.is_default

        db.session.delete(address)
        db.session.flush()

        # Nếu địa chỉ vừa xóa là mặc định, đôn địa chỉ còn lại gần nhất làm mặc định
        if was_default:
            remaining_address = (
                db.session.query(Address)
                .filter(Address.user_id == user_id)
                .order_by(Address.created_at.desc())
                .first()
            )
            if remaining_address:
                remaining_address.is_default = True
                logger.info("Promoted address id=%s to default for user_id=%s after deletion", remaining_address.id, user_id)

        db.session.commit()
        logger.info("Deleted address id=%s for user_id=%s", address_id, user_id)
        return True

    @staticmethod
    def set_default_address(user_id: int, address_id: int) -> Dict[str, Any]:
        """
        Đặt một địa chỉ giao hàng làm địa chỉ mặc định (NT-07-CN-003).

        Args:
            user_id: ID người dùng từ JWT Token
            address_id: ID địa chỉ cần đặt làm mặc định

        Returns:
            Dict thông tin địa chỉ sau khi cập nhật.

        Raises:
            ValueError("ADDRESS_NOT_FOUND"): Địa chỉ không tồn tại.
            PermissionError("FORBIDDEN_ACCESS"): Địa chỉ thuộc về người dùng khác.
        """
        address = db.session.query(Address).filter(Address.id == address_id).first()
        if not address:
            raise ValueError("ADDRESS_NOT_FOUND")

        if address.user_id != user_id:
            raise PermissionError("FORBIDDEN_ACCESS")

        # Đặt is_default = False cho toàn bộ địa chỉ khác của user
        db.session.query(Address).filter(Address.user_id == user_id).update(
            {Address.is_default: False}, synchronize_session=False
        )

        address.is_default = True
        db.session.commit()

        logger.info("Set address id=%s as default for user_id=%s", address_id, user_id)
        return address.to_dict()
