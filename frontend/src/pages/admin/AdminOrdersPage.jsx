import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import OrderDetailModal from '@/components/order/OrderDetailModal'
import api from '@/services/api'
import orderService from '@/services/orderService'

/**
 * AdminOrdersPage — Trang Quản lý danh sách toàn bộ đơn hàng (nhaxinh.com style).
 * Góc cạnh vuông vức (rounded-none), KHÔNG SỬ DỤNG ICON.
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
        page,
        limit: 15,
        status: activeTab !== 'all' ? activeTab : undefined,
        search: searchQuery.trim() || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      }

      const res = await api.get('/admin/orders', { params })
      const resData = res.data.data
      setOrders(resData.items || [])
      setPagination(resData.pagination || { page: 1, limit: 15, total_items: 0, total_pages: 1 })
      if (resData.summary) {
        setSummary(resData.summary)
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể tải danh sách đơn hàng Admin.'
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
    setSearchQuery('')
    setStartDate('')
    setEndDate('')
    setActiveTab('all')
  }

  const handleStatusChange = async (orderId, newStatus, orderCode) => {
    if (!window.confirm(`Bạn có chắc muốn chuyển trạng thái đơn hàng ${orderCode} sang "${newStatus.toUpperCase()}"?`)) {
      return
    }

    try {
      await orderService.updateOrderStatus(orderId, newStatus)
      fetchAdminOrders(pagination.page)
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể cập nhật trạng thái đơn hàng.')
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const str = (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.includes('+'))
      ? dateStr + 'Z'
      : dateStr
    return new Date(str).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold rounded-none uppercase tracking-wider">Chờ xác nhận</span>
      case 'confirmed':
        return <span className="px-3 py-1 bg-stone-100 text-stone-900 border border-stone-300 text-xs font-bold rounded-none uppercase tracking-wider">Đã xác nhận</span>
      case 'shipping':
        return <span className="px-3 py-1 bg-blue-50 text-blue-900 border border-blue-200 text-xs font-bold rounded-none uppercase tracking-wider">Đang giao</span>
      case 'delivered':
        return <span className="px-3 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold rounded-none uppercase tracking-wider">Hoàn thành</span>
      case 'cancelled':
        return <span className="px-3 py-1 bg-red-50 text-red-900 border border-red-200 text-xs font-bold rounded-none uppercase tracking-wider">Đã hủy</span>
      default:
        return <span className="px-3 py-1 bg-stone-100 text-stone-800 border border-stone-200 text-xs font-bold rounded-none uppercase tracking-wider">{status}</span>
    }
  }

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      
      {/* Header Breadcrumb */}
      <div className="bg-white rounded-none border border-stone-200/80 p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest bg-amber-100 px-2.5 py-0.5 rounded-none border border-amber-200 inline-block mb-1">
            Phân hệ Quản trị
          </span>
          <h1 className="text-2xl font-heading font-bold text-stone-900 uppercase tracking-wider">
            QUẢN LÝ DANH SÁCH ĐƠN HÀNG
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Theo dõi, xử lý và cập nhật tiến trình đơn hàng của khách hàng toàn hệ thống
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/returns"
            className="px-4 py-2.5 bg-stone-900 hover:bg-amber-800 text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs cursor-pointer"
          >
            DUYỆT ĐỔI / TRẢ HÀNG
          </Link>
        </div>
      </div>

      {/* Summary Counter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { key: 'all', label: 'TẤT CẢ ĐƠN', count: summary.total },
          { key: 'pending', label: 'CHỜ XÁC NHẬN', count: summary.pending },
          { key: 'confirmed', label: 'ĐÃ XÁC NHẬN', count: summary.confirmed },
          { key: 'shipping', label: 'ĐANG GIAO HÀNG', count: summary.shipping },
          { key: 'delivered', label: 'GIAO THÀNH CÔNG', count: summary.delivered },
          { key: 'cancelled', label: 'ĐÃ HỦY ĐƠN', count: summary.cancelled },
        ].map((item) => (
          <div
            key={item.key}
            onClick={() => setActiveTab(item.key)}
            className={`p-4 rounded-none border cursor-pointer transition-all ${
              activeTab === item.key
                ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                : 'bg-white text-stone-700 border-stone-200/80 hover:border-stone-400 shadow-2xs'
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-widest opacity-75">{item.label}</div>
            <div className="text-xl font-bold font-mono mt-1">{item.count}</div>
          </div>
        ))}
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white rounded-none border border-stone-200/80 p-5 shadow-2xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
          
          {/* Search Input */}
          <div className="flex-1 min-w-[240px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm mã đơn (ORD-...), tên khách hàng, SĐT, địa chỉ..."
              className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-none text-xs focus:outline-none focus:border-amber-800 bg-white text-stone-900"
            />
          </div>

          {/* Date Range Start */}
          <div className="flex items-center gap-1.5 text-xs text-stone-600">
            <span className="font-bold uppercase tracking-wider text-[11px]">Từ ngày:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-none text-xs focus:outline-none focus:border-amber-800"
            />
          </div>

          {/* Date Range End */}
          <div className="flex items-center gap-1.5 text-xs text-stone-600">
            <span className="font-bold uppercase tracking-wider text-[11px]">Đến ngày:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-none text-xs focus:outline-none focus:border-amber-800"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2 bg-stone-900 hover:bg-amber-800 text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs cursor-pointer"
          >
            LỌC KẾT QUẢ
          </button>

          {(searchQuery || startDate || endDate || activeTab !== 'all') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              ĐẶT LẠI
            </button>
          )}
        </form>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-none border border-stone-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-stone-400 text-xs space-y-3">
            <div className="w-8 h-8 border-2 border-amber-800 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="font-semibold">Đang tải danh sách đơn hàng Admin...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 text-xs font-semibold">
            ⚠️ {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-stone-400 text-xs space-y-2">
            <p className="font-heading font-bold text-stone-900 text-base uppercase tracking-wider">Không tìm thấy đơn hàng nào</p>
            <p>Thử thay đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200/80 text-stone-500 font-bold uppercase tracking-wider text-[11px]">
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
              <tbody className="divide-y divide-stone-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-stone-900 whitespace-nowrap">
                      <Link to={`/orders/${o.id}`} className="hover:text-amber-800 underline">
                        {o.order_code}
                      </Link>
                    </td>
                    <td className="py-4 px-4 font-bold text-stone-800">
                      {o.recipient_name || 'Khách hàng'}
                    </td>
                    <td className="py-4 px-4 max-w-xs">
                      <div className="font-semibold text-stone-900 font-mono">{o.recipient_phone}</div>
                      <div className="text-[11px] text-stone-500 truncate">{o.shipping_address}</div>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="font-bold text-stone-800">
                        {o.payment_method === 'QR_BANK' || o.payment_method === 'qr' ? 'VietQR Ngân hàng' : 'COD (Tiền mặt)'}
                      </div>
                      <div className={`text-[10px] font-bold uppercase tracking-wider ${o.payment_status === 'paid' ? 'text-emerald-800' : 'text-amber-800'}`}>
                        {o.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                      </div>
                    </td>
                    <td className="py-4 px-4 font-bold text-amber-800 whitespace-nowrap">
                      {formatCurrency(o.total_amount)}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      {getStatusBadge(o.status)}
                    </td>
                    <td className="py-4 px-4 text-stone-500 text-[11px] font-mono whitespace-nowrap">
                      {formatDate(o.created_at)}
                    </td>
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {o.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(o.id, 'confirmed', o.order_code)}
                              className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded-none text-[11px] font-bold uppercase tracking-wider cursor-pointer"
                            >
                              Xác nhận
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(o.id, 'cancelled', o.order_code)}
                              className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-none text-[11px] font-bold uppercase tracking-wider cursor-pointer"
                            >
                              Hủy
                            </button>
                          </>
                        )}

                        {o.status === 'confirmed' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(o.id, 'shipping', o.order_code)}
                              className="px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded-none text-[11px] font-bold uppercase tracking-wider cursor-pointer"
                            >
                              Giao hàng
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(o.id, 'cancelled', o.order_code)}
                              className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-none text-[11px] font-bold uppercase tracking-wider cursor-pointer"
                            >
                              Hủy
                            </button>
                          </>
                        )}

                        {o.status === 'shipping' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(o.id, 'delivered', o.order_code)}
                            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-none text-[11px] font-bold uppercase tracking-wider cursor-pointer"
                          >
                            Hoàn thành
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedOrderId(o.id)}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-none text-[11px] font-bold uppercase tracking-wider cursor-pointer"
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.total_pages > 1 && (
          <div className="px-6 py-4 border-t border-stone-200/80 bg-stone-50/50 flex items-center justify-between text-xs">
            <div className="text-stone-500">
              Hiển thị <span className="font-bold text-stone-900 font-mono">{orders.length}</span> / <span className="font-bold text-stone-900 font-mono">{pagination.total_items}</span> đơn hàng
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => fetchAdminOrders(pagination.page - 1)}
                className="px-3.5 py-1.5 bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 rounded-none font-bold uppercase tracking-wider disabled:opacity-40 transition-colors cursor-pointer"
              >
                ← TRANG TRƯỚC
              </button>
              <span className="font-bold text-stone-900 font-mono">
                {pagination.page} / {pagination.total_pages}
              </span>
              <button
                type="button"
                disabled={pagination.page >= pagination.total_pages}
                onClick={() => fetchAdminOrders(pagination.page + 1)}
                className="px-3.5 py-1.5 bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 rounded-none font-bold uppercase tracking-wider disabled:opacity-40 transition-colors cursor-pointer"
              >
                TRANG SAU →
              </button>
            </div>
          </div>
        )}
      </div>

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
