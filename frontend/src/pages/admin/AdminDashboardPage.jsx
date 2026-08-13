import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/layout/Navbar'
import FormAlert from '@/components/ui/FormAlert'
import AdminQuickSearch from '@/components/admin/AdminQuickSearch'
import api from '@/services/api'

/**
 * AdminDashboardPage — Trang Tổng quan Quản trị (Admin Only).
 * Chỉ xem được khi đăng nhập bằng tài khoản có role === 'admin'.
 */
const AdminDashboardPage = () => {
  const { user } = useAuth()

  const [stats, setStats] = useState(null)
  const [lowStockItems, setLowStockItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchDashboardStats = async () => {
      setLoading(true)
      try {
        const response = await api.get('/admin/dashboard')
        setStats(response.data.data.stats)

        const warningRes = await api.get('/admin/inventory/low-stock-warnings')
        setLowStockItems(warningRes.data.data.items || [])
      } catch (err) {
        const msg = err.response?.data?.message || 'Đã xảy ra lỗi khi nạp dữ liệu quản trị'
        setError(msg)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardStats()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 animate-fade-in">

        {/* Admin Header & Quick Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <span className="inline-block px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-semibold uppercase tracking-wider mb-1">
              Khu vực Quản trị viên (Admin Area)
            </span>
            <h1 className="text-2xl font-display font-bold text-gray-900">
              Chào mừng, {user?.full_name}!
            </h1>
          </div>

          {/* Quick Search */}
          <AdminQuickSearch />
        </div>

        {error && <div className="mb-6"><FormAlert type="error" message={error} /></div>}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

          {/* Stat Item 1 */}
          <div className="card border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tổng Người Dùng</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{loading ? '...' : stats?.total_users}</p>
            <span className="text-xs text-emerald-600 font-medium mt-1 inline-block">↑ Tăng trưởng ổn định</span>
          </div>

          {/* Stat Item 2 */}
          <Link to="/admin/orders" className="card border-l-4 border-l-blue-500 hover:shadow-md transition-shadow group block">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider group-hover:text-blue-600 transition-colors">Tổng Đơn Hàng</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{loading ? '...' : stats?.total_orders}</p>
            <span className="text-xs text-blue-600 font-bold mt-1 inline-block">Quản lý đơn hàng →</span>
          </Link>

          {/* Stat Item 3: Danh Mục Sản Phẩm */}
          <Link to="/admin/categories" className="card border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow group block">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider group-hover:text-emerald-600 transition-colors">Danh Mục Sản Phẩm</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{loading ? '...' : stats?.total_products}</p>
            <span className="text-xs text-emerald-600 font-bold mt-1 inline-block">Quản lý danh mục →</span>
          </Link>

          {/* Stat Item 3b: Quản lý Sản phẩm */}
          <Link to="/admin/products" className="card border-l-4 border-l-amber-500 hover:shadow-md transition-shadow group block">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider group-hover:text-amber-600 transition-colors">Sản Phẩm Kinh Doanh</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{loading ? '...' : stats?.total_products}</p>
            <span className="text-xs text-amber-600 font-bold mt-1 inline-block">Quản lý sản phẩm →</span>
          </Link>

          {/* Stat Item 3c: Quản lý Combo */}
          <Link to="/admin/combos" className="card border-l-4 border-l-orange-500 hover:shadow-md transition-shadow group block">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider group-hover:text-orange-600 transition-colors">Combo & Bộ Sản Phẩm</span>
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <span className="text-lg">🎁</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">Combo</p>
            <span className="text-xs text-orange-600 font-bold mt-1 inline-block">Tạo combo ưu đãi →</span>
          </Link>

          {/* Stat Item 3d: Quản lý Kho & Tồn Kho */}
          <Link to="/admin/inventory" className="card border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow group block">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider group-hover:text-emerald-600 transition-colors">Quản Lý Kho & Tồn Kho</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <span className="text-lg">📦</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">Nhập Kho</p>
            <span className="text-xs text-emerald-600 font-bold mt-1 inline-block">Xem tồn kho & Nhập hàng →</span>
          </Link>

          {/* Stat Item 3e: Cảnh báo Tồn kho Thấp QTN-08 */}
          <Link to="/admin/inventory" className={`card border-l-4 ${stats?.low_stock_count > 0 ? 'border-l-red-500 bg-red-50/20' : 'border-l-gray-300'} hover:shadow-md transition-shadow group block`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider group-hover:text-red-600 transition-colors">Tồn Kho Dưới Ngưỡng</span>
              <div className={`w-9 h-9 rounded-xl ${stats?.low_stock_count > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'} flex items-center justify-center font-bold`}>
                ⚠️
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{loading ? '...' : (stats?.low_stock_count || 0)} <span className="text-xs font-normal text-gray-500">sản phẩm</span></p>
            <span className={`text-xs font-bold mt-1 inline-block ${stats?.low_stock_count > 0 ? 'text-red-600 animate-pulse' : 'text-gray-500'}`}>
              {stats?.low_stock_count > 0 ? '⚠️ Cần nhập kho ngay →' : 'Tồn kho an toàn →'}
            </span>
          </Link>

          {/* Stat Item 4 */}
          <div className="card border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Doanh Thu Tạm Tính</span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{loading ? '...' : stats?.revenue}</p>
            <span className="text-xs text-purple-600 font-medium mt-1 inline-block">Cập nhật realtime</span>
          </div>

        </div>

        {/* Widget Cảnh báo Tồn Kho Thấp QTN-08 */}
        {lowStockItems.length > 0 && (
          <div className="card mb-8 border-amber-200 bg-amber-50/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <h2 className="text-base font-bold text-amber-900">Danh sách Cảnh báo Tồn kho Thấp (QTN-08)</h2>
                <span className="px-2.5 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-extrabold">{lowStockItems.length}</span>
              </div>
              <Link to="/admin/inventory" className="text-xs font-bold text-amber-800 hover:text-amber-900 underline">
                Xem tất cả trong kho →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockItems.slice(0, 6).map((item) => (
                <div key={item.id} className="p-3.5 bg-white rounded-2xl border border-amber-200 shadow-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={item.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc'} alt={item.name} className="w-11 h-11 rounded-xl object-cover border border-gray-200 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{item.name}</p>
                      <p className="text-[11px] text-red-600 font-extrabold mt-0.5">
                        Tồn: <span className="font-mono text-sm">{item.stock}</span> (Min: {item.min_stock_threshold})
                      </p>
                    </div>
                  </div>
                  <Link to="/admin/inventory" className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[11px] font-bold shrink-0 shadow-xs">
                    📦 Nhập kho
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security & Access Logs Card */}
        <div className="card">
          <h2 className="text-lg font-display font-bold text-gray-900 mb-4">Trạng thái bảo vệ phân quyền (QTN-09)</h2>
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
            <svg className="w-6 h-6 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-emerald-900">Hệ thống đang được bảo vệ an toàn</p>
              <p className="text-xs text-emerald-700">Tất cả truy cập vào khu vực `/admin` đều được kiểm tra vai trò Quản trị viên (Admin) chặt chẽ từ Server.</p>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}

export default AdminDashboardPage
