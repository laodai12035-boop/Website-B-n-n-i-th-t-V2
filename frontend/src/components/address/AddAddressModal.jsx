import React, { useState } from 'react'
import { useAddress } from '@/contexts/AddressContext'
import FormAlert from '@/components/ui/FormAlert'

const PHONE_REGEX = /^0[0-9]{9}$/

/**
 * AddAddressModal — Modal Thêm địa chỉ mới trực tiếp (Chuẩn MASTER.md).
 * Tích hợp tính năng tự động định vị GPS (Reverse Geocoding).
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

  // GPS Locating state
  const [locating, setLocating] = useState(false)
  const [locationSuccess, setLocationSuccess] = useState(null)

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

  // Tự động định vị vị trí GPS người dùng & quy đổi ra Địa chỉ
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt của bạn không hỗ trợ định vị GPS.')
      return
    }

    setLocating(true)
    setLocationSuccess(null)
    setApiError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=vi`
          )
          const data = await res.json()

          if (data && data.address) {
            const addr = data.address
            const provinceName = addr.city || addr.state || addr.province || 'TP. Hồ Chí Minh'
            const districtName = addr.suburb || addr.district || addr.city_district || addr.county || ''
            const wardName = addr.quarter || addr.suburb || addr.neighbourhood || addr.village || ''

            const road = addr.road || addr.building || addr.amenity || ''
            const houseNumber = addr.house_number ? `Số ${addr.house_number}, ` : ''
            const detail = `${houseNumber}${road}`.trim() || data.display_name?.split(',')[0] || ''

            setFormData((prev) => ({
              ...prev,
              province: provinceName,
              district: districtName,
              ward: wardName,
              detail_address: detail || prev.detail_address,
            }))

            setLocationSuccess(`Định vị vị trí GPS thành công: ${data.display_name}`)
          }
        } catch (err) {
          console.error('Lỗi Reverse Geocoding:', err)
          setApiError('Không thể tự động quy đổi địa chỉ từ tọa độ GPS. Vui lòng tự điền thông tin.')
        } finally {
          setLocating(false)
        }
      },
      (err) => {
        console.warn('Geolocation Error:', err)
        setLocating(false)
        if (err.code === err.PERMISSION_DENIED) {
          setApiError('Bạn đã từ chối quyền truy cập vị trí. Vui lòng cấp quyền trên trình duyệt hoặc tự điền địa chỉ.')
        } else {
          setApiError('Không thể định vị thiết bị. Vui lòng tự nhập địa chỉ giao hàng.')
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans">
      <div className="relative w-full max-w-lg bg-white rounded-none shadow-2xl border border-stone-200/80 overflow-hidden animate-slide-up">

        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
          <h2 className="text-sm font-heading font-bold uppercase tracking-wider">
            THÊM ĐỊA CHỈ GIAO HÀNG MỚI
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-white transition-colors p-1 cursor-pointer font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {apiError && <FormAlert type="error" message={apiError} />}

          {/* Quick Auto GPS Action Banner */}
          <div className="bg-amber-50/80 p-3.5 border border-amber-200 flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-stone-900 uppercase tracking-wider block">
                TỰ ĐỘNG ĐIỀN ĐỊA CHỈ TỪ GPS
              </span>
              <span className="text-[10px] text-stone-500 font-medium block">
                Cho phép truy cập vị trí để tự điền Tỉnh/Thành, Quận/Huyện, Phường/Xã
              </span>
            </div>
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={locating}
              className="px-3.5 py-2 bg-amber-800 hover:bg-stone-900 text-white font-bold text-[11px] uppercase tracking-wider rounded-none transition-colors shrink-0 cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              {locating ? 'ĐANG ĐỊNH VỊ...' : 'ĐỊNH VỊ GPS'}
            </button>
          </div>

          {locationSuccess && (
            <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-medium">
              ✓ {locationSuccess}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Họ tên người nhận */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 uppercase tracking-wider">
                Họ tên người nhận <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="recipient_name"
                value={formData.recipient_name}
                onChange={handleChange}
                placeholder="Nhập họ tên người nhận"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-none text-xs focus:outline-none focus:border-amber-800 focus:bg-white text-stone-900"
              />
              {errors.recipient_name && <p className="text-[11px] text-red-600 font-bold mt-1">{errors.recipient_name}</p>}
            </div>

            {/* Số điện thoại */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 uppercase tracking-wider">
                Số điện thoại <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Ví dụ: 0901234567"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-none text-xs focus:outline-none focus:border-amber-800 focus:bg-white text-stone-900 font-mono"
              />
              {errors.phone && <p className="text-[11px] text-red-600 font-bold mt-1">{errors.phone}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Tỉnh / Thành */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 uppercase tracking-wider">
                Tỉnh / Thành phố <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="province"
                value={formData.province}
                onChange={handleChange}
                placeholder="VD: TP. Hồ Chí Minh"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-none text-xs focus:outline-none focus:border-amber-800 focus:bg-white text-stone-900"
              />
              {errors.province && <p className="text-[11px] text-red-600 font-bold mt-1">{errors.province}</p>}
            </div>

            {/* Quận / Huyện */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 uppercase tracking-wider">
                Quận / Huyện <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="district"
                value={formData.district}
                onChange={handleChange}
                placeholder="VD: Quận 1"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-none text-xs focus:outline-none focus:border-amber-800 focus:bg-white text-stone-900"
              />
              {errors.district && <p className="text-[11px] text-red-600 font-bold mt-1">{errors.district}</p>}
            </div>

            {/* Phường / Xã */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 uppercase tracking-wider">
                Phường / Xã <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="ward"
                value={formData.ward}
                onChange={handleChange}
                placeholder="VD: Phường Bến Nghé"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-none text-xs focus:outline-none focus:border-amber-800 focus:bg-white text-stone-900"
              />
              {errors.ward && <p className="text-[11px] text-red-600 font-bold mt-1">{errors.ward}</p>}
            </div>
          </div>

          {/* Địa chỉ chi tiết */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 uppercase tracking-wider">
              Địa chỉ chi tiết (Số nhà, tên đường...) <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="detail_address"
              value={formData.detail_address}
              onChange={handleChange}
              placeholder="VD: 123 Nguyễn Huệ, Tòa nhà Bitexco"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-none text-xs focus:outline-none focus:border-amber-800 focus:bg-white text-stone-900"
            />
            {errors.detail_address && <p className="text-[11px] text-red-600 font-bold mt-1">{errors.detail_address}</p>}
          </div>

          {/* Checkbox Đặt làm mặc định */}
          <div className="pt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="is_default"
              name="is_default"
              checked={formData.is_default}
              onChange={handleChange}
              className="w-4 h-4 rounded-none text-amber-800 border-stone-300 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="is_default" className="text-xs font-bold text-stone-700 cursor-pointer uppercase tracking-wider">
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
              HỦY BỎ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-stone-900 hover:bg-amber-800 text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'ĐANG LƯU...' : 'LƯU ĐỊA CHỈ'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}

export default AddAddressModal
