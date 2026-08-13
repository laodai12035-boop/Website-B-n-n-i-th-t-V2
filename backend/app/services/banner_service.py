"""
app/services/banner_service.py — Service xử lý Quản lý Banner Trang Chủ (NT-11-CN-001).
"""

import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.extensions import db
from app.models.banner import Banner

logger = logging.getLogger(__name__)


class BannerService:
    """Service xử lý logic nghiệp vụ Banner quảng cáo trang chủ."""

    @staticmethod
    def get_public_banners() -> List[Dict[str, Any]]:
        """
        Lấy danh sách các banner quảng cáo đang hoạt động để hiển thị công khai trên trang chủ.

        Returns:
            List[Dict]: Danh sách thông tin banner hoạt động hợp lệ.
        """
        now = datetime.utcnow()
        query = db.session.query(Banner).filter(Banner.is_active == True)

        all_active = query.order_by(Banner.display_order.asc(), Banner.created_at.desc()).all()

        valid_banners = []
        for b in all_active:
            if b.start_date and b.start_date > now:
                continue
            if b.end_date and b.end_date < now:
                continue
            valid_banners.append(b.to_dict())

        return valid_banners

    @staticmethod
    def get_all_banners_admin() -> List[Dict[str, Any]]:
        """
        Quản trị viên lấy tất cả danh sách banner (bao gồm cả active và inactive).

        Returns:
            List[Dict]: Danh sách tất cả banner.
        """
        banners = db.session.query(Banner).order_by(Banner.display_order.asc(), Banner.id.desc()).all()
        return [b.to_dict() for b in banners]

    @staticmethod
    def create_banner(
        title: str,
        image_url: str,
        subtitle: Optional[str] = None,
        link_url: Optional[str] = None,
        display_order: int = 0,
        is_active: bool = True,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """
        Tạo banner quảng cáo mới (NT-11-CN-001).

        Raises:
            ValueError("MISSING_IMAGE_URL"): Thiếu đường dẫn hình ảnh banner (TC-02).
        """
        if not image_url or not str(image_url).strip():
            raise ValueError("MISSING_IMAGE_URL")

        banner = Banner(
            title=title.strip() if title else "Banner Quảng Cáo",
            subtitle=subtitle.strip() if subtitle else None,
            image_url=image_url.strip(),
            link_url=link_url.strip() if link_url else None,
            display_order=int(display_order) if display_order is not None else 0,
            is_active=bool(is_active),
            start_date=start_date,
            end_date=end_date,
        )

        db.session.add(banner)
        db.session.commit()
        logger.info("[NT-11-CN-001] Admin created new banner id=%s", banner.id)

        return banner.to_dict()

    @staticmethod
    def update_banner(banner_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Cập nhật thông tin banner (NT-11-CN-001).

        Raises:
            ValueError("BANNER_NOT_FOUND"): Banner không tồn tại.
            ValueError("MISSING_IMAGE_URL"): Image URL bị xóa rỗng.
        """
        banner = db.session.query(Banner).filter(Banner.id == banner_id).first()
        if not banner:
            raise ValueError("BANNER_NOT_FOUND")

        if "image_url" in data:
            new_img = data["image_url"]
            if not new_img or not str(new_img).strip():
                raise ValueError("MISSING_IMAGE_URL")
            banner.image_url = new_img.strip()

        if "title" in data and data["title"] is not None:
            banner.title = str(data["title"]).strip()
        if "subtitle" in data:
            banner.subtitle = str(data["subtitle"]).strip() if data["subtitle"] else None
        if "link_url" in data:
            banner.link_url = str(data["link_url"]).strip() if data["link_url"] else None
        if "display_order" in data and data["display_order"] is not None:
            banner.display_order = int(data["display_order"])
        if "is_active" in data and data["is_active"] is not None:
            banner.is_active = bool(data["is_active"])
        if "start_date" in data:
            banner.start_date = data["start_date"]
        if "end_date" in data:
            banner.end_date = data["end_date"]

        db.session.commit()
        logger.info("[NT-11-CN-001] Admin updated banner id=%s", banner.id)

        return banner.to_dict()

    @staticmethod
    def delete_banner(banner_id: int) -> bool:
        """
        Xóa banner (NT-11-CN-001).

        Raises:
            ValueError("BANNER_NOT_FOUND"): Banner không tồn tại.
        """
        banner = db.session.query(Banner).filter(Banner.id == banner_id).first()
        if not banner:
            raise ValueError("BANNER_NOT_FOUND")

        db.session.delete(banner)
        db.session.commit()
        logger.info("[NT-11-CN-001] Admin deleted banner id=%s", banner_id)
        return True
