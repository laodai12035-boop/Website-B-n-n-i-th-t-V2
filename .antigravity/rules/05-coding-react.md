## File `05-coding-react.md` (Ngắn gọn)

```markdown
# 05 - QUY TẮC CODE REACT

## Naming
| Loại | Quy tắc | Ví dụ |
|------|---------|-------|
| Component | PascalCase | `ProductCard` |
| Hook | useXxx | `useAuth` |
| Handler | handleXxx | `handleSubmit` |
| Props | camelCase | `onAddToCart` |

## 🧩 Component Structure
```jsx
// 1. Imports
import React, { useState } from 'react';

// 2. Props Type
const ProductCard = ({ product, onAdd }) => {
  // 3. Hooks
  const [loading, setLoading] = useState(false);
  
  // 4. Handlers
  const handleClick = () => {
    setLoading(true);
    onAdd(product.id);
  };
  
  // 5. Render
  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <button onClick={handleClick}>
        {loading ? '...' : 'Add'}
      </button>
    </div>
  );
};

// 6. Export
export default ProductCard;

JSX Rules
jsx
// Đúng
<div className="container">
  {items.map(item => (
    <Item key={item.id} data={item} />
  ))}
</div>

// Sai
<div class="container">  {/* Dùng className, không dùng class */}
  {items.map(item => <Item data={item} />)}  {/* Thiếu key */}
</div>


Imports
jsx
// Đúng - Import có thứ tự
import React from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

// Sai - Import lộn xộn
import api from '../services/api';
import React from 'react';


Quy tắc
Mỗi file = 1 component (export default)
Functional component (KHÔNG dùng class)
Hooks chỉ dùng trong function component
useEffect cleanup khi cần
Key bắt buộc cho list items