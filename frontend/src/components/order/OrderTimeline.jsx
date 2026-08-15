import React from 'react'

/**
 * OrderTimeline — Component hiển thị tiến trình trạng thái đơn hàng (Chuẩn MASTER.md).
 * Stepper 4 bước: Đã đặt hàng -> Đã xác nhận -> Đang giao hàng -> Đã hoàn thành (Góc vuông sắc nét rounded-none).
 */
const OrderTimeline = ({ status }) => {
  if (status === 'cancelled') {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-none flex items-center gap-3 text-red-800 text-xs font-semibold">
        <svg className="w-5 h-5 text-red-600 fill-current shrink-0" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <div>
          <div className="font-bold text-xs uppercase tracking-wider">Đơn hàng đã bị hủy</div>
          <p className="text-[11px] text-red-600 mt-0.5">Đơn hàng này đã bị hủy. Vui lòng liên hệ bộ phận hỗ trợ khách hàng nếu bạn có thắc mắc.</p>
        </div>
      </div>
    )
  }

  const steps = [
    { key: 'pending', label: 'Đã đặt hàng', desc: 'Đã ghi nhận đơn' },
    { key: 'confirmed', label: 'Đã xác nhận', desc: 'Đang chuẩn bị hàng' },
    { key: 'shipping', label: 'Đang giao hàng', desc: 'Đơn đang vận chuyển' },
    { key: 'delivered', label: 'Hoàn thành', desc: 'Giao hàng thành công' },
  ]

  const statusOrder = ['pending', 'confirmed', 'shipping', 'delivered']
  const currentIndex = statusOrder.indexOf(status)

  return (
    <div className="bg-white rounded-none border border-stone-200/80 p-6 shadow-2xs space-y-5">
      <h3 className="text-xs font-heading font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2 border-b border-stone-200/80 pb-3">
        <svg className="w-4 h-4 text-amber-800 stroke-current" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        </svg>
        <span>TIẾN TRÌNH ĐƠN HÀNG</span>
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentIndex
          const isCurrent = idx === currentIndex

          return (
            <div key={step.key} className="flex flex-col items-center text-center relative z-10 space-y-2">
              {/* Step Icon / Circle */}
              <div
                className={`w-9 h-9 rounded-none flex items-center justify-center text-xs font-bold transition-all shadow-2xs ${
                  isCompleted
                    ? 'bg-emerald-700 text-white border border-emerald-700'
                    : isCurrent
                    ? 'bg-amber-800 text-white border-2 border-amber-900 shadow-sm'
                    : 'bg-stone-100 text-stone-400 border border-stone-200'
                }`}
              >
                {isCompleted ? '✓' : idx + 1}
              </div>

              {/* Labels */}
              <div>
                <div
                  className={`text-xs font-bold uppercase tracking-wider ${
                    isCompleted
                      ? 'text-emerald-800'
                      : isCurrent
                      ? 'text-amber-800'
                      : 'text-stone-400'
                  }`}
                >
                  {step.label}
                </div>
                <p className="text-[10px] text-stone-500 mt-0.5">{step.desc}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default OrderTimeline
