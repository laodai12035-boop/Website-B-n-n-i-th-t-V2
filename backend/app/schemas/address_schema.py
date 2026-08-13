"""
schemas/address_schema.py — Marshmallow Schema validate dữ liệu địa chỉ giao hàng (NT-07).
"""

import re
from marshmallow import Schema, fields, validate, validates, ValidationError

PHONE_REGEX = re.compile(r"^0[0-9]{9}$")


class AddressSchema(Schema):
    """Schema validate thông tin thêm/sửa địa chỉ giao hàng."""

    recipient_name = fields.String(
        required=True,
        validate=[validate.Length(min=2, max=100, error="Họ tên người nhận phải từ 2 đến 100 ký tự.")],
        error_messages={"required": "Họ tên người nhận là bắt buộc."},
    )

    phone = fields.String(
        required=True,
        error_messages={"required": "Số điện thoại là bắt buộc."},
    )

    province = fields.String(
        required=True,
        validate=[validate.Length(min=1, max=100, error="Tỉnh/Thành phố là bắt buộc.")],
        error_messages={"required": "Tỉnh/Thành phố là bắt buộc."},
    )

    district = fields.String(
        required=True,
        validate=[validate.Length(min=1, max=100, error="Quận/Huyện là bắt buộc.")],
        error_messages={"required": "Quận/Huyện là bắt buộc."},
    )

    ward = fields.String(
        required=True,
        validate=[validate.Length(min=1, max=100, error="Phường/Xã là bắt buộc.")],
        error_messages={"required": "Phường/Xã là bắt buộc."},
    )

    detail_address = fields.String(
        required=True,
        validate=[validate.Length(min=1, max=255, error="Địa chỉ chi tiết từ 1 đến 255 ký tự.")],
        error_messages={"required": "Địa chỉ chi tiết là bắt buộc."},
    )

    is_default = fields.Boolean(required=False, default=False)

    @validates("phone")
    def validate_phone(self, value: str) -> str:
        if not value or not PHONE_REGEX.match(value.strip()):
            raise ValidationError("Số điện thoại không hợp lệ (phải bắt đầu bằng 0 và có 10 chữ số).")
        return value.strip()

    @validates("recipient_name")
    def normalize_name(self, value: str) -> str:
        stripped = value.strip()
        if len(stripped) < 2:
            raise ValidationError("Họ tên người nhận phải có ít nhất 2 ký tự.")
        return stripped


address_schema = AddressSchema()
