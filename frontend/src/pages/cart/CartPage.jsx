import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useCart } from '@/contexts/CartContext'
import couponService from '@/services/couponService'
import CouponSelectorModal from '@/components/checkout/CouponSelectorModal'

/**
 * CartPage — Trang Giỏ hàng đầy đủ phong cách Nhà Xinh (nhaxinh.com).
 * Thiết kế vuông vức góc cạnh (rounded-none), phông chữ Hanken Grotesk & Playfair Display, icon SVG vector chuẩn.
 */
const CartPage = () => {
  const { items, cartCount, cartTotal, updateQuantity, removeFromCart, clearCart, loading } = useCart()
  const navigate = useNavigate()
  const [stockError, setStockError] = useState({})
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false)

  const handleSelectCouponFromModal = async (code) => {
    setCouponCode(code)
    setCouponError('')
    setCouponLoading(true)
    try {
      const result = await couponService.applyCoupon(code, cartTotal)
      setAppliedCoupon(result)
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Không thể áp dụng mã giảm giá này')
      setAppliedCoupon(null)
    } finally {
      setCouponLoading(false)
    }
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)
  }

  const handleIncrease = async (item) => {
    setStockError((prev) => ({ ...prev, [item.product_id]: '' }))
    try {
      await updateQuantity(item.product_id, item.quantity + 1)
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể tăng số lượng sản phẩm'
      setStockError((prev) => ({ ...prev, [item.product_id]: msg }))
    }
  }

  const handleDecrease = async (item) => {
    setStockError((prev) => ({ ...prev, [item.product_id]: '' }))
    if (item.quantity <= 1) {
      await removeFromCart(item.product_id)
      return
    }
    try {
      await updateQuantity(item.product_id, item.quantity - 1)
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể giảm số lượng'
      setStockError((prev) => ({ ...prev, [item.product_id]: msg }))
    }
  }

  const handleQuantityInputChange = async (item, newQtyStr) => {
    const val = parseInt(newQtyStr, 10)
    setStockError((prev) => ({ ...prev, [item.product_id]: '' }))
    if (isNaN(val) || val <= 0) return
    try {
      await updateQuantity(item.product_id, val)
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể cập nhật số lượng'
      setStockError((prev) => ({ ...prev, [item.product_id]: msg }))
    }
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

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponError('')
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 animate-fade-in">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-medium text-stone-500 mb-6">
          <Link to="/" className="hover:text-amber-800 transition-colors">Trang chủ</Link>
          <span>/</span>
          <span className="text-stone-900 font-semibold">Giỏ hàng của bạn</span>
        </nav>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-stone-200/80">
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-stone-900 uppercase tracking-wider">
              GIỎ HÀNG CỦA BẠN
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Quản lý và kiểm tra danh sách các sản phẩm nội thất trước khi thanh toán
            </p>
          </div>
          {items.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="text-xs text-red-600 hover:text-red-700 font-semibold px-4 py-2 rounded-none border border-red-200 hover:bg-red-50 transition-colors cursor-pointer self-start sm:self-auto flex items-center gap-1.5"
            >
              <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Xóa sạch giỏ hàng</span>
            </button>
          )}
        </div>

        {items.length === 0 ? (
          /* Empty Cart State */
          <div className="bg-white rounded-none border border-stone-200/80 shadow-2xs p-12 text-center max-w-lg mx-auto my-12">
            <div className="w-16 h-16 bg-stone-100 text-stone-400 rounded-none flex items-center justify-center mx-auto mb-4 border border-stone-200">
              <svg className="w-8 h-8 stroke-current" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-lg font-heading font-bold text-stone-900 mb-2 uppercase tracking-wider">
              Giỏ hàng của bạn đang trống
            </h3>
            <p className="text-xs text-stone-500 mb-6">
              Hãy khám phá bộ sưu tập nội thất cao cấp và lựa chọn những sản phẩm sang trọng cho không gian sống của bạn.
            </p>
            <Link
              to="/products"
              className="inline-block px-8 py-3.5 bg-stone-900 hover:bg-amber-800 text-white text-xs font-bold uppercase tracking-wider rounded-none shadow-2xs transition-colors"
            >
              Khám phá sản phẩm ngay
            </Link>
          </div>
        ) : (
          /* Main Cart Content Grid */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Cart Items List */}
            <div className="lg:col-span-8 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id || item.product_id}
                  className="bg-white rounded-none border border-stone-200/80 shadow-2xs p-4 sm:p-6 transition-all hover:border-amber-700/60"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    {/* Image (Tỷ lệ 4:5 vuông vức) */}
                    <img
                      src={item.product?.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc'}
                      alt={item.product?.name}
                      className="w-24 h-28 object-cover rounded-none bg-stone-100 border border-stone-200/80 shrink-0"
                    />

                    {/* Content Info */}
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-stone-700 uppercase tracking-widest bg-stone-100 px-2.5 py-0.5 rounded-none border border-stone-200/80 inline-block">
                        {item.product?.category || 'Nội thất'}
                      </span>
                      <h3 className="text-base font-sans font-bold text-stone-900 mt-1.5 line-clamp-1">
                        <Link to={`/products/${item.product_id}`} className="hover:text-amber-800 transition-colors">
                          {item.product?.name}
                        </Link>
                      </h3>
                      <p className="text-xs text-stone-500 mt-1">
                        Tồn kho còn: <span className="font-semibold text-stone-800">{item.product?.stock ?? 10} sản phẩm</span>
                      </p>

                      <div className="text-base font-bold text-amber-800 mt-2">
                        {formatCurrency(item.price)}
                      </div>
                    </div>

                    {/* Quantity Controls & Line Total */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                      <div className="flex items-center border border-stone-300 bg-white">
                        <button
                          type="button"
                          onClick={() => handleDecrease(item)}
                          className="w-8 h-8 text-stone-700 font-bold hover:bg-stone-100 text-sm flex items-center justify-center transition-colors cursor-pointer"
                          title="Giảm số lượng"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleQuantityInputChange(item, e.target.value)}
                          className="w-10 text-center bg-transparent text-xs font-bold text-stone-900 focus:outline-none font-mono"
                          min="1"
                          max={item.product?.stock || 99}
                        />
                        <button
                          type="button"
                          onClick={() => handleIncrease(item)}
                          className="w-8 h-8 text-stone-700 font-bold hover:bg-stone-100 text-sm flex items-center justify-center transition-colors cursor-pointer"
                          title="Tăng số lượng"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="text-[11px] text-stone-400 uppercase tracking-wider">Thành tiền</div>
                        <div className="text-base font-bold text-stone-900">
                          {formatCurrency(item.subtotal)}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product_id)}
                        className="text-stone-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                        title="Xóa khỏi giỏ hàng"
                      >
                        <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Stock Warning Banner */}
                  {stockError[item.product_id] && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-none text-xs text-red-800 font-semibold flex items-center gap-2 animate-fade-in">
                      <svg className="w-4 h-4 text-red-600 fill-current shrink-0" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>{stockError[item.product_id]}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Right Column: Order Summary Card */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-none border border-stone-200/80 shadow-2xs p-6 space-y-6 sticky top-24">
                <h3 className="text-base font-heading font-bold text-stone-900 pb-3 border-b border-stone-200/80 uppercase tracking-wider">
                  TÓM TẮT ĐƠN HÀNG
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Tổng số lượng:</span>
                    <span className="font-bold text-stone-900 font-mono">{cartCount} sản phẩm</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Tạm tính:</span>
                    <span className="font-bold text-stone-900">{formatCurrency(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Phí vận chuyển:</span>
                    <span className="font-bold text-emerald-700">Miễn phí toàn quốc</span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between items-center text-emerald-800 bg-emerald-50 p-3 rounded-none border border-emerald-200 text-xs font-semibold">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-emerald-700 stroke-current" fill="none" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span>Mã {appliedCoupon.coupon_code}:</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">-{formatCurrency(appliedCoupon.discount_amount)}</span>
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="text-stone-400 hover:text-red-600 font-bold p-0.5 cursor-pointer"
                          title="Gỡ mã giảm giá"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Coupon Form */}
                <form onSubmit={handleApplyCoupon} className="space-y-2 pt-2 border-t border-stone-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">Mã giảm giá / Voucher:</span>
                    <button
                      type="button"
                      onClick={() => setIsCouponModalOpen(true)}
                      className="text-[11px] font-semibold text-amber-800 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Kho Voucher</span>
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Mã giảm giá"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 text-xs border border-stone-200 rounded-none focus:outline-none focus:border-amber-800 uppercase font-semibold text-stone-900"
                    />
                    <button
                      type="submit"
                      disabled={couponLoading || !couponCode.trim()}
                      className="px-5 py-2.5 bg-stone-900 hover:bg-amber-800 text-white text-xs font-bold uppercase tracking-wider rounded-none transition-colors disabled:bg-stone-200 disabled:text-stone-400 cursor-pointer"
                    >
                      {couponLoading ? '...' : 'Áp dụng'}
                    </button>
                  </div>

                  {couponError && (
                    <p className="text-[11px] text-red-600 font-semibold px-1 animate-fade-in flex items-center gap-1">
                      <span>⚠️</span> {couponError}
                    </p>
                  )}
                </form>

                {/* Total Price Row */}
                <div className="pt-4 border-t border-stone-200/80 flex justify-between items-baseline">
                  <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">Tổng thanh toán:</span>
                  <span className="text-xl font-bold text-amber-800">
                    {formatCurrency(appliedCoupon ? appliedCoupon.final_total : cartTotal)}
                  </span>
                </div>

                {/* Primary CTA Checkout Button (Nút Solid đen sẫm vuông sắc nét) */}
                <button
                  type="button"
                  onClick={() => navigate('/checkout', { state: { appliedCoupon } })}
                  className="w-full py-4 bg-stone-900 hover:bg-amber-800 text-white rounded-none text-xs font-bold uppercase tracking-wider text-center transition-colors shadow-2xs cursor-pointer block"
                >
                  TIẾN HÀNH THANH TOÁN
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* Modal Chọn Mã Giảm Giá / Voucher Khả Dụng */}
      <CouponSelectorModal
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
        subtotal={cartTotal}
        onSelectCoupon={handleSelectCouponFromModal}
        currentCouponCode={couponCode}
      />
    </div>
  )
}

export default CartPage
