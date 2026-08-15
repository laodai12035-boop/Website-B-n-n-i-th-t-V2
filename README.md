# Website Bán Đồ Nội Thất V2

Hệ thống E-Commerce thương mại điện tử chuyên kinh doanh sản phẩm nội thất cao cấp, được thiết kế theo kiến trúc **Clean Architecture / Layered Pattern** với **Flask Backend** và **React (Vite) Frontend**.

---

## Tổng quan Hệ thống

Website hỗ trợ đầy đủ quy trình bán hàng trực tuyến: từ tìm kiếm, xem chi tiết sản phẩm, tạo combo ưu đãi, áp dụng mã giảm giá (coupon), tính phí vận chuyển, đến đặt hàng và quản lý đơn hàng cho cả Khách hàng và Quản trị viên (Admin).

---

## Công nghệ sử dụng (Tech Stack)

### Backend
- **Ngôn ngữ:** Python 3.10+ (Khuyên dùng Python 3.12 / 3.13)
- **Framework:** Flask (Application Factory Pattern)
- **Database ORM:** Flask-SQLAlchemy + PyMySQL (MySQL / MariaDB trên XAMPP)
- **Xác thực (Authentication):** Flask-JWT-Extended (Access Token & Refresh Token)
- **Bảo mật:** Flask-Bcrypt (Mã hóa mật khẩu)
- **CORS & Utilities:** Flask-CORS, python-dotenv, Marshmallow
- **Testing:** Pytest, pytest-flask

### Frontend
- **Framework:** React 18 (Vite)
- **Routing:** React Router DOM v6
- **Styling:** Tailwind CSS + PostCSS + Autoprefixer
- **HTTP Client:** Axios (Interceptors xử lý JWT Token)

---

## Cấu trúc Thư mục Dự án

```
Website Bán đồ nội thất V2/
├── backend/                  # Flask RESTful API Backend
│   ├── app/                  # Mã nguồn chính Backend
│   │   ├── models/           # SQLAlchemy Data Models (User, Product, Order, Coupon, v.v.)
│   │   ├── routes/           # Blueprints Controllers / APIs
│   │   ├── services/         # Business Logic Layer
│   │   ├── extensions.py     # Khởi tạo db, jwt, bcrypt, cors
│   │   └── auto_migrate.py   # Tự động cập nhật Schema MySQL khi khởi chạy
│   ├── tests/                # Unit Tests & Integration Tests (Pytest)
│   ├── config.py             # Cấu hình môi trường (Development, Testing, Production)
│   ├── run.py                # Entry point khởi chạy Flask Dev Server (Port 5000)
│   └── .env                  # Biến môi trường Backend
├── frontend/                 # React Vite Frontend
│   ├── src/
│   │   ├── components/       # UI Components (Navbar, Footer, Modals, Cards...)
│   │   ├── pages/            # Các trang giao diện (Home, Shop, Cart, Checkout, Admin...)
│   │   ├── services/         # Tích hợp API Axios
│   │   └── context/          # State Management (AuthContext, CartContext...)
│   ├── vite.config.js        # Cấu hình Vite & Proxy API (/api -> http://localhost:5000)
│   └── package.json
└── docs/                     # Tài liệu thiết kế API, Database Schema, Architecture
```

---

## Hướng dẫn Cài đặt & Khởi chạy (Local Development)

### Yêu cầu Tiền đề (Prerequisites)
1. **XAMPP / MariaDB / MySQL Server** (Đang chạy MySQL ở port `3306`)
2. **Python 3.10+** (đã thêm vào PATH)
3. **Node.js 18+ & npm**

---

