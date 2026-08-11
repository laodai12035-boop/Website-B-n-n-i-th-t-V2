## 📄 File `06-api-convention.md` (Ngắn gọn)
# 06 - QUY TẮC API

## 📍 Endpoint Convention
GET /api/v1/products # List
GET /api/v1/products/:id # Detail
POST /api/v1/products # Create (Admin)
PUT /api/v1/products/:id # Update (Admin)
DELETE /api/v1/products/:id # Delete (Admin)

text

## 📦 Response Format
```json
// Success
{
  "status": "success",
  "data": { ... },
  "message": "Done"
}

// Error
{
  "status": "error",
  "message": "Error message",
  "code": "ERROR_CODE"
}
🔢 Status Codes
Code	Ý nghĩa
200	OK
201	Created
400	Bad Request
401	Unauthorized
403	Forbidden
404	Not Found
500	Server Error
🔐 Authentication
Header: Authorization: Bearer <token>

Token: JWT, expires in 1 hour

✅ Quy tắc
Tất cả API đều có prefix /api/v1/

Luôn trả về format chuẩn (status + data)

Validate input trước khi xử lý

Log lỗi server (500)

CORS chỉ cho phép frontend domain