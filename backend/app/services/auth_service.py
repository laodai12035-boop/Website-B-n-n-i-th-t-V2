"""
services/auth_service.py — Business logic cho Authentication.

Layer này chứa toàn bộ domain logic: hash password, check trùng email,
tạo user trong DB, mock email service.
Route layer KHÔNG được chứa business logic — chỉ gọi service.
"""

import logging
from datetime import timedelta
from typing import Optional

from sqlalchemy.exc import IntegrityError
from flask_jwt_extended import create_access_token, decode_token

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
    def request_password_reset(email: str) -> tuple[str, str]:
        """
        Yêu cầu đặt lại mật khẩu cho email.

        Args:
            email: Email tài khoản cần đặt lại mật khẩu

        Returns:
            Tuple (reset_token, reset_link)

        Raises:
            ValueError("USER_NOT_FOUND"): Khi email không tồn tại trong DB.
        """
        email = email.lower().strip()

        user = User.query.filter_by(email=email).first()
        if not user:
            logger.warning("Password reset requested for non-existing email: %s", email)
            raise ValueError("USER_NOT_FOUND")

        # Sinh JWT reset token với thời hạn 15 phút
        reset_token = create_access_token(
            identity=str(user.id),
            expires_delta=timedelta(minutes=15),
            additional_claims={"type": "reset_password"},
        )

        reset_link = f"http://localhost:5173/reset-password?token={reset_token}"

        # Log mock email reset
        logger.info(
            "[MOCK EMAIL] Gửi liên kết đặt lại mật khẩu đến %s | Link: %s (Hạn 15 phút)",
            user.email,
            reset_link,
        )

        return reset_token, reset_link

    @staticmethod
    def reset_password(token: str, new_password: str) -> User:
        """
        Đặt lại mật khẩu mới bằng Reset Token.

        Args:
            token:        Reset JWT Token nhận từ email/link
            new_password: Mật khẩu mới

        Returns:
            User instance đã được cập nhật mật khẩu.

        Raises:
            ValueError("INVALID_TOKEN"): Token không hợp lệ hoặc đã hết hạn.
        """
        try:
            decoded = decode_token(token)
            if decoded.get("type") != "reset_password":
                raise ValueError("INVALID_TOKEN")

            user_id = int(decoded.get("sub"))
        except Exception as exc:
            logger.warning("Invalid or expired reset token: %s", exc)
            raise ValueError("INVALID_TOKEN") from exc

        user = db.session.get(User, user_id)
        if not user or not user.is_active:
            raise ValueError("INVALID_TOKEN")

        # Hash new password
        password_hash = bcrypt.generate_password_hash(new_password).decode("utf-8")
        user.password_hash = password_hash

        try:
            db.session.commit()
        except Exception as exc:
            db.session.rollback()
            logger.error("DB error updating password: %s", exc)
            raise RuntimeError("DB_ERROR") from exc

        logger.info("Password updated successfully for user_id=%s", user.id)
        return user

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

