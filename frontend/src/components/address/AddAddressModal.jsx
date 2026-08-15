import React, { useState } from 'react'
import { useAddress } from '@/contexts/AddressContext'
import FormAlert from '@/components/ui/FormAlert'

const PHONE_REGEX = /^0[0-9]{9}$/

/**
 * AddAddressModal — Modal Thêm địa chỉ mới trực tiếp (Chuẩn MASTER.md).
 * Thiết kế vuông vức góc cạnh (rounded-none), accent bg-amber-800.
 */
const AddAddressModal = ({ isOpen, onClose, onSuccess }) => {
  const { addAddress } = useAddress()

  const [formData, setFormData] = useState({
    recipient_name: '',
    phone: '',
    province: 'TP. Hồ Chí Minh',
    district: '',
    ward: '',
    detail_address: '',
    is_default: false,
  })

  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const validate = () => {
    const errs = {}
    if (!formData.recipient_name || !formData.recipient_name.trim()) {
      errs.recipient_name = 'Họ tên người nhận là bắt buộc'
    }
    if (!formData.phone || !formData.phone.trim()) {
      errs.phone = 'Số điện thoại là bắt buộc'
    } else if (!PHONE_REGEX.test(formData.phone.trim())) {
      errs.phone = 'Số điện thoại không hợp lệ (phải có 10 chữ số, bắt đầu bằng 0)'
    }
    if (!formData.province.trim()) {
      errs.province = 'Tỉnh / Thành phố là bắt buộc'
    }
    if (!formData.district.trim()) {
      errs.district = 'Quận / Huyện là bắt buộc'
    }
    if (!formData.ward.trim()) {
      errs.ward = 'Phường / Xã là bắt buộc'
    }
    if (!formData.detail_address.trim()) {
      errs.detail_address = 'Địa chỉ chi tiết là bắt buộc'
    }
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError(null)

    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setSubmitting(true)
    try {
      await addAddress(formData)
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Không thể thêm địa chỉ giao hàng mới.'
      setApiError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans">
      <div className="relative w-full max-w-lg bg-white rounded-none shadow-2xl border border-stone-200/80 overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="px-6 py-4 bg-stone-50 border-b border-stone-200/80 flex items-center justify-between">
          <h2 className="text-sm font-heading font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
            THÊM ĐỊA CHỈ GIAO HÀNG MỚI
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-900 transition-colors p-1 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {apiError && <FormAlert type="error" message={apiError} />}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Họ tên người nhận */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1 uppercase tracking-wider">
                Họ tên người nhận <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="recipient_name"
                value={formData.recipient_name}
                onChange={handleChange}
                placeholder="Nhập họ tên người nhận"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-none text-xs focus:outline-none focus:border-amber-800 focus:bg-white text-stone-900"
              />
              {errors.recipient_name && <p className="text-[11px] text-red-600 font-medium mt-1">{errors.recipient_name}</p>}
            </div>

            {/* Số điện thoại */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1 uppercase tracking-wider">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Ví dụ: 0901234567"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-none text-xs focus:outline-none focus:border-amber-800 focus:bg-white text-stone-900"
              />
              {errors.phone && <p className="text-[11px] text-red-600 font-medium mt-1">{errors.phone}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Tỉnh / Thành */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1 uppercase tracking-wider">
                Tỉnh / Thành phố <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="province"
                value={formData.province}
                onChange={handleChange}
                placeholder="VD: TP. Hồ Chí Minh"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-none text-xs focus:outline-none focus:border-amber-800 focus:bg-white text-stone-900"
              />
              {errors.province && <p className="text-[11px] text-red-600 font-medium mt-1">{errors.province}</p>}
            </div>

            {/* Quận / Huyện */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1 uppercase tracking-wider">
                Quận / Huyện <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="district"
                value={formData.district}
                onChange={handleChange}
                placeholder="VD: Quận 1"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-none text-xs focus:outline-none focus:border-amber-800 focus:bg-white text-stone-900"
              />
              {errors.district && <p className="text-[11px] text-red-600 font-medium mt-1">{errors.district}</p>}
            </div>

            {/* Phường / Xã */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1 uppercase tracking-wider">
                Phường / Xã <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="ward"
                value={formData.ward}
                onChange={handleChange}
                placeholder="VD: Phường Bến Nghé"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-none text-xs focus:outline-none focus:border-amber-800 focus:bg-white text-stone-900"
              />
              {errors.ward && <p className="text-[11px] text-red-600 font-medium mt-1">{errors.ward}</p>}
            </div>
          </div>

          {/* Địa chỉ chi tiết */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1 uppercase tracking-wider">
              Địa chỉ chi tiết (Số nhà, tên đường...) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="detail_address"
              value={formData.detail_address}
              onChange={handleChange}
              placeholder="VD: 123 Nguyễn Huệ, Tòa nhà Bitexco"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-none text-xs focus:outline-none focus:border-amber-800 focus:bg-white text-stone-900"
            />
            {errors.detail_address && <p className="text-[11px] text-red-600 font-medium mt-1">{errors.detail_address}</p>}
          </div>

          {/* Checkbox Đặt làm mặc định */}
          <div className="pt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="is_default"
              name="is_default"
              checked={formData.is_default}
              onChange={handleChange}
              className="w-4 h-4 rounded-none text-amber-800 border-stone-300 focus:ring-amber-800 cursor-pointer"
            />
            <label htmlFor="is_default" className="text-xs font-semibold text-stone-700 cursor-pointer">
              Đặt làm địa chỉ giao hàng mặc định
            </label>
          </div>

          {/* Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-200/80">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Đang lưu...' : 'LƯU ĐỊA CHỈ'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}

export default AddAddressModal
