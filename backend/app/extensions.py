"""
extensions.py — Khởi tạo Flask extensions tập trung.

Mục đích: Tránh circular import khi các module khác (models, routes)
cần import db, bcrypt, jwt cùng lúc với app factory.
Pattern: Khởi tạo extension ở đây (không bind app),
sau đó gọi extension.init_app(app) trong factory.
"""

from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_cors import CORS

db = SQLAlchemy()
jwt = JWTManager()
bcrypt = Bcrypt()
cors = CORS()
