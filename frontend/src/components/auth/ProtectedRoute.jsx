import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

/**
 * ProtectedRoute — Component bảo vệ các trang yêu cầu đăng nhập.
 *
 * Hành vi:
 * - Nếu đang loading (kiểm tra token từ backend): Hiển thị spinner
 * - Nếu CHƯA ĐĂNG NHẬP (isAuthenticated = false): Chuyển hướng về /login (kèm state location để redirect lại sau khi login)
 * - Nếu ĐÃ ĐÃ ĐĂNG NHẬP: Render component con (children)
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm font-medium text-gray-500">Đang tải...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Chuyển hướng về /login và lưu lại trang đang truy cập dở
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default ProtectedRoute
