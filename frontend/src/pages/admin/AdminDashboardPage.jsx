import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/layout/Navbar'
import FormAlert from '@/components/ui/FormAlert'
import AdminQuickSearch from '@/components/admin/AdminQuickSearch'
import api from '@/services/api'

/**
 * AdminDashboardPage — Trang Bảng Điều Khiển Tổng Quan & Thống Kê Quản Trị (NT-13-CN-001 & NT-13-CN-002).
 * Chỉ xem được khi đăng nhập bằng tài khoản có role === 'admin'.
 */
const AdminDashboardPage = () => {
  const { user } = useAuth()

  const [timeRange, setTimeRange] = useState('this_month')
  const [dashboardData, setDashboardData] = useState(null)
  const [stats, setStats] = useState(null)
  const [topProducts, setTopProducts] = useState([])
  const [statusCounts, setStatusCounts] = useState({})
  const [categoryAnalytics, setCategoryAnalytics] = useState(null)
  const [lowStockItems, setLowStockItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDashboardStats = async (range = timeRange) => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/admin/dashboard', { params: { time_range: range } })
      const resData = response.data.data
      setDashboardData(resData)
      setStats(resData.stats)
      setTopProducts(resData.top_selling_products || [])
      setStatusCounts(resData.order_status_counts || {})

      const catRes = await api.get('/admin/analytics/categories', { params: { time_range: range } })
      setCategoryAnalytics(catRes.data.data)

      const warningRes = await api.get('/admin/inventory/low-stock-warnings')
      setLowStockItems(warningRes.data.data.items || [])
    } catch (err) {
      const msg = err.response?.data?.message || 'Đã xảy ra lỗi khi nạp dữ liệu quản trị'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardStats(timeRange)
  }, [timeRange])

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '0đ'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 animate-fade-in">
        {/* Admin Header & Quick Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-1">
              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Khu vực Quản trị (Admin)
              </span>
              <span>/</span>
              <span className="text-gray-900 font-bold">Bảng Điều Khiển & Thống Kê Kinh Doanh</span>
            </div>
            <h1 className="text-2xl font-display font-extrabold text-gray-900">
              Chào mừng trở lại, {user?.full_name}!
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <AdminQuickSearch />
          </div>
        </div>

        {error && (
          <div className="mb-6">
            <FormAlert type="error" message={error} />
          </div>
        )}

        {/* Time Range Filter Bar (NT-13-CN-001 & NT-13-CN-002) */}
        <div className="bg-white rounded-3xl p-4 mb-6 border border-gray-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
            <span>📅 Lọc thời gian thống kê:</span>
          </div>

          <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-2xl border border-gray-100 w-full sm:w-auto">
            {[
              { key: 'today', label: 'Hôm nay' },
              { key: 'this_week', label: 'Tuần này' },
              { key: 'this_month', label: 'Tháng này' },
              { key: 'this_year', label: 'Năm nay' },
              { key: 'all', label: 'Tất cả' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setTimeRange(tab.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  timeRange === tab.key
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Stat Item 1: Doanh Thu */}
          <div className="bg-white rounded-3xl p-5 border border-amber-200 shadow-xs border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Doanh Thu Thực Tế</span>
              <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg font-bold">
                💰
              </div>
            </div>
            <p className="text-2xl font-display font-extrabold text-amber-700">
              {loading ? '...' : dashboardData?.summary?.revenue_formatted || stats?.revenue || '0đ'}
            </p>
            <span className="text-[11px] text-amber-600 font-semibold mt-1 inline-block">
              Lọc theo {timeRange === 'today' ? 'hôm nay' : timeRange === 'this_week' ? 'tuần này' : timeRange === 'this_month' ? 'tháng này' : timeRange === 'this_year' ? 'năm nay' : 'toàn thời gian'}
            </span>
          </div>

          {/* Stat Item 2: Tổng Đơn Hàng */}
          <Link to="/admin/orders" className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs border-l-4 border-l-blue-500 hover:shadow-md transition-shadow group block">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider group-hover:text-blue-600 transition-colors">Đơn Hàng Mới</span>
              <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg font-bold">
                📦
              </div>
            </div>
            <p className="text-2xl font-display font-extrabold text-gray-900">
              {loading ? '...' : dashboardData?.summary?.total_orders ?? stats?.total_orders ?? 0} <span className="text-xs font-normal text-gray-500">đơn</span>
            </p>
            <span className="text-[11px] text-blue-600 font-bold mt-1 inline-block">Quản lý đơn hàng →</span>
          </Link>

          {/* Stat Item 3: Tổng Khách Hàng */}
          <Link to="/admin/customers" className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow group block">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider group-hover:text-emerald-600 transition-colors">Khách Hàng</span>
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg font-bold">
                👥
              </div>
            </div>
            <p className="text-2xl font-display font-extrabold text-gray-900">
              {loading ? '...' : stats?.total_users ?? 0} <span className="text-xs font-normal text-gray-500">tài khoản</span>
            </p>
            <span className="text-[11px] text-emerald-600 font-bold mt-1 inline-block">Quản lý khách hàng →</span>
          </Link>

          {/* Stat Item 4: Tổng Sản Phẩm */}
          <Link to="/admin/products" className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs border-l-4 border-l-purple-500 hover:shadow-md transition-shadow group block">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider group-hover:text-purple-600 transition-colors">Tổng Sản Phẩm</span>
              <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg font-bold">
                🪑
              </div>
            </div>
            <p className="text-2xl font-display font-extrabold text-gray-900">
              {loading ? '...' : stats?.total_products ?? 0} <span className="text-xs font-normal text-gray-500">mặt hàng</span>
            </p>
            <span className="text-[11px] text-purple-600 font-bold mt-1 inline-block">Quản lý sản phẩm →</span>
          </Link>
        </div>

        {/* TOP SELLING PRODUCTS WIDGET (NT-13-CN-001) & ORDER STATUS BREAKDOWN */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Top Selling Products List (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔥</span>
                  <h2 className="text-base font-display font-extrabold text-gray-900">
                    Top 5 Sản Phẩm Bán Chạy Nhất (NT-13-CN-001)
                  </h2>
                </div>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  {timeRange === 'today' ? 'Hôm nay' : timeRange === 'this_week' ? 'Tuần này' : timeRange === 'this_month' ? 'Tháng này' : timeRange === 'this_year' ? 'Năm nay' : 'Tất cả'}
                </span>
              </div>

              {loading ? (
                <div className="py-12 text-center text-gray-400 text-xs">
                  <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  Đang nạp bảng xếp hạng sản phẩm bán chạy...
                </div>
              ) : topProducts.length === 0 ? (
                <div className="py-12 text-center text-gray-400 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50 space-y-1">
                  <p className="font-bold text-gray-700 text-sm">Chưa có dữ liệu sản phẩm bán ra</p>
                  <p className="text-xs text-gray-500">Không tìm thấy đơn hàng nào trong khoảng thời gian này</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topProducts.map((p, idx) => (
                    <div
                      key={p.product_id || idx}
                      className="p-3.5 bg-gray-50/70 hover:bg-amber-50/30 rounded-2xl border border-gray-100 transition-colors flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`w-7 h-7 rounded-xl font-extrabold text-xs flex items-center justify-center shrink-0 ${
                          idx === 0 ? 'bg-amber-500 text-white shadow-xs' : idx === 1 ? 'bg-gray-300 text-gray-800' : idx === 2 ? 'bg-amber-800 text-amber-100' : 'bg-gray-100 text-gray-500'
                        }`}>
                          #{idx + 1}
                        </span>
                        <img
                          src={p.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc'}
                          alt={p.name}
                          className="w-10 h-10 rounded-xl object-cover border border-gray-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">{p.name}</p>
                          <p className="text-[11px] text-gray-500 font-mono">{formatCurrency(p.price)}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-200 rounded-full font-extrabold text-[11px] block mb-0.5">
                          Đã bán: {p.sold_count}
                        </span>
                        <span className="text-xs font-extrabold text-gray-900 block">
                          {p.revenue_formatted || formatCurrency(p.revenue)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 text-right">
              <Link to="/admin/products" className="text-xs font-bold text-amber-700 hover:text-amber-800">
                Xem tất cả danh mục sản phẩm →
              </Link>
            </div>
          </div>

          {/* Order Status Breakdown Widget (1 col) */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">📊</span>
                <h2 className="text-base font-display font-extrabold text-gray-900">
                  Phân Loại Đơn Hàng
                </h2>
              </div>

              <div className="space-y-3 text-xs font-medium">
                <div className="flex items-center justify-between p-3 bg-amber-50/60 rounded-2xl border border-amber-100">
                  <span className="text-amber-800 font-bold">Chờ xác nhận (Pending):</span>
                  <span className="px-2.5 py-0.5 bg-amber-500 text-white rounded-full font-mono font-extrabold">
                    {statusCounts.pending || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50/60 rounded-2xl border border-blue-100">
                  <span className="text-blue-800 font-bold">Đã xác nhận (Confirmed):</span>
                  <span className="px-2.5 py-0.5 bg-blue-500 text-white rounded-full font-mono font-extrabold">
                    {statusCounts.confirmed || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50/60 rounded-2xl border border-purple-100">
                  <span className="text-purple-800 font-bold">Đang giao (Shipping):</span>
                  <span className="px-2.5 py-0.5 bg-purple-500 text-white rounded-full font-mono font-extrabold">
                    {statusCounts.shipping || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                  <span className="text-emerald-800 font-bold">Đã giao (Delivered):</span>
                  <span className="px-2.5 py-0.5 bg-emerald-600 text-white rounded-full font-mono font-extrabold">
                    {statusCounts.delivered || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-rose-50/60 rounded-2xl border border-rose-100">
                  <span className="text-rose-800 font-bold">Đã hủy (Cancelled):</span>
                  <span className="px-2.5 py-0.5 bg-rose-500 text-white rounded-full font-mono font-extrabold">
                    {statusCounts.cancelled || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 text-center">
              <Link to="/admin/orders" className="text-xs font-bold text-blue-600 hover:text-blue-700">
                Chi tiết lịch sử đơn hàng →
              </Link>
            </div>
          </div>
        </div>

        {/* CATEGORY SALES & REVENUE ANALYTICS WIDGET (NT-13-CN-002) */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🪑</span>
                <h2 className="text-lg font-display font-extrabold text-gray-900">
                  Thống Kê Số Lượng Bán & Doanh Thu Theo Danh Mục (NT-13-CN-002)
                </h2>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Tổng hợp doanh thu thực tế và tổng số sản phẩm đã bán ra cho từng danh mục sản phẩm.
              </p>
            </div>

            {categoryAnalytics && (
              <div className="flex items-center gap-3 bg-amber-50 px-4 py-2 rounded-2xl border border-amber-200">
                <div className="text-right">
                  <span className="text-[10px] font-bold text-amber-800 uppercase block">Tổng Doanh Thu Toàn Phân Khúc</span>
                  <span className="text-sm font-extrabold text-amber-900">{categoryAnalytics.overall_revenue_formatted}</span>
                </div>
                <div className="w-px h-6 bg-amber-200"></div>
                <div>
                  <span className="text-[10px] font-bold text-amber-800 uppercase block">Tổng Sản Phẩm Bán</span>
                  <span className="text-sm font-extrabold text-amber-900">{categoryAnalytics.overall_sold} món</span>
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Đang tổng hợp báo cáo doanh thu theo danh mục...
            </div>
          ) : !categoryAnalytics || categoryAnalytics.categories.length === 0 ? (
            <div className="py-12 text-center text-gray-400 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
              Chưa có danh mục sản phẩm nào trong hệ thống
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryAnalytics.categories.map((cat, idx) => (
                <div key={cat.category_name || idx} className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 hover:border-amber-200 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-extrabold text-gray-900">{cat.category_name}</span>
                    <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-200 rounded-full font-bold text-[11px]">
                      {cat.total_sold} sản phẩm
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-base font-extrabold text-amber-700">{cat.revenue_formatted}</span>
                    <span className="text-xs font-bold text-gray-500">{cat.revenue_percentage}% tổng doanh thu</span>
                  </div>

                  {/* Progress Bar tỉ lệ doanh thu */}
                  <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(cat.revenue_percentage, 0)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Widget Cảnh báo Tồn Kho Thấp QTN-08 */}
        {lowStockItems.length > 0 && (
          <div className="card mb-8 border-amber-200 bg-amber-50/30 rounded-3xl">
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
        <div className="card rounded-3xl">
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
