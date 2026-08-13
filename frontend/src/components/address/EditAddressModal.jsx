import React, { useState, useEffect } from 'react'
import { useAddress } from '@/contexts/AddressContext'
import FormAlert from '@/components/ui/FormAlert'

const PHONE_REGEX = /^0[0-9]{9}$/

const EditAddressModal = ({ isOpen, onClose, addressItem, onSuccess }) => {
  const { updateAddress } = useAddress()

  const [formData, setFormData] = useState({
    recipient_name: '',
    phone: '',
    province: '',
    district: '',
    ward: '',
    detail_address: '',
    is_default: false,
  })

  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (addressItem) {
      setFormData({
        recipient_name: addressItem.recipient_name || '',
        phone: addressItem.phone || '',
        province: addressItem.province || '',
        district: addressItem.district || '',
        ward: addressItem.ward || '',
        detail_address: addressItem.detail_address || '',
        is_default: addressItem.is_default || false,
      })
      setErrors({})
      setApiError(null)
    }
  }, [addressItem, isOpen])

  if (!isOpen || !addressItem) return null

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
    if (!formData.province || !formData.province.trim()) {
      errs.province = 'Tỉnh / Thành phố là bắt buộc'
    }
    if (!formData.district || !formData.district.trim()) {
      errs.district = 'Quận / Huyện là bắt buộc'
    }
    if (!formData.ward || !formData.ward.trim()) {
      errs.ward = 'Phường / Xã là bắt buộc'
    }
    if (!formData.detail_address || !formData.detail_address.trim()) {
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
      await updateAddress(addressItem.id, formData)
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Không thể cập nhật thông tin địa chỉ.'
      setApiError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-display font-bold text-gray-900 flex items-center gap-2">
            <span>✏️</span> Cập nhật địa chỉ giao hàng
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-200/60 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {apiError && <FormAlert type="error" message={apiError} />}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Họ tên người nhận */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Họ tên người nhận <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="recipient_name"
                value={formData.recipient_name}
                onChange={handleChange}
                placeholder="Nhập họ tên người nhận"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
              />
              {errors.recipient_name && <p className="text-[11px] text-red-500 font-medium mt-1">{errors.recipient_name}</p>}
            </div>

            {/* Số điện thoại */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Ví dụ: 0901234567"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
              />
              {errors.phone && <p className="text-[11px] text-red-500 font-medium mt-1">{errors.phone}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Tỉnh / Thành */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Tỉnh / Thành phố <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="province"
                value={formData.province}
                onChange={handleChange}
                placeholder="VD: TP. Hồ Chí Minh"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-white"
              />
              {errors.province && <p className="text-[11px] text-red-500 font-medium mt-1">{errors.province}</p>}
            </div>

            {/* Quận / Huyện */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Quận / Huyện <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="district"
                value={formData.district}
                onChange={handleChange}
                placeholder="VD: Quận 1"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-white"
              />
              {errors.district && <p className="text-[11px] text-red-500 font-medium mt-1">{errors.district}</p>}
            </div>

            {/* Phường / Xã */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Phường / Xã <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="ward"
                value={formData.ward}
                onChange={handleChange}
                placeholder="VD: Phường Bến Nghé"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-white"
              />
              {errors.ward && <p className="text-[11px] text-red-500 font-medium mt-1">{errors.ward}</p>}
            </div>
          </div>

          {/* Địa chỉ chi tiết */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Địa chỉ chi tiết (Số nhà, tên đường...) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="detail_address"
              value={formData.detail_address}
              onChange={handleChange}
              placeholder="VD: 123 Nguyễn Huệ, Tòa nhà Bitexco"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-white"
            />
            {errors.detail_address && <p className="text-[11px] text-red-500 font-medium mt-1">{errors.detail_address}</p>}
          </div>

          {/* Checkbox Đặt làm mặc định */}
          <div className="pt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="edit_is_default"
              name="is_default"
              checked={formData.is_default}
              onChange={handleChange}
              className="w-4 h-4 rounded text-amber-600 border-gray-300 focus:ring-amber-500 cursor-pointer"
            />
            <label htmlFor="edit_is_default" className="text-xs font-semibold text-gray-700 cursor-pointer">
              Đặt làm địa chỉ giao hàng mặc định
            </label>
          </div>

          {/* Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}

export default EditAddressModal
