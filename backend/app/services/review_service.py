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
    def get_product_reviews(
        product_id: int, star: Optional[int] = None, current_user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Lấy danh sách các nhận xét đã duyệt của sản phẩm kèm tổng quan phân bổ sao và bộ lọc.

        Args:
            product_id: ID sản phẩm
            star: Lọc nhận xét theo số sao (1 đến 5, tùy chọn)
            current_user_id: ID người dùng đang xem (nếu có)

        Returns:
            Dict chứa reviews, summary, và can_review (QTN-06).
        """
        # 1. Lấy tất cả approved reviews để tính summary thống kê sao
        all_reviews = (
            db.session.query(Review)
            .filter(Review.product_id == product_id, Review.is_approved == True)
            .order_by(Review.created_at.desc())
            .all()
        )

        breakdown = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        total_rating_sum = 0
        for r in all_reviews:
            if 1 <= r.rating <= 5:
                breakdown[r.rating] += 1
                total_rating_sum += r.rating

        total_count = len(all_reviews)
        avg_rating = round(total_rating_sum / total_count, 1) if total_count > 0 else 5.0

        # 2. Lọc danh sách nhận xét nếu có star parameter
        if star is not None and isinstance(star, int) and 1 <= star <= 5:
            filtered_reviews = [r for r in all_reviews if r.rating == star]
        else:
            filtered_reviews = all_reviews

        can_review = False
        if current_user_id:
            can_review = ReviewService.check_user_eligible_to_review(current_user_id, product_id)

        return {
            "reviews": [r.to_dict() for r in filtered_reviews],
            "summary": {
                "average_rating": avg_rating,
                "total_reviews": total_count,
                "rating_breakdown": breakdown,
            },
            "can_review": can_review,
        }

    @staticmethod
    def get_admin_reviews(
        status_filter: Optional[str] = "all",
        product_id: Optional[int] = None,
        page: int = 1,
        limit: int = 20,
    ) -> Dict[str, Any]:
        """
        Quản trị viên lấy danh sách tất cả các bình luận đánh giá kèm thông tin sản phẩm và người dùng (NT-10-CN-001).

        Args:
            status_filter: 'all', 'approved', 'hidden' / 'rejected'
            product_id: Lọc theo sản phẩm (tùy chọn)
            page: Số trang
            limit: Số bản ghi trên mỗi trang

        Returns:
            Dict chứa danh sách `items` và metadata `pagination`.
        """
        query = db.session.query(Review)

        if status_filter == "approved":
            query = query.filter(Review.is_approved == True)
        elif status_filter in ["hidden", "rejected", "unapproved"]:
            query = query.filter(Review.is_approved == False)

        if product_id:
            query = query.filter(Review.product_id == product_id)

        total_items = query.count()
        page = max(1, page)
        limit = max(1, min(100, limit))
        total_pages = (total_items + limit - 1) // limit if total_items > 0 else 1

        offset = (page - 1) * limit
        reviews = query.order_by(Review.created_at.desc()).offset(offset).limit(limit).all()

        review_dicts = []
        for r in reviews:
            item_dict = r.to_dict()
            item_dict["product_name"] = r.product.name if r.product else None
            item_dict["product_image_url"] = r.product.image_url if r.product else None
            review_dicts.append(item_dict)

        return {
            "items": review_dicts,
            "pagination": {
                "page": page,
                "limit": limit,
                "total_items": total_items,
                "total_pages": total_pages,
            },
        }

    @staticmethod
    def moderate_review(review_id: int, is_approved: bool) -> Dict[str, Any]:
        """
        Admin duyệt (`is_approved = True`) hoặc ẩn (`is_approved = False`) bình luận (NT-10-CN-001).

        Args:
            review_id: ID bình luận cần duyệt/ẩn
            is_approved: Cờ trạng thái mới

        Returns:
            Dict thông tin bình luận đã được cập nhật.

        Raises:
            ValueError("REVIEW_NOT_FOUND"): Bình luận không tồn tại.
        """
        review = db.session.query(Review).filter(Review.id == review_id).first()
        if not review:
            raise ValueError("REVIEW_NOT_FOUND")

        review.is_approved = bool(is_approved)
        db.session.flush()

        # Tự động tính toán lại điểm rating trung bình của sản phẩm tương ứng
        product_id = review.product_id
        stats = (
            db.session.query(
                func.avg(Review.rating).label("avg_rating"),
                func.count(Review.id).label("total_count"),
            )
            .filter(Review.product_id == product_id, Review.is_approved == True)
            .first()
        )

        product = db.session.query(Product).filter(Product.id == product_id).first()
        if product:
            product.rating = round(float(stats.avg_rating or 5.0), 1) if stats and stats.total_count > 0 else 5.0
            product.rating_count = int(stats.total_count or 0) if stats else 0

        db.session.commit()
        logger.info("[NT-10-CN-001] Admin moderated review id=%s (is_approved=%s)", review.id, review.is_approved)

        res_dict = review.to_dict()
        if product:
            res_dict["new_product_rating"] = product.rating
            res_dict["new_product_rating_count"] = product.rating_count

        return res_dict

    @staticmethod
    def get_product_review_stats(search: Optional[str] = None, sort_by: str = "reviews_desc") -> Dict[str, Any]:
        """
        Quản trị viên xem báo cáo thống kê đánh giá sản phẩm (NT-10-CN-002).

        Args:
            search: Từ khóa tìm kiếm tên sản phẩm (tùy chọn)
            sort_by: Cách sắp xếp ('rating_desc', 'rating_asc', 'reviews_desc', 'reviews_asc')

        Returns:
            Dict chứa `overview` và danh sách `products`.
        """
        # 1. Overview metrics
        all_reviews = db.session.query(Review).all()
        total_reviews = len(all_reviews)
        approved_reviews = sum(1 for r in all_reviews if r.is_approved)
        hidden_reviews = total_reviews - approved_reviews

        approved_ratings = [r.rating for r in all_reviews if r.is_approved and 1 <= r.rating <= 5]
        overall_average_rating = round(sum(approved_ratings) / len(approved_ratings), 1) if approved_ratings else 5.0

        star_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        for r in all_reviews:
            if r.is_approved and 1 <= r.rating <= 5:
                star_distribution[r.rating] += 1

        # 2. Product-level statistics
        product_query = db.session.query(Product).filter(Product.is_active == True)
        if search and search.strip():
            product_query = product_query.filter(Product.name.ilike(f"%{search.strip()}%"))

        products_list = product_query.all()
        product_stats = []

        for p in products_list:
            p_reviews = p.reviews.all()
            p_total = len(p_reviews)
            p_approved = sum(1 for r in p_reviews if r.is_approved)
            p_hidden = p_total - p_approved

            p_approved_ratings = [r.rating for r in p_reviews if r.is_approved and 1 <= r.rating <= 5]
            avg_rating = round(sum(p_approved_ratings) / len(p_approved_ratings), 1) if p_approved_ratings else p.rating

            high_ratings_count = sum(1 for r in p_reviews if r.is_approved and r.rating in [4, 5])
            satisfaction_rate = round((high_ratings_count / p_approved * 100), 1) if p_approved > 0 else 0.0

            product_stats.append({
                "id": p.id,
                "name": p.name,
                "slug": p.slug,
                "image_url": p.image_url,
                "category": p.category,
                "average_rating": avg_rating,
                "rating_count": p_approved,
                "total_reviews": p_total,
                "approved_reviews": p_approved,
                "hidden_reviews": p_hidden,
                "satisfaction_rate": satisfaction_rate,
            })

        # Sắp xếp danh sách sản phẩm theo lựa chọn
        if sort_by == "rating_desc":
            product_stats.sort(key=lambda x: (x["average_rating"], x["total_reviews"]), reverse=True)
        elif sort_by == "rating_asc":
            product_stats.sort(key=lambda x: (x["average_rating"], x["total_reviews"]))
        elif sort_by == "reviews_asc":
            product_stats.sort(key=lambda x: x["total_reviews"])
        else:  # reviews_desc (mặc định)
            product_stats.sort(key=lambda x: (x["total_reviews"], x["average_rating"]), reverse=True)

        return {
            "overview": {
                "total_reviews": total_reviews,
                "approved_reviews": approved_reviews,
                "hidden_reviews": hidden_reviews,
                "overall_average_rating": overall_average_rating,
                "star_distribution": star_distribution,
            },
            "products": product_stats,
        }


