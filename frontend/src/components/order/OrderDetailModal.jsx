import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import orderService from '@/services/orderService'

/**
 * OrderDetailModal — Modal xem chi tiết đơn hàng (NT-06-CN-001 / NT-06-CN-002).
 */
const OrderDetailModal = ({ orderId, onClose }) => {
  const { user } = useAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!orderId) return
    const fetchDetail = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await orderService.getOrderDetail(orderId)
        setOrder(data)
      } catch (err) {
        const status = err.response?.status
        const msg = err.response?.data?.message
        if (status === 403) {
          setError('⚠️ Bạn không có quyền truy cập thông tin đơn hàng này.')
        } else if (status === 404) {
          setError('⚠️ Đơn hàng không tồn tại trong hệ thống.')
        } else {
          setError(msg || 'Không thể tải thông tin chi tiết đơn hàng.')
        }
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [orderId])

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleString('vi-VN', {
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
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">🎉 Đã hoàn thành</span>
      case 'cancelled':
        return <span className="px-2.5 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">✖ Đã hủy</span>
      default:
        return <span className="px-2.5 py-1 bg-gray-100 text-gray-800 text-xs font-bold rounded-full">{status}</span>
    }
  }

  const getPaymentStatusBadge = (pStatus, pMethod) => {
    if (pStatus === 'paid') {
      return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">💳 Đã thanh toán</span>
    }
    if (pMethod === 'QR_BANK' || pMethod === 'qr') {
      return <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-full">📱 Chờ chuyển khoản QR</span>
    }
    return <span className="px-2.5 py-1 bg-orange-50 text-orange-700 border border-orange-200 text-xs font-bold rounded-full">💵 COD (Thanh toán khi nhận)</span>
  }

  if (!orderId) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100 flex flex-col">

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h3 className="text-base font-display font-bold text-gray-900 flex items-center gap-2">
              <span>📋</span> Chi tiết đơn hàng
            </h3>
            {order && (
              <p className="text-xs text-gray-500 font-mono mt-0.5">{order.order_code}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="py-12 text-center text-gray-500 text-xs space-y-2">
              <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p>Đang tải thông tin đơn hàng...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-semibold text-center">
              {error}
            </div>
          ) : order ? (
            <>
              {/* Status Badges & Time */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-[11px] text-gray-500">Thời gian đặt: {formatDate(order.created_at)}</div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(order.status)}
                    {getPaymentStatusBadge(order.payment_status, order.payment_method)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-semibold text-gray-400">Hình thức thanh toán</div>
                  <div className="text-xs font-bold text-gray-800">
                    {order.payment_method === 'QR_BANK' || order.payment_method === 'qr' ? 'Chuyển khoản QR' : 'COD (Tiền mặt)'}
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>📍</span> Thông tin giao hàng
                </h4>
                <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-100 text-xs space-y-1">
                  <div><span className="font-semibold text-gray-700">Người nhận:</span> {order.recipient_name} ({order.recipient_phone})</div>
                  <div><span className="font-semibold text-gray-700">Địa chỉ:</span> {order.shipping_address}</div>
                  {order.note && (
                    <div className="text-gray-500 italic pt-1 border-t border-amber-200/50">
                      Ghi chú: "{order.note}"
                    </div>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🛍️</span> Danh sách sản phẩm ({order.items?.length || 0})
                </h4>
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
                  {order.items?.map((item) => (
                    <div key={item.id} className="p-3.5 flex items-center gap-3 bg-white">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden shrink-0 border border-gray-100">
                        {item.product?.image_url ? (
                          <img src={item.product.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg">🪑</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-gray-900 truncate">{item.product_name || item.product?.name}</div>
                        <div className="text-[11px] text-gray-500">
                          {formatCurrency(item.price)} × {item.quantity}
                        </div>
                      </div>
                      <div className="text-xs font-extrabold text-gray-900 font-display">
                        {formatCurrency(item.subtotal)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Breakdown */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính sản phẩm:</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển (QTN-07):</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(order.shipping_fee)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Giảm giá khuyến mãi:</span>
                    <span className="font-bold">-{formatCurrency(order.discount_amount)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-200 flex justify-between items-baseline text-sm">
                  <span className="font-bold text-gray-900">Tổng thanh toán:</span>
                  <span className="text-lg font-extrabold text-amber-700 font-display">
                    {formatCurrency(order.total_amount)}
                  </span>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
          <div>
            {order && user?.role === 'admin' ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-gray-500">Chuyển trạng thái Admin:</span>
                {order.status === 'pending' && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await orderService.updateOrderStatus(order.id, 'confirmed', 'Admin xác nhận đơn')
                        onClose()
                      } catch (err) {
                        alert(err.response?.data?.message || 'Không thể chuyển trạng thái.')
                      }
                    }}
                    className="px-3 py-1 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
                  >
                    🔵 Xác nhận đơn
                  </button>
                )}
                {order.status === 'confirmed' && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await orderService.updateOrderStatus(order.id, 'shipping', 'Admin bàn giao vận chuyển')
                        onClose()
                      } catch (err) {
                        alert(err.response?.data?.message || 'Không thể chuyển trạng thái.')
                      }
                    }}
                    className="px-3 py-1 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
                  >
                    🚚 Bàn giao vận chuyển
                  </button>
                )}
                {order.status === 'shipping' && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await orderService.updateOrderStatus(order.id, 'delivered', 'Admin xác nhận hoàn thành')
                        onClose()
                      } catch (err) {
                        alert(err.response?.data?.message || 'Không thể chuyển trạng thái.')
                      }
                    }}
                    className="px-3 py-1 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors"
                  >
                    ✅ Hoàn thành
                  </button>
                )}
                {(order.status === 'pending' || order.status === 'confirmed') && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (window.confirm(`Xác nhận HỦY đơn ${order.order_code} và hoàn lại tồn kho?`)) {
                        try {
                          await orderService.updateOrderStatus(order.id, 'cancelled', 'Admin hủy đơn')
                          onClose()
                        } catch (err) {
                          alert(err.response?.data?.message || 'Không thể hủy đơn.')
                        }
                      }
                    }}
                    className="px-3 py-1 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors"
                  >
                    ✖ Hủy đơn
                  </button>
                )}
              </div>
            ) : order && (order.status === 'pending' || order.status === 'confirmed') ? (
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm(`Bạn có chắc chắn muốn hủy đơn hàng ${order.order_code} không?`)) {
                    try {
                      await orderService.cancelOrder(order.id, 'Hủy từ xem nhanh đơn hàng')
                      alert('Đã hủy đơn hàng thành công và hoàn lại số lượng tồn kho!')
                      onClose()
                    } catch (err) {
                      alert(err.response?.data?.message || 'Không thể hủy đơn hàng.')
                    }
                  }
                }}
                className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-extrabold transition-colors flex items-center gap-1"
              >
                <span>✖</span> Hủy đơn hàng
              </button>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  )
}

export default OrderDetailModal
