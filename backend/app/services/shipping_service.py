"""
app/services/shipping_service.py — Tính phí vận chuyển theo kích thước và trọng lượng (QTN-07).

Quy tắc QTN-07:
- Phí tính dựa trên trọng lượng quy đổi: max(actual_weight, dimensional_weight)
- Dimensional weight = (L * W * H) / 5000 [cm → kg, chuẩn GHN/GHTK]
- 5 mức phí × 2 vùng địa lý (nội thành HCM/HN vs tỉnh khác)
- Nếu thiếu dữ liệu → áp mức phí mặc định + cảnh báo missing_data_warning
"""

import re
from typing import Optional
from app.extensions import db
from app.models.cart_item import CartItem
from app.models.product import Product


# ------------------------------------------------------------------ #
# Bảng phí vận chuyển QTN-07 (Rate Card) — dễ chỉnh sửa
# Format: (max_weight_kg, inner_city_fee, province_fee)
# Hàng cuối max_weight_kg = None → áp dụng cho mọi trọng lượng > 50kg
# ------------------------------------------------------------------ #
SHIPPING_RATE_CARD = [
    (5,    35_000,  65_000),   # Mức A: ≤ 5 kg
    (15,   55_000,  95_000),   # Mức B: 5 – 15 kg
    (30,   85_000, 145_000),   # Mức C: 15 – 30 kg
    (50,  120_000, 200_000),   # Mức D: 30 – 50 kg
    (None, 200_000, 350_000),  # Mức E: > 50 kg (cồng kềnh)
]

DEFAULT_SHIPPING_FEE = 120_000  # Phí mặc định khi thiếu data weight_kg (QTN-07 TC-02)

# Từ khóa nhận diện nội thành TP.HCM / Hà Nội
INNER_CITY_KEYWORDS = [
    "tp.hcm", "tp hcm", "tp. hcm", "hcm", "hồ chí minh", "ho chi minh",
    "hà nội", "ha noi", "hanoi",
]


class ShippingService:
    """Service tính phí vận chuyển theo QTN-07."""

    @staticmethod
    def classify_zone(shipping_address: str) -> str:
        """
        Phân loại vùng giao hàng dựa trên địa chỉ.

        Args:
            shipping_address: Địa chỉ giao hàng (chuỗi tự do)

        Returns:
            'inner_city' nếu là HCM/HN, 'province' còn lại
        """
        addr_lower = shipping_address.lower()
        for keyword in INNER_CITY_KEYWORDS:
            if keyword in addr_lower:
                return "inner_city"
        return "province"

    @staticmethod
    def parse_dimensions(dim_str: Optional[str]):
        """
        Parse chuỗi dimensions thành (length, width, height) theo cm.
        Chấp nhận định dạng: "220x90x85", "220 x 90 x 85", "220*90*85".

        Returns:
            (L, W, H) tuple of floats, hoặc None nếu không parse được.
        """
        if not dim_str:
            return None
        # Thay thế ký tự phân cách không phải số
        parts = re.split(r"[xX*×\s]+", dim_str.strip())
        parts = [p.strip() for p in parts if p.strip()]
        if len(parts) == 3:
            try:
                return tuple(float(p) for p in parts)
            except ValueError:
                return None
        return None

    @staticmethod
    def get_dimensional_weight(length: float, width: float, height: float) -> float:
        """
        Tính trọng lượng quy đổi theo công thức GHN/GHTK.
        dimensional_weight = L × W × H / 5000  (cm → kg)
        """
        return (length * width * height) / 5000.0

    @staticmethod
    def get_fee_by_weight(charged_weight: float, zone: str) -> int:
        """
        Tra bảng Rate Card để lấy phí theo trọng lượng quy đổi và vùng.

        Args:
            charged_weight: Trọng lượng quy đổi tổng (kg)
            zone: 'inner_city' hoặc 'province'

        Returns:
            Phí vận chuyển (VNĐ)
        """
        for max_kg, inner_fee, province_fee in SHIPPING_RATE_CARD:
            if max_kg is None or charged_weight <= max_kg:
                return inner_fee if zone == "inner_city" else province_fee
        # Fallback — không nên xảy ra vì hàng cuối max_kg=None
        return SHIPPING_RATE_CARD[-1][1] if zone == "inner_city" else SHIPPING_RATE_CARD[-1][2]

    @staticmethod
    def calculate_shipping_fee(user_id: int, shipping_address: str) -> dict:
        """
        Tính phí vận chuyển cho giỏ hàng của user theo QTN-07.

        Args:
            user_id: ID của Khách hàng
            shipping_address: Địa chỉ giao hàng

        Returns:
            {
                fee (int),
                zone (str),
                total_weight (float),
                missing_data_warning (bool),
                breakdown (list of item details)
            }

        Raises:
            ValueError: CART_EMPTY nếu giỏ hàng trống
        """
        cart_items = db.session.query(CartItem).filter(CartItem.user_id == user_id).all()
        if not cart_items:
            raise ValueError("CART_EMPTY")

        zone = ShippingService.classify_zone(shipping_address)
        missing_data_warning = False
        total_charged_weight = 0.0
        breakdown = []

        for item in cart_items:
            product = db.session.query(Product).filter(
                Product.id == item.product_id, Product.is_active == True
            ).first()

            if not product:
                continue

            item_info = {
                "product_id": product.id,
                "product_name": product.name,
                "quantity": item.quantity,
                "actual_weight_kg": product.weight_kg,
                "dimensions": product.dimensions,
            }

            # Kiểm tra đủ data để tính dimensional weight
            dims = ShippingService.parse_dimensions(product.dimensions)
            has_weight = product.weight_kg is not None and product.weight_kg > 0
            has_dims = dims is not None

            if has_weight and has_dims:
                # Tính dimensional weight
                L, W, H = dims
                dim_weight = ShippingService.get_dimensional_weight(L, W, H)
                charged = round(max(float(product.weight_kg), dim_weight), 3)
                item_info["dimensional_weight_kg"] = round(dim_weight, 3)
                item_info["charged_weight_kg"] = charged
                item_info["used_default"] = False
            elif has_weight:
                # Có weight nhưng không có dims → dùng actual weight
                charged = float(product.weight_kg)
                item_info["dimensional_weight_kg"] = None
                item_info["charged_weight_kg"] = charged
                item_info["used_default"] = False
            else:
                # Thiếu weight_kg → áp mức phí mặc định cho item này (QTN-07 TC-02)
                charged = 0.0  # Đánh dấu missing, sẽ dùng DEFAULT_FEE ở cuối
                item_info["charged_weight_kg"] = None
                item_info["used_default"] = True
                missing_data_warning = True

            total_charged_weight += charged * item.quantity
            breakdown.append(item_info)

        # Nếu thiếu data → dùng phí mặc định
        if missing_data_warning and total_charged_weight == 0.0:
            fee = DEFAULT_SHIPPING_FEE
        else:
            fee = ShippingService.get_fee_by_weight(total_charged_weight, zone)

        return {
            "fee": fee,
            "zone": zone,
            "total_weight": round(total_charged_weight, 3),
            "missing_data_warning": missing_data_warning,
            "breakdown": breakdown,
        }
