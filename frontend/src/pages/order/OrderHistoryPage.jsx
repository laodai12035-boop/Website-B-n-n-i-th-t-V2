import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import orderService from '@/services/orderService'
import OrderDetailModal from '@/components/order/OrderDetailModal'

/**
 * OrderHistoryPage — Trang Xem lịch sử đơn hàng của tôi (nhaxinh.com style).
 * Góc cạnh vuông vức (rounded-none), badge trạng thái tinh tế, thiết kế thẻ đơn hàng cao cấp.
 */
const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [selectedOrderId, setSelectedOrderId] = useState(null)

  const tabs = [
    { id: 'all', label: 'Tất cả đơn hàng' },
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
    const str = (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.includes('+'))
      ? dateStr + 'Z'
      : dateStr
    return new Date(str).toLocaleDateString('vi-VN', {
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
        return <span className="px-3 py-1 bg-blue-50 text-blue-900 border border-blue-200 text-xs font-bold rounded-none uppercase tracking-wider">Đang giao hàng</span>
      case 'delivered':
        return <span className="px-3 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold rounded-none uppercase tracking-wider">Hoàn thành</span>
      case 'cancelled':
        return <span className="px-3 py-1 bg-red-50 text-red-900 border border-red-200 text-xs font-bold rounded-none uppercase tracking-wider">Đã hủy</span>
      default:
        return <span className="px-3 py-1 bg-stone-100 text-stone-800 border border-stone-200 text-xs font-bold rounded-none uppercase tracking-wider">{status}</span>
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 animate-fade-in">

        {/* Page Header */}
        <div className="mb-6 pb-4 border-b border-stone-200/80">
          <div className="flex items-center gap-2 text-xs font-medium text-stone-500 mb-1">
            <Link to="/profile" className="hover:text-amber-800 transition-colors">Tài khoản</Link>
            <span>/</span>
            <span className="text-stone-900 font-semibold">Lịch sử đơn hàng</span>
          </div>
          <h1 className="text-2xl font-heading font-bold text-stone-900 uppercase tracking-wider">
            LỊCH SỬ ĐƠN HÀNG CỦA TÔI
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Theo dõi tình trạng chế tác, đóng gói và vận chuyển các đơn hàng nội thất của bạn
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex overflow-x-auto gap-2 pb-2 mb-6 border-b border-stone-200/80 scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-none whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-stone-900 text-white border border-stone-900 shadow-2xs'
                  : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="py-16 text-center text-stone-400 text-xs space-y-3 bg-white rounded-none border border-stone-200/80">
            <div className="w-8 h-8 border-2 border-amber-800 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="font-semibold">Đang nạp danh sách đơn hàng...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-none text-xs text-red-800 font-semibold text-center">
            ⚠️ {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-none border border-stone-200/80 p-12 text-center space-y-4 shadow-2xs">
            <div className="w-16 h-16 bg-stone-100 text-stone-400 rounded-none flex items-center justify-center mx-auto mb-2 border border-stone-200">
              <svg className="w-8 h-8 stroke-current" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-heading font-bold text-stone-900 uppercase tracking-wider">Bạn chưa có đơn hàng nào</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                {activeTab === 'all'
                  ? 'Hãy lựa chọn các mẫu thiết kế nội thất sang trọng cho ngôi nhà của bạn ngay hôm nay.'
                  : `Không tìm thấy đơn hàng nào ở trạng thái "${tabs.find((t) => t.id === activeTab)?.label}".`}
              </p>
            </div>
            <Link
              to="/products"
              className="inline-block px-8 py-3.5 bg-stone-900 hover:bg-amber-800 text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs"
            >
              Khám phá sản phẩm ngay
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-none border border-stone-200/80 shadow-2xs hover:border-amber-800/50 transition-all overflow-hidden"
              >
                {/* Order Card Header */}
                <div className="p-4 sm:p-5 border-b border-stone-200/80 flex flex-wrap items-center justify-between gap-3 bg-stone-50/60">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-900 font-mono tracking-wider">
                        {order.order_code}
                      </span>
                      <span className="text-[11px] text-stone-400 font-mono">• {formatDate(order.created_at)}</span>
                    </div>
                    <div className="text-[11px] text-stone-500 truncate max-w-md">
                      Người nhận: <span className="font-semibold text-stone-800">{order.recipient_name}</span> ({order.recipient_phone}) — {order.shipping_address}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                {/* Order Card Items Summary */}
                <div className="p-4 sm:p-5 divide-y divide-stone-100">
                  {order.items?.slice(0, 3).map((item) => (
                    <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center gap-4">
                      <img
                        src={item.product?.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc'}
                        alt={item.product_name}
                        className="w-14 h-16 object-cover rounded-none bg-stone-100 border border-stone-200/80 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-stone-900 truncate">{item.product_name || item.product?.name}</h4>
                        <p className="text-[11px] text-stone-400">Số lượng: {item.quantity}</p>
                      </div>
                      <div className="text-xs font-bold text-stone-900">
                        {formatCurrency(item.subtotal)}
                      </div>
                    </div>
                  ))}

                  {order.items?.length > 3 && (
                    <div className="pt-2 text-[11px] text-stone-400 font-medium italic">
                      + và {order.items.length - 3} sản phẩm khác trong đơn hàng
                    </div>
                  )}
                </div>

                {/* Order Card Footer */}
                <div className="p-4 sm:p-5 border-t border-stone-200/80 flex flex-wrap items-center justify-between gap-4 bg-stone-50/40">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-stone-500 uppercase tracking-wider font-medium">Tổng thanh toán:</span>
                    <span className="text-lg font-bold text-amber-800">
                      {formatCurrency(order.total_amount)}
                    </span>
                    <span className="text-[11px] text-stone-400 font-medium">
                      ({order.payment_method === 'QR_BANK' || order.payment_method === 'qr' ? 'VietQR Ngân hàng' : 'COD'})
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
                        className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Hủy đơn
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedOrderId(order.id)}
                      className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Xem nhanh
                    </button>
                    <Link
                      to={`/orders/${order.id}`}
                      className="px-4 py-2 bg-stone-900 hover:bg-amber-800 text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs cursor-pointer"
                    >
                      Chi tiết đơn hàng →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />

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
