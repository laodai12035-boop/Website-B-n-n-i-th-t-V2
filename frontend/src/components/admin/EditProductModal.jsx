import React, { useState, useEffect } from 'react'
import productService from '@/services/productService'
import categoryService from '@/services/categoryService'
import FormAlert from '@/components/ui/FormAlert'

const EditProductModal = ({ isOpen, onClose, productItem, onSuccess }) => {
  const [categories, setCategories] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    category: 'ban',
    price: '',
    discount_price: '',
    stock: 0,
    min_stock_threshold: 10,
    dimensions: '',
    material: '',
    weight_kg: '',
    warranty_months: 12,
    warranty_terms: '',
    image_url: '',
    description: '',
    is_active: true,
  })

  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen && productItem) {
      setFormData({
        name: productItem.name || '',
        category: productItem.category || 'ban',
        price: productItem.price !== undefined ? productItem.price : '',
        discount_price: productItem.discount_price !== null && productItem.discount_price !== undefined ? productItem.discount_price : '',
        stock: productItem.stock !== undefined ? productItem.stock : 0,
        min_stock_threshold: productItem.min_stock_threshold !== undefined && productItem.min_stock_threshold !== null ? productItem.min_stock_threshold : 10,
        dimensions: productItem.dimensions !== 'Đang cập nhật' ? (productItem.dimensions || '') : '',
        material: productItem.material !== 'Gỗ tự nhiên cao cấp' ? (productItem.material || '') : '',
        weight_kg: productItem.weight_kg !== null && productItem.weight_kg !== undefined ? productItem.weight_kg : '',
        warranty_months: productItem.warranty_months !== undefined && productItem.warranty_months !== null ? productItem.warranty_months : 12,
        warranty_terms: productItem.warranty_terms || '',
        image_url: productItem.image_url || '',
        description: productItem.description || '',
        is_active: productItem.is_active !== undefined ? productItem.is_active : true,
      })
      setErrors({})
      setApiError(null)

      categoryService
        .getCategories()
        .then((cats) => setCategories(cats))
        .catch(() => {})
    }
  }, [isOpen, productItem])

  if (!isOpen || !productItem) return null

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    const val = type === 'checkbox' ? checked : value
    setFormData((prev) => ({ ...prev, [name]: val }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 15 * 1024 * 1024) {
      alert('Kích thước file ảnh quá lớn (vượt quá 15MB). Vui lòng chọn file nhỏ hơn!')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 800
        const MAX_HEIGHT = 800
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height
            height = MAX_HEIGHT
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75)
        setFormData((prev) => ({ ...prev, image_url: compressedBase64 }))
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }

  const validate = () => {
    const errs = {}
    if (!formData.name || !formData.name.trim()) {
      errs.name = 'Tên sản phẩm không được để trống'
    }

    const numericPrice = parseFloat(formData.price)
    if (isNaN(numericPrice) || numericPrice <= 0) {
      errs.price = 'Giá bán phải là số thực lớn hơn 0'
    }

    if (formData.discount_price !== '') {
      const disc = parseFloat(formData.discount_price)
      if (isNaN(disc) || disc < 0) {
        errs.discount_price = 'Giá khuyến mãi phải lớn hơn hoặc bằng 0'
      } else if (!isNaN(numericPrice) && disc >= numericPrice) {
        errs.discount_price = 'Giá khuyến mãi phải nhỏ hơn giá gốc'
      }
    }

    if (!formData.category) {
      errs.category = 'Vui lòng chọn danh mục sản phẩm'
    }

    if (formData.warranty_months !== '') {
      const wMonths = parseInt(formData.warranty_months, 10)
      if (isNaN(wMonths) || wMonths < 0) {
        errs.warranty_months = 'Thời gian bảo hành phải lớn hơn hoặc bằng 0'
      }
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
      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        price: parseFloat(formData.price),
        discount_price: formData.discount_price !== '' ? parseFloat(formData.discount_price) : null,
        stock: parseInt(formData.stock, 10) || 0,
        min_stock_threshold: parseInt(formData.min_stock_threshold, 10) || 10,
        dimensions: formData.dimensions.trim() || null,
        material: formData.material.trim() || null,
        weight_kg: formData.weight_kg !== '' ? parseFloat(formData.weight_kg) : null,
        warranty_months: formData.warranty_months !== '' ? parseInt(formData.warranty_months, 10) : 12,
        warranty_terms: formData.warranty_terms.trim() || null,
        image_url: formData.image_url.trim() || null,
        description: formData.description.trim() || null,
        is_active: formData.is_active,
      }

      await productService.updateProduct(productItem.id, payload)
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Không thể cập nhật sản phẩm.'
      setApiError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-display font-bold text-gray-900 flex items-center gap-2">
            <span>✏️</span> Chỉnh sửa sản phẩm #{productItem.id}
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

          {/* Tên sản phẩm & Danh mục */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Tên sản phẩm <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ví dụ: Bộ Sofa Gỗ Óc Chó..."
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
              />
              {errors.name && <p className="text-[11px] text-red-500 font-medium mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Danh mục sản phẩm <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-white transition-colors cursor-pointer"
              >
                {categories.length > 0 ? (
                  categories.map((c) => (
                    <option key={c.id || c.slug} value={c.slug || c.name}>
                      {c.icon || '📁'} {c.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="ban">🪑 Bàn</option>
                    <option value="ghe">🛋️ Ghế / Sofa</option>
                    <option value="ke">📚 Kệ</option>
                    <option value="tu">🚪 Tủ</option>
                    <option value="trang-tri">💡 Trang trí</option>
                  </>
                )}
              </select>
              {errors.category && <p className="text-[11px] text-red-500 font-medium mt-1">{errors.category}</p>}
            </div>
          </div>

          {/* Giá gốc, Giá KM, Tồn kho */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Giá niêm yết (VNĐ) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="price"
                step="10000"
                value={formData.price}
                onChange={handleChange}
                placeholder="VD: 15000000"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
              />
              {errors.price && <p className="text-[11px] text-red-500 font-medium mt-1">{errors.price}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Giá khuyến mãi (VNĐ)
              </label>
              <input
                type="number"
                name="discount_price"
                step="10000"
                value={formData.discount_price}
                onChange={handleChange}
                placeholder="VD: 12900000"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
              />
              {errors.discount_price && <p className="text-[11px] text-red-500 font-medium mt-1">{errors.discount_price}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Số lượng tồn kho
              </label>
              <input
                type="number"
                name="stock"
                min="0"
                value={formData.stock}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Ngưỡng tồn kho tối thiểu (QTN-08)
              </label>
              <input
                type="number"
                name="min_stock_threshold"
                min="0"
                value={formData.min_stock_threshold}
                onChange={handleChange}
                placeholder="Mặc định: 10"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Kích thước, Trọng lượng, Chất liệu */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Kích thước (cm)
              </label>
              <input
                type="text"
                name="dimensions"
                value={formData.dimensions}
                onChange={handleChange}
                placeholder="VD: 180x80x75 cm"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Trọng lượng (kg)
              </label>
              <input
                type="number"
                name="weight_kg"
                step="0.1"
                value={formData.weight_kg}
                onChange={handleChange}
                placeholder="VD: 25.5"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Chất liệu chính
              </label>
              <input
                type="text"
                name="material"
                value={formData.material}
                onChange={handleChange}
                placeholder="VD: Gỗ Óc Chó..."
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Bảo hành (NT-08-CN-005) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Thời gian bảo hành (Tháng)
              </label>
              <input
                type="number"
                name="warranty_months"
                min="0"
                value={formData.warranty_months}
                onChange={handleChange}
                placeholder="VD: 12 hoặc 24"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
              />
              {errors.warranty_months && <p className="text-[11px] text-red-500 font-medium mt-1">{errors.warranty_months}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Điều kiện bảo hành áp dụng
              </label>
              <input
                type="text"
                name="warranty_terms"
                value={formData.warranty_terms}
                onChange={handleChange}
                placeholder="VD: Bảo hành 1 đổi 1 nếu lỗi mối mọt, cong vênh do nhà sản xuất..."
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Hình ảnh sản phẩm (Upload từ máy tính hoặc Nhập URL) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center justify-between">
              <span>🖼️ Hình ảnh đại diện sản phẩm</span>
              <span className="text-[10px] text-gray-400 font-normal">Hỗ trợ JPG, PNG, WEBP (Tối đa 5MB)</span>
            </label>

            <div className="space-y-3">
              {/* Controls: Chọn file từ PC hoặc Nhập URL */}
              <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                <label className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-2xs">
                  <span>📁</span> Chọn ảnh từ máy tính
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>

                <div className="relative flex-1">
                  <input
                    type="text"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleChange}
                    placeholder="Hoặc dán URL ảnh từ Web (https://...)"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
                  />
                  {formData.image_url && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, image_url: '' }))}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 font-bold text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Preview Thumbnail Box */}
              {formData.image_url && (
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200/80 flex items-center gap-3 animate-fade-in">
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-14 h-14 object-cover rounded-xl border border-gray-200 bg-white shrink-0"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc'
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-bold text-emerald-700 block">✓ Ảnh sản phẩm hiện tại</span>
                    <p className="text-[10px] text-gray-400 truncate font-mono">{formData.image_url.slice(0, 60)}...</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, image_url: '' }))}
                    className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-[11px] font-bold transition-colors shrink-0"
                  >
                    Đổi ảnh khác
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mô tả sản phẩm */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Mô tả chi tiết sản phẩm
            </label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Mô tả công năng và chi tiết sản phẩm..."
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-white resize-none"
            />
          </div>

          {/* Trạng thái kinh doanh */}
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
              />
              <label htmlFor="is_active" className="text-xs font-bold text-gray-800 cursor-pointer">
                Đang mở bán trên website (Active)
              </label>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${formData.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>
              {formData.is_active ? 'Đang bán' : 'Ngừng bán'}
            </span>
          </div>

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
              {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}

export default EditProductModal
