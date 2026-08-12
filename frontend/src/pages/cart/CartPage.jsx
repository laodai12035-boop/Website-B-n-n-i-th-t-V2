import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import { useCart } from '@/contexts/CartContext'

/**
 * CartPage — Trang Giỏ hàng đầy đủ.
 */
const CartPage = () => {
  const { items, cartCount, cartTotal, updateQuantity, removeFromCart, clearCart, loading } = useCart()
  const navigate = useNavigate()
  const [stockError, setStockError] = useState({}) // { [productId]: 'Error message' }
  const [couponCode, setCouponCode] = useState('')
  const [couponApplied, setCouponApplied] = useState(false)

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

  const handleApplyCoupon = (e) => {
    e.preventDefault()
    if (!couponCode.trim()) return
    setCouponApplied(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 animate-fade-in">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-6">
          <Link to="/" className="hover:text-amber-700">Trang chủ</Link>
          <span>/</span>
          <span className="text-gray-900">Giỏ hàng của bạn</span>
        </nav>

        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">Giỏ hàng của bạn</h1>
            <p className="text-xs text-gray-500 mt-1">Quản lý và điều chỉnh số lượng sản phẩm trước khi thanh toán</p>
          </div>
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-red-600 hover:text-red-700 font-semibold px-3 py-1.5 rounded-xl border border-red-200 hover:bg-red-50 transition-colors"
            >
              🗑️ Xóa sạch giỏ hàng
            </button>
          )}
        </div>

        {items.length === 0 ? (
          /* Empty Cart State */
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center max-w-lg mx-auto my-8">
            <div className="w-20 h-20 bg-amber-50 text-amber-700 rounded-3xl flex items-center justify-center mx-auto mb-4 text-4xl shadow-inner">
              🛒
            </div>
            <h3 className="text-lg font-display font-bold text-gray-900 mb-2">Giỏ hàng của bạn đang trống</h3>
            <p className="text-xs text-gray-500 mb-6">Hãy khám phá bộ sưu tập nội thất cao cấp và thêm sản phẩm ưng ý vào giỏ hàng ngay!</p>
            <Link
              to="/products"
              className="inline-flex items-center justify-center px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-2xl shadow-sm transition-colors"
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
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-6 transition-all hover:border-amber-200"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Image */}
                    <img
                      src={item.product?.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc'}
                      alt={item.product?.name}
                      className="w-24 h-24 object-cover rounded-2xl bg-gray-50 border border-gray-100 shrink-0"
                    />

                    {/* Content Info */}
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded-full">
                        {item.product?.category || 'Nội thất'}
                      </span>
                      <h3 className="text-base font-display font-bold text-gray-900 mt-1 line-clamp-1">
                        <Link to={`/products/${item.product_id}`} className="hover:text-amber-700 transition-colors">
                          {item.product?.name}
                        </Link>
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Tồn kho còn: <span className="font-semibold text-gray-700">{item.product?.stock ?? 10} sản phẩm</span>
                      </p>

                      <div className="text-sm font-extrabold text-amber-800 mt-2">
                        {formatCurrency(item.price)}
                      </div>
                    </div>

                    {/* Quantity Controls & Line Total */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                        <button
                          type="button"
                          onClick={() => handleDecrease(item)}
                          className="w-8 h-8 rounded-lg bg-white text-gray-700 font-bold hover:bg-gray-200 text-sm flex items-center justify-center transition-colors"
                          title="Giảm số lượng"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleQuantityInputChange(item, e.target.value)}
                          className="w-10 text-center bg-transparent text-xs font-bold text-gray-900 focus:outline-none"
                          min="1"
                          max={item.product?.stock || 99}
                        />
                        <button
                          type="button"
                          onClick={() => handleIncrease(item)}
                          className="w-8 h-8 rounded-lg bg-white text-gray-700 font-bold hover:bg-gray-200 text-sm flex items-center justify-center transition-colors"
                          title="Tăng số lượng"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-gray-400">Thành tiền</div>
                        <div className="text-base font-extrabold text-gray-900 font-display">
                          {formatCurrency(item.subtotal)}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product_id)}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                        title="Xóa khỏi giỏ hàng"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Stock Warning Banner (QTN-02) */}
                  {stockError[item.product_id] && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2 animate-fade-in">
                      <span>⚠️</span>
                      <span>{stockError[item.product_id]}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Right Column: Order Summary Card */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6 sticky top-24">
                <h3 className="text-lg font-display font-bold text-gray-900 pb-3 border-b border-gray-100">
                  Tóm tắt đơn hàng
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Tổng số lượng:</span>
                    <span className="font-bold text-gray-900">{cartCount} sản phẩm</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tạm tính:</span>
                    <span className="font-bold text-gray-900">{formatCurrency(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Phí vận chuyển:</span>
                    <span className="font-bold text-emerald-600">Miễn phí</span>
                  </div>
                  {couponApplied && (
                    <div className="flex justify-between text-emerald-700 bg-emerald-50 p-2 rounded-xl">
                      <span>Mã giảm giá (NOITHAT10):</span>
                      <span className="font-bold">-10%</span>
                    </div>
                  )}
                </div>

                {/* Coupon Form */}
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Mã giảm giá (Ví dụ: NOITHAT10)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-colors"
                  >
                    Áp dụng
                  </button>
                </form>

                <div className="pt-4 border-t border-gray-100 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-gray-900">Tổng thanh toán:</span>
                  <span className="text-xl font-extrabold text-amber-800 font-display">
                    {formatCurrency(couponApplied ? cartTotal * 0.9 : cartTotal)}
                  </span>
                </div>

                <button
                  onClick={() => alert('Chức năng đặt hàng & thanh toán đang được phát triển!')}
                  className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-sm font-bold text-center transition-colors shadow-md active:scale-98"
                >
                  Tiến hành thanh toán 🚀
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default CartPage
