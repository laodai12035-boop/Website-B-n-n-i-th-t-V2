"""
services/auth_service.py — Business logic cho Authentication.

Layer này chứa toàn bộ domain logic: hash password, check trùng email,
tạo user trong DB, mock email service.
Route layer KHÔNG được chứa business logic — chỉ gọi service.
"""

import logging
from typing import Optional

from sqlalchemy.exc import IntegrityError

from flask_jwt_extended import create_access_token

from app.extensions import db, bcrypt
from app.models.user import User

logger = logging.getLogger(__name__)


class AuthService:
    """Service xử lý nghiệp vụ xác thực và tài khoản người dùng."""

    @staticmethod
    def register(
        full_name: str,
        email: str,
        phone: str,
        password: str,
    ) -> User:
        """
        Đăng ký tài khoản mới.

        Args:
            full_name: Họ tên đầy đủ (đã validate)
            email:     Email lowercase (đã normalize)
            phone:     Số điện thoại VN (đã validate)
            password:  Mật khẩu plaintext (chưa hash)

        Returns:
            User instance vừa tạo.

        Raises:
            ValueError("EMAIL_EXISTS"): Khi email đã tồn tại trong DB.
            RuntimeError:               Khi có lỗi DB không mong đợi.
        """
        # Normalize email: lowercase + strip (defense in depth, schema đã làm nhưng đảm bảo)
        email = email.lower().strip()

        # Tuyến phòng thủ: kiểm tra email trùng trước (tránh race condition nhẹ)
        existing = User.query.filter_by(email=email).first()
        if existing:
            raise ValueError("EMAIL_EXISTS")

        # Hash password — bcrypt tự sinh salt, 12 rounds mặc định từ config
        password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

        user = User(
            full_name=full_name,
            email=email,
            phone=phone,
            password_hash=password_hash,
            role="user",
            is_active=True,
        )

        try:
            db.session.add(user)
            db.session.commit()
        except IntegrityError:
            # Trường hợp race condition: 2 request tạo cùng email cùng lúc
            db.session.rollback()
            logger.warning(
                "IntegrityError on register (race condition?): email=%s", email
            )
            raise ValueError("EMAIL_EXISTS")
        except Exception as exc:
            db.session.rollback()
            logger.error("Unexpected DB error on register: %s", exc, exc_info=True)
            raise RuntimeError("DB_ERROR") from exc

        # Mock email service — log ra console thay vì gửi thật
        AuthService._send_welcome_email_mock(user)

        logger.info("New user registered: id=%s email=%s", user.id, user.email)
        return user

    @staticmethod
    def login(email: str, password: str) -> tuple[str, User]:
        """
        Xác thực đăng nhập người dùng và tạo JWT token.

        Args:
            email:    Email đăng nhập (đã normalize)
            password: Mật khẩu nhập vào

        Returns:
            Tuple (access_token, user_instance)

        Raises:
            ValueError("INVALID_CREDENTIALS"): Khi email không tìm thấy hoặc mật khẩu không khớp.
            ValueError("ACCOUNT_LOCKED"):     Khi tài khoản bị khóa (is_active=False).
        """
        email = email.lower().strip()

        user = User.query.filter_by(email=email).first()
        if not user:
            logger.warning("Login failed: email %s not found", email)
            raise ValueError("INVALID_CREDENTIALS")

        # Verify password
        if not bcrypt.check_password_hash(user.password_hash, password):
            logger.warning("Login failed: invalid password for email %s", email)
            raise ValueError("INVALID_CREDENTIALS")

        # Check account status
        if not user.is_active:
            logger.warning("Login failed: account %s is locked (is_active=False)", email)
            raise ValueError("ACCOUNT_LOCKED")

        # Tạo JWT access token — identity stringify id để đảm bảo tương thích
        access_token = create_access_token(identity=str(user.id))

        logger.info("User logged in successfully: id=%s email=%s", user.id, user.email)
        return access_token, user

    @staticmethod
    def _send_welcome_email_mock(user: User) -> None:
        """
        Mock email xác nhận tài khoản.
        [MOCK] Không gửi email thật — chỉ log ra console.
        Thay bằng SMTP/Mailgun khi deploy production.
        """
        logger.info(
            "[MOCK EMAIL] Gửi email chào mừng đến %s | Chủ đề: Chào mừng bạn đến với Nội Thất Đẹp!",
            user.email,
        )
