"""
schemas/category_schema.py — Marshmallow schema cho validation danh mục sản phẩm (NT-08-CN-001).
"""

from marshmallow import Schema, fields, validate


class CategorySchema(Schema):
    """Schema validate dữ liệu đầu vào khi tạo/sửa danh mục sản phẩm."""

    name = fields.Str(
        required=True,
        validate=[
            validate.Length(min=2, max=100, error="Tên danh mục phải từ 2 đến 100 ký tự"),
        ],
        error_messages={"required": "Tên danh mục là bắt buộc"},
    )
    description = fields.Str(required=False, allow_none=True)
    icon = fields.Str(required=False, allow_none=True)
    is_active = fields.Bool(required=False, default=True)


category_schema = CategorySchema()
