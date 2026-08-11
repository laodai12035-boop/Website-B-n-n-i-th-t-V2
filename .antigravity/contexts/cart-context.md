## 📄 File `cart-context.md` (Context cho Cart)

```markdown
# CART CONTEXT - Rules cho phần Giỏ hàng

## 📋 Phạm vi
Code cart bao gồm:
- Thêm/xóa sản phẩm vào giỏ
- Cập nhật số lượng
- Hiển thị giỏ hàng
- Tính tổng tiền

## 🛒 Cart Model
```python
class CartItem(db.Model):
    __tablename__ = 'cart_items'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity = db.Column(db.Integer, default=1)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        db.UniqueConstraint('user_id', 'product_id', name='unique_cart'),
    )
📡 APIs
python
GET    /api/v1/cart              # Lấy giỏ hàng
POST   /api/v1/cart/items        # Thêm item
PUT    /api/v1/cart/items/:id    # Update quantity
DELETE /api/v1/cart/items/:id    # Xóa item
DELETE /api/v1/cart/clear        # Xóa toàn bộ
🎨 Frontend Cart Context
jsx
// CartContext.jsx
const CartContext = React.createContext();

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  
  const addToCart = async (productId, quantity = 1) => {
    await api.post('/cart/items', { product_id: productId, quantity });
    await fetchCart(); // Refresh
  };
  
  const updateQuantity = async (productId, quantity) => {
    await api.put(`/cart/items/${productId}`, { quantity });
    await fetchCart();
  };
  
  const removeItem = async (productId) => {
    await api.delete(`/cart/items/${productId}`);
    await fetchCart();
  };
  
  return (
    <CartContext.Provider value={{ items, total, addToCart, updateQuantity, removeItem }}>
      {children}
    </CartContext.Provider>
  );
};
✅ Checklist khi làm Cart
□ Mỗi user chỉ có 1 giỏ hàng
□ Không thêm sản phẩm trùng (update quantity)
□ Không thêm sản phẩm hết hàng (stock > 0)
□ Tổng tiền tự động cập nhật
□ Cart được lưu ở localStorage (cho guest users)