import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import orderService from '@/services/orderService'
import OrderDetailModal from '@/components/order/OrderDetailModal'

/**
 * OrderHistoryPage — Trang Xem lịch sử đơn hàng của tôi (NT-06-CN-001).
 */
const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [selectedOrderId, setSelectedOrderId] = useState(null)

  const tabs = [
    { id: 'all', label: 'Tất cả' },
    { id: 'pending', label: 'Chờ xác nhận' },
    { id: 'confirmed', label: 'Đã xác nhận' },
    { id: 'shipping', label: 'Đang giao' },
    { id: 'delivered', label: 'Hoàn thành' },
    { id: 'cancelled', label: 'Đã hủy' },
  ]

  const fetchOrders = async (status) => {
    setLoading(true)
    setError('')
    try {
      const data = await orderService.getUserOrders(status)
      setOrders(data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách đơn hàng.')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders(activeTab)
  }, [activeTab])

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('vi-VN', {
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
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">⏳ Chờ xác nhận</span>
      case 'confirmed':
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">✓ Đã xác nhận</span>
      case 'shipping':
        return <span className="px-2.5 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-full">🚚 Đang giao hàng</span>
      case 'delivered':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">🎉 Hoàn thành</span>
      case 'cancelled':
        return <span className="px-2.5 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">✖ Đã hủy</span>
      default:
        return <span className="px-2.5 py-1 bg-gray-100 text-gray-800 text-xs font-bold rounded-full">{status}</span>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/60 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">

        {/* Page Header */}
        <div className="mb-6 space-y-1">
          <h1 className="text-2xl font-display font-bold text-gray-900 flex items-center gap-2">
            <span>📦</span> Lịch sử đơn hàng của tôi
          </h1>
          <p className="text-xs text-gray-500">
            Theo dõi tất cả đơn hàng nội thất bạn đã đặt và tình trạng vận chuyển
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex overflow-x-auto gap-2 pb-2 mb-6 border-b border-gray-200 no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="py-16 text-center text-gray-500 text-xs space-y-3 bg-white rounded-3xl border border-gray-100">
            <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="font-semibold">Đang tải danh sách đơn hàng...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-semibold text-center">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center space-y-4 shadow-sm">
            <div className="text-5xl">🛍️</div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-gray-900">Bạn chưa có đơn hàng nào</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                {activeTab === 'all'
                  ? 'Hãy chọn mua những món đồ nội thất tinh tế cho ngôi nhà của bạn ngay hôm nay.'
                  : `Không có đơn hàng nào ở trạng thái "${tabs.find((t) => t.id === activeTab)?.label}".`}
              </p>
            </div>
            <Link
              to="/products"
              className="inline-block px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold transition-colors shadow-sm"
            >
              Khám phá sản phẩm ngay 🚀
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                {/* Order Card Header */}
                <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-gray-50/40">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-gray-900 font-mono">
                        {order.order_code}
                      </span>
                      <span className="text-[11px] text-gray-400">• {formatDate(order.created_at)}</span>
                    </div>
                    <div className="text-[11px] text-gray-500 truncate max-w-md">
                      Người nhận: <span className="font-semibold text-gray-700">{order.recipient_name}</span> ({order.recipient_phone}) — {order.shipping_address}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                {/* Order Card Items Summary */}
                <div className="p-4 sm:p-5 divide-y divide-gray-100">
                  {order.items?.slice(0, 3).map((item) => (
                    <div key={item.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center gap-3">
                      <img
                        src={item.product?.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc'}
                        alt={item.product_name}
                        className="w-12 h-12 object-cover rounded-xl bg-gray-50 border border-gray-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-gray-900 truncate">{item.product_name || item.product?.name}</h4>
                        <p className="text-[11px] text-gray-500">Số lượng: {item.quantity}</p>
                      </div>
                      <div className="text-xs font-bold text-gray-800 font-display">
                        {formatCurrency(item.subtotal)}
                      </div>
                    </div>
                  ))}

                  {order.items?.length > 3 && (
                    <div className="pt-2 text-[11px] text-gray-400 font-medium">
                      + và {order.items.length - 3} sản phẩm khác trong đơn hàng
                    </div>
                  )}
                </div>

                {/* Order Card Footer */}
                <div className="p-4 sm:p-5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4 bg-gray-50/20">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-gray-500">Tổng thanh toán:</span>
                    <span className="text-base font-extrabold text-amber-700 font-display">
                      {formatCurrency(order.total_amount)}
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium">
                      ({order.payment_method === 'QR_BANK' || order.payment_method === 'qr' ? 'QR Ngân hàng' : 'COD'})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {(order.status === 'pending' || order.status === 'confirmed') && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (window.confirm(`Bạn có chắc chắn muốn hủy đơn hàng ${order.order_code} không?`)) {
                            try {
                              await orderService.cancelOrder(order.id, 'Hủy từ danh sách đơn hàng')
                              await fetchOrders(activeTab)
                            } catch (err) {
                              alert(err.response?.data?.message || 'Không thể hủy đơn hàng.')
                            }
                          }
                        }}
                        className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-extrabold transition-colors"
                      >
                        ✖ Hủy đơn
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedOrderId(order.id)}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors"
                    >
                      ⚡ Xem nhanh
                    </button>
                    <Link
                      to={`/orders/${order.id}`}
                      className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                    >
                      Xem chi tiết đơn hàng →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal detail */}
      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  )
}

export default OrderHistoryPage
