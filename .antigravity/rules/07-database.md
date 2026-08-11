## 📄 File `07-database.md` (Ngắn gọn)

```markdown
# 07 - QUY TẮC DATABASE

## 📝 Naming
| Loại | Quy tắc | Ví dụ |
|------|---------|-------|
| Table | snake_case, số nhiều | `users`, `products` |
| Column | snake_case | `created_at` |
| PK | `id` | `id` |
| FK | `{table}_id` | `user_id` |

## 🏗️ Model Template
```python
from app import db
from datetime import datetime

class Product(db.Model):
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'price': float(self.price),
            'created_at': self.created_at.isoformat()
        }
🔗 Relationships
python
# One-to-Many
class User(db.Model):
    orders = db.relationship('Order', backref='user', lazy=True)

# Many-to-One
class Order(db.Model):
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))

# Many-to-Many (cần bảng trung gian)
cart_items = db.Table('cart_items',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id')),
    db.Column('product_id', db.Integer, db.ForeignKey('products.id'))
)
📋 Tables cần có
□ users
□ products
□ cart_items (user_id, product_id, quantity)
□ orders (user_id, total, status)
□ order_items (order_id, product_id, quantity, price)
⚡ Quy tắc
Luôn có created_at, updated_at

KHÔNG xóa dữ liệu (dùng soft delete nếu cần)

Index cho cột hay search (category, price)

Migration khi thay đổi schema

Test migration trước khi deploy