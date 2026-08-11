## 📄 File `product-context.md` (Context cho Product)

```markdown
# PRODUCT CONTEXT - Rules cho phần Sản phẩm

## 📋 Phạm vi
Code product bao gồm:
- Hiển thị danh sách sản phẩm
- Chi tiết sản phẩm
- Tìm kiếm và lọc
- CRUD (cho Admin)

## 🏷️ Product Model
```python
class Product(db.Model):
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(200), unique=True, nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    discount_price = db.Column(db.Numeric(10, 2))
    category = db.Column(db.String(50))
    stock = db.Column(db.Integer, default=0)
    image_url = db.Column(db.String(500))
    is_active = db.Column(db.Boolean, default=True)
📡 APIs
python
GET    /api/v1/products          # List (có filter)
GET    /api/v1/products/:id      # Detail
GET    /api/v1/products/categories # Categories
POST   /api/v1/products          # Create (Admin)
PUT    /api/v1/products/:id      # Update (Admin)
DELETE /api/v1/products/:id      # Delete (Admin)
🎨 Frontend Components
jsx
// ProductCard.jsx - Hiển thị 1 sản phẩm
// ProductList.jsx - Danh sách sản phẩm
// ProductFilters.jsx - Bộ lọc
// ProductDetail.jsx - Trang chi tiết
🔍 Filter Parameters
text
GET /products?category=ban&page=1&limit=20&search=go&sort=price_asc
✅ Checklist khi làm Product
□ Slug được tạo từ tên sản phẩm
□ Giá luôn > 0
□ Tồn kho không âm
□ Có ảnh đại diện
□ Category có sẵn: ['ban', 'ghe', 'ke', 'tu', 'trang-tri']
□ Search hoạt động với name và description
□ Pagination mặc định 20 items/page