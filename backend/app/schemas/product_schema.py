"""
schemas/product_schema.py — Marshmallow Schema cho Product.
"""

from marshmallow import Schema, fields, validate, validates, ValidationError


class ProductSchema(Schema):
    """Schema serialize và validate thông tin Sản phẩm (NT-08-CN-003)."""

    id = fields.Int(dump_only=True)
    name = fields.Str(
        required=True,
        validate=validate.Length(min=2, max=200, error="Tên sản phẩm phải từ 2 đến 200 ký tự"),
        error_messages={"required": "Tên sản phẩm là bắt buộc"},
    )
    slug = fields.Str(dump_only=True)
    description = fields.Str(allow_none=True)
    price = fields.Float(
        required=True,
        error_messages={"required": "Giá bán sản phẩm là bắt buộc"},
    )
    discount_price = fields.Float(allow_none=True)
    category = fields.Str(
        required=True,
        error_messages={"required": "Danh mục sản phẩm là bắt buộc"},
    )
    stock = fields.Int(load_default=0, validate=validate.Range(min=0, error="Tồn kho phải lớn hơn hoặc bằng 0"))
    image_url = fields.Str(allow_none=True)
    material = fields.Str(allow_none=True)
    dimensions = fields.Str(allow_none=True)
    weight_kg = fields.Float(allow_none=True, validate=validate.Range(min=0, error="Trọng lượng phải lớn hơn hoặc bằng 0"))
    warranty_months = fields.Int(allow_none=True, validate=validate.Range(min=0, error="Thời gian bảo hành phải lớn hơn hoặc bằng 0"))
    warranty_terms = fields.Str(allow_none=True)
    rating = fields.Float(load_default=5.0)
    rating_count = fields.Int(load_default=0)
    is_active = fields.Bool(load_default=True)
    created_at = fields.Str(dump_only=True)

    @validates("name")
    def validate_name(self, value):
        if not value or not value.strip():
            raise ValidationError("Tên sản phẩm không được để trống hoặc chỉ chứa khoảng trắng.")

    @validates("price")
    def validate_price(self, value):
        if value is None or value <= 0:
            raise ValidationError("Giá bán sản phẩm phải lớn hơn 0.")

    @validates("discount_price")
    def validate_discount(self, value):
        if value is not None and value < 0:
            raise ValidationError("Giá khuyến mãi phải lớn hơn hoặc bằng 0.")

    @validates("category")
    def validate_category(self, value):
        if not value or not value.strip():
            raise ValidationError("Danh mục sản phẩm không được để trống.")


product_schema = ProductSchema()
products_schema = ProductSchema(many=True)
