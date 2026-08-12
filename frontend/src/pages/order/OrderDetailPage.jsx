import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import orderService from '@/services/orderService'
import OrderTimeline from '@/components/order/OrderTimeline'

/**
 * OrderDetailPage — Trang xem chi tiết đơn hàng cho Khách hàng (NT-06-CN-002).
 * Tuyến đường: /orders/:id
 */
const OrderDetailPage = () => {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorInfo, setErrorInfo] = useState(null) // { code: 'FORBIDDEN' | 'NOT_FOUND', message: '' }

  useEffect(() => {
    if (!id) return
    const fetchOrderDetail = async () => {
      setLoading(true)
      setErrorInfo(null)
      try {
        const data = await orderService.getOrderDetail(id)
        setOrder(data)
      } catch (err) {
        const status = err.response?.status
        const code = err.response?.data?.code || 'ERROR'
        const message = err.response?.data?.message || 'Không thể tải thông tin chi tiết đơn hàng.'

        if (status === 403 || code === 'FORBIDDEN') {
          setErrorInfo({
            code: 'FORBIDDEN',
            message: 'Bạn không có quyền truy cập thông tin đơn hàng này.',
          })
        } else if (status === 404 || code === 'ORDER_NOT_FOUND') {
          setErrorInfo({
            code: 'NOT_FOUND',
            message: 'Đơn hàng không tồn tại trong hệ thống.',
          })
        } else {
          setErrorInfo({ code: 'ERROR', message })
        }
      } finally {
        setLoading(false)
      }
    }
    fetchOrderDetail()
  }, [id])

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
        return <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">⏳ Chờ xác nhận</span>
      case 'confirmed':
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">✓ Đã xác nhận</span>
      case 'shipping':
        return <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-full">🚚 Đang giao hàng</span>
      case 'delivered':
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">🎉 Đã hoàn thành</span>
      case 'cancelled':
        return <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">✖ Đã hủy</span>
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-bold rounded-full">{status}</span>
    }
  }

  const getPaymentBadge = (pStatus, pMethod) => {
    if (pStatus === 'paid') {
      return <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">💳 Đã thanh toán</span>
    }
    if (pMethod === 'QR_BANK' || pMethod === 'qr') {
      return <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-full">📱 QR Ngân hàng (Chờ xác nhận)</span>
    }
    return <span className="px-3 py-1 bg-orange-50 text-orange-700 border border-orange-200 text-xs font-bold rounded-full">💵 COD (Tiền mặt lúc nhận)</span>
  }

  return (
    <div className="min-h-screen bg-gray-50/60 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">

        {/* Back Link & Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/orders"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-amber-600 transition-colors"
          >
            ← Quay lại lịch sử đơn hàng
          </Link>
        </div>

        {loading ? (
          <div className="py-20 text-center text-gray-500 text-xs space-y-3 bg-white rounded-3xl border border-gray-100">
            <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="font-semibold">Đang tải thông tin chi tiết đơn hàng...</p>
          </div>
        ) : errorInfo ? (
          /* Error State (403 Forbidden / 404 Not Found) */
          <div className="bg-white rounded-3xl border border-gray-100 p-10 text-center space-y-4 shadow-sm">
            <div className="text-5xl">{errorInfo.code === 'FORBIDDEN' ? '🔒' : '🔎'}</div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-900">
                {errorInfo.code === 'FORBIDDEN' ? 'Từ chối truy cập (403)' : 'Không tìm thấy đơn hàng (404)'}
              </h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">{errorInfo.message}</p>
            </div>
            <Link
              to="/orders"
              className="inline-block px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl text-xs font-bold transition-colors"
            >
              Về trang danh sách đơn hàng
            </Link>
          </div>
        ) : order ? (
          <div className="space-y-6">

            {/* Order Header Summary Card */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <div className="text-xs text-gray-400 font-medium">MÃ ĐƠN HÀNG</div>
                  <h1 className="text-xl font-display font-extrabold text-gray-900 font-mono">
                    {order.order_code}
                  </h1>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(order.status)}
                  {getPaymentBadge(order.payment_status, order.payment_method)}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-600">
                <div><span>Ngày đặt hàng:</span> <span className="font-semibold text-gray-900">{formatDate(order.created_at)}</span></div>
                <div><span>Hình thức thanh toán:</span> <span className="font-semibold text-gray-900">{order.payment_method === 'QR_BANK' || order.payment_method === 'qr' ? 'Chuyển khoản QR Ngân hàng' : 'Thanh toán COD'}</span></div>
              </div>
            </div>

            {/* Order Timeline Stepper */}
            <OrderTimeline status={order.status} />

            {/* Recipient / Shipping Info Card */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
                <span>📍</span> Thông tin nhận hàng
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-gray-400 font-medium">Người nhận hàng:</div>
                  <div className="font-bold text-gray-900">{order.recipient_name}</div>
                  <div className="text-gray-500">{order.recipient_phone}</div>
                </div>
                <div>
                  <div className="text-gray-400 font-medium">Địa chỉ giao hàng:</div>
                  <div className="font-semibold text-gray-900">{order.shipping_address}</div>
                </div>
              </div>
              {order.note && (
                <div className="pt-2 text-xs text-amber-800 bg-amber-50/50 p-3 rounded-xl border border-amber-100/60">
                  <span className="font-bold">Ghi chú giao hàng:</span> "{order.note}"
                </div>
              )}
            </div>

            {/* Items Table Card */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
                <span>🛍️</span> Danh sách sản phẩm ({order.items?.length || 0})
              </h3>
              <div className="divide-y divide-gray-100">
                {order.items?.map((item) => (
                  <div key={item.id} className="py-3 flex items-center gap-4">
                    <img
                      src={item.product?.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc'}
                      alt={item.product_name}
                      className="w-14 h-14 object-cover rounded-xl bg-gray-50 border border-gray-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/products/${item.product_id}`}
                        className="text-xs font-bold text-gray-900 hover:text-amber-600 truncate block"
                      >
                        {item.product_name || item.product?.name}
                      </Link>
                      <div className="text-[11px] text-gray-500">
                        Đơn giá: {formatCurrency(item.price)} × Số lượng: {item.quantity}
                      </div>
                    </div>
                    <div className="text-xs font-extrabold text-gray-900 font-display">
                      {formatCurrency(item.subtotal)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Breakdown Card */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
                <span>💰</span> Chi tiết thanh toán
              </h3>
              <div className="space-y-2 text-xs">
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
                    <span>Mã giảm giá ưu đãi:</span>
                    <span className="font-bold">-{formatCurrency(order.discount_amount)}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline text-sm">
                  <span className="font-extrabold text-gray-900">Tổng thanh toán:</span>
                  <span className="text-xl font-extrabold text-amber-700 font-display">
                    {formatCurrency(order.total_amount)}
                  </span>
                </div>
              </div>
            </div>

          </div>
        ) : null}

      </main>
    </div>
  )
}

export default OrderDetailPage
