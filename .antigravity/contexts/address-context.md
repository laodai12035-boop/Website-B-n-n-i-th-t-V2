# ADDRESS CONTEXT - Rules cho phần Quản lý địa chỉ giao hàng

## 📋 Phạm vi
Code address bao gồm:
- Thêm/sửa/xóa địa chỉ giao hàng
- Đặt địa chỉ mặc định
- Hiển thị danh sách địa chỉ
- Tự động áp dụng địa chỉ mặc định khi thanh toán

## 📍 Address Model
```python
class Address(db.Model):
    __tablename__ = 'addresses'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    recipient_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(15), nullable=False)
    province = db.Column(db.String(100), nullable=False)
    district = db.Column(db.String(100), nullable=False)
    ward = db.Column(db.String(100), nullable=False)
    detail_address = db.Column(db.String(255), nullable=False)
    is_default = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        db.Index('idx_user_default', 'user_id', 'is_default'),
    )
```

## 📡 APIs
```python
GET    /api/v1/addresses              # Lấy danh sách địa chỉ của user
POST   /api/v1/addresses              # Thêm địa chỉ mới
PUT    /api/v1/addresses/:id          # Sửa địa chỉ
DELETE /api/v1/addresses/:id          # Xóa địa chỉ
PATCH  /api/v1/addresses/:id/default  # Đặt làm địa chỉ mặc định
```

## 🎨 Frontend Address Context
```jsx
// AddressContext.jsx
const AddressContext = React.createContext();

export const AddressProvider = ({ children }) => {
  const [addresses, setAddresses] = useState([]);
  const [defaultAddress, setDefaultAddress] = useState(null);

  const fetchAddresses = async () => {
    const res = await api.get('/addresses');
    setAddresses(res.data);
    setDefaultAddress(res.data.find(a => a.is_default) || null);
  };

  const addAddress = async (data) => {
    await api.post('/addresses', data);
    await fetchAddresses();
  };

  const updateAddress = async (id, data) => {
    await api.put(`/addresses/${id}`, data);
    await fetchAddresses();
  };

  const removeAddress = async (id) => {
    await api.delete(`/addresses/${id}`);
    await fetchAddresses();
  };

  const setAsDefault = async (id) => {
    await api.patch(`/addresses/${id}/default`);
    await fetchAddresses();
  };

  return (
    <AddressContext.Provider value={{
      addresses, defaultAddress,
      addAddress, updateAddress, removeAddress, setAsDefault
    }}>
      {children}
    </AddressContext.Provider>
  );
};
```

## ✅ Checklist khi làm Address
```
□ Mỗi user có thể có nhiều địa chỉ, nhưng chỉ 1 địa chỉ mặc định tại 1 thời điểm
□ Khi đặt địa chỉ mới làm mặc định, tự động bỏ mặc định của địa chỉ cũ (transaction)
□ Khi xóa địa chỉ đang là mặc định → tự động chọn địa chỉ khác làm mặc định (nếu còn) hoặc để trống
□ Validate số điện thoại, không cho địa chỉ rỗng các trường bắt buộc
□ Giới hạn số lượng địa chỉ tối đa mỗi user (ví dụ: 10) để tránh spam
□ Địa chỉ mặc định tự động điền vào bước thanh toán, nhưng khách vẫn chọn được địa chỉ khác
□ User chỉ được thao tác (sửa/xóa) trên địa chỉ thuộc về chính mình (kiểm tra ownership)