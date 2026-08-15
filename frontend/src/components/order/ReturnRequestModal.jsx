import React, { useState, useRef } from 'react'
import returnService from '@/services/returnService'

/**
 * Modal gửi yêu cầu đổi/trả hàng cho Khách hàng (NT-06-CN-004, QTN-05).
 * Phong cách thiết kế Nhà Xinh: Góc cạnh vuông vức (rounded-none), phông Be Vietnam Pro, màu chủ đạo amber-800 & stone-900.
 * Hỗ trợ tải ảnh minh chứng trực tiếp từ máy tính hoặc dán đường dẫn URL.
 */
const ReturnRequestModal = ({ order, onClose, onSuccess }) => {
  const [requestType, setRequestType] = useState('return')
  const [reason, setReason] = useState('')
  const [proofImageUrl, setProofImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Vui lòng chọn định dạng file hình ảnh (PNG, JPG, WEBP).')
      return
    }

    setErrorMsg('')
    const reader = new FileReader()
    reader.onload = (evt) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        const MAX_SIZE = 800

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width
            width = MAX_SIZE
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height
            height = MAX_SIZE
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75)
        setProofImageUrl(compressedBase64)
      }
      img.onerror = () => {
        setProofImageUrl(evt.target.result)
      }
      img.src = evt.target.result
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setProofImageUrl('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

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
        setErrorMsg('Đơn hàng đã quá thời hạn 30 ngày đổi/trả theo quy định QTN-05.')
      } else {
        setErrorMsg(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-sans">
      <div className="bg-white rounded-none max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div>
            <h3 className="text-sm font-heading font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Gửi Yêu Cầu Đổi / Trả Hàng
            </h3>
            <p className="text-xs text-stone-500 font-mono mt-0.5">
              Đơn hàng: <span className="font-bold text-amber-800">{order?.order_code}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-none bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-900 flex items-center justify-center text-xs transition-colors cursor-pointer border border-stone-200"
          >
            ✕
          </button>
        </div>

        {/* Info Banner QTN-05 */}
        <div className="p-3.5 bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1 rounded-none shadow-2xs">
          <div className="font-bold flex items-center gap-1.5 uppercase tracking-wider">
            <svg className="w-4 h-4 text-amber-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Quy tắc đổi trả QTN-05:
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            Hệ thống hỗ trợ gửi yêu cầu đổi/trả sản phẩm trong vòng <strong className="font-bold text-amber-950">30 ngày</strong> kể từ ngày giao hàng thành công. Sản phẩm cần còn nguyên vẹn tem nhãn và lý do rõ ràng.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-xs text-red-800 font-semibold rounded-none animate-fade-in">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Request Type Selector */}
          <div>
            <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block mb-2">
              Loại yêu cầu <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRequestType('return')}
                className={`p-3 rounded-none border text-xs font-bold text-center transition-all cursor-pointer ${requestType === 'return'
                    ? 'border-amber-800 bg-amber-800 text-white shadow-2xs'
                    : 'border-stone-200 hover:border-stone-400 text-stone-700 bg-white'
                  }`}
              >
                Trả hàng hoàn tiền
              </button>

              <button
                type="button"
                onClick={() => setRequestType('exchange')}
                className={`p-3 rounded-none border text-xs font-bold text-center transition-all cursor-pointer ${requestType === 'exchange'
                    ? 'border-amber-800 bg-amber-800 text-white shadow-2xs'
                    : 'border-stone-200 hover:border-stone-400 text-stone-700 bg-white'
                  }`}
              >
                Đổi sản phẩm
              </button>

              <button
                type="button"
                onClick={() => setRequestType('warranty')}
                className={`p-3 rounded-none border text-xs font-bold text-center transition-all cursor-pointer ${requestType === 'warranty'
                    ? 'border-amber-800 bg-amber-800 text-white shadow-2xs'
                    : 'border-stone-200 hover:border-stone-400 text-stone-700 bg-white'
                  }`}
              >
                Bảo hành lỗi
              </button>
            </div>
          </div>

          {/* Reason Textarea */}
          <div>
            <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block mb-1">
              Lý do chi tiết <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Mô tả cụ thể lý do đổi/trả sản phẩm (ví dụ: Sản phẩm trầy xước góc, sai kích thước, hư hỏng trong quá trình vận chuyển...)"
              className="w-full px-3.5 py-2.5 border border-stone-200 rounded-none text-xs text-stone-900 focus:outline-none focus:border-amber-800 bg-stone-50 focus:bg-white transition-colors"
            />
          </div>

          {/* Proof Image Upload / File Computer Picker */}
          <div>
            <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block mb-1">
              Hình ảnh minh chứng <span className="text-stone-400 font-normal lowercase">(tùy chọn)</span>
            </label>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Image Preview or Upload Button Zone */}
            {proofImageUrl ? (
              <div className="relative p-2 border border-stone-200 bg-stone-50 flex items-center gap-3">
                <img
                  src={proofImageUrl}
                  alt="Ảnh minh chứng"
                  className="w-20 h-20 object-cover border border-stone-300 shadow-2xs bg-white shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-stone-800 truncate">Ảnh minh chứng đã chọn</p>
                  <p className="text-[11px] text-stone-400">Đã sẵn sàng tải lên cùng yêu cầu</p>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="mt-1.5 text-[11px] font-bold text-red-600 hover:text-red-800 hover:underline cursor-pointer"
                  >
                    ✕ Xóa ảnh này
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 px-4 border border-dashed border-stone-300 hover:border-amber-800 bg-stone-50 hover:bg-amber-50/50 text-stone-700 hover:text-amber-900 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4 text-amber-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>Tải ảnh từ máy tính (PNG, JPG, WEBP)</span>
                </button>

                <div className="relative flex items-center justify-center">
                  <span className="bg-white px-2 text-[10px] text-stone-400 font-semibold uppercase">hoặc nhập đường dẫn URL</span>
                  <div className="absolute inset-x-0 h-px bg-stone-200 -z-10" />
                </div>

                <input
                  type="url"
                  value={proofImageUrl}
                  onChange={(e) => setProofImageUrl(e.target.value)}
                  placeholder="https://example.com/anh-minh-chung.jpg"
                  className="w-full px-3.5 py-2 border border-stone-200 rounded-none text-xs text-stone-900 focus:outline-none focus:border-amber-800 bg-stone-50 focus:bg-white transition-colors"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              disabled={loading}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-stone-900 hover:bg-amber-800 text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
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


