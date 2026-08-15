import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import orderService from '@/services/orderService'
import returnService from '@/services/returnService'
import OrderTimeline from '@/components/order/OrderTimeline'
import ReturnRequestModal from '@/components/order/ReturnRequestModal'

/**
 * OrderDetailPage — Trang xem chi tiết đơn hàng cho Khách hàng (nhaxinh.com style).
 * Góc cạnh vuông vức (rounded-none), phông chữ Hanken Grotesk & Playfair Display, icon vector SVG.
 */
const OrderDetailPage = () => {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorInfo, setErrorInfo] = useState(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('Thay đổi nhu cầu mua hàng')
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')
  const [cancelSuccess, setCancelSuccess] = useState('')
  const [returnRequest, setReturnRequest] = useState(null)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [returnSuccess, setReturnSuccess] = useState('')

  const handleCancelOrder = async (e) => {
    e.preventDefault()
    if (!order) return
    setCancelling(true)
    setCancelError('')
    try {
      const res = await orderService.cancelOrder(order.id, cancelReason)
      setOrder(res.data)
      setShowCancelModal(false)
      setCancelSuccess('Đã hủy đơn hàng thành công và hoàn lại số lượng tồn kho!')
      setTimeout(() => setCancelSuccess(''), 5000)
    } catch (err) {
      setCancelError(err.response?.data?.message || 'Không thể hủy đơn hàng.')
    } finally {
      setCancelling(false)
    }
  }

  useEffect(() => {
    if (!id) return
    const fetchOrderDetail = async () => {
      setLoading(true)
      setErrorInfo(null)
      try {
        const data = await orderService.getOrderDetail(id)
        setOrder(data)

        try {
          const retData = await returnService.getReturnRequestByOrder(id)
          setReturnRequest(retData)
        } catch (e) {
          // Ignore if no return request
        }
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
        return <span className="px-3 py-1 bg-blue-50 text-blue-900 border border-blue-200 text-xs font-bold rounded-none uppercase tracking-wider">Đang giao hàng</span>
      case 'delivered':
        return <span className="px-3 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold rounded-none uppercase tracking-wider">Hoàn thành</span>
      case 'cancelled':
        return <span className="px-3 py-1 bg-red-50 text-red-900 border border-red-200 text-xs font-bold rounded-none uppercase tracking-wider">Đã hủy</span>
      default:
        return <span className="px-3 py-1 bg-stone-100 text-stone-800 border border-stone-200 text-xs font-bold rounded-none uppercase tracking-wider">{status}</span>
    }
  }

  const getPaymentBadge = (pStatus, pMethod) => {
    if (pStatus === 'paid') {
      return <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-none uppercase tracking-wider">Đã thanh toán</span>
    }
    if (pMethod === 'QR_BANK' || pMethod === 'qr') {
      return <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-none uppercase tracking-wider">VietQR Ngân hàng</span>
    }
    return <span className="px-3 py-1 bg-stone-100 text-stone-800 border border-stone-200 text-xs font-bold rounded-none uppercase tracking-wider">COD (Tiền mặt lúc nhận)</span>
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 animate-fade-in">

        {/* Back Link */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/orders"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-amber-800 transition-colors uppercase tracking-wider"
          >
            ← Quay lại danh sách đơn hàng
          </Link>
        </div>

        {loading ? (
          <div className="py-20 text-center text-stone-400 text-xs space-y-3 bg-white rounded-none border border-stone-200/80">
            <div className="w-8 h-8 border-2 border-amber-800 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="font-semibold">Đang nạp chi tiết đơn hàng...</p>
          </div>
        ) : errorInfo ? (
          /* Error State */
          <div className="bg-white rounded-none border border-stone-200/80 p-10 text-center space-y-4 shadow-2xs">
            <div className="w-16 h-16 bg-stone-100 text-stone-400 rounded-none flex items-center justify-center mx-auto mb-2 border border-stone-200">
              <svg className="w-8 h-8 stroke-current" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-heading font-bold text-stone-900 uppercase tracking-wider">
                {errorInfo.code === 'FORBIDDEN' ? 'Từ chối truy cập (403)' : 'Không tìm thấy đơn hàng (404)'}
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto">{errorInfo.message}</p>
            </div>
            <Link
              to="/orders"
              className="inline-block px-6 py-3 bg-stone-900 hover:bg-amber-800 text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs"
            >
              Quay lại danh sách đơn hàng
            </Link>
          </div>
        ) : order ? (
          <div className="space-y-6">

            {cancelSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-none text-xs text-emerald-800 font-bold flex items-center gap-2 animate-fade-in">
                <span>✅</span> {cancelSuccess}
              </div>
            )}

            {/* Order Header Summary Card */}
            <div className="bg-white rounded-none border border-stone-200/80 p-6 shadow-2xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200/80 pb-4">
                <div>
                  <div className="text-[11px] text-stone-400 font-bold uppercase tracking-wider">MÃ ĐƠN HÀNG</div>
                  <h1 className="text-2xl font-heading font-bold text-stone-900 font-mono tracking-wider">
                    {order.order_code}
                  </h1>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {getStatusBadge(order.status)}
                  {getPaymentBadge(order.payment_status, order.payment_method)}

                  {/* Nút Hủy Đơn Hàng */}
                  {(order.status === 'pending' || order.status === 'confirmed') && (
                    <button
                      type="button"
                      onClick={() => {
                        setCancelError('')
                        setShowCancelModal(true)
                      }}
                      className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Hủy đơn hàng
                    </button>
                  )}

                  {/* Nút Yêu cầu Đổi/Trả hàng */}
                  {order.status === 'delivered' && (
                    returnRequest ? (
                      <span className={`px-3 py-1.5 rounded-none text-xs font-bold uppercase tracking-wider flex items-center gap-1 border ${
                        returnRequest.status === 'pending'
                          ? 'bg-amber-50 text-amber-900 border-amber-200'
                          : returnRequest.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                          : 'bg-red-50 text-red-900 border-red-200'
                      }`}>
                        {
                          returnRequest.status === 'pending'
                            ? '⏳ Đang chờ Admin duyệt đổi/trả'
                            : returnRequest.status === 'approved'
                            ? '✅ Yêu cầu đổi/trả đã chấp nhận'
                            : '❌ Yêu cầu đổi/trả bị từ chối'
                        }
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowReturnModal(true)}
                        className="px-3.5 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs cursor-pointer"
                      >
                        Yêu cầu đổi/trả
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-stone-600">
                <div><span className="text-stone-400 uppercase tracking-wider">Ngày đặt hàng:</span> <span className="font-semibold text-stone-900 font-mono">{formatDate(order.created_at)}</span></div>
                <div><span className="text-stone-400 uppercase tracking-wider">Phương thức thanh toán:</span> <span className="font-semibold text-stone-900">{order.payment_method === 'QR_BANK' || order.payment_method === 'qr' ? 'Chuyển khoản VietQR Ngân hàng' : 'Thanh toán COD'}</span></div>
              </div>
            </div>

            {/* Return Request Banner */}
            {returnRequest && (
              <div className={`p-5 rounded-none border text-xs space-y-3 animate-fade-in shadow-2xs ${
                returnRequest.status === 'pending'
                  ? 'bg-amber-50/90 border-amber-200 text-amber-900'
                  : returnRequest.status === 'approved'
                  ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
                  : 'bg-red-50/90 border-red-200 text-red-900'
              }`}>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-current/15 pb-3">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                    Yêu cầu {returnRequest.request_type === 'return' ? 'Trả hàng & Hoàn tiền' : returnRequest.request_type === 'exchange' ? 'Đổi sản phẩm' : 'Bảo hành'}:
                    <span className="px-2.5 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider bg-white border border-current">
                      {returnRequest.status === 'pending' ? 'Đang chờ duyệt' : returnRequest.status === 'approved' ? 'Đã chấp nhận' : 'Từ chối'}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono opacity-75">{formatDate(returnRequest.created_at)}</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="font-bold text-stone-700">Lý do từ phía bạn:</span> <span className="italic font-medium">"{returnRequest.reason}"</span>
                  </div>

                  {returnRequest.admin_note && (
                    <div className="p-3.5 rounded-none bg-white border border-stone-200 font-medium mt-2 shadow-2xs">
                      <div className="flex items-center gap-1.5 font-bold mb-1 text-xs uppercase tracking-wider">
                        Phản hồi từ Admin:
                      </div>
                      <p className="leading-relaxed text-xs font-semibold text-stone-900">"{returnRequest.admin_note}"</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Order Timeline Stepper */}
            <OrderTimeline status={order.status} />

            {/* Recipient / Shipping Info Card */}
            <div className="bg-white rounded-none border border-stone-200/80 p-6 shadow-2xs space-y-4">
              <h3 className="text-xs font-heading font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2 border-b border-stone-200/80 pb-3">
                <svg className="w-4 h-4 text-amber-800 stroke-current" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span>THÔNG TIN NHẬN HÀNG</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-stone-400 uppercase tracking-wider font-medium">Người nhận hàng:</div>
                  <div className="font-bold text-stone-900 mt-0.5">{order.recipient_name}</div>
                  <div className="text-stone-500 font-mono">{order.recipient_phone}</div>
                </div>
                <div>
                  <div className="text-stone-400 uppercase tracking-wider font-medium">Địa chỉ giao hàng:</div>
                  <div className="font-semibold text-stone-900 mt-0.5">{order.shipping_address}</div>
                </div>
              </div>
              {order.note && (
                <div className="pt-2 text-xs text-amber-900 bg-amber-50/50 p-3 rounded-none border border-amber-200/60">
                  <span className="font-bold uppercase tracking-wider">Ghi chú giao hàng:</span> "{order.note}"
                </div>
              )}
            </div>

            {/* Items Table Card */}
            <div className="bg-white rounded-none border border-stone-200/80 p-6 shadow-2xs space-y-4">
              <h3 className="text-xs font-heading font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2 border-b border-stone-200/80 pb-3">
                <svg className="w-4 h-4 text-amber-800 stroke-current" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span>DANH SÁCH SẢN PHẨM ({order.items?.length || 0})</span>
              </h3>
              <div className="divide-y divide-stone-100">
                {order.items?.map((item) => (
                  <div key={item.id} className="py-3 flex items-center gap-4">
                    <img
                      src={item.product?.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc'}
                      alt={item.product_name}
                      className="w-14 h-16 object-cover rounded-none bg-stone-100 border border-stone-200/80 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/products/${item.product_id}`}
                        className="text-xs font-bold text-stone-900 hover:text-amber-800 truncate block"
                      >
                        {item.product_name || item.product?.name}
                      </Link>
                      <div className="text-[11px] text-stone-500">
                        Đơn giá: {formatCurrency(item.price)} × Số lượng: {item.quantity}
                      </div>
                    </div>
                    <div className="text-xs font-bold text-stone-900">
                      {formatCurrency(item.subtotal)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Breakdown Card */}
            <div className="bg-white rounded-none border border-stone-200/80 p-6 shadow-2xs space-y-3">
              <h3 className="text-xs font-heading font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2 border-b border-stone-200/80 pb-3">
                <span>CHI TIẾT THANH TOÁN</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Tạm tính sản phẩm:</span>
                  <span className="font-semibold text-stone-900">{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Phí vận chuyển:</span>
                  <span className="font-semibold text-stone-900">{formatCurrency(order.shipping_fee)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-800 font-semibold">
                    <span>Mã giảm giá ưu đãi:</span>
                    <span className="font-bold">-{formatCurrency(order.discount_amount)}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-stone-200/80 flex justify-between items-baseline text-sm">
                  <span className="font-bold text-stone-900 uppercase tracking-wider">Tổng thanh toán:</span>
                  <span className="text-xl font-bold text-amber-800">
                    {formatCurrency(order.total_amount)}
                  </span>
                </div>
              </div>
            </div>

          </div>
        ) : null}

      </main>

      <Footer />

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-white rounded-none max-w-md w-full p-6 shadow-2xl border border-stone-200/80 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
              <h3 className="text-xs font-heading font-bold text-stone-900 uppercase tracking-wider">
                XÁC NHẬN HỦY ĐƠN HÀNG
              </h3>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="text-stone-400 hover:text-stone-900 transition-colors p-1 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-xs text-stone-600">
              Bạn có chắc chắn muốn hủy đơn hàng <span className="font-mono font-bold text-stone-900">{order?.order_code}</span> không? Số lượng sản phẩm trong đơn sẽ được hoàn lại vào kho.
            </p>

            {cancelError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-none text-xs text-red-800 font-semibold">
                ⚠️ {cancelError}
              </div>
            )}

            <form onSubmit={handleCancelOrder} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1 uppercase tracking-wider">Vui lòng chọn lý do hủy:</label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-stone-200 rounded-none text-xs focus:outline-none focus:border-amber-800 bg-white text-stone-900"
                >
                  <option value="Thay đổi nhu cầu mua hàng">Thay đổi nhu cầu mua hàng</option>
                  <option value="Muốn thay đổi phương thức thanh toán/địa chỉ">Muốn thay đổi phương thức thanh toán / địa chỉ</option>
                  <option value="Muốn chọn sản phẩm khác">Muốn chọn sản phẩm khác</option>
                  <option value="Tìm thấy giá tốt hơn ở nơi khác">Tìm thấy giá tốt hơn ở nơi khác</option>
                  <option value="Khác">Lý do khác</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  disabled={cancelling}
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={cancelling}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  {cancelling ? 'Đang hủy...' : 'XÁC NHẬN HỦY'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Request Modal */}
      {showReturnModal && (
        <ReturnRequestModal
          order={order}
          onClose={() => setShowReturnModal(false)}
          onSuccess={(req) => {
            setReturnRequest(req)
            setReturnSuccess('Đã gửi yêu cầu đổi/trả hàng thành công! Admin sẽ liên hệ xử lý.')
            setTimeout(() => setReturnSuccess(''), 6000)
          }}
        />
      )}
    </div>
  )
}

export default OrderDetailPage
