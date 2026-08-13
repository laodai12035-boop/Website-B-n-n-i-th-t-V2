import React, { useState, useEffect } from 'react'
import comboService from '@/services/comboService'
import productService from '@/services/productService'
import FormAlert from '@/components/ui/FormAlert'

const AddComboModal = ({ isOpen, onClose, onSuccess }) => {
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    discount_percent: 10,
    description: '',
  })

  // Selected items: { [productId]: quantity }
  const [selectedItems, setSelectedItems] = useState({})

  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setLoadingProducts(true)
      productService
        .getAdminProducts({ limit: 100 })
        .then((res) => {
          // Chỉ hiển thị các sản phẩm active để chọn tạo combo (TC-02)
          const activeList = (res.items || []).filter((p) => p.is_active)
          setProducts(activeList)
        })
        .catch(() => {})
        .finally(() => setLoadingProducts(false))
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleToggleProduct = (productId) => {
    setSelectedItems((prev) => {
      const updated = { ...prev }
      if (updated[productId]) {
        delete updated[productId]
      } else {
        updated[productId] = 1
      }
      return updated
    })
    if (errors.items) {
      setErrors((prev) => ({ ...prev, items: undefined }))
    }
  }

  const handleQuantityChange = (productId, qty) => {
    const parsed = parseInt(qty, 10) || 1
    setSelectedItems((prev) => ({
      ...prev,
      [productId]: Math.max(1, parsed),
    }))
  }

  // Calculate totals
  let totalOriginal = 0
  Object.keys(selectedItems).forEach((pId) => {
    const prod = products.find((p) => p.id === Number(pId))
    if (prod) {
      const price = prod.discount_price || prod.price
      totalOriginal += price * selectedItems[pId]
    }
  })
  const discountPercent = parseFloat(formData.discount_percent) || 0
  const totalCombo = Math.round(totalOriginal * (1 - discountPercent / 100))
  const savings = Math.max(0, totalOriginal - totalCombo)

  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const validate = () => {
    const errs = {}
    if (!formData.name || !formData.name.trim()) {
      errs.name = 'Tên combo không được để trống'
    }

    const disc = parseFloat(formData.discount_percent)
    if (isNaN(disc) || disc < 0 || disc > 100) {
      errs.discount_percent = 'Phần trăm ưu đãi phải từ 0% đến 100%'
    }

    if (Object.keys(selectedItems).length === 0) {
      errs.items = 'Vui lòng chọn ít nhất 1 sản phẩm thành phần cho combo'
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
      const itemsPayload = Object.keys(selectedItems).map((pId) => ({
        product_id: Number(pId),
        quantity: selectedItems[pId],
      }))

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        discount_percent: parseFloat(formData.discount_percent),
        items: itemsPayload,
      }

      await comboService.createCombo(payload)
      setFormData({ name: '', discount_percent: 10, description: '' })
      setSelectedItems({})
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Không thể tạo combo sản phẩm.'
      setApiError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-display font-bold text-gray-900 flex items-center gap-2">
            <span>🎁</span> Tạo bộ sản phẩm Combo mới (NT-08-CN-006)
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-200/60 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {apiError && <FormAlert type="error" message={apiError} />}

          {/* Tên Combo & Phần trăm ưu đãi */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Tên Bộ Combo / Gói sản phẩm <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ví dụ: Combo Bộ Bàn Ăn Scandinavian 6 Ghế..."
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
              />
              {errors.name && <p className="text-[11px] text-red-500 font-medium mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Ưu đãi giảm giá (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="discount_percent"
                step="1"
                min="0"
                max="100"
                value={formData.discount_percent}
                onChange={handleChange}
                placeholder="VD: 15"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-white transition-colors font-bold text-amber-700"
              />
              {errors.discount_percent && <p className="text-[11px] text-red-500 font-medium mt-1">{errors.discount_percent}</p>}
            </div>
          </div>

          {/* Mô tả combo */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Mô tả nổi bật của Combo
            </label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="VD: Bộ bàn ăn sang trọng gỗ sồi tự nhiên tiết kiệm 15%..."
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Chọn sản phẩm thành phần */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-gray-700">
                Chọn sản phẩm thành phần trong combo <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] font-bold text-amber-700">
                Đã chọn {Object.keys(selectedItems).length} sản phẩm
              </span>
            </div>

            {errors.items && <p className="text-[11px] text-red-500 font-medium mb-2">{errors.items}</p>}

            <div className="border border-gray-200 rounded-2xl max-h-56 overflow-y-auto divide-y divide-gray-100 bg-gray-50/50">
              {loadingProducts ? (
                <div className="py-8 text-center text-xs text-gray-400 font-medium">
                  Đang nạp danh sách sản phẩm...
                </div>
              ) : products.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400 font-medium">
                  Chưa có sản phẩm nào khả dụng.
                </div>
              ) : (
                products.map((p) => {
                  const isChecked = !!selectedItems[p.id]
                  return (
                    <div
                      key={p.id}
                      className={`p-3 flex items-center justify-between transition-colors ${
                        isChecked ? 'bg-amber-50/80' : 'hover:bg-gray-100/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleProduct(p.id)}
                          className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                        />
                        <img
                          src={p.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc'}
                          alt={p.name}
                          className="w-9 h-9 rounded-lg object-cover border border-gray-200"
                        />
                        <div>
                          <p className="text-xs font-bold text-gray-900 line-clamp-1">{p.name}</p>
                          <p className="text-[11px] text-amber-700 font-bold">
                            {formatVND(p.discount_price || p.price)}
                          </p>
                        </div>
                      </div>

                      {isChecked && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-gray-500">Số lượng:</span>
                          <input
                            type="number"
                            min="1"
                            max={p.stock || 99}
                            value={selectedItems[p.id]}
                            onChange={(e) => handleQuantityChange(p.id, e.target.value)}
                            className="w-16 px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-center focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Tóm tắt giá trị combo */}
          {Object.keys(selectedItems).length > 0 && (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <p className="text-gray-500">Tổng giá bán lẻ ban đầu: <span className="font-bold text-gray-900 line-through">{formatVND(totalOriginal)}</span></p>
                <p className="text-emerald-800 font-extrabold text-sm mt-0.5">
                  Giá bán ưu đãi Combo (-{discountPercent}%): {formatVND(totalCombo)}
                </p>
              </div>
              <div className="px-3 py-1.5 bg-emerald-600 text-white font-extrabold rounded-xl text-center shadow-2xs">
                Tiết kiệm {formatVND(savings)}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Đang tạo...' : 'Tạo Bộ Combo'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}

export default AddComboModal
