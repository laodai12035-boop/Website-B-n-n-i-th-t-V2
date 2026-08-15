import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '@/contexts/CartContext'

/**
 * CartDrawer — Panel Giỏ hàng trượt ra từ lề phải chuẩn phong cách Nhà Xinh (nhaxinh.com).
 * Thiết kế tối giản, góc cạnh vuông vức (rounded-none), SVG vector icons sắc nét.
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
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in font-sans">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col rounded-none border-l border-stone-200">
          
          {/* Header */}
          <div className="p-5 border-b border-stone-200/80 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2.5">
              <svg className="w-5 h-5 text-stone-900 stroke-current" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <h2 className="text-base font-heading font-bold text-stone-900 uppercase tracking-wider">
                GIỎ HÀNG CỦA BẠN
              </h2>
              <span className="bg-amber-800 text-white text-[11px] font-bold px-2 py-0.5 rounded-none">
                {cartCount}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsCartOpen(false)}
              className="p-1 text-stone-400 hover:text-stone-900 transition-colors cursor-pointer"
              title="Đóng giỏ hàng"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Stock Error Banner */}
          {errorMsg && (
            <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 text-xs text-red-800 font-semibold flex items-center gap-2">
              <svg className="w-4 h-4 text-red-600 fill-current shrink-0" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="flex-1">{errorMsg}</span>
            </div>
          )}

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-20 px-4 space-y-4">
                <div className="w-16 h-16 bg-stone-100 text-stone-400 rounded-none flex items-center justify-center mx-auto border border-stone-200">
                  <svg className="w-8 h-8 stroke-current" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <p className="text-sm text-stone-500 font-medium">Giỏ hàng của bạn hiện đang trống.</p>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-3 bg-stone-900 text-white rounded-none text-xs font-bold uppercase tracking-wider hover:bg-amber-800 transition-colors cursor-pointer"
                >
                  Khám phá sản phẩm ngay
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id || item.product_id}
                  className="flex gap-4 p-3.5 rounded-none border border-stone-200/80 bg-white hover:border-amber-700/60 transition-all shadow-2xs"
                >
                  {/* Thumbnail (Tỷ lệ 4:5 vuông vức) */}
                  <img
                    src={item.product?.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=300&q=80'}
                    alt={item.product?.name}
                    className="w-16 h-20 object-cover rounded-none bg-stone-100 border border-stone-200/60 shrink-0"
                  />

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-xs font-bold text-stone-900 line-clamp-1 leading-snug">
                          {item.product?.name}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product_id)}
                          className="text-stone-400 hover:text-red-600 transition-colors p-0.5 cursor-pointer shrink-0"
                          title="Xóa sản phẩm"
                        >
                          <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-xs text-amber-800 font-bold mt-1">
                        {formatPrice(item.price || item.product?.price)}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100">
                      <div className="flex items-center border border-stone-300 bg-white">
                        <button
                          type="button"
                          onClick={() => handleDecrease(item)}
                          className="w-6 h-6 text-stone-700 text-xs font-bold flex items-center justify-center hover:bg-stone-100 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold w-6 text-center font-mono">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleIncrease(item)}
                          className="w-6 h-6 text-stone-700 text-xs font-bold flex items-center justify-center hover:bg-stone-100 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-xs text-stone-400 font-medium">
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
            <div className="p-5 border-t border-stone-200/80 bg-stone-50 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-500 uppercase tracking-wider font-semibold">Tạm tính:</span>
                <span className="text-lg font-bold text-amber-800">{formatPrice(cartTotal)}</span>
              </div>

              <div className="space-y-2">
                <Link
                  to="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full py-3.5 bg-stone-900 hover:bg-amber-800 text-white text-xs font-bold uppercase tracking-wider text-center block transition-colors cursor-pointer shadow-2xs"
                >
                  TIẾN HÀNH THANH TOÁN
                </Link>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/cart"
                    onClick={() => setIsCartOpen(false)}
                    className="py-2.5 border border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white text-xs font-bold uppercase tracking-wider text-center block transition-colors cursor-pointer"
                  >
                    Xem giỏ hàng
                  </Link>

                  <button
                    type="button"
                    onClick={clearCart}
                    className="py-2.5 border border-stone-300 text-stone-600 hover:bg-stone-200 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Xóa toàn bộ
                  </button>
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
