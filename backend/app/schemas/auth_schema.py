"""
schemas/auth_schema.py — Marshmallow schemas cho Auth endpoints.

Mục đích: Validate và deserialize request body trước khi đưa vào service layer.
Luôn validate SERVER-SIDE dù client đã validate, vì không tin client input.
"""

import re
from marshmallow import Schema, fields, validate, validates, ValidationError


# Regex số điện thoại Việt Nam: bắt đầu 0, tổng 10 chữ số
PHONE_REGEX = re.compile(r"^0[0-9]{9}$")


class RegisterSchema(Schema):
    """
    Schema validate request đăng ký tài khoản.
    POST /api/v1/auth/register
    """

    full_name = fields.String(
        required=True,
        validate=[
            validate.Length(min=2, max=100, error="Họ tên phải từ 2 đến 100 ký tự"),
        ],
        error_messages={"required": "Họ tên là bắt buộc"},
    )

    email = fields.Email(
        required=True,
        error_messages={
            "required": "Email là bắt buộc",
            "invalid": "Email không hợp lệ",
        },
    )

    phone = fields.String(
        required=True,
        error_messages={"required": "Số điện thoại là bắt buộc"},
    )

    password = fields.String(
        required=True,
        validate=validate.Length(min=8, error="Mật khẩu phải có ít nhất 8 ký tự"),
        error_messages={"required": "Mật khẩu là bắt buộc"},
        load_only=True,   # Không bao giờ serialize password ra response
    )

    @validates("phone")
    def validate_phone(self, value: str) -> str:
        """Kiểm tra số điện thoại đúng format Việt Nam."""
        if not PHONE_REGEX.match(value):
            raise ValidationError(
                "Số điện thoại không hợp lệ (phải bắt đầu bằng 0 và có 10 chữ số)"
            )
        return value

    @validates("full_name")
    def validate_full_name(self, value: str) -> str:
        """Strip whitespace thừa."""
        stripped = value.strip()
        if len(stripped) < 2:
            raise ValidationError("Họ tên phải có ít nhất 2 ký tự")
        return stripped

    @validates("email")
    def normalize_email(self, value: str) -> str:
        """Normalize email về lowercase để tránh duplicate."""
        return value.lower().strip()


# Singleton instance — dùng chung, schema là stateless
register_schema = RegisterSchema()
