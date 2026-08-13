import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import AdminQuickSearch from '@/components/admin/AdminQuickSearch'
import couponService from '@/services/couponService'
import FormAlert from '@/components/ui/FormAlert'

/**
 * AdminCouponsPage — Trang Quản lý Mã giảm giá Khuyến mãi (NT-11-CN-002, QTN-01).
 * Tuyến đường: /admin/coupons
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
    is_active: true,
    start_date: '',
    end_date: '',
  })

  const fetchCoupons = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await couponService.getAdminCoupons()
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
    setModalError(null)
    if (coupon) {
      setEditingCoupon(coupon)
      setFormData({
        code: coupon.code || '',
        description: coupon.description || '',
        discount_type: coupon.discount_type || 'percent',
        discount_value: coupon.discount_value ?? '',
        min_order_value: coupon.min_order_value ?? 0,
        max_discount: coupon.max_discount ?? '',
        is_active: coupon.is_active ?? true,
        start_date: coupon.start_date ? coupon.start_date.substring(0, 16) : '',
        end_date: coupon.end_date ? coupon.end_date.substring(0, 16) : '',
      })
    } else {
      setEditingCoupon(null)
      setFormData({
        code: '',
        description: 'Giảm 10% cho đơn hàng đạt giá trị tối thiểu',
        discount_type: 'percent',
        discount_value: 10,
        min_order_value: 2000000,
        max_discount: 1000000,
        is_active: true,
        start_date: '',
        end_date: '',
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
    setModalError(null)

    const cleanCode = formData.code.trim().toUpperCase()
    if (!cleanCode) {
      setModalError('Vui lòng nhập mã giảm giá (VD: NOITHAT10).')
      return
    }

    if (!formData.discount_value || parseFloat(formData.discount_value) <= 0) {
      setModalError('Giá trị giảm phải lớn hơn 0.')
      return
    }

    setSubmitting(true)

    const payload = {
      code: cleanCode,
      description: formData.description.trim() || null,
      discount_type: formData.discount_type,
      discount_value: parseFloat(formData.discount_value),
      min_order_value: parseFloat(formData.min_order_value) || 0,
      max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
      is_active: formData.is_active,
      start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
      end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
    }

    try {
      if (editingCoupon) {
        await couponService.updateCoupon(editingCoupon.id, payload)
        setSuccessMsg(`Cập nhật mã giảm giá "${cleanCode}" thành công!`)
      } else {
        await couponService.createCoupon(payload)
        setSuccessMsg(`Tạo mã giảm giá mới "${cleanCode}" thành công!`)
      }
      handleCloseModal()
      fetchCoupons()
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Đã xảy ra lỗi khi lưu thông tin mã giảm giá.'
      setModalError(errMsg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteCoupon = async (coupon) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa mã giảm giá "${coupon.code}" không?`)) return

    try {
      await couponService.deleteCoupon(coupon.id)
      setSuccessMsg(`Xóa mã giảm giá "${coupon.code}" thành công!`)
      fetchCoupons()
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể xóa mã giảm giá.')
    }
  }

  const handleToggleActive = async (coupon) => {
    try {
      await couponService.updateCoupon(coupon.id, { is_active: !coupon.is_active })
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, is_active: !c.is_active } : c))
      )
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể cập nhật trạng thái mã giảm giá.')
    }
  }

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '0đ'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Vĩnh viễn'
    return new Date(dateStr).toLocaleDateString('vi-VN')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-1">
              <Link to="/admin" className="hover:text-amber-600 transition-colors">
                Quản trị
              </Link>
              <span>/</span>
              <span className="text-gray-900 font-bold">Quản Lý Mã Giảm Giá</span>
            </div>
            <h1 className="text-2xl font-display font-extrabold text-gray-900 flex items-center gap-2">
              <span>🎟️</span> Quản Lý Mã Giảm Giá & Khuyến Mãi (NT-11-CN-002 - QTN-01)
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <AdminQuickSearch />
            <button
              type="button"
              onClick={() => handleOpenModal(null)}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
            >
              <span>+</span> Tạo Mã Giảm Giá Mới
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4">
            <FormAlert type="error" message={error} />
          </div>
        )}

        {successMsg && (
          <div className="mb-4">
            <FormAlert type="success" message={successMsg} />
          </div>
        )}

        {/* Coupons List / Grid */}
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-xs space-y-3">
            <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="font-semibold">Đang nạp danh sách mã giảm giá...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center text-gray-400 border border-gray-100 shadow-xs space-y-3">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-2xl mx-auto font-bold">
              🎟️
            </div>
            <p className="font-bold text-gray-800 text-base">Chưa có mã giảm giá nào</p>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Hãy tạo mã giảm giá đầu tiên để triển khai các chương trình ưu đãi hấp dẫn thúc đẩy doanh số bán hàng!
            </p>
            <button
              type="button"
              onClick={() => handleOpenModal(null)}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <span>+</span> Tạo Mã Giảm Giá Ngay
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coupons.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow relative"
              >
                {/* Top Ticket Header */}
                <div className="p-5 bg-gradient-to-r from-amber-500 to-amber-600 text-white relative">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {c.discount_type === 'percent' ? `Giảm ${c.discount_value}%` : `Giảm ${formatCurrency(c.discount_value)}`}
                    </span>
                    {c.is_active ? (
                      <span className="px-2.5 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full shadow-xs">
                        Đang Khả Dụng
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-gray-800 text-gray-200 text-[10px] font-bold rounded-full">
                        Tạm Ẩn
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl font-mono font-extrabold tracking-wider underline decoration-amber-300 decoration-2 select-all">
                    {c.code}
                  </h3>
                  {c.description && (
                    <p className="text-xs text-amber-100 mt-1 line-clamp-2 font-medium">{c.description}</p>
                  )}
                </div>

                {/* Ticket Details (QTN-01) */}
                <div className="p-5 flex-1 space-y-3 text-xs text-gray-600 bg-white">
                  <div className="space-y-1.5 border-b border-gray-100 pb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 font-semibold">Đơn tối thiểu (QTN-01):</span>
                      <span className="font-bold text-gray-900">{formatCurrency(c.min_order_value)}</span>
                    </div>

                    {c.discount_type === 'percent' && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 font-semibold">Giảm tối đa:</span>
                        <span className="font-bold text-amber-700">
                          {c.max_discount ? formatCurrency(c.max_discount) : 'Không giới hạn'}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 font-semibold">Hạn sử dụng:</span>
                      <span className="font-medium text-gray-700">{formatDate(c.end_date)}</span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-1 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(c)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer border ${
                        c.is_active
                          ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      {c.is_active ? '⏸️ Tạm Ẩn' : '▶️ Kích Hoạt'}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenModal(c)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCoupon(c)}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-xs transition-colors cursor-pointer border border-red-100"
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL TẠO / SỬA MÃ GIẢM GIÁ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <h2 className="text-lg font-display font-extrabold text-gray-900 flex items-center gap-2">
                <span>{editingCoupon ? '✏️' : '✨'}</span>
                {editingCoupon ? 'Chỉnh Sửa Mã Giảm Giá' : 'Tạo Mã Giảm Giá Mới (QTN-01)'}
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
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
              {/* Mã giảm giá & Mô tả */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Mã Giảm Giá (Code) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: NOITHAT10"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-mono font-extrabold uppercase text-amber-700 tracking-wider focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Loại Giảm Giá</label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all outline-none"
                  >
                    <option value="percent">Giảm theo Phần trăm (%)</option>
                    <option value="fixed">Giảm Số tiền cố định (VND)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Mô Tả Chương Trình Ưu Đãi</label>
                <input
                  type="text"
                  placeholder="VD: Giảm 10% cho tất cả đơn hàng phòng khách từ 2.000.000đ"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all outline-none"
                />
              </div>

              {/* Mức giảm & Đơn hàng tối thiểu (QTN-01) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Mức Giảm giá ({formData.discount_type === 'percent' ? '%' : 'VND'}) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    required
                    placeholder={formData.discount_type === 'percent' ? 'VD: 10' : 'VD: 500000'}
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Đơn Hàng Tối Thiểu (QTN-01) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    required
                    placeholder="VD: 2000000"
                    value={formData.min_order_value}
                    onChange={(e) => setFormData({ ...formData, min_order_value: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all outline-none"
                  />
                </div>
              </div>

              {/* Max Discount (dành cho phần trăm) */}
              {formData.discount_type === 'percent' && (
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Mức Giảm Tối Đa (VND - Tùy chọn)</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    placeholder="VD: 1000000 (Để trống nếu không giới hạn)"
                    value={formData.max_discount}
                    onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all outline-none"
                  />
                </div>
              )}

              {/* Start Date & End Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Ngày Bắt Đầu Hiệu Lực</label>
                  <input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Ngày Kết Thúc Hiệu Lực</label>
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all outline-none"
                  />
                </div>
              </div>

              {/* Active Checkbox */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-amber-600 rounded-md focus:ring-amber-500 border-gray-300"
                  />
                  <span>Bật trạng thái sẵn sàng áp dụng ngay cho khách hàng</span>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : editingCoupon ? 'Cập Nhật Mã Giảm Giá' : 'Tạo Mã Giảm Giá Mới'}
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
