import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import FormAlert from '@/components/ui/FormAlert'
import api from '@/services/api'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

// Đăng ký các module Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

/**
 * AdminDashboardPage — Bảng Điều Khiển Tổng Quan & Thống Kê Kinh Doanh (nhaxinh.com style).
 * 1. Tích hợp Biểu đồ Cột (Bar Chart) — Phân tích Đơn hàng theo Trạng thái.
 * 2. Tích hợp Biểu đồ Tròn (Doughnut Chart) — Tỷ lệ Đóng góp Doanh thu theo Danh mục.
 * 3. Thiết kế vuông vức góc cạnh (rounded-none), phông chữ Inter / Be Vietnam Pro, KHÔNG SỬ DỤNG ICON.
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

  // -------------------------------------------------------------
  // 1. Cấu hình Biểu đồ Cột (Bar Chart) — Trạng thái đơn hàng
  // -------------------------------------------------------------
  const orderBarChartData = {
    labels: ['Chờ xác nhận', 'Đã xác nhận', 'Đang giao hàng', 'Đã hoàn thành', 'Đã hủy'],
    datasets: [
      {
        label: 'Số lượng đơn hàng',
        data: [
          statusCounts.pending || 0,
          statusCounts.confirmed || 0,
          statusCounts.shipping || 0,
          statusCounts.delivered || 0,
          statusCounts.cancelled || 0,
        ],
        backgroundColor: [
          '#D97706', // Pending (Amber)
          '#1E1E22', // Confirmed (Charcoal)
          '#1D4ED8', // Shipping (Blue)
          '#047857', // Delivered (Emerald)
          '#DC2626', // Cancelled (Red)
        ],
        borderWidth: 0,
        borderRadius: 0, // Vuông vức rounded-none
      },
    ],
  }

  const orderBarChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1E1E22',
        titleFont: { family: 'Inter', size: 12, weight: 'bold' },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 10,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Inter', size: 11, weight: '600' }, color: '#4B5563' },
      },
      y: {
        beginAtZero: true,
        grid: { color: '#F3F4F6' },
        ticks: { stepSize: 1, font: { family: 'Inter', size: 11 }, color: '#6B7280' },
      },
    },
  }

  // -------------------------------------------------------------
  // 2. Cấu hình Biểu đồ Tròn (Doughnut Chart) — Doanh thu theo Danh mục
  // -------------------------------------------------------------
  const categoryList = categoryAnalytics?.categories || []
  const categoryDonutChartData = {
    labels: categoryList.map((c) => c.category_name),
    datasets: [
      {
        data: categoryList.map((c) => c.total_revenue),
        backgroundColor: [
          '#7D441A', // Amber Walnut
          '#1E1E22', // Deep Charcoal
          '#B86D1E', // Warm Ochre
          '#047857', // Forest Emerald
          '#624134', // Dark Wood
          '#4B5563', // Slate Gray
          '#D97706', // Gold Accent
        ],
        borderWidth: 2,
        borderColor: '#FFFFFF',
      },
    ],
  }

  const categoryDonutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%', // Dạng Donut thanh lịch
    plugins: {
      legend: {
        position: 'right',
        labels: {
          font: { family: 'Inter', size: 11, weight: '600' },
          color: '#374151',
          padding: 14,
          boxWidth: 12,
        },
      },
      tooltip: {
        backgroundColor: '#1E1E22',
        titleFont: { family: 'Inter', size: 12, weight: 'bold' },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 10,
        callbacks: {
          label: (context) => {
            const val = context.raw || 0
            return ` Doanh thu: ${formatCurrency(val)}`
          },
        },
      },
    },
  }

  return (
    <div className="space-y-6 font-admin animate-fade-in text-stone-900">
      
      {/* Welcome & Overview Header */}
      <div className="bg-white rounded-none border border-stone-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest bg-amber-100 px-2.5 py-0.5 rounded-none border border-amber-200 inline-block mb-1">
            Bảng điều khiển quản trị
          </span>
          <h1 className="text-2xl font-bold text-stone-900 uppercase tracking-wider">
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

      {error && <FormAlert type="error" message={error} />}

      {/* KPI Stats Summary Grid (Vuông vức rounded-none) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        
        {/* KPI 1: Doanh Thu */}
        <div className="bg-white rounded-none p-5 border border-stone-200 shadow-2xs border-l-4 border-l-amber-800">
          <div className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
            DOANH THU THỰC TẾ
          </div>
          <p className="text-xl font-extrabold text-amber-800 truncate">
            {loading ? '...' : dashboardData?.summary?.revenue_formatted || stats?.revenue || '0đ'}
          </p>
          <span className="text-[11px] text-stone-600 font-semibold uppercase tracking-wider mt-1 block">
            {timeRange === 'today' ? 'Hôm nay' : timeRange === 'this_week' ? 'Tuần này' : timeRange === 'this_month' ? 'Tháng này' : timeRange === 'this_year' ? 'Năm nay' : 'Tất cả thời gian'}
          </span>
        </div>

        {/* KPI 2: Đơn Hàng */}
        <Link to="/admin/orders" className="bg-white rounded-none p-5 border border-stone-200 shadow-2xs border-l-4 border-l-stone-900 hover:border-stone-400 transition-all block group">
          <div className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-1 group-hover:text-stone-900 transition-colors">
            TỔNG ĐƠN HÀNG
          </div>
          <p className="text-xl font-extrabold text-stone-900 font-mono">
            {loading ? '...' : dashboardData?.summary?.total_orders ?? stats?.total_orders ?? 0} <span className="text-xs font-semibold text-stone-600">đơn</span>
          </p>
          <span className="text-[11px] text-amber-800 font-bold uppercase tracking-wider mt-1 block">
            Quản lý đơn →
          </span>
        </Link>

        {/* KPI 3: Đổi / Trả Hàng */}
        <Link to="/admin/returns" className="bg-white rounded-none p-5 border border-stone-200 shadow-2xs border-l-4 border-l-red-700 hover:border-red-500 transition-all block group">
          <div className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-1 group-hover:text-red-700 transition-colors">
            YÊU CẦU ĐỔI / TRẢ
          </div>
          <p className="text-xl font-extrabold text-stone-900">
            Duyệt <span className="text-xs font-semibold text-stone-600">đổi trả</span>
          </p>
          <span className="text-[11px] text-red-700 font-bold uppercase tracking-wider mt-1 block">
            Duyệt đổi trả →
          </span>
        </Link>

        {/* KPI 4: Danh Mục */}
        <Link to="/admin/categories" className="bg-white rounded-none p-5 border border-stone-200 shadow-2xs border-l-4 border-l-amber-800 hover:border-amber-900 transition-all block group">
          <div className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-1 group-hover:text-amber-800 transition-colors">
            DANH MỤC SẢN PHẨM
          </div>
          <p className="text-xl font-extrabold text-stone-900 font-mono">
            {loading ? '...' : categoryAnalytics?.categories?.length ?? '...' } <span className="text-xs font-semibold text-stone-600">mục</span>
          </p>
          <span className="text-[11px] text-amber-800 font-bold uppercase tracking-wider mt-1 block">
            Quản lý danh mục →
          </span>
        </Link>

        {/* KPI 5: Khách Hàng */}
        <Link to="/admin/customers" className="bg-white rounded-none p-5 border border-stone-200 shadow-2xs border-l-4 border-l-emerald-700 hover:border-emerald-500 transition-all block group">
          <div className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-1 group-hover:text-emerald-700 transition-colors">
            TÀI KHOẢN KHÁCH HÀNG
          </div>
          <p className="text-xl font-extrabold text-stone-900 font-mono">
            {loading ? '...' : stats?.total_users ?? 0} <span className="text-xs font-semibold text-stone-600">user</span>
          </p>
          <span className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider mt-1 block">
            Quản lý tài khoản →
          </span>
        </Link>

        {/* KPI 6: Sản Phẩm */}
        <Link to="/admin/products" className="bg-white rounded-none p-5 border border-stone-200 shadow-2xs border-l-4 border-l-stone-700 hover:border-stone-900 transition-all block group">
          <div className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-1 group-hover:text-stone-900 transition-colors">
            SẢN PHẨM NỘI THẤT
          </div>
          <p className="text-xl font-extrabold text-stone-900 font-mono">
            {loading ? '...' : stats?.total_products ?? 0} <span className="text-xs font-semibold text-stone-600">món</span>
          </p>
          <span className="text-[11px] text-stone-700 font-bold uppercase tracking-wider mt-1 block">
            Quản lý sản phẩm →
          </span>
        </Link>

      </div>

      {/* ============================================================= */}
      {/* 2 BIỂU ĐỒ QUẢN TRỊ TRỰC QUAN (BAR CHART & DONUT CHART ROW) */}
      {/* ============================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Biểu Đồ Cột (Bar Chart) — Trạng thái đơn hàng (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-none border border-stone-200 p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200">
              <div>
                <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                  PHÂN TÍCH ĐƠN HÀNG THEO TRẠNG THÁI (BAR CHART)
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Thống kê trực quan số lượng đơn hàng theo từng công đoạn xử lý
                </p>
              </div>
              <span className="px-2.5 py-0.5 bg-stone-100 text-stone-700 border border-stone-200 text-[10px] font-bold uppercase tracking-wider rounded-none">
                BÁO CÁO ĐƠN
              </span>
            </div>

            <div className="h-64 relative w-full pt-2">
              {loading ? (
                <div className="h-full flex items-center justify-center text-xs text-stone-400">
                  Đang nạp dữ liệu biểu đồ đơn hàng...
                </div>
              ) : (
                <Bar data={orderBarChartData} options={orderBarChartOptions} />
              )}
            </div>
          </div>

          <div className="pt-3 mt-4 border-t border-stone-100 flex items-center justify-between text-xs">
            <span className="text-stone-500 font-medium">Cập nhật theo dữ liệu đơn mới nhất</span>
            <Link to="/admin/orders" className="font-bold text-amber-800 hover:underline uppercase tracking-wider">
              Chi tiết đơn hàng →
            </Link>
          </div>
        </div>

        {/* Biểu Đồ Tròn (Doughnut Chart) — Tỷ lệ Doanh thu danh mục (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-none border border-stone-200 p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200">
              <div>
                <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                  TỶ LỆ DOANH THU THEO DANH MỤC (DONUT CHART)
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Tỷ lệ đóng góp doanh thu của từng nhóm phân loại nội thất
                </p>
              </div>
              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold uppercase tracking-wider rounded-none">
                CƠ CẤU DOANH THU
              </span>
            </div>

            <div className="h-64 relative w-full pt-2 flex items-center justify-center">
              {loading ? (
                <div className="h-full flex items-center justify-center text-xs text-stone-400">
                  Đang nạp dữ liệu biểu đồ doanh thu...
                </div>
              ) : !categoryList.length ? (
                <div className="text-xs text-stone-400">Chưa có dữ liệu doanh thu danh mục</div>
              ) : (
                <Doughnut data={categoryDonutChartData} options={categoryDonutChartOptions} />
              )}
            </div>
          </div>

          <div className="pt-3 mt-4 border-t border-stone-100 flex items-center justify-between text-xs">
            <span className="text-stone-500 font-medium">
              Tổng doanh thu: <strong className="text-amber-800">{categoryAnalytics?.overall_revenue_formatted || '0đ'}</strong>
            </span>
            <Link to="/admin/categories" className="font-bold text-stone-900 hover:text-amber-800 uppercase tracking-wider">
              Quản lý danh mục →
            </Link>
          </div>
        </div>

      </div>

      {/* TOP SELLING PRODUCTS & ORDER STATUS BREAKDOWN (2 Cols + 1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top 5 Selling Products */}
        <div className="lg:col-span-2 bg-white rounded-none border border-stone-200 p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-stone-200">
              <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
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
                    className="p-3 bg-stone-50 rounded-none border border-stone-200 hover:border-amber-800/60 transition-colors flex items-center justify-between gap-4"
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

        {/* Low Stock Inventory Warning List */}
        <div className="bg-white rounded-none border border-stone-200 p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200">
              <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                CẢNH BẢO TỒN KHO THẤP ({lowStockItems.length})
              </h2>
              <span className="px-2 py-0.5 bg-red-100 text-red-700 border border-red-200 text-[10px] font-bold uppercase tracking-wider rounded-none">
                CẦN NHẬP HÀNG
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-stone-400 text-xs">
                Đang nạp cảnh báo tồn kho...
              </div>
            ) : lowStockItems.length === 0 ? (
              <div className="py-12 text-center text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-none text-xs space-y-1">
                <p className="font-bold uppercase tracking-wider">KHO HÀNG AN TOÀN</p>
                <p className="text-[11px] text-emerald-700">Tất cả sản phẩm đều đủ tồn kho cung ứng</p>
              </div>
            ) : (
              <div className="space-y-2.5 text-xs">
                {lowStockItems.slice(0, 5).map((item) => (
                  <div key={item.product_id} className="p-3 bg-red-50/60 border border-red-200 rounded-none flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-stone-900 truncate">{item.name}</p>
                      <p className="text-[11px] text-stone-500 font-mono">Chỉ còn: <strong className="text-red-700">{item.stock_quantity}</strong> sp</p>
                    </div>
                    <Link
                      to="/admin/inventory"
                      className="px-2.5 py-1 bg-red-700 hover:bg-red-800 text-white rounded-none font-bold text-[10px] uppercase tracking-wider shrink-0"
                    >
                      Nhập hàng
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 mt-4 border-t border-stone-100 text-center">
            <Link to="/admin/inventory" className="text-xs font-bold text-stone-900 hover:text-amber-800 uppercase tracking-wider">
              Quản lý kho hàng →
            </Link>
          </div>
        </div>

      </div>

      {/* CATEGORY SALES & REVENUE ANALYTICS WIDGET TABLE */}
      <div className="bg-white rounded-none border border-stone-200 p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-3 border-b border-stone-200">
          <div>
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
              CHI TIẾT DOANH THU & SỐ LƯỢNG BÁN THEO DANH MỤC
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Báo cáo danh sách đóng góp doanh thu của từng danh mục sản phẩm nội thất
            </p>
          </div>

          {categoryAnalytics && (
            <div className="flex items-center gap-4 bg-stone-50 px-4 py-2.5 rounded-none border border-stone-200">
              <div>
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Tổng Doanh Thu</span>
                <span className="text-sm font-bold text-amber-800">{categoryAnalytics.overall_revenue_formatted}</span>
              </div>
              <div className="w-px h-6 bg-stone-300"></div>
              <div>
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Đã bán out</span>
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
              <div key={cat.category_name || idx} className="p-4 bg-stone-50 rounded-none border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">{cat.category_name}</span>
                  <span className="px-2.5 py-0.5 bg-amber-800 text-white rounded-none font-bold text-[10px] font-mono">
                    {cat.total_sold} SP
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Doanh Thu:</span>
                  <span className="text-sm font-bold text-amber-800 font-mono">{cat.revenue_formatted}</span>
                </div>

                {/* Progress bar tỷ lệ phần trăm */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-stone-500">
                    <span>Tỷ lệ đóng góp:</span>
                    <span className="font-mono text-stone-900 font-bold">{cat.revenue_percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-stone-200 rounded-none overflow-hidden">
                    <div
                      className="h-full bg-amber-800 transition-all duration-500"
                      style={{ width: `${Math.min(100, cat.revenue_percentage)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboardPage
