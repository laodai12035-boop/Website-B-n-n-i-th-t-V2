import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

/**
 * ForbiddenPage — Trang 403 Từ chối truy cập (Access Denied).
 * Hiển thị khi người dùng tài khoản 'user' cố truy cập khu vực Admin.
 */
const ForbiddenPage = () => {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center animate-slide-up">

        {/* 403 Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-red-100 text-red-600 mb-6 shadow-sm border border-red-200">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h1 className="text-4xl font-display font-extrabold text-gray-900 mb-2">403</h1>
        <h2 className="text-xl font-display font-bold text-gray-800 mb-2">Từ chối truy cập (Access Denied)</h2>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          Tài khoản <strong className="text-gray-900 font-semibold">{user?.email || 'của bạn'}</strong> (Vai trò: <span className="uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-mono text-xs">{user?.role || 'Khách hàng'}</span>) không có quyền truy cập vào khu vực Quản trị.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            to="/profile"
            className="btn-outline text-sm px-5 py-2.5"
          >
            Quay lại Hồ sơ
          </Link>
          <Link
            to="/"
            className="btn-primary text-sm px-5 py-2.5"
          >
            Về Trang chủ
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-8">
          Hành vi truy cập trái phép đã được ghi nhận vào hệ thống giám sát an ninh (QTN-09).
        </p>
      </div>
    </div>
  )
}

export default ForbiddenPage
