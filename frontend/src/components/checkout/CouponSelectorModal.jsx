import React, { useState, useEffect } from 'react'
import couponService from '@/services/couponService'
import FormAlert from '@/components/ui/FormAlert'

/**
 * CouponSelectorModal — Popup chọn Mã Giảm Giá & Voucher Ưu Đãi trực quan (Chuẩn MASTER.md).
 * Thiết kế vuông vức góc cạnh (rounded-none), accent bg-amber-800.
 */
const CouponSelectorModal = ({ isOpen, onClose, subtotal = 0, onSelectCoupon, currentCouponCode = '' }) => {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [manualCode, setManualCode] = useState('')

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '0đ'
    return `${Number(amount).toLocaleString('vi-VN')}đ`
  }

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      setError(null)
      couponService
        .getActiveCoupons()
        .then((data) => {
          setCoupons(data || [])
        })
        .catch(() => {
          setError('Không thể nạp danh sách mã giảm giá.')
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleApply = (code) => {
    if (!code || !code.trim()) return
    onSelectCoupon(code.trim().toUpperCase())
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in font-sans">
      <div className="bg-white rounded-none max-w-lg w-full p-6 shadow-2xl border border-stone-200/80 max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5 text-amber-800 stroke-current" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <div>
              <h2 className="text-base font-heading font-bold text-stone-900 uppercase tracking-wider">
                KHO VOUCHER & MÃ GIẢM GIÁ
              </h2>
              <p className="text-[11px] text-stone-500 font-medium">
                Chọn mã ưu đãi phù hợp nhất với đơn hàng của bạn
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-900 transition-colors p-1 cursor-pointer"
            title="Đóng"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Manual Coupon Input Form */}
        <div className="py-3.5 border-b border-stone-200/80 shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nhập mã giảm giá khác..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              className="flex-1 px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-none text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-amber-800 focus:bg-white outline-none text-stone-900"
            />
            <button
              type="button"
              disabled={!manualCode.trim()}
              onClick={() => handleApply(manualCode)}
              className="px-5 py-2 bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold uppercase tracking-wider rounded-none transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              Áp dụng
            </button>
          </div>
        </div>

        {/* Coupon List Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-1">
          {error && <FormAlert type="error" message={error} />}

          {loading ? (
            <div className="py-12 text-center text-stone-400 text-xs">
              <div className="w-6 h-6 border-2 border-amber-800 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Đang tải danh sách voucher ưu đãi...
            </div>
          ) : coupons.length === 0 ? (
            <div className="py-12 text-center text-stone-400 border border-dashed border-stone-200 rounded-none bg-stone-50 text-xs">
              Hiện chưa có mã giảm giá công khai nào khả dụng.
            </div>
          ) : (
            coupons.map((c) => {
              const minVal = Number(c.min_order_value || 0)
              const isEligible = subtotal >= minVal
              const isCurrent = currentCouponCode.toUpperCase() === c.code.toUpperCase()
              const neededAmount = minVal - subtotal

              return (
                <div
                  key={c.id || c.code}
                  className={`p-4 rounded-none border transition-all flex flex-col justify-between gap-3 relative overflow-hidden ${
                    isCurrent
                      ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-800/40 shadow-2xs'
                      : isEligible
                      ? 'bg-white hover:bg-stone-50 border-stone-200/80 shadow-2xs'
                      : 'bg-stone-50/70 border-stone-200 opacity-75'
                  }`}
                >
                  {/* Decorative Ticket Left Bar */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-2 ${
                      isEligible ? 'bg-amber-800' : 'bg-stone-300'
                    }`}
                  />

                  <div className="pl-2 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-200/80 rounded-none text-xs font-mono font-bold tracking-wider">
                          {c.code}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-emerald-700 text-white rounded-none text-[10px] font-bold">
                            Đang dùng
                          </span>
                        )}
                        {isEligible && !isCurrent && (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-none text-[10px] font-bold">
                            ✓ Đủ điều kiện
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-bold text-stone-900 pt-0.5">
                        {c.description || (c.discount_type === 'percent' ? `Giảm ${c.discount_value}% cho đơn hàng` : `Giảm trực tiếp ${formatCurrency(c.discount_value)}`)}
                      </p>

                      <div className="text-[11px] text-stone-500 space-y-0.5">
                        <p>
                          • Đơn tối thiểu: <strong className="text-stone-800">{formatCurrency(minVal)}</strong>
                        </p>
                        {c.discount_type === 'percent' && c.max_discount && (
                          <p>
                            • Giảm tối đa: <strong className="text-stone-800">{formatCurrency(c.max_discount)}</strong>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="shrink-0 flex flex-col items-end justify-center">
                      <button
                        type="button"
                        disabled={!isEligible}
                        onClick={() => handleApply(c.code)}
                        className={`px-4 py-2 rounded-none text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-2xs ${
                          isCurrent
                            ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                            : isEligible
                            ? 'bg-amber-800 hover:bg-amber-900 text-white'
                            : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                        }`}
                      >
                        {isCurrent ? 'Đã áp dụng' : isEligible ? 'Áp Dụng' : 'Chưa đủ ĐK'}
                      </button>
                    </div>
                  </div>

                  {/* Progress info if not eligible */}
                  {!isEligible && (
                    <div className="pl-2 pt-2 border-t border-stone-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-amber-800 font-medium">
                        💡 Mua thêm <strong className="font-bold">{formatCurrency(neededAmount)}</strong> để áp dụng mã này
                      </span>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-stone-200/80 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

export default CouponSelectorModal
