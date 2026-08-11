import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/layout/Navbar'

/**
 * ProfilePage — Trang thông tin cá nhân (Protected Page).
 * Chỉ xem được khi ĐÃ ĐĂNG NHẬP.
 * Nếu đã đăng xuất mà nhập trực tiếp URL này -> ProtectedRoute sẽ đẩy về /login.
 */
const ProfilePage = () => {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8 animate-fade-in">
        <div className="card">
          <div className="flex items-center justify-between border-b border-gray-100 pb-6 mb-6">
            <div>
              <h1 className="text-2xl font-display font-bold text-gray-900">Hồ sơ cá nhân</h1>
              <p className="text-sm text-gray-500 mt-0.5">Quản lý thông tin tài khoản của bạn</p>
            </div>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-800 uppercase tracking-wider">
              {user?.role}
            </span>
          </div>

          <div className="space-y-4 max-w-lg">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Họ và tên</label>
              <p className="text-base font-medium text-gray-900 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100">{user?.full_name}</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Email</label>
              <p className="text-base font-medium text-gray-900 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100">{user?.email}</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Số điện thoại</label>
              <p className="text-base font-medium text-gray-900 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100">{user?.phone || 'Chưa cập nhật'}</p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
            <button
              type="button"
              onClick={logout}
              className="btn-outline text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            >
              Đăng xuất ngay
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ProfilePage
