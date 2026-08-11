# 04 - QUY TẮC CODE PYTHON

## Naming
| Loại | Quy tắc | Ví dụ |
|------|---------|-------|
| Class | PascalCase | `UserService` |
| Function | snake_case | `get_user_by_id()` |
| Variable | snake_case | `user_id` |
| Constant | UPPER_CASE | `MAX_RETRIES` |
| Private | `_` prefix | `_internal_method()` |

## Format
```python
# Đúng
def calculate_total(items):
    total = 0
    for item in items:
        total += item.price * item.quantity
    return total

# Sai
def calculate_total(items):
 total=0
 for item in items: total+=item.price*item.quantity
 return total

Imports
 # Đúng
import os
from flask import Flask, request
from app.models import User

# Sai
from flask import *  # Không dùng import *

Class Structure
class UserService:
    """Service xử lý logic User"""
    
    def __init__(self):
        self.db = db
    
    @staticmethod
    def get_user(user_id):
        """Lấy user theo ID"""
        return User.query.get(user_id)

Quy tắc
Indent: 4 spaces (KHÔNG dùng tab)
Max line: 79 characters
Docstring: Bắt buộc cho public functions
Type hints: Khuyến khích dùng
Error handling: Bắt buộc try/except