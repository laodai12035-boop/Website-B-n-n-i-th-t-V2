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
-- Hướng dẫn sử dụng
-- ==========================================
-- 1. Mở phpMyAdmin (http://localhost/phpmyadmin)
-- 2. Click "SQL" tab
-- 3. Paste toàn bộ nội dung file này và Execute
-- HOẶC chạy: mysql -u root -p < init_db.sql
