import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import couponService from '@/services/couponService'

/**
 * CheckoutPage — Trang Thanh toán đặt hàng (Express Checkout / Standard Checkout).
 */
const CheckoutPage = () => {
  const { items, cartTotal, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  // Form State
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [address, setAddress] = useState('')
  const [note, setNote] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cod')

  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)

  const [submitting, setSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)
  }

  const handleApplyCoupon = async (e) => {
    e.preventDefault()
    setCouponError('')
    if (!couponCode.trim()) return

    setCouponLoading(true)
    try {
      const res = await couponService.applyCoupon(couponCode, cartTotal)
      setAppliedCoupon(res)
      setCouponError('')
    } catch (err) {
      setAppliedCoupon(null)
      const msg = err.response?.data?.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn.'
      setCouponError(msg)
    } finally {
      setCouponLoading(false)
    }
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!fullName.trim() || !phone.trim() || !address.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ Họ tên, Số điện thoại và Địa chỉ giao hàng.')
      return
    }

    setSubmitting(true)
    try {
      // Simulate placing order
      await new Promise((resolve) => setTimeout(resolve, 800))
      await clearCart()
      setOrderSuccess(true)
    } catch (err) {
      setErrorMsg('Đã có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại!')
    } finally {
      setSubmitting(false)
    }
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-lg mx-auto w-full p-6 my-12 flex flex-col items-center justify-center text-center animate-fade-in">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center text-4xl mb-4 shadow-lg animate-bounce">
            🎉
          </div>
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">Đặt hàng thành công!</h2>
          <p className="text-xs text-gray-500 mb-6">
            Cảm ơn bạn đã tin tưởng chọn mua sản phẩm tại <strong className="text-gray-800">Nội Thất Đẹp</strong>. Đơn hàng của bạn đang được xử lý và sẽ sớm giao tận tay.
          </p>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 w-full text-left text-xs space-y-2 mb-6 shadow-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Người nhận:</span>
              <span className="font-bold text-gray-900">{fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Số điện thoại:</span>
              <span className="font-bold text-gray-900">{phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Hình thức thanh toán:</span>
              <span className="font-bold text-amber-800 uppercase">{paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản VNPAY/QR'}</span>
            </div>
          </div>
          <Link
            to="/products"
            className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold transition-colors shadow-sm"
          >
            Tiếp tục mua sắm
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 animate-fade-in">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-6">
          <Link to="/" className="hover:text-amber-700">Trang chủ</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-amber-700">Sản phẩm</Link>
          <span>/</span>
          <span className="text-gray-900">Thanh toán</span>
        </nav>

        <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 mb-6">Thanh toán đơn hàng</h1>

        {items.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center max-w-md mx-auto my-8 shadow-sm">
            <span className="text-4xl block mb-3">🛒</span>
            <p className="text-gray-500 text-xs font-medium mb-4">Bạn chưa chọn sản phẩm nào để thanh toán</p>
            <Link
              to="/products"
              className="px-6 py-2.5 bg-amber-600 text-white rounded-2xl text-xs font-bold hover:bg-amber-700 transition-colors inline-block"
            >
              Chọn sản phẩm mua sắm
            </Link>
          </div>
        ) : (
          <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Delivery Form */}
            <div className="lg:col-span-7 space-y-6">
              {/* Shipping Address Box */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
                <h3 className="text-base font-display font-bold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
                  <span>📍</span> Thông tin giao hàng
                </h3>

                {errorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
                    <span>⚠️</span> {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Họ và tên người nhận <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0901234567"
                      className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Địa chỉ nhận hàng chi tiết <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Số nhà, Tên đường, Phường/Xã, Quận/Huyện, TP"
                    className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Ghi chú giao hàng (Tùy chọn)</label>
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ví dụ: Giao vào giờ hành chính, gọi trước khi đến 15 phút"
                    className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
                <h3 className="text-base font-display font-bold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
                  <span>💳</span> Phương thức thanh toán
                </h3>

                <div className="space-y-3">
                  <label
                    className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === 'cod'
                        ? 'border-amber-500 bg-amber-50/50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-lg">💵</span>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">Thanh toán khi nhận hàng (COD)</h4>
                      <p className="text-[11px] text-gray-500">Khách hàng kiểm tra sản phẩm và thanh toán tiền mặt trực tiếp cho nhân viên giao hàng</p>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === 'vnpay'
                        ? 'border-amber-500 bg-amber-50/50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="vnpay"
                      checked={paymentMethod === 'vnpay'}
                      onChange={() => setPaymentMethod('vnpay')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-lg">🏦</span>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">Chuyển khoản Ngân hàng / VNPAY QR</h4>
                      <p className="text-[11px] text-gray-500">Thanh toán tức thì qua mã QR Ngân hàng hoặc thẻ ATM/Visa nội địa</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6 sticky top-24">
                <h3 className="text-base font-display font-bold text-gray-900 pb-3 border-b border-gray-100">
                  Sản phẩm đặt mua ({items.length})
                </h3>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.id || item.product_id} className="flex gap-3 items-center">
                      <img
                        src={item.product?.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc'}
                        alt={item.product?.name}
                        className="w-14 h-14 object-cover rounded-xl bg-gray-50 border border-gray-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-gray-900 truncate">{item.product?.name}</h4>
                        <p className="text-[11px] text-gray-500">Số lượng: {item.quantity}</p>
                      </div>
                      <div className="text-xs font-extrabold text-gray-900 font-display">
                        {formatCurrency(item.subtotal)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-gray-100 space-y-2 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Tạm tính:</span>
                    <span className="font-bold text-gray-900">{formatCurrency(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Phí vận chuyển:</span>
                    <span className="font-bold text-emerald-600">Miễn phí</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between items-center text-emerald-700 bg-emerald-50 p-2 rounded-xl text-xs font-semibold">
                      <span>🏷️ Mã {appliedCoupon.coupon_code}:</span>
                      <span className="font-bold">-{formatCurrency(appliedCoupon.discount_amount)}</span>
                    </div>
                  )}
                </div>

                {/* Coupon Form */}
                <form onSubmit={handleApplyCoupon} className="space-y-1.5 pt-2 border-t border-gray-100">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Mã giảm giá (NOITHAT10)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 uppercase font-semibold"
                    />
                    <button
                      type="submit"
                      disabled={couponLoading || !couponCode.trim()}
                      className="px-3.5 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition-colors disabled:bg-gray-300"
                    >
                      {couponLoading ? '...' : 'Áp dụng'}
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-[11px] text-red-600 font-medium px-1">
                      ⚠️ {couponError}
                    </p>
                  )}
                </form>

                <div className="pt-3 border-t border-gray-100 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-gray-900">Tổng tiền:</span>
                  <span className="text-xl font-extrabold text-amber-800 font-display">
                    {formatCurrency(appliedCoupon ? appliedCoupon.final_total : cartTotal)}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-sm font-bold text-center transition-colors shadow-md active:scale-98 disabled:bg-gray-300"
                >
                  {submitting ? 'Đang tạo đơn hàng...' : 'Xác nhận đặt hàng 🚀'}
                </button>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  )
}

export default CheckoutPage