### Step 1: Cấu hình Cơ sở dữ liệu (MySQL / XAMPP)
1. Mở **XAMPP Control Panel** và nhấn **Start** tại mục **MySQL** (Default Port `3306`).
2. Tạo cơ sở dữ liệu có tên: `noi_that_db` (bằng phpMyAdmin hoặc MySQL CLI):
   ```sql
   CREATE DATABASE noi_that_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

---

### Step 2: Khởi chạy Backend (Flask)

1. Mở Terminal tại thư mục `backend`:
   ```bash
   cd backend
   ```

2. Tạo và kích hoạt môi trường ảo (Virtual Environment - Khuyên dùng):
   - **Windows:**
     ```bash
     python -m venv venv
     .\venv\Scripts\activate
     ```
   - **macOS/Linux:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. Cài đặt các thư viện phụ thuộc:
   ```bash
   pip install -r requirements.txt
   ```

4. Tạo/Kiểm tra file `.env` tại thư mục `backend/`:
   ```ini
   FLASK_ENV=development
   FLASK_DEBUG=1
   SECRET_KEY=your_secret_key
   
   # Database (XAMPP MySQL)
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=noi_that_db
   DB_USER=root
   DB_PASSWORD=
   
   # JWT
   JWT_SECRET_KEY=your_jwt_secret
   ```

5. Khởi chạy Flask Server:
   ```bash
   python run.py
   ```
   > Backend sẽ tự động chạy auto-migration, tạo bảng & dữ liệu mẫu (Seed Data) và lắng nghe tại `http://localhost:5000`.

---

### Step 3: Khởi chạy Frontend (React Vite)

1. Mở một Terminal mới và di chuyển vào thư mục `frontend`:
   ```bash
   cd frontend
   ```

2. Cài đặt các npm packages:
   ```bash
   npm install
   ```

3. Khởi chạy môi trường Dev Server:
   ```bash
   npm run dev
   ```
   > Frontend sẽ chạy tại `http://localhost:5173` (Tự động proxy các request `/api` sang `http://localhost:5000`).

---

## Các Tính năng Chính

- **Hệ thống Tài khoản & Phân quyền:** Đăng ký, đăng nhập JWT, đổi mật khẩu, quên mật khẩu (mã xác nhận Email/OTP), phân quyền Khách hàng và Admin.
- **Danh mục & Sản phẩm:** Xem danh sách, lọc theo giá/loại/bảo hành, tìm kiếm sản phẩm, xem chi tiết và biến thể.
- **Combo Khuyến mãi & Coupon:** Bán hàng theo gói Combo tiết kiệm, áp dụng mã giảm giá theo phần trăm hoặc số tiền cố định.
- **Giỏ hàng & Đặt hàng:** Quản lý giỏ hàng real-time, tính phí vận chuyển theo khoảng cách/trọng lượng, thanh toán COD hoặc quét mã QR Chuyển khoản.
- **Quản trị Admin (Admin Dashboard):** Quản lý đơn hàng (Duyệt, Giao hàng, Hủy), Quản lý sản phẩm & tồn kho, Quản lý banner quảng cáo, Thống kê doanh thu.

---

## Xử lý Sự cố Thường gặp (Troubleshooting)

### 1. Lỗi `python run.py` bị đứng yên / treo khi khởi chạy
* **Nguyên nhân:** XAMPP MySQL bị tắt đột ngột trước đó dẫn tới hỏng bảng phân quyền Aria (`mysql/db.MAI`). Khi Flask kết nối tới MySQL, tiến trình bị treo ở câu lệnh socket.
* **Cách khắc phục:**
  1. Tắt toàn bộ tiến trình Python và MySQL đang bị treo:
     ```cmd
     taskkill /F /IM python.exe
     taskkill /F /IM mysqld.exe
     ```
  2. Phục hồi bảng dữ liệu bị hỏng trong XAMPP bằng công cụ `aria_chk`:
     ```cmd
     C:\xampp\mysql\bin\aria_chk.exe -r C:\xampp\mysql\data\mysql\db.MAI
     ```
  3. Bật lại MySQL trong XAMPP Control Panel và chạy lại `python run.py`.

### 2. Lỗi CORS khi gọi API từ Frontend
* **Nguyên nhân:** File `vite.config.js` thiếu proxy hoặc Backend chưa bật `Flask-CORS`.
* **Cách khắc phục:** Đảm bảo `backend/run.py` có đăng ký CORS và `frontend/vite.config.js` cấu hình proxy `/api` tới `http://localhost:5000`.

---

## Kiểm thử (Testing)

Để chạy hệ thống Unit test cho Backend:
```bash
cd backend
pytest
```
