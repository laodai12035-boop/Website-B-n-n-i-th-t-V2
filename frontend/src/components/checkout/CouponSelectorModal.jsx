import React, { useState, useEffect } from 'react'
import couponService from '@/services/couponService'
import FormAlert from '@/components/ui/FormAlert'

/**
 * CouponSelectorModal — Popup chọn Mã Giảm Giá & Voucher Ưu Đãi trực quan (QTN-01).
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎟️</span>
            <div>
              <h2 className="text-base font-display font-extrabold text-gray-900">
                Kho Voucher & Mã Giảm Giá
              </h2>
              <p className="text-[11px] text-gray-500 font-medium">
                Chọn 1 mã ưu đãi phù hợp với đơn hàng của bạn
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Manual Coupon Input Form */}
        <div className="py-3.5 border-b border-gray-100 shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nhập mã giảm giá khác..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              className="flex-1 px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-amber-500 focus:bg-white outline-none"
            />
            <button
              type="button"
              disabled={!manualCode.trim()}
              onClick={() => handleApply(manualCode)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              Áp dụng
            </button>
          </div>
        </div>

        {/* Coupon List Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-1">
          {error && <FormAlert type="error" message={error} />}

          {loading ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Đang tải danh sách voucher ưu đãi...
            </div>
          ) : coupons.length === 0 ? (
            <div className="py-12 text-center text-gray-400 border border-dashed border-gray-200 rounded-2xl bg-gray-50">
              Hiện chưa có mã giảm giá công khai nào khả dụng
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
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 relative overflow-hidden ${
                    isCurrent
                      ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/50 shadow-xs'
                      : isEligible
                      ? 'bg-white hover:bg-amber-50/40 border-gray-200 hover:border-amber-200 shadow-2xs'
                      : 'bg-gray-50/60 border-gray-200 opacity-75'
                  }`}
                >
                  {/* Decorative Ticket Left Bar */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-2 ${
                      isEligible ? 'bg-amber-500' : 'bg-gray-300'
                    }`}
                  />

                  <div className="pl-2 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-mono font-extrabold tracking-wider">
                          {c.code}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-emerald-500 text-white rounded-full text-[10px] font-bold">
                            Đang dùng
                          </span>
                        )}
                        {isEligible && !isCurrent && (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                            ✓ Đủ điều kiện
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-bold text-gray-900 pt-0.5">
                        {c.description || (c.discount_type === 'percent' ? `Giảm ${c.discount_value}% cho đơn hàng` : `Giảm trực tiếp ${formatCurrency(c.discount_value)}`)}
                      </p>

                      <div className="text-[11px] text-gray-500 space-y-0.5">
                        <p>
                          • Đơn tối thiểu: <strong className="text-gray-800">{formatCurrency(minVal)}</strong>
                        </p>
                        {c.discount_type === 'percent' && c.max_discount && (
                          <p>
                            • Giảm tối đa: <strong className="text-gray-800">{formatCurrency(c.max_discount)}</strong>
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
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                          isCurrent
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : isEligible
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {isCurrent ? 'Đã áp dụng' : isEligible ? 'Áp Dụng' : 'Chưa đủ ĐK'}
                      </button>
                    </div>
                  </div>

                  {/* Progress info if not eligible */}
                  {!isEligible && (
                    <div className="pl-2 pt-2 border-t border-gray-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-amber-700 font-medium">
                        💡 Mua thêm <strong className="font-extrabold">{formatCurrency(neededAmount)}</strong> để dùng mã này
                      </span>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

export default CouponSelectorModal
