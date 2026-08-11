## 📄 File `auth-context.md` (Context cho Auth)
# AUTH CONTEXT - Rules cho phần Authentication

## 📋 Phạm vi
Code auth bao gồm:
- Register / Login
- JWT Token
- Protected routes
- User profile

## 🔐 Backend APIs
```python
# app/routes/auth.py
POST   /api/v1/auth/register    # Đăng ký
POST   /api/v1/auth/login       # Đăng nhập
POST   /api/v1/auth/logout      # Đăng xuất
GET    /api/v1/auth/me          # Lấy user info
👤 User Model
python
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(100))
    role = db.Column(db.String(20), default='user')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
🔐 Security Rules
python
# Bắt buộc dùng bcrypt
from bcrypt import hashpw, gensalt, checkpw

def hash_password(password):
    return hashpw(password.encode('utf-8'), gensalt())

def verify_password(password, hashed):
    return checkpw(password.encode('utf-8'), hashed)

# JWT Config
JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour
JWT_REFRESH_TOKEN_EXPIRES = 604800  # 7 days
🎨 Frontend Auth
jsx
// AuthContext.jsx
const AuthContext = React.createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data.data;
    localStorage.setItem('token', token);
    setUser(user);
    return user;
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };
  
  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
✅ Checklist khi làm Auth
□ Password được hash trước khi lưu
□ JWT token được tạo sau login
□ Token được lưu ở localStorage (frontend)
□ Interceptor tự động thêm token vào header
□ Protected routes chỉ cho user đã login
□ Admin routes chỉ cho user role admin
□ Logout xóa token khỏi localStorage