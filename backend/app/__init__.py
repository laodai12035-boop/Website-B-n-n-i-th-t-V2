"""
app/__init__.py — Flask Application Factory.

Dùng factory pattern để:
- Tránh circular import
- Dễ tạo nhiều app instance khác nhau (dev, test, prod)
- Inject config linh hoạt khi testing
"""

import os
from flask import Flask
from dotenv import load_dotenv

from config import config_map
from app.extensions import db, jwt, bcrypt, cors


def create_app(config_name: str = None) -> Flask:
    """
    Tạo và cấu hình Flask application.

    Args:
        config_name: Tên môi trường ('development', 'testing', 'production').
                     Nếu None, đọc từ biến môi trường FLASK_ENV.

    Returns:
        Flask app instance đã được cấu hình đầy đủ.
    """
    # Load .env nếu tồn tại (development)
    load_dotenv()

    app = Flask(__name__)

    # --- Load config ---
    if config_name is None:
        config_name = os.environ.get("FLASK_ENV", "development")
    app.config.from_object(config_map.get(config_name, config_map["development"]))

    # --- Khởi tạo extensions ---
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    # --- Đăng ký blueprints ---
    _register_blueprints(app)

    # --- Tự động migrate schema MySQL (tránh lỗi OperationalError 1054) ---
    from app.auto_migrate import run_auto_migrations
    run_auto_migrations(app)

    return app


def _register_blueprints(app: Flask) -> None:
    """Đăng ký tất cả blueprints vào app."""
    from app.routes.auth import auth_bp
    from app.routes.admin import admin_bp
    from app.routes.products import products_bp
    from app.routes.wishlist import wishlist_bp
    from app.routes.cart import cart_bp
    from app.routes.coupons import coupons_bp
    from app.routes.orders import orders_bp
    from app.routes.shipping import shipping_bp
    from app.routes.combos import combos_bp

    app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")
    app.register_blueprint(admin_bp, url_prefix="/api/v1/admin")
    app.register_blueprint(products_bp, url_prefix="/api/v1/products")
    app.register_blueprint(wishlist_bp, url_prefix="/api/v1/wishlist")
    app.register_blueprint(cart_bp, url_prefix="/api/v1/cart")
    app.register_blueprint(coupons_bp, url_prefix="/api/v1/coupons")
    app.register_blueprint(orders_bp, url_prefix="/api/v1/orders")
    app.register_blueprint(shipping_bp, url_prefix="/api/v1/shipping")
    app.register_blueprint(combos_bp, url_prefix="/api/v1/combos")
