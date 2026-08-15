import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import FormAlert from '@/components/ui/FormAlert'
import api from '@/services/api'

/**
 * AdminDashboardPage — Bảng Điều Khiển Tổng Quan & Thống Kê Kinh Doanh phong cách Nhà Xinh (nhaxinh.com).
 * Thiết kế vuông vức góc cạnh (rounded-none), phông chữ Hanken Grotesk & Playfair Display, KHÔNG SỬ DỤNG ICON.
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
    <div className="space-y-6 font-sans animate-fade-in">
      
      {/* Welcome & Overview Header */}
      <div className="bg-white rounded-none border border-stone-200/80 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest bg-amber-100 px-2.5 py-0.5 rounded-none border border-amber-200 inline-block mb-1">
            Bảng điều khiển quản trị
          </span>
          <h1 className="text-2xl font-heading font-bold text-stone-900 uppercase tracking-wider">
            CHÀO MỪNG TRỞ LẠI, {user?.full_name?.toUpperCase() || 'ADMIN'}!
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Báo cáo tổng quan chỉ số kinh doanh, doanh thu và đơn hàng của hệ thống
          </p>
        </div>

        {/* Time Range Filter Buttons */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 border border-stone-200 rounded-none overflow-x-auto scrollbar-none">
          {[
            { key: 'today', label: 'HÔM NAY' },
            { key: 'this_week', label: 'TUẦN NÀY' },
            { key: 'this_month', label: 'THÁNG NÀY' },
            { key: 'this_year', label: 'NĂM NAY' },
            { key: 'all', label: 'TẤT CẢ' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setTimeRange(tab.key)}
              className={`px-3 py-1.5 rounded-none text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                timeRange === tab.key
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <FormAlert type="error" message={error} />
      )}

      {/* KPI Stats Summary Grid (Vuông vức rounded-none, NO ICONS) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        
        {/* KPI 1: Doanh Thu */}
        <div className="bg-white rounded-none p-5 border border-stone-200/80 shadow-2xs border-l-4 border-l-amber-800">
          <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">
            DOANH THU THỰC TẾ
          </div>
          <p className="text-lg font-bold text-amber-800 truncate">
            {loading ? '...' : dashboardData?.summary?.revenue_formatted || stats?.revenue || '0đ'}
          </p>
          <span className="text-[10px] text-stone-500 font-semibold uppercase tracking-wider mt-1 block">
            {timeRange === 'today' ? 'Hôm nay' : timeRange === 'this_week' ? 'Tuần này' : timeRange === 'this_month' ? 'Tháng này' : timeRange === 'this_year' ? 'Năm nay' : 'Tất cả thời gian'}
          </span>
        </div>

        {/* KPI 2: Đơn Hàng */}
        <Link to="/admin/orders" className="bg-white rounded-none p-5 border border-stone-200/80 shadow-2xs border-l-4 border-l-stone-900 hover:border-stone-400 transition-all block group">
          <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1 group-hover:text-stone-900 transition-colors">
            TỔNG ĐƠN HÀNG
          </div>
          <p className="text-lg font-bold text-stone-900 font-mono">
            {loading ? '...' : dashboardData?.summary?.total_orders ?? stats?.total_orders ?? 0} <span className="text-xs font-normal text-stone-500">đơn</span>
          </p>
          <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider mt-1 block">
            Quản lý đơn →
          </span>
        </Link>

        {/* KPI 3: Đổi / Trả Hàng */}
        <Link to="/admin/returns" className="bg-white rounded-none p-5 border border-stone-200/80 shadow-2xs border-l-4 border-l-red-700 hover:border-red-500 transition-all block group">
          <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1 group-hover:text-red-700 transition-colors">
            YÊU CẦU ĐỔI / TRẢ
          </div>
          <p className="text-lg font-bold text-stone-900">
            Duyệt <span className="text-xs font-normal text-stone-500">đổi trả</span>
          </p>
          <span className="text-[10px] text-red-700 font-bold uppercase tracking-wider mt-1 block">
            Duyệt đổi trả →
          </span>
        </Link>

        {/* KPI 4: Danh Mục */}
        <Link to="/admin/categories" className="bg-white rounded-none p-5 border border-stone-200/80 shadow-2xs border-l-4 border-l-amber-800 hover:border-amber-900 transition-all block group">
          <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1 group-hover:text-amber-800 transition-colors">
            DANH MỤC SẢN PHẨM
          </div>
          <p className="text-lg font-bold text-stone-900 font-mono">
            {loading ? '...' : categoryAnalytics?.categories?.length ?? '...' } <span className="text-xs font-normal text-stone-500">mục</span>
          </p>
          <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider mt-1 block">
            Quản lý danh mục →
          </span>
        </Link>

        {/* KPI 5: Khách Hàng */}
        <Link to="/admin/customers" className="bg-white rounded-none p-5 border border-stone-200/80 shadow-2xs border-l-4 border-l-emerald-700 hover:border-emerald-500 transition-all block group">
          <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1 group-hover:text-emerald-700 transition-colors">
            TÀI KHOẢN KHÁCH HÀNG
          </div>
          <p className="text-lg font-bold text-stone-900 font-mono">
            {loading ? '...' : stats?.total_users ?? 0} <span className="text-xs font-normal text-stone-500">user</span>
          </p>
          <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider mt-1 block">
            Quản lý khách hàng →
          </span>
        </Link>

        {/* KPI 6: Sản Phẩm */}
        <Link to="/admin/products" className="bg-white rounded-none p-5 border border-stone-200/80 shadow-2xs border-l-4 border-l-stone-700 hover:border-stone-900 transition-all block group">
          <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1 group-hover:text-stone-900 transition-colors">
            SẢN PHẨM NỘI THẤT
          </div>
          <p className="text-lg font-bold text-stone-900 font-mono">
            {loading ? '...' : stats?.total_products ?? 0} <span className="text-xs font-normal text-stone-500">món</span>
          </p>
          <span className="text-[10px] text-stone-700 font-bold uppercase tracking-wider mt-1 block">
            Quản lý sản phẩm →
          </span>
        </Link>

      </div>

      {/* TOP SELLING PRODUCTS & ORDER STATUS BREAKDOWN (2 Cols + 1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top 5 Selling Products */}
        <div className="lg:col-span-2 bg-white rounded-none border border-stone-200/80 p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-stone-200/80">
              <h2 className="text-sm font-heading font-bold text-stone-900 uppercase tracking-wider">
                TOP 5 SẢN PHẨM BÁN CHẠY NHẤT
              </h2>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-none border border-amber-200 uppercase tracking-wider">
                {timeRange === 'today' ? 'Hôm nay' : timeRange === 'this_week' ? 'Tuần này' : timeRange === 'this_month' ? 'Tháng này' : timeRange === 'this_year' ? 'Năm nay' : 'Tất cả'}
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-stone-400 text-xs">
                Đang nạp bảng xếp hạng sản phẩm bán chạy...
              </div>
            ) : topProducts.length === 0 ? (
              <div className="py-12 text-center text-stone-400 border border-dashed border-stone-200 rounded-none bg-stone-50 text-xs">
                Chưa có dữ liệu sản phẩm bán ra trong khoảng thời gian này.
              </div>
            ) : (
              <div className="space-y-3">
                {topProducts.map((p, idx) => (
                  <div
                    key={p.product_id || idx}
                    className="p-3 bg-stone-50 rounded-none border border-stone-200/80 hover:border-amber-800/60 transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-7 h-7 rounded-none font-bold text-xs flex items-center justify-center shrink-0 font-mono ${
                        idx === 0 ? 'bg-amber-800 text-white' : idx === 1 ? 'bg-stone-900 text-white' : 'bg-stone-200 text-stone-700'
                      }`}>
                        #{idx + 1}
                      </span>
                      <img
                        src={p.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc'}
                        alt={p.name}
                        className="w-10 h-12 object-cover rounded-none border border-stone-200 bg-white shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-stone-900 truncate">{p.name}</p>
                        <p className="text-[11px] text-stone-500 font-mono">{formatCurrency(p.price)}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-200 rounded-none font-bold text-[10px] uppercase tracking-wider block mb-0.5">
                        Đã bán: {p.sold_count}
                      </span>
                      <span className="text-xs font-bold text-stone-900 block">
                        {p.revenue_formatted || formatCurrency(p.revenue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 mt-4 border-t border-stone-100 text-right">
            <Link to="/admin/products" className="text-xs font-bold text-amber-800 hover:underline uppercase tracking-wider">
              Quản lý sản phẩm →
            </Link>
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-white rounded-none border border-stone-200/80 p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-heading font-bold text-stone-900 uppercase tracking-wider pb-3 mb-4 border-b border-stone-200/80">
              PHÂN LOẠI TRẠNG THÁI ĐƠN HÀNG
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-none">
                <span className="text-amber-900 font-bold uppercase tracking-wider">Chờ xác nhận (Pending):</span>
                <span className="px-3 py-1 bg-amber-800 text-white rounded-none font-mono font-bold text-xs">
                  {statusCounts.pending || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200 rounded-none">
                <span className="text-stone-900 font-bold uppercase tracking-wider">Đã xác nhận (Confirmed):</span>
                <span className="px-3 py-1 bg-stone-900 text-white rounded-none font-mono font-bold text-xs">
                  {statusCounts.confirmed || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-none">
                <span className="text-blue-900 font-bold uppercase tracking-wider">Đang giao (Shipping):</span>
                <span className="px-3 py-1 bg-blue-700 text-white rounded-none font-mono font-bold text-xs">
                  {statusCounts.shipping || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-none">
                <span className="text-emerald-900 font-bold uppercase tracking-wider">Đã hoàn thành (Delivered):</span>
                <span className="px-3 py-1 bg-emerald-700 text-white rounded-none font-mono font-bold text-xs">
                  {statusCounts.delivered || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-none">
                <span className="text-red-900 font-bold uppercase tracking-wider">Đã hủy (Cancelled):</span>
                <span className="px-3 py-1 bg-red-700 text-white rounded-none font-mono font-bold text-xs">
                  {statusCounts.cancelled || 0}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-4 border-t border-stone-100 text-center">
            <Link to="/admin/orders" className="text-xs font-bold text-stone-900 hover:text-amber-800 uppercase tracking-wider">
              Xem tất cả đơn hàng →
            </Link>
          </div>
        </div>

      </div>

      {/* CATEGORY SALES & REVENUE ANALYTICS WIDGET */}
      <div className="bg-white rounded-none border border-stone-200/80 p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-3 border-b border-stone-200/80">
          <div>
            <h2 className="text-sm font-heading font-bold text-stone-900 uppercase tracking-wider">
              THỐNG KÊ DOANH THU & SỐ LƯỢNG BÁN THEO DANH MỤC
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Báo cáo tỷ lệ đóng góp doanh thu của từng danh mục sản phẩm nội thất
            </p>
          </div>

          {categoryAnalytics && (
            <div className="flex items-center gap-4 bg-stone-50 px-4 py-2.5 rounded-none border border-stone-200">
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Tổng Doanh Thu</span>
                <span className="text-sm font-bold text-amber-800">{categoryAnalytics.overall_revenue_formatted}</span>
              </div>
              <div className="w-px h-6 bg-stone-300"></div>
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Đã bán out</span>
                <span className="text-sm font-bold text-stone-900 font-mono">{categoryAnalytics.overall_sold} sản phẩm</span>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-stone-400 text-xs">
            Đang tổng hợp báo cáo doanh thu theo danh mục...
          </div>
        ) : !categoryAnalytics || categoryAnalytics.categories.length === 0 ? (
          <div className="py-12 text-center text-stone-400 border border-dashed border-stone-200 rounded-none bg-stone-50 text-xs">
            Chưa có danh mục sản phẩm nào trong hệ thống.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryAnalytics.categories.map((cat, idx) => (
              <div key={cat.category_name || idx} className="p-4 bg-stone-50 rounded-none border border-stone-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">{cat.category_name}</span>
                  <span className="px-2.5 py-0.5 bg-amber-800 text-white rounded-none font-bold text-[10px] font-mono">
                    {cat.total_sold} SP
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-sm font-bold text-amber-800">{cat.revenue_formatted}</span>
                  <span className="text-[11px] font-bold text-stone-500 font-mono">{cat.revenue_percentage}% tổng DT</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-stone-200 rounded-none overflow-hidden">
                  <div
                    className="h-full bg-amber-800 rounded-none transition-all duration-500"
                    style={{ width: `${Math.max(cat.revenue_percentage, 0)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* LOW STOCK WARNING WIDGET */}
      {lowStockItems.length > 0 && (
        <div className="bg-white border border-red-200 rounded-none p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-200/80">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-heading font-bold text-red-800 uppercase tracking-wider">
                CẢNH BÁO TỒN KHO THẤP
              </h2>
              <span className="px-2.5 py-0.5 bg-red-700 text-white rounded-none text-xs font-bold font-mono">
                {lowStockItems.length} sản phẩm
              </span>
            </div>
            <Link to="/admin/inventory" className="text-xs font-bold text-amber-800 hover:underline uppercase tracking-wider">
              Xem kho hàng →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockItems.slice(0, 6).map((item) => (
              <div key={item.id} className="p-3.5 bg-stone-50 rounded-none border border-stone-200/80 shadow-2xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={item.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc'} alt={item.name} className="w-10 h-12 rounded-none object-cover border border-stone-200 bg-white shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-900 truncate">{item.name}</p>
                    <p className="text-[11px] text-red-600 font-bold mt-0.5">
                      Tồn kho: <span className="font-mono text-xs">{item.stock}</span> (Mức tối thiểu: {item.min_stock_threshold})
                    </p>
                  </div>
                </div>
                <Link to="/admin/inventory" className="px-3 py-1.5 bg-stone-900 hover:bg-amber-800 text-white rounded-none text-[11px] font-bold uppercase tracking-wider shrink-0 cursor-pointer">
                  Nhập kho
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

export default AdminDashboardPage
