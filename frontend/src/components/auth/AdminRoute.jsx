import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

/**
 * AdminRoute — Component phân quyền khu vực Quản trị viên (/admin/*).
 *
 * Thực thi Quy tắc QTN-09:
 * 1. Nếu chưa đăng nhập (!isAuthenticated) -> Chuyển hướng về /login
 * 2. Nếu đã đăng nhập nhưng không có vai trò Admin (user.role !== 'admin') -> Chuyển hướng về /403 (Access Denied)
 * 3. Nếu là Admin -> Render component con (children)
 */
const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm font-medium text-gray-500">Đang kiểm tra quyền truy cập...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/403" replace />
  }

  return children
}

export default AdminRoute
