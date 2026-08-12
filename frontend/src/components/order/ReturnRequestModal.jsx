import React, { useState } from 'react'
import returnService from '@/services/returnService'

/**
 * Modal gửi yêu cầu đổi/trả hàng cho Khách hàng (NT-06-CN-004, QTN-05).
 */
const ReturnRequestModal = ({ order, onClose, onSuccess }) => {
  const [requestType, setRequestType] = useState('return')
  const [reason, setReason] = useState('')
  const [proofImageUrl, setProofImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!reason.trim()) {
      setErrorMsg('Vui lòng nhập lý do đổi/trả sản phẩm.')
      return
    }

    setLoading(true)
    setErrorMsg('')

    try {
      const res = await returnService.createReturnRequest({
        order_id: order.id,
        request_type: requestType,
        reason: reason.trim(),
        proof_image_url: proofImageUrl.trim() || undefined,
      })

      if (onSuccess) {
        onSuccess(res.data)
      }
      onClose()
    } catch (err) {
      const code = err.response?.data?.code
      const msg = err.response?.data?.message || 'Không thể gửi yêu cầu đổi/trả. Vui lòng thử lại.'
      if (code === 'EXPIRED_RETURN_PERIOD') {
        setErrorMsg('⚠️ Đơn hàng đã quá thời hạn 30 ngày đổi/trả theo quy định QTN-05.')
      } else {
        setErrorMsg(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span>🔄</span> Gửi yêu cầu đổi / trả hàng
            </h3>
            <p className="text-xs text-gray-500 font-mono mt-0.5">
              Đơn hàng: <span className="font-bold text-gray-800">{order?.order_code}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center text-xs transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Info Banner QTN-05 */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <span>📋</span> Quy tắc đổi trả QTN-05:
          </div>
          <p className="text-[11px] text-amber-700">
            Hệ thống hỗ trợ gửi yêu cầu đổi/trả sản phẩm trong vòng <strong className="font-extrabold">30 ngày</strong> kể từ ngày giao hàng thành công. Sản phẩm cần còn nguyên vẹn tem nhãn và lý do rõ ràng.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-semibold animate-fade-in">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Request Type */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">
              Loại yêu cầu <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRequestType('return')}
                className={`p-3 rounded-2xl border text-xs font-bold text-center transition-all ${
                  requestType === 'return'
                    ? 'border-amber-600 bg-amber-50 text-amber-900 shadow-xs'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600 bg-white'
                }`}
              >
                <div className="text-base mb-1">🔄</div>
                Trả hàng hoàn tiền
              </button>

              <button
                type="button"
                onClick={() => setRequestType('exchange')}
                className={`p-3 rounded-2xl border text-xs font-bold text-center transition-all ${
                  requestType === 'exchange'
                    ? 'border-amber-600 bg-amber-50 text-amber-900 shadow-xs'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600 bg-white'
                }`}
              >
                <div className="text-base mb-1">🔀</div>
                Đổi sản phẩm
              </button>

              <button
                type="button"
                onClick={() => setRequestType('warranty')}
                className={`p-3 rounded-2xl border text-xs font-bold text-center transition-all ${
                  requestType === 'warranty'
                    ? 'border-amber-600 bg-amber-50 text-amber-900 shadow-xs'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600 bg-white'
                }`}
              >
                <div className="text-base mb-1">🛠️</div>
                Bảo hành lỗi
              </button>
            </div>
          </div>

          {/* Reason Textarea */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              Lý do chi tiết <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Mô tả cụ thể lý do đổi/trả sản phẩm (ví dụ: Sản phẩm trầy xước góc, sai kích thước, hư hỏng trong quá trình vận chuyển...)"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-2xl text-xs focus:outline-none focus:border-amber-500 bg-white"
            />
          </div>

          {/* Proof Image URL */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              Đường dẫn hình ảnh minh chứng <span className="text-gray-400 font-normal">(Tùy chọn)</span>
            </label>
            <input
              type="url"
              value={proofImageUrl}
              onChange={(e) => setProofImageUrl(e.target.value)}
              placeholder="https://example.com/anh-minh-chung.jpg"
              className="w-full px-3.5 py-2 border border-gray-200 rounded-2xl text-xs focus:outline-none focus:border-amber-500 bg-white"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors"
              disabled={loading}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang gửi yêu cầu...</span>
                </>
              ) : (
                <span>Gửi yêu cầu đổi/trả →</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ReturnRequestModal
