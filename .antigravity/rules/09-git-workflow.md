# 09 - GIT WORKFLOW

## 1. Branching Strategy

Dự án cá nhân — **không có nhánh `develop`**.

```
main                        ← nhánh chính, production-ready
  └── feature/<Story-ID>-<ten-ngan>   ← 1 Story = 1 nhánh
```

### Quy tắc nhánh
- Tạo nhánh từ `main`: `git checkout -b feature/NT-XX-CN-XXX-ten-story`
- Tên nhánh: `feature/<Story-ID>-<mô-tả-gạch-ngang>`  
  - Ví dụ: `feature/NT-01-CN-001-dang-ky-tai-khoan`
- **Không commit thẳng vào `main`**
- Sau khi hoàn thành Story: push branch → báo người dùng review → merge vào `main`

---

## 2. Quy ước commit

Dùng **Conventional Commits**, gắn kèm mã Task ID để truy vết ngược lại backlog:

```
<type>(<phạm vi>): <mô tả ngắn tiếng Việt> [<Task ID>]
```

Ví dụ:
```
feat(auth): thêm API đăng ký tài khoản [NT-01-CN-001-CV-03]
docs(auth): phân tích nghiệp vụ đăng ký [NT-01-CN-001-CV-01]
style(auth): dựng giao diện form đăng ký [NT-01-CN-001-CV-02]
test(auth): thêm test case đăng ký tài khoản [NT-01-CN-001-CV-04]
fix(cart): sửa lỗi tính sai tổng tiền khi xóa sản phẩm [NT-04-CN-002-CV-03]
chore: khởi tạo backend Flask boilerplate
```

### Bảng `type` sử dụng

| type | Dùng khi |
|---|---|
| `feat` | Thêm chức năng / API / component mới |
| `fix` | Sửa lỗi |
| `docs` | Tài liệu, ghi chú phân tích nghiệp vụ |
| `style` | Giao diện, CSS — không đổi logic |
| `refactor` | Tái cấu trúc code, không đổi hành vi |
| `test` | Thêm / sửa test case |
| `chore` | Cấu hình, dependency, boilerplate — không ảnh hưởng logic |

---

## 3. Tần suất commit — commit nhỏ, commit nhiều

AI commit ngay sau khi hoàn thành **mỗi Task (CV-xx)**. Theo 4 Task chuẩn mỗi Story:

1. **CV-01** (Phân tích nghiệp vụ) → 1 commit `docs`
2. **CV-02** (Thiết kế giao diện) → 1–2 commit `style`
3. **CV-03** (Phát triển chức năng) → chia nhỏ tối đa:
   - 1 commit cho model / schema DB
   - 1 commit cho validation schema
   - 1 commit cho service + API
   - 1 commit cho frontend service + context
   - 1 commit cho nối UI ↔ API
4. **CV-04** (Kiểm thử) → 1 commit `test`

> **Mục tiêu:** Mỗi commit đọc diff phải hiểu ngay "cái này làm gì", không cần đọc cả Story.

---

## 4. Trước mỗi commit

- Không commit file `.env` (chỉ commit `.env.example`)
- Không commit `node_modules/`, `__pycache__/`, `*.pyc`
- Không commit file rác (log, file tạm IDE, file export tạm)
- Kiểm tra `.gitignore` trước khi `git add .`

---

## 5. Kết thúc một Story

Sau khi hoàn thành đủ 4 Task và tự kiểm tra Definition of Done:

1. `git push origin feature/<Story-ID>-<ten>`
2. AI tổng hợp:
   - Danh sách commit đã tạo trên nhánh
   - Nội dung PR (tiêu đề + mô tả)
3. **Người dùng review → approve → merge vào `main`**  
   (AI không tự merge vào main)

---

## 6. Hotfix

Nếu cần sửa lỗi khẩn trên `main`:

```
git checkout main
git checkout -b hotfix/ten-loi
# fix → commit → push → báo review
```