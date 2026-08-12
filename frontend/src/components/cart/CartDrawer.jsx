import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '@/contexts/CartContext'

/**
 * CartDrawer — Panel Giỏ hàng trượt ra từ lề phải (Slide-over Cart Drawer).
 */
const CartDrawer = () => {
  const { isCartOpen, setIsCartOpen, items, cartCount, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart()
  const [errorMsg, setErrorMsg] = useState('')

  if (!isCartOpen) return null

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0)
  }

  const handleIncrease = async (item) => {
    setErrorMsg('')
    try {
      await updateQuantity(item.product_id, item.quantity + 1)
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể tăng số lượng sản phẩm'
      setErrorMsg(msg)
      setTimeout(() => setErrorMsg(''), 4000)
    }
  }

  const handleDecrease = async (item) => {
    setErrorMsg('')
    if (item.quantity <= 1) {
      await removeFromCart(item.product_id)
      return
    }
    try {
      await updateQuantity(item.product_id, item.quantity - 1)
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể giảm số lượng'
      setErrorMsg(msg)
      setTimeout(() => setErrorMsg(''), 4000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛒</span>
              <h2 className="text-lg font-display font-bold text-gray-900">Giỏ hàng của bạn</h2>
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                {cartCount} sản phẩm
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* QTN-02 Stock Error Banner */}
          {errorMsg && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
              <span>⚠️</span>
              <span className="flex-1">{errorMsg}</span>
            </div>
          )}

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-16">
                <span className="text-5xl block mb-4">🛒</span>
                <p className="text-gray-500 font-medium mb-4">Giỏ hàng của bạn đang trống</p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-2.5 bg-gray-900 text-white rounded-full text-xs font-semibold hover:bg-amber-600 transition-colors"
                >
                  Khám phá sản phẩm ngay
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id || item.product_id}
                  className="flex gap-4 p-4 rounded-2xl border border-gray-100 bg-white hover:border-amber-200 transition-all shadow-sm"
                >
                  {/* Thumbnail */}
                  <img
                    src={item.product?.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=300&q=80'}
                    alt={item.product?.name}
                    className="w-20 h-20 object-cover rounded-xl bg-gray-50"
                  />

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-bold text-gray-900 line-clamp-1">{item.product?.name}</h4>
                        <button
                          onClick={() => removeFromCart(item.product_id)}
                          className="text-gray-400 hover:text-red-500 text-xs transition-colors p-1"
                          title="Xóa sản phẩm"
                        >
                          🗑️
                        </button>
                      </div>
                      <p className="text-xs text-amber-700 font-extrabold mt-1">{formatPrice(item.price || item.product?.price)}</p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                        <button
                          onClick={() => handleDecrease(item)}
                          className="w-6 h-6 rounded-md bg-white text-gray-700 text-xs font-bold flex items-center justify-center hover:bg-gray-200"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => handleIncrease(item)}
                          className="w-6 h-6 rounded-md bg-white text-gray-700 text-xs font-bold flex items-center justify-center hover:bg-gray-200"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatPrice((item.price || item.product?.price || 0) * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary */}
          {items.length > 0 && (
            <div className="p-6 border-t border-gray-100 bg-gray-50/50 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Tạm tính:</span>
                <span className="text-lg font-extrabold text-amber-800 font-display">{formatPrice(cartTotal)}</span>
              </div>

              <div className="flex flex-col gap-2">
                <Link
                  to="/cart"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl text-xs font-bold text-center transition-colors shadow-sm"
                >
                  Xem giỏ hàng đầy đủ 📋
                </Link>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={clearCart}
                    className="px-3 py-2.5 border border-gray-200 rounded-2xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Xóa toàn bộ
                  </button>
                  <Link
                    to="/checkout"
                    onClick={() => setIsCartOpen(false)}
                    className="px-3 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold text-center transition-colors shadow-sm"
                  >
                    Thanh toán
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CartDrawer
