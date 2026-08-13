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
    dimensions     VARCHAR(100)  COMMENT 'Kích thước (Dài x Rộng x Cao) đơn vị cm, VD: 120x60x75',
    weight_kg      FLOAT         NULL COMMENT 'Trọng lượng thực tế (kg) - QTN-07',
    rating         FLOAT         NOT NULL DEFAULT 5.0 COMMENT 'Đánh giá trung bình',
    rating_count   INT           NOT NULL DEFAULT 0 COMMENT 'Số lượt đánh giá',
    is_active      BOOLEAN       NOT NULL DEFAULT TRUE COMMENT 'Hiển thị',
    created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_name (name),
    INDEX idx_category (category),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample furniture data (with weight_kg and dimensions for QTN-07)
INSERT IGNORE INTO products (id, name, slug, description, price, discount_price, category, stock, image_url, is_active, dimensions, weight_kg) VALUES
(1, 'Bộ Sofa Gỗ Óc Chó Cao Cấp', 'bo-sofa-go-oc-cho-cao-cap', 'Bộ sofa gỗ óc chó tự nhiên kết hợp đệm bọc da Ý cao cấp sang trọng cho phòng khách.', 28500000.00, 25000000.00, 'ghe', 5, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc', 1, '220x90x85', 25.0),
(2, 'Ghế Sofa Văng Da Hiện Đại', 'ghe-sofa-vang-da-hien-dai', 'Sofa văng da bò thật phong cách Bắc Âu tối giản, khung gỗ sồi chắc chắn.', 15800000.00, NULL, 'ghe', 8, 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7', 1, '180x80x75', 18.0),
(3, 'Bàn Ăn Gỗ Sồi 6 Ghế', 'ban-an-go-soi-6-ghe', 'Bộ bàn ăn gia đình 6 ghế bằng gỗ sồi Nga lau màu óc chó tinh tế.', 12500000.00, 10900000.00, 'ban', 10, 'https://images.unsplash.com/photo-1617806118233-18e1de247200', 1, '200x90x78', 35.0),
(4, 'Bàn Làm Việc Chân Sắt Tối Giản', 'ban-lam-viec-chan-sat-toi-gian', 'Bàn làm việc mặt gỗ công nghiệp phủ Melamine chống xước, chân sắt sơn tĩnh điện.', 2450000.00, NULL, 'ban', 20, 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd', 1, '140x60x75', 12.0),
(5, 'Kệ Sách Gỗ Khung Kim Loại', 'ke-sach-go-khung-kim-loai', 'Kệ sách trang trí 5 tầng khung thép tĩnh điện phong cách Industrial.', 3200000.00, 2800000.00, 'ke', 15, 'https://images.unsplash.com/photo-1594620302200-9a762244a156', 1, '80x30x180', 8.0),
(6, 'Kệ Tivi Gỗ Tự Nhiên Modern', 'ke-tivi-go-tu-nhien-modern', 'Kệ tivi phòng khách thiết kế nhiều ngăn kéo lưu trữ tiện lợi.', 6800000.00, NULL, 'ke', 7, 'https://images.unsplash.com/photo-1595428774223-ef52624120d2', 1, '160x40x55', 15.0),
(7, 'Tủ Quần Áo 4 Cánh Cửa Lưa', 'tu-quan-ao-4-canh-cua-lua', 'Tủ quần áo hiện đại tích hợp gương soi toàn thân và kệ trang trí bên hông.', 14500000.00, 12900000.00, 'tu', 4, 'https://images.unsplash.com/photo-1558997519-83ea9252edf8', 1, '200x60x220', 45.0),
(8, 'Đèn Sàn Trang Trí Đọc Sách Scandinavian', 'den-san-trang-tri-doc-sach-scandinavian', 'Đèn cây trang trí góc sofa với ánh sáng vàng ấm áp bảo vệ mắt.', 1200000.00, 950000.00, 'trang-tri', 25, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c', 1, '30x30x150', 2.5);

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
    id               INT AUTO_INCREMENT PRIMARY KEY,
    order_code       VARCHAR(50) NOT NULL UNIQUE COMMENT 'Mã đơn hàng (VD: ORD-20260812-1001)',
    user_id          INT NOT NULL,
    recipient_name   VARCHAR(100) NOT NULL COMMENT 'Họ tên người nhận',
    recipient_phone  VARCHAR(20) NOT NULL COMMENT 'SĐT người nhận',
    shipping_address VARCHAR(255) NOT NULL COMMENT 'Địa chỉ giao hàng',
    note             VARCHAR(255) NULL COMMENT 'Ghi chú đơn hàng',
    payment_method   VARCHAR(20) NOT NULL DEFAULT 'COD' COMMENT 'COD hoặc VNPAY',
    payment_status   VARCHAR(20) NOT NULL DEFAULT 'unpaid' COMMENT 'unpaid hoặc paid',
    status           VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT 'pending, confirmed, shipping, delivered, cancelled',
    subtotal         DOUBLE NOT NULL DEFAULT 0.0,
    discount_amount  DOUBLE NOT NULL DEFAULT 0.0,
    shipping_fee     DOUBLE NOT NULL DEFAULT 0.0 COMMENT 'Phí vận chuyển QTN-07',
    total_amount     DOUBLE NOT NULL DEFAULT 0.0,
    qr_expire_at     DATETIME NULL COMMENT 'QR payment expiry timestamp (NT-05-CN-002)',
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_orders_user (user_id),
    INDEX idx_orders_code (order_code),
    INDEX idx_orders_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Bảng order_items (Chi tiết đơn hàng)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    order_id     INT NOT NULL,
    product_id   INT NOT NULL,
    product_name VARCHAR(200) NULL,
    quantity     INT NOT NULL DEFAULT 1,
    price        DOUBLE NOT NULL DEFAULT 0.0,
    subtotal     DOUBLE NOT NULL DEFAULT 0.0,
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

-- ------------------------------------------------------------
-- Bảng cart_items (Giỏ hàng người dùng)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cart_items (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT NOT NULL,
    product_id INT NOT NULL,
    quantity   INT NOT NULL DEFAULT 1,
    added_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uix_user_product_cart UNIQUE (user_id, product_id),
    CONSTRAINT fk_cart_items_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_items_products FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    INDEX idx_cart_items_user (user_id),
    INDEX idx_cart_items_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Bảng coupons (Mã giảm giá & Khuyến mãi QTN-01)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coupons (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    code            VARCHAR(50) NOT NULL UNIQUE COMMENT 'Mã giảm giá (ví dụ: NOITHAT10)',
    description     VARCHAR(255) COMMENT 'Mô tả khuyến mãi',
    discount_type   ENUM('percent', 'fixed') NOT NULL DEFAULT 'percent' COMMENT 'Loại giảm giá',
    discount_value  DOUBLE NOT NULL COMMENT 'Giá trị giảm (% hoặc VND)',
    min_order_value DOUBLE NOT NULL DEFAULT 0.0 COMMENT 'Giá trị đơn hàng tối thiểu QTN-01',
    max_discount    DOUBLE NULL COMMENT 'Số tiền giảm tối đa',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Trạng thái',
    start_date      DATETIME NULL COMMENT 'Ngày bắt đầu',
    end_date        DATETIME NULL COMMENT 'Ngày hết hạn',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_coupons_code (code),
    INDEX idx_coupons_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed coupons data
INSERT IGNORE INTO coupons (id, code, description, discount_type, discount_value, min_order_value, max_discount, is_active) VALUES
(1, 'NOITHAT10', 'Giảm 10% cho đơn hàng từ 2.000.000đ', 'percent', 10.0, 2000000.0, 1000000.0, 1),
(2, 'GIAM500K', 'Giảm trực tiếp 500.000đ cho đơn từ 5.000.000đ', 'fixed', 500000.0, 5000000.0, NULL, 1),
(3, 'HETHAN2025', 'Mã ưu đãi đã hết hạn sử dụng', 'percent', 20.0, 1000000.0, NULL, 0);

-- ------------------------------------------------------------
-- Bảng combos (Bộ sản phẩm ưu đãi NT-05-CN-005)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS combos (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    name             VARCHAR(200) NOT NULL COMMENT 'Tên combo',
    description      TEXT NULL COMMENT 'Mô tả combo',
    discount_percent FLOAT NOT NULL DEFAULT 0.0 COMMENT '% giảm giá khi mua trọn bộ',
    is_active        BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Trạng thái bật/tắt',
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_combos_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Bảng combo_items (Chi tiết sản phẩm trong combo)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS combo_items (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    combo_id   INT NOT NULL,
    product_id INT NOT NULL,
    quantity   INT NOT NULL DEFAULT 1,
    CONSTRAINT uix_combo_product UNIQUE (combo_id, product_id),
    CONSTRAINT fk_combo_items_combos FOREIGN KEY (combo_id) REFERENCES combos (id) ON DELETE CASCADE,
    CONSTRAINT fk_combo_items_products FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    INDEX idx_combo_items_combo (combo_id),
    INDEX idx_combo_items_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed combos data
INSERT IGNORE INTO combos (id, name, description, discount_percent, is_active) VALUES
(1, 'Bộ Trọn Gói Phòng Khách Sang Trọng', 'Bộ Combo gồm 01 Bộ Sofa Gỗ Óc Chó và 01 Kệ Tivi Gỗ Tự Nhiên với ưu đãi giảm giá 15% khi mua trọn bộ.', 15.0, 1),
(2, 'Bộ Góc Làm Việc Tối Giản', 'Bộ Combo gồm 01 Bàn Làm Việc Chân Sắt và 01 Kệ Sách Gỗ Khung Kim Loại giảm ngay 10%.', 10.0, 1);

INSERT IGNORE INTO combo_items (id, combo_id, product_id, quantity) VALUES
(1, 1, 1, 1), -- Sofa gỗ óc chó (id=1)
(2, 1, 6, 1), -- Kệ tivi gỗ (id=6)
(3, 2, 4, 1), -- Bàn làm việc (id=4)
(4, 2, 5, 1); -- Kệ sách (id=5)

-- ------------------------------------------------------------
-- Bảng return_requests (Yêu cầu Đổi/Trả hàng NT-06-CN-004)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS return_requests (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    order_id        INT NOT NULL,
    user_id         INT NOT NULL,
    request_type    VARCHAR(20) NOT NULL DEFAULT 'return' COMMENT 'return/exchange/warranty',
    reason          TEXT NOT NULL COMMENT 'Lý do đổi trả',
    proof_image_url TEXT NULL COMMENT 'URL ảnh minh chứng',
    status          VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT 'pending/approved/rejected',
    admin_note      TEXT NULL COMMENT 'Ghi chú Admin',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_return_requests_orders FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_return_requests_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_return_requests_order (order_id),
    INDEX idx_return_requests_user (user_id),
    INDEX idx_return_requests_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Seed sample users for testing (Password123@)
-- ============================================================
INSERT IGNORE INTO users (id, full_name, email, phone, password_hash, role, is_active) VALUES
(1, 'Nguyễn Văn Anh', 'user@example.com', '0901234567', '$2b$12$KIXs6N5kK8W/Bv8r9c5Jv.dM.k5zD4aL0R2oP7Q9x5B8n9M1K2L3m', 'user', 1),
(2, 'Trần Thị Bình', 'user2@example.com', '0909876543', '$2b$12$KIXs6N5kK8W/Bv8r9c5Jv.dM.k5zD4aL0R2oP7Q9x5B8n9M1K2L3m', 'user', 1),
(3, 'Quản Trị Viên (Admin)', 'admin@example.com', '0900000000', '$2b$12$KIXs6N5kK8W/Bv8r9c5Jv.dM.k5zD4aL0R2oP7Q9x5B8n9M1K2L3m', 'admin', 1);

-- ============================================================
-- Seed sample orders for Epic 6 Testing
-- ============================================================
INSERT IGNORE INTO orders (id, order_code, user_id, recipient_name, recipient_phone, shipping_address, note, payment_method, payment_status, status, subtotal, discount_amount, shipping_fee, total_amount, created_at) VALUES
(1, 'ORD-20260810-1001', 1, 'Nguyễn Văn Anh', '0901234567', '123 Nguyễn Huệ, P. Bến Nghé, Q1, TP.HCM', 'Giao giờ hành chính', 'COD', 'unpaid', 'pending', 28500000.00, 0.00, 120000.00, 28620000.00, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(2, 'ORD-20260811-1002', 1, 'Nguyễn Văn Anh', '0901234567', '123 Nguyễn Huệ, P. Bến Nghé, Q1, TP.HCM', 'Đã VietQR thanh toán', 'QR_BANK', 'paid', 'confirmed', 10900000.00, 0.00, 50000.00, 10950000.00, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(3, 'ORD-20260811-1003', 2, 'Trần Thị Bình', '0909876543', '456 Lê Lợi, P. 1, Hải Châu, Đà Nẵng', 'Hàng cồng kềnh', 'COD', 'unpaid', 'shipping', 8100000.00, 0.00, 50000.00, 8150000.00, DATE_SUB(NOW(), INTERVAL 36 HOUR)),
(4, 'ORD-20260805-1004', 1, 'Nguyễn Văn Anh', '0901234567', '123 Nguyễn Huệ, P. Bến Nghé, Q1, TP.HCM', 'Nghiệm thu đủ', 'QR_BANK', 'paid', 'delivered', 12900000.00, 0.00, 50000.00, 12950000.00, DATE_SUB(NOW(), INTERVAL 7 DAY)),
(5, 'ORD-20260601-1005', 1, 'Nguyễn Văn Anh', '0901234567', '123 Nguyễn Huệ, P. Bến Nghé, Q1, TP.HCM', 'Đã hoàn tất', 'COD', 'paid', 'delivered', 1900000.00, 0.00, 50000.00, 1950000.00, DATE_SUB(NOW(), INTERVAL 70 DAY)),
(6, 'ORD-20260809-1006', 2, 'Trần Thị Bình', '0909876543', '456 Lê Lợi, Hải Châu, Đà Nẵng', 'Khách đổi ý', 'COD', 'unpaid', 'cancelled', 6800000.00, 0.00, 50000.00, 6850000.00, DATE_SUB(NOW(), INTERVAL 3 DAY));

-- Seed order items
INSERT IGNORE INTO order_items (id, order_id, product_id, product_name, price, quantity) VALUES
(1, 1, 1, 'Bộ Sofa Gỗ Óc Chó Cao Cấp', 28500000.00, 1),
(2, 2, 3, 'Bàn Ăn Gỗ Sồi 6 Ghế', 10900000.00, 1),
(3, 3, 4, 'Bàn Làm Việc Chân Sắt Tối Giản', 2450000.00, 2),
(4, 3, 5, 'Kệ Sách Gỗ Khung Kim Loại', 3200000.00, 1),
(5, 4, 7, 'Tủ Quần Áo 4 Cánh Cửa Lùa', 12900000.00, 1),
(6, 5, 8, 'Đèn Sàn Trang Trí Đọc Sách Scandinavian', 950000.00, 2),
(7, 6, 6, 'Kệ Tivi Gỗ Tự Nhiên Modern', 6800000.00, 1);

-- Seed return request (NT-06-CN-004)
INSERT IGNORE INTO return_requests (id, order_id, user_id, request_type, reason, proof_image_url, status, created_at) VALUES
(1, 4, 1, 'exchange', 'Nẹp viền cánh tủ bị trầy xước nhẹ trong quá trình vận chuyển.', 'https://images.unsplash.com/photo-1558997519-83ea9252edf8', 'pending', DATE_SUB(NOW(), INTERVAL 2 DAY));

-- ------------------------------------------------------------
-- Bảng addresses (Địa chỉ giao hàng NT-07)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS addresses (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    user_id        INT NOT NULL,
    recipient_name VARCHAR(100) NOT NULL COMMENT 'Họ tên người nhận',
    phone          VARCHAR(15) NOT NULL COMMENT 'SĐT người nhận',
    province       VARCHAR(100) NOT NULL COMMENT 'Tỉnh/Thành phố',
    district       VARCHAR(100) NOT NULL COMMENT 'Quận/Huyện',
    ward           VARCHAR(100) NOT NULL COMMENT 'Phường/Xã',
    detail_address VARCHAR(255) NOT NULL COMMENT 'Địa chỉ chi tiết',
    is_default     BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Đã đặt làm mặc định',
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_addresses_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_user_default (user_id, is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed addresses sample data
INSERT IGNORE INTO addresses (id, user_id, recipient_name, phone, province, district, ward, detail_address, is_default) VALUES
(1, 1, 'Nguyễn Văn Anh', '0901234567', 'TP. Hồ Chí Minh', 'Quận 1', 'Phường Bến Nghé', '123 Nguyễn Huệ', 1),
(2, 2, 'Trần Thị Bình', '0909876543', 'Đà Nẵng', 'Hải Châu', 'Phường 1', '456 Lê Lợi', 1);

