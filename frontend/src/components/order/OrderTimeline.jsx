import React from 'react'

/**
 * OrderTimeline — Component hiển thị tiến trình trạng thái đơn hàng (NT-06-CN-002).
 * Stepper 4 bước: Đã đặt hàng -> Đã xác nhận -> Đang giao hàng -> Đã hoàn thành.
 */
const OrderTimeline = ({ status }) => {
  if (status === 'cancelled') {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-xs font-semibold">
        <span className="text-xl">✖</span>
        <div>
          <div className="font-bold text-sm">Đơn hàng đã bị hủy</div>
          <p className="text-[11px] text-red-600 mt-0.5">Đơn hàng này đã bị hủy. Vui lòng liên hệ bộ phận hỗ trợ nếu có thắc mắc.</p>
        </div>
      </div>
    )
  }

  const steps = [
    { key: 'pending', label: 'Đã đặt hàng', icon: '📝', desc: 'Đã ghi nhận đơn' },
    { key: 'confirmed', label: 'Đã xác nhận', icon: '✓', desc: 'Đang chuẩn bị hàng' },
    { key: 'shipping', label: 'Đang giao hàng', icon: '🚚', desc: 'Đơn đang vận chuyển' },
    { key: 'delivered', label: 'Đã hoàn thành', icon: '🎉', desc: 'Giao hàng thành công' },
  ]

  const statusOrder = ['pending', 'confirmed', 'shipping', 'delivered']
  const currentIndex = statusOrder.indexOf(status)

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-4">
      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
        <span>📍</span> Tiến trình đơn hàng
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentIndex
          const isCurrent = idx === currentIndex
          const isUpcoming = idx > currentIndex

          return (
            <div key={step.key} className="flex flex-col items-center text-center relative z-10 space-y-2">
              {/* Step Icon / Circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all shadow-xs ${
                  isCompleted
                    ? 'bg-emerald-500 text-white border-2 border-emerald-500'
                    : isCurrent
                    ? 'bg-amber-600 text-white border-4 border-amber-200 animate-pulse'
                    : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                }`}
              >
                {isCompleted ? '✓' : step.icon}
              </div>

              {/* Labels */}
              <div>
                <div
                  className={`text-xs font-bold ${
                    isCompleted
                      ? 'text-emerald-700'
                      : isCurrent
                      ? 'text-amber-700'
                      : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">{step.desc}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default OrderTimeline
