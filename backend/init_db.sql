-- ==========================================
-- Script khởi tạo Database cho XAMPP MySQL
-- Chạy file này trong phpMyAdmin hoặc MySQL CLI
-- ==========================================

-- Tạo database (nếu chưa có)
CREATE DATABASE IF NOT EXISTS noi_that_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE noi_that_db;

-- ==========================================
-- Bảng users
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    full_name     VARCHAR(100)  NOT NULL COMMENT 'Họ tên đầy đủ',
    email         VARCHAR(100)  NOT NULL UNIQUE COMMENT 'Email đăng nhập',
    phone         VARCHAR(15)   COMMENT 'Số điện thoại Việt Nam',
    avatar_url    VARCHAR(255)  COMMENT 'URL ảnh đại diện',
    password_hash VARCHAR(255)  NOT NULL COMMENT 'Mật khẩu đã hash bằng bcrypt',
    role          ENUM('user', 'admin') NOT NULL DEFAULT 'user' COMMENT 'Vai trò',
    is_active     BOOLEAN       NOT NULL DEFAULT TRUE COMMENT 'Trạng thái tài khoản',
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- Bảng products
-- ==========================================
CREATE TABLE IF NOT EXISTS products (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    name           VARCHAR(200)  NOT NULL COMMENT 'Tên sản phẩm',
    slug           VARCHAR(200)  NOT NULL UNIQUE COMMENT 'Slug URL',
    description    TEXT          COMMENT 'Mô tả sản phẩm',
    price          DECIMAL(10,2) NOT NULL COMMENT 'Giá gốc',
    discount_price DECIMAL(10,2) COMMENT 'Giá khuyến mãi',
    category       VARCHAR(50)   NOT NULL COMMENT 'Danh mục (ban, ghe, ke, tu, trang-tri)',
    stock          INT           NOT NULL DEFAULT 0 COMMENT 'Tồn kho',
    image_url      VARCHAR(500)  COMMENT 'URL ảnh đại diện',
    material       VARCHAR(100)  COMMENT 'Chất liệu sản phẩm',
    dimensions     VARCHAR(100)  COMMENT 'Kích thước',
    rating         FLOAT         NOT NULL DEFAULT 5.0 COMMENT 'Đánh giá trung bình',
    rating_count   INT           NOT NULL DEFAULT 0 COMMENT 'Số lượt đánh giá',
    is_active      BOOLEAN       NOT NULL DEFAULT TRUE COMMENT 'Hiển thị',
    created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_name (name),
    INDEX idx_category (category),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample furniture data
INSERT IGNORE INTO products (id, name, slug, description, price, discount_price, category, stock, image_url, is_active) VALUES
(1, 'Bộ Sofa Gỗ Óc Chó Cao Cấp', 'bo-sofa-go-oc-cho-cao-cap', 'Bộ sofa gỗ óc chó tự nhiên kết hợp đệm bọc da Ý cao cấp sang trọng cho phòng khách.', 28500000.00, 25000000.00, 'ghe', 5, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc', 1),
(2, 'Ghế Sofa Văng Da Hiện Đại', 'ghe-sofa-vang-da-hien-dai', 'Sofa văng da bò thật phong cách Bắc Âu tối giản, khung gỗ sồi chắc chắn.', 15800000.00, NULL, 'ghe', 8, 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7', 1),
(3, 'Bàn Ăn Gỗ Sồi 6 Ghế', 'ban-an-go-soi-6-ghe', 'Bộ bàn ăn gia đình 6 ghế bằng gỗ sồi Nga lau màu óc chó tinh tế.', 12500000.00, 10900000.00, 'ban', 10, 'https://images.unsplash.com/photo-1617806118233-18e1de247200', 1),
(4, 'Bàn Làm Việc Chân Sắt Tối Giản', 'ban-lam-viec-chan-sat-toi-gian', 'Bàn làm việc mặt gỗ công nghiệp phủ Melamine chống xước, chân sắt sơn tĩnh điện.', 2450000.00, NULL, 'ban', 20, 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd', 1),
(5, 'Kệ Sách Gỗ Khung Kim Loại', 'ke-sach-go-khung-kim-loai', 'Kệ sách trang trí 5 tầng khung thép tĩnh điện phong cách Industrial.', 3200000.00, 2800000.00, 'ke', 15, 'https://images.unsplash.com/photo-1594620302200-9a762244a156', 1),
(6, 'Kệ Tivi Gỗ Tự Nhiên Modern', 'ke-tivi-go-tu-nhien-modern', 'Kệ tivi phòng khách thiết kế nhiều ngăn kéo lưu trữ tiện lợi.', 6800000.00, NULL, 'ke', 7, 'https://images.unsplash.com/photo-1595428774223-ef52624120d2', 1),
(7, 'Tủ Quần Áo 4 Cánh Cửa Lùa', 'tu-quan-ao-4-canh-cua-lua', 'Tủ quần áo hiện đại tích hợp gương soi toàn thân và kệ trang trí bên hông.', 14500000.00, 12900000.00, 'tu', 4, 'https://images.unsplash.com/photo-1558997519-83ea9252edf8', 1),
(8, 'Đèn Sàn Trang Trí Đọc Sách Scandinavian', 'den-san-trang-tri-doc-sach-scandinavian', 'Đèn cây trang trí góc sofa với ánh sáng vàng ấm áp bảo vệ mắt.', 1200000.00, 950000.00, 'trang-tri', 25, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c', 1);

-- ------------------------------------------------------------
-- Bảng wishlists (Sản phẩm yêu thích)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wishlists (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT NOT NULL,
    product_id INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uix_user_product_wishlist UNIQUE (user_id, product_id),
    CONSTRAINT fk_wishlists_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_wishlists_products FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    INDEX idx_wishlists_user (user_id),
    INDEX idx_wishlists_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Bảng orders (Đơn hàng)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    user_id      INT NOT NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'delivered',
    total_amount DOUBLE NOT NULL DEFAULT 0.0,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_orders_user (user_id),
    INDEX idx_orders_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Bảng order_items (Chi tiết đơn hàng)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    order_id   INT NOT NULL,
    product_id INT NOT NULL,
    quantity   INT NOT NULL DEFAULT 1,
    price      DOUBLE NOT NULL DEFAULT 0.0,
    CONSTRAINT fk_order_items_orders FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_products FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    INDEX idx_order_items_order (order_id),
    INDEX idx_order_items_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Bảng reviews (Đánh giá & Bình luận sản phẩm)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    product_id  INT NOT NULL,
    order_id    INT NULL,
    rating      INT NOT NULL,
    comment     TEXT NULL,
    is_approved BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uix_user_product_review UNIQUE (user_id, product_id),
    CONSTRAINT fk_reviews_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_products FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_orders FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE SET NULL,
    INDEX idx_reviews_user (user_id),
    INDEX idx_reviews_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


