## 📄 File `order-context.md` (Context cho Order)

```markdown
# ORDER CONTEXT - Rules cho phần Đơn hàng

## 📋 Phạm vi
Code order bao gồm:
- Tạo đơn hàng (checkout)
- Xem lịch sử đơn hàng
- Chi tiết đơn hàng
- Cập nhật trạng thái (Admin)

## 📦 Order Model
```python
class Order(db.Model):
    __tablename__ = 'orders'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    order_number = db.Column(db.String(20), unique=True, nullable=False)
    total_amount = db.Column(db.Numeric(10, 2), nullable=False)
    status = db.Column(db.String(20), default='pending')
    shipping_address = db.Column(db.Text, nullable=False)
    payment_method = db.Column(db.String(50))
    payment_status = db.Column(db.String(20), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class OrderItem(db.Model):
    __tablename__ = 'order_items'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price_at_time = db.Column(db.Numeric(10, 2), nullable=False)
📡 APIs
python
POST   /api/v1/orders            # Tạo đơn hàng
GET    /api/v1/orders             # Lịch sử đơn hàng
GET    /api/v1/orders/:id         # Chi tiết đơn hàng
PUT    /api/v1/orders/:id/cancel  # Hủy đơn
PUT    /api/v1/orders/:id/status  # Update status (Admin)
🎨 Order Status Flow
text
pending → processing → shipped → delivered
                ↓
            cancelled
✅ Checklist khi làm Order
□ Order number được tạo tự động (unique)
□ Total = sum of (quantity * price_at_time)
□ Cart được xóa sau khi tạo order
□ Stock được trừ khi tạo order
□ Không cho tạo order nếu giỏ hàng rỗng
□ Order history chỉ xem được của user hiện tại