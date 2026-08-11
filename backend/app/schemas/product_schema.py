"""
schemas/product_schema.py — Marshmallow Schema cho Product.
"""

from marshmallow import Schema, fields, validate, validates, ValidationError

VALID_CATEGORIES = ["ban", "ghe", "ke", "tu", "trang-tri"]


class ProductSchema(Schema):
    """Schema serialize và validate thông tin Sản phẩm."""

    id = fields.Int(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(min=2, max=200))
    slug = fields.Str(dump_only=True)
    description = fields.Str(allow_none=True)
    price = fields.Float(required=True, validate=validate.Range(min=0))
    discount_price = fields.Float(allow_none=True, validate=validate.Range(min=0))
    category = fields.Str(required=True, validate=validate.OneOf(VALID_CATEGORIES))
    stock = fields.Int(missing=0, validate=validate.Range(min=0))
    image_url = fields.Str(allow_none=True)
    is_active = fields.Bool(missing=True)
    created_at = fields.Str(dump_only=True)

    @validates("discount_price")
    def validate_discount(self, value):
        if value is not None and value < 0:
            raise ValidationError("Giá khuyến mãi phải lớn hơn hoặc bằng 0")


product_schema = ProductSchema()
products_schema = ProductSchema(many=True)
