"""
models/user.py — SQLAlchemy model cho bảng users.

Đây là source of truth cho schema bảng users.
Script SQL tương ứng: backend/init_db.sql
"""

from datetime import datetime
from app.extensions import db


class User(db.Model):
    """Model đại diện cho tài khoản người dùng trong hệ thống."""

    __tablename__ = "users"

    # Primary key
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # Thông tin cá nhân
    full_name = db.Column(db.String(100), nullable=False, comment="Họ tên đầy đủ")
    email = db.Column(
        db.String(100),
        nullable=False,
        unique=True,
        index=True,
        comment="Email đăng nhập — unique, lowercase",
    )
    phone = db.Column(db.String(15), nullable=True, comment="Số điện thoại Việt Nam")

    # Authentication
    password_hash = db.Column(
        db.String(255), nullable=False, comment="Mật khẩu hash bcrypt — KHÔNG LƯU PLAINTEXT"
    )

    # Phân quyền
    role = db.Column(
        db.Enum("user", "admin", name="user_role"),
        nullable=False,
        default="user",
        comment="Vai trò: user hoặc admin",
    )

    # Trạng thái tài khoản (soft disable, không xóa)
    is_active = db.Column(
        db.Boolean, nullable=False, default=True, comment="False = tài khoản bị khóa"
    )

    # Audit timestamps
    created_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow
    )
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    # -------------------------------------------------------
    # Relationships (sẽ thêm khi implement các model liên quan)
    # -------------------------------------------------------
    # orders    = db.relationship('Order', backref='user', lazy=True)
    # cart_items = db.relationship('CartItem', backref='user', lazy=True)

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} role={self.role}>"

    def to_dict(self) -> dict:
        """
        Serialize user thành dict an toàn để trả về API.
        KHÔNG bao gồm password_hash.
        """
        return {
            "id": self.id,
            "full_name": self.full_name,
            "email": self.email,
            "phone": self.phone,
            "role": self.role,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def to_public_dict(self) -> dict:
        """
        Subset an toàn hơn để trả về sau khi đăng ký/đăng nhập.
        Không expose role để tránh enumeration.
        """
        return {
            "id": self.id,
            "full_name": self.full_name,
            "email": self.email,
        }
