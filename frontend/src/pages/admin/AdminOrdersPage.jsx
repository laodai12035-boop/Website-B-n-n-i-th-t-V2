import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/layout/Navbar'
import OrderDetailModal from '@/components/order/OrderDetailModal'
import api from '@/services/api'

/**
 * AdminOrdersPage — Trang Quản lý danh sách toàn bộ đơn hàng dành riêng cho Quản trị viên (NT-06-CN-005).
 * Tuyến đường: /admin/orders
 */
const AdminOrdersPage = () => {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total_items: 0, total_pages: 1 })
  const [summary, setSummary] = useState({ total: 0, pending: 0, confirmed: 0, shipping: 0, delivered: 0, cancelled: 0 })
  
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [selectedOrderId, setSelectedOrderId] = useState(null)

  const fetchAdminOrders = async (page = 1) => {
    setLoading(true)
    setError(null)
    try {
      const params = {
        status: activeTab,
        q: searchQuery.trim(),
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        page,
        limit: 15,
      }
      const res = await api.get('/admin/orders', { params })
      const data = res.data.data
      setOrders(data.orders || [])
      setPagination(data.pagination || { page: 1, limit: 15, total_items: 0, total_pages: 1 })
      setSummary(data.summary || { total: 0, pending: 0, confirmed: 0, shipping: 0, delivered: 0, cancelled: 0 })
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể nạp danh sách đơn hàng Admin.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdminOrders(1)
  }, [activeTab])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchAdminOrders(1)
  }

  const handleResetFilters = () => {
    setActiveTab('all')
    setSearchQuery('')
    setStartDate('')
    setEndDate('')
  }

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '0đ'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const formatDate = (isoStr) => {
    if (!isoStr) return ''
    const d = new Date(isoStr)
    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: '⏳ Chờ xác nhận', class: 'bg-amber-100 text-amber-900 border-amber-300' },
      confirmed: { label: '🔵 Đã xác nhận', class: 'bg-blue-100 text-blue-900 border-blue-300' },
      shipping: { label: '🚚 Đang giao hàng', class: 'bg-indigo-100 text-indigo-900 border-indigo-300' },
      delivered: { label: '✅ Giao thành công', class: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
      cancelled: { label: '❌ Đã hủy', class: 'bg-red-100 text-red-900 border-red-300' },
    }
    const conf = statusMap[status] || { label: status, class: 'bg-gray-100 text-gray-800 border-gray-300' }
    return (
      <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${conf.class}`}>
        {conf.label}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        
        {/* Header Breadcrumb */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-1">
              <Link to="/admin" className="hover:text-amber-600 transition-colors">Admin Dashboard</Link>
              <span>/</span>
              <span className="text-gray-900 font-bold">Quản lý Đơn hàng</span>
            </div>
            <h1 className="text-2xl font-display font-extrabold text-gray-900 flex items-center gap-2">
              <span>🛒</span> Quản lý danh sách đơn hàng (Admin)
            </h1>
          </div>

          <Link
            to="/admin"
            className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-2xl text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5"
          >
            ← Về Dashboard
          </Link>
        </div>

        {/* Summary Counter Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div
            onClick={() => setActiveTab('all')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              activeTab === 'all' ? 'bg-gray-900 text-white border-gray-900 shadow-md scale-102' : 'bg-white text-gray-700 border-gray-100 hover:border-gray-200 shadow-2xs'
            }`}
          >
            <div className="text-[11px] font-semibold uppercase tracking-wider opacity-75">Tất cả đơn</div>
            <div className="text-xl font-black mt-1">{summary.total}</div>
          </div>

          <div
            onClick={() => setActiveTab('pending')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              activeTab === 'pending' ? 'bg-amber-500 text-white border-amber-500 shadow-md scale-102' : 'bg-white text-amber-900 border-amber-100 hover:border-amber-200 shadow-2xs'
            }`}
          >
            <div className="text-[11px] font-semibold uppercase tracking-wider opacity-75">Chờ xác nhận</div>
            <div className="text-xl font-black mt-1">{summary.pending}</div>
          </div>

          <div
            onClick={() => setActiveTab('confirmed')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              activeTab === 'confirmed' ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-102' : 'bg-white text-blue-900 border-blue-100 hover:border-blue-200 shadow-2xs'
            }`}
          >
            <div className="text-[11px] font-semibold uppercase tracking-wider opacity-75">Đã xác nhận</div>
            <div className="text-xl font-black mt-1">{summary.confirmed}</div>
          </div>

          <div
            onClick={() => setActiveTab('shipping')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              activeTab === 'shipping' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-102' : 'bg-white text-indigo-900 border-indigo-100 hover:border-indigo-200 shadow-2xs'
            }`}
          >
            <div className="text-[11px] font-semibold uppercase tracking-wider opacity-75">Đang giao</div>
            <div className="text-xl font-black mt-1">{summary.shipping}</div>
          </div>

          <div
            onClick={() => setActiveTab('delivered')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              activeTab === 'delivered' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-102' : 'bg-white text-emerald-900 border-emerald-100 hover:border-emerald-200 shadow-2xs'
            }`}
          >
            <div className="text-[11px] font-semibold uppercase tracking-wider opacity-75">Giao thành công</div>
            <div className="text-xl font-black mt-1">{summary.delivered}</div>
          </div>

          <div
            onClick={() => setActiveTab('cancelled')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              activeTab === 'cancelled' ? 'bg-red-600 text-white border-red-600 shadow-md scale-102' : 'bg-white text-red-900 border-red-100 hover:border-red-200 shadow-2xs'
            }`}
          >
            <div className="text-[11px] font-semibold uppercase tracking-wider opacity-75">Đã hủy</div>
            <div className="text-xl font-black mt-1">{summary.cancelled}</div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-xs mb-6 space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
            
            {/* Search Input */}
            <div className="flex-1 min-w-[240px] relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã đơn (ORD-...), tên khách, SĐT, địa chỉ..."
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
              />
              <span className="absolute left-3 top-3 text-gray-400 text-xs">🔍</span>
            </div>

            {/* Date Range Start */}
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <span>Từ ngày:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Date Range End */}
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <span>Đến ngày:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold transition-colors shadow-xs"
            >
              Lọc kết quả
            </button>

            {(searchQuery || startDate || endDate || activeTab !== 'all') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl text-xs font-bold transition-colors"
              >
                Đặt lại
              </button>
            )}
          </form>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-gray-500 text-xs space-y-3">
              <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="font-semibold">Đang tải danh sách đơn hàng Admin...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600 text-xs font-semibold">
              ⚠️ {error}
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-xs space-y-2">
              <div className="text-4xl">🛒</div>
              <p className="font-bold text-gray-600 text-sm">Không tìm thấy đơn hàng nào</p>
              <p>Thử thay đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Mã đơn hàng</th>
                    <th className="py-3.5 px-4">Khách hàng</th>
                    <th className="py-3.5 px-4">SĐT / Địa chỉ</th>
                    <th className="py-3.5 px-4">Thanh toán</th>
                    <th className="py-3.5 px-4">Tổng tiền</th>
                    <th className="py-3.5 px-4">Trạng thái</th>
                    <th className="py-3.5 px-4">Ngày đặt</th>
                    <th className="py-3.5 px-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-gray-900 whitespace-nowrap">
                        <Link to={`/orders/${o.id}`} className="hover:text-amber-600 underline">
                          {o.order_code}
                        </Link>
                      </td>
                      <td className="py-4 px-4 font-bold text-gray-800">
                        {o.recipient_name || 'Khách hàng'}
                      </td>
                      <td className="py-4 px-4 max-w-xs">
                        <div className="font-semibold text-gray-900">{o.recipient_phone}</div>
                        <div className="text-[11px] text-gray-400 truncate">{o.shipping_address}</div>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-bold text-gray-800">
                          {o.payment_method === 'QR_BANK' || o.payment_method === 'qr' ? 'QR Ngân hàng' : 'COD (Tiền mặt)'}
                        </div>
                        <div className={`text-[10px] font-extrabold uppercase ${o.payment_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {o.payment_status === 'paid' ? '● Đã thanh toán' : '○ Chưa thanh toán'}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-extrabold text-amber-700 font-display whitespace-nowrap">
                        {formatCurrency(o.total_amount)}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        {getStatusBadge(o.status)}
                      </td>
                      <td className="py-4 px-4 text-gray-500 text-[11px] whitespace-nowrap">
                        {formatDate(o.created_at)}
                      </td>
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedOrderId(o.id)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-colors"
                        >
                          ⚡ Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          {pagination.total_pages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs">
              <div className="text-gray-500">
                Hiển thị <span className="font-bold text-gray-800">{orders.length}</span> / <span className="font-bold text-gray-800">{pagination.total_items}</span> đơn hàng
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchAdminOrders(pagination.page - 1)}
                  className="px-3.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-xl font-bold disabled:opacity-40 transition-colors"
                >
                  ← Trang trước
                </button>
                <span className="font-semibold text-gray-700">
                  {pagination.page} / {pagination.total_pages}
                </span>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.total_pages}
                  onClick={() => fetchAdminOrders(pagination.page + 1)}
                  className="px-3.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-xl font-bold disabled:opacity-40 transition-colors"
                >
                  Trang sau →
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => {
            setSelectedOrderId(null)
            fetchAdminOrders(pagination.page)
          }}
        />
      )}
    </div>
  )
}

export default AdminOrdersPage
