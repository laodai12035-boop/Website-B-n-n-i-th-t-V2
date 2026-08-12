"""
app/services/review_service.py — Service xử lý Đánh giá & Bình luận sản phẩm (Tuân thủ QTN-06).
"""

import logging
from typing import Dict, Any, List, Optional
from sqlalchemy import func
from app.extensions import db
from app.models.review import Review
from app.models.product import Product
from app.models.order import Order, OrderItem

logger = logging.getLogger(__name__)


class ReviewService:
    """Service xử lý logic đánh giá và nhận xét sản phẩm."""

    @staticmethod
    def check_user_eligible_to_review(user_id: int, product_id: int) -> bool:
        """
        Kiểm tra quy tắc QTN-06: Người dùng chỉ được đánh giá sản phẩm thuộc đơn hàng đã giao thành công.

        Args:
            user_id: ID người dùng
            product_id: ID sản phẩm

        Returns:
            bool: True nếu đủ điều kiện (đã mua & đơn delivered), False nếu chưa đủ điều kiện.
        """
        delivered_order_item = (
            db.session.query(OrderItem)
            .join(Order, OrderItem.order_id == Order.id)
            .filter(
                Order.user_id == user_id,
                OrderItem.product_id == product_id,
                Order.status == "delivered",
            )
            .first()
        )
        return delivered_order_item is not None

    @staticmethod
    def create_review(
        user_id: int, product_id: int, rating: int, comment: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Tạo hoặc cập nhật đánh giá sản phẩm (Tuân thủ QTN-06).

        Args:
            user_id: ID khách hàng
            product_id: ID sản phẩm
            rating: Số sao (1 đến 5)
            comment: Nội dung nhận xét (tùy chọn)

        Returns:
            Dict chứa thông tin đánh giá mới và điểm rating trung bình cập nhật.

        Raises:
            ValueError("INVALID_RATING"): Số sao không hợp lệ (ngoài 1-5).
            ValueError("PRODUCT_NOT_FOUND"): Sản phẩm không tồn tại.
            ValueError("REVIEW_NOT_ALLOWED"): Chưa đủ điều kiện đánh giá theo QTN-06.
        """
        if not (1 <= rating <= 5):
            raise ValueError("INVALID_RATING")

        product = (
            db.session.query(Product)
            .filter(Product.id == product_id, Product.is_active == True)
            .first()
        )
        if not product:
            raise ValueError("PRODUCT_NOT_FOUND")

        # Kiểm tra QTN-06
        if not ReviewService.check_user_eligible_to_review(user_id, product_id):
            raise ValueError("REVIEW_NOT_ALLOWED")

        # Lấy order_id gần nhất đã giao
        delivered_item = (
            db.session.query(OrderItem)
            .join(Order, OrderItem.order_id == Order.id)
            .filter(
                Order.user_id == user_id,
                OrderItem.product_id == product_id,
                Order.status == "delivered",
            )
            .first()
        )
        order_id = delivered_item.order_id if delivered_item else None

        # Check existing review (Upsert)
        existing = (
            db.session.query(Review)
            .filter(Review.user_id == user_id, Review.product_id == product_id)
            .first()
        )

        if existing:
            existing.rating = rating
            existing.comment = comment
            existing.order_id = order_id
            review_obj = existing
        else:
            review_obj = Review(
                user_id=user_id,
                product_id=product_id,
                order_id=order_id,
                rating=rating,
                comment=comment,
                is_approved=True,
            )
            db.session.add(review_obj)

        db.session.flush()

        # Tính lại điểm sao trung bình của sản phẩm
        stats = (
            db.session.query(
                func.avg(Review.rating).label("avg_rating"),
                func.count(Review.id).label("total_count"),
            )
            .filter(Review.product_id == product_id, Review.is_approved == True)
            .first()
        )

        product.rating = round(float(stats.avg_rating or rating), 1)
        product.rating_count = int(stats.total_count or 1)

        db.session.commit()

        return {
            "review": review_obj.to_dict(),
            "new_product_rating": product.rating,
            "new_rating_count": product.rating_count,
        }

    @staticmethod
    def get_product_reviews(product_id: int, current_user_id: Optional[int] = None) -> Dict[str, Any]:
        """
        Lấy danh sách các nhận xét đã duyệt của sản phẩm kèm tổng quan phân bổ sao.

        Args:
            product_id: ID sản phẩm
            current_user_id: ID người dùng đang xem (nếu có)

        Returns:
            Dict chứa reviews, summary, và can_review (QTN-06).
        """
        reviews = (
            db.session.query(Review)
            .filter(Review.product_id == product_id, Review.is_approved == True)
            .order_by(Review.created_at.desc())
            .all()
        )

        # Tính toán phân bổ số sao 1-5
        breakdown = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        total_rating_sum = 0
        for r in reviews:
            if 1 <= r.rating <= 5:
                breakdown[r.rating] += 1
                total_rating_sum += r.rating

        total_count = len(reviews)
        avg_rating = round(total_rating_sum / total_count, 1) if total_count > 0 else 5.0

        can_review = False
        if current_user_id:
            can_review = ReviewService.check_user_eligible_to_review(current_user_id, product_id)

        return {
            "reviews": [r.to_dict() for r in reviews],
            "summary": {
                "average_rating": avg_rating,
                "total_reviews": total_count,
                "rating_breakdown": breakdown,
            },
            "can_review": can_review,
        }
