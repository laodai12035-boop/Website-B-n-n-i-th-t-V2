import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import couponService from '@/services/couponService'
import FormAlert from '@/components/ui/FormAlert'

/**
 * AdminCouponsPage — Trang Quản lý Mã giảm giá Khuyến mãi dành cho Admin (nhaxinh.com style).
 * Góc cạnh vuông vức (rounded-none), KHÔNG SỬ DỤNG ICON.
 */
const AdminCouponsPage = () => {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null) // null = Create, object = Edit
  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState(null)

  // Form Data
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percent',
    discount_value: '',
    min_order_value: 0,
    max_discount: '',
    usage_limit: '',
    start_date: '',
    end_date: '',
    is_active: true,
  })

  const fetchCoupons = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await couponService.getAllCoupons()
      setCoupons(data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể nạp danh sách mã giảm giá.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCoupons()
  }, [])

  const handleOpenModal = (coupon = null) => {
    setEditingCoupon(coupon)
    setModalError(null)

    if (coupon) {
      setFormData({
        code: coupon.code || '',
        description: coupon.description || '',
        discount_type: coupon.discount_type || 'percent',
        discount_value: coupon.discount_value || '',
        min_order_value: coupon.min_order_value || 0,
        max_discount: coupon.max_discount || '',
        usage_limit: coupon.usage_limit || '',
        start_date: coupon.start_date ? new Date(coupon.start_date).toISOString().slice(0, 16) : '',
        end_date: coupon.end_date ? new Date(coupon.end_date).toISOString().slice(0, 16) : '',
        is_active: coupon.is_active !== undefined ? coupon.is_active : true,
      })
    } else {
      setFormData({
        code: '',
        description: '',
        discount_type: 'percent',
        discount_value: '',
        min_order_value: 0,
        max_discount: '',
        usage_limit: '',
        start_date: '',
        end_date: '',
        is_active: true,
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCoupon(null)
    setModalError(null)
  }

  const handleSubmitForm = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setModalError(null)

    const payload = {
      ...formData,
      discount_value: Number(formData.discount_value),
      min_order_value: Number(formData.min_order_value || 0),
      max_discount: formData.max_discount ? Number(formData.max_discount) : null,
      usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null,
      start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
      end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
    }

    try {
      if (editingCoupon) {
        await couponService.updateCoupon(editingCoupon.id, payload)
        setSuccessMsg(`Cập nhật mã giảm giá "${formData.code}" thành công!`)
      } else {
        await couponService.createCoupon(payload)
        setSuccessMsg(`Tạo mới mã giảm giá "${formData.code}" thành công!`)
      }
      handleCloseModal()
      fetchCoupons()
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err) {
      setModalError(err.response?.data?.message || 'Không thể lưu thông tin mã giảm giá.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (coupon) => {
    try {
      await couponService.toggleCouponStatus(coupon.id, !coupon.is_active)
      fetchCoupons()
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể chuyển trạng thái mã giảm giá.')
    }
  }

  const handleDeleteCoupon = async (coupon) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn mã giảm giá "${coupon.code}" không?`)) {
      return
    }
    try {
      await couponService.deleteCoupon(coupon.id)
      setSuccessMsg(`Đã xóa mã giảm giá "${coupon.code}".`)
      fetchCoupons()
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xóa mã giảm giá.')
    }
  }

  const formatCurrency = (val) => {
    if (!val) return '0đ'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Vô thời hạn'
    return new Date(dateStr).toLocaleDateString('vi-VN')
  }

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      
      {/* Header */}
      <div className="bg-white rounded-none border border-stone-200/80 p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest bg-amber-100 px-2.5 py-0.5 rounded-none border border-amber-200 inline-block mb-1">
            Phân hệ Quản trị
          </span>
          <h1 className="text-2xl font-heading font-bold text-stone-900 uppercase tracking-wider">
            QUẢN LÝ MÃ GIẢM GIÁ ({coupons.length})
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Tạo mã voucher khuyến mãi, áp đặt điều kiện đơn tối thiểu và quản lý thời hạn áp dụng
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenModal(null)}
          className="px-5 py-3 bg-stone-900 hover:bg-amber-800 text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs cursor-pointer shrink-0"
        >
          + TẠO MÃ GIẢM GIÁ MỚI
        </button>
      </div>

      {error && <FormAlert type="error" message={error} />}
      {successMsg && <FormAlert type="success" message={successMsg} />}

      {/* Coupons Grid */}
      {loading ? (
        <div className="py-16 text-center text-stone-400 text-xs space-y-3 bg-white rounded-none border border-stone-200/80">
          <div className="w-8 h-8 border-2 border-amber-800 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="font-semibold">Đang nạp danh sách mã giảm giá...</p>
        </div>
      ) : coupons.length === 0 ? (
        <div className="bg-white rounded-none p-12 text-center text-stone-400 border border-stone-200/80 shadow-2xs space-y-3">
          <p className="font-heading font-bold text-stone-900 text-base uppercase tracking-wider">Chưa có mã giảm giá nào</p>
          <button
            type="button"
            onClick={() => handleOpenModal(null)}
            className="px-6 py-3 bg-stone-900 hover:bg-amber-800 text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            + Tạo Mã Giảm Giá Ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-none border border-stone-200/80 shadow-2xs overflow-hidden flex flex-col justify-between hover:border-amber-800/60 transition-all relative"
            >
              {/* Ticket Header */}
              <div className="p-5 bg-stone-900 text-white relative border-b border-amber-800">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 bg-amber-800 text-white rounded-none text-[10px] font-bold uppercase tracking-wider">
                    {c.discount_type === 'percent' ? `GIẢM ${c.discount_value}%` : `GIẢM ${formatCurrency(c.discount_value)}`}
                  </span>
                  {c.is_active ? (
                    <span className="px-2.5 py-0.5 bg-emerald-700 text-white text-[10px] font-bold rounded-none uppercase tracking-wider">
                      ĐANG HOẠT ĐỘNG
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-stone-700 text-stone-300 text-[10px] font-bold rounded-none uppercase tracking-wider">
                      TẠM ẨN
                    </span>
                  )}
                </div>

                <h3 className="text-2xl font-mono font-bold tracking-wider underline decoration-amber-500 underline-offset-4 select-all">
                  {c.code}
                </h3>
                {c.description && (
                  <p className="text-xs text-stone-300 mt-1 line-clamp-2 leading-relaxed">{c.description}</p>
                )}
              </div>

              {/* Ticket Details */}
              <div className="p-5 flex-1 space-y-3 text-xs text-stone-600 bg-white">
                <div className="space-y-1.5 border-b border-stone-100 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-400 font-bold uppercase tracking-wider text-[11px]">Đơn tối thiểu:</span>
                    <span className="font-bold text-stone-900 font-mono">{formatCurrency(c.min_order_value)}</span>
                  </div>

                  {c.discount_type === 'percent' && (
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400 font-bold uppercase tracking-wider text-[11px]">Giảm tối đa:</span>
                      <span className="font-bold text-amber-800 font-mono">
                        {c.max_discount ? formatCurrency(c.max_discount) : 'Không giới hạn'}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-stone-400 font-bold uppercase tracking-wider text-[11px]">Hạn sử dụng:</span>
                    <span className="font-semibold text-stone-700 font-mono">{formatDate(c.end_date)}</span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-1 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(c)}
                    className={`px-3 py-1.5 rounded-none font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer border ${
                      c.is_active
                        ? 'bg-stone-100 text-stone-900 border-stone-200 hover:bg-stone-200'
                        : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {c.is_active ? 'TẠM ẨN' : 'KÍCH HOẠT'}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenModal(c)}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-900 rounded-none font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      SỬA
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCoupon(c)}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-none font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      XÓA
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL TẠO / SỬA MÃ GIẢM GIÁ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-white rounded-none max-w-xl w-full p-6 shadow-2xl border border-stone-200/80 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-stone-200/80 pb-3">
              <h2 className="text-sm font-heading font-bold text-stone-900 uppercase tracking-wider">
                {editingCoupon ? 'CHỈNH SỬA MÃ GIẢM GIÁ' : 'TẠO MÃ GIẢM GIÁ MỚI'}
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-stone-400 hover:text-stone-900 transition-colors p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="mb-4">
                <FormAlert type="error" message={modalError} />
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1 uppercase tracking-wider">
                    Mã Giảm Giá (Code) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: NOITHAT10"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-none font-mono font-bold uppercase text-amber-800 tracking-wider focus:outline-none focus:border-amber-800 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1 uppercase tracking-wider">Loại Giảm Giá</label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-none font-bold focus:outline-none focus:border-amber-800 bg-white text-stone-900"
                  >
                    <option value="percent">Giảm theo Phần trăm (%)</option>
                    <option value="fixed">Giảm Số tiền cố định (VND)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1 uppercase tracking-wider">Mô Tả Ưu Đãi</label>
                <input
                  type="text"
                  placeholder="VD: Giảm 10% cho đơn hàng từ 2.000.000đ"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-none focus:outline-none focus:border-amber-800 bg-white text-stone-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1 uppercase tracking-wider">
                    Mức Giảm ({formData.discount_type === 'percent' ? '%' : 'VND'}) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    required
                    placeholder={formData.discount_type === 'percent' ? 'VD: 10' : 'VD: 500000'}
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-none font-bold focus:outline-none focus:border-amber-800 bg-white text-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1 uppercase tracking-wider">
                    Đơn Hàng Tối Thiểu <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    required
                    placeholder="VD: 2000000"
                    value={formData.min_order_value}
                    onChange={(e) => setFormData({ ...formData, min_order_value: e.target.value })}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-none font-bold focus:outline-none focus:border-amber-800 bg-white text-stone-900"
                  />
                </div>
              </div>

              {formData.discount_type === 'percent' && (
                <div>
                  <label className="block font-bold text-stone-700 mb-1 uppercase tracking-wider">Mức Giảm Tối Đa (VND - Tùy chọn)</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    placeholder="VD: 1000000 (Để trống nếu không giới hạn)"
                    value={formData.max_discount}
                    onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-none focus:outline-none focus:border-amber-800 bg-white text-stone-900"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1 uppercase tracking-wider">Ngày Bắt Đầu Hiệu Lực</label>
                  <input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-none focus:outline-none focus:border-amber-800 bg-white text-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1 uppercase tracking-wider">Ngày Kết Thúc Hiệu Lực</label>
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-none focus:outline-none focus:border-amber-800 bg-white text-stone-900"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-700 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-amber-800 rounded-none border-stone-300"
                  />
                  <span>Kích hoạt mã ngay cho khách hàng</span>
                </label>
              </div>

              <div className="pt-4 border-t border-stone-200/80 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-none font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  HỦY BỎ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-stone-900 hover:bg-amber-800 text-white rounded-none font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  {submitting ? 'ĐANG LƯU...' : editingCoupon ? 'CẬP NHẬT MÃ GIẢM GIÁ' : 'TẠO MÃ GIẢM GIÁ MỚI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminCouponsPage
