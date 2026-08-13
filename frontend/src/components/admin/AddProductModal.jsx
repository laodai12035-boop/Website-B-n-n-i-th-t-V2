import React, { useState, useEffect } from 'react'
import productService from '@/services/productService'
import categoryService from '@/services/categoryService'
import FormAlert from '@/components/ui/FormAlert'

const AddProductModal = ({ isOpen, onClose, onSuccess }) => {
  const [categories, setCategories] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    category: 'ban',
    price: '',
    discount_price: '',
    stock: 10,
    dimensions: '',
    material: '',
    weight_kg: '',
    warranty_months: 12,
    warranty_terms: '',
    image_url: '',
    description: '',
  })

  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Nạp danh mục từ API
      categoryService
        .getCategories()
        .then((cats) => {
          setCategories(cats)
          if (cats.length > 0 && !formData.category) {
            setFormData((prev) => ({ ...prev, category: cats[0].slug || cats[0].name }))
          }
        })
        .catch(() => {})
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
        dimensions: formData.dimensions.trim() || null,
        material: formData.material.trim() || null,
        weight_kg: formData.weight_kg !== '' ? parseFloat(formData.weight_kg) : null,
        warranty_months: formData.warranty_months !== '' ? parseInt(formData.warranty_months, 10) : 12,
        warranty_terms: formData.warranty_terms.trim() || null,
        image_url: formData.image_url.trim() || null,
        description: formData.description.trim() || null,
      }

      await productService.createProduct(payload)
      setFormData({
        name: '',
        category: categories.length > 0 ? categories[0].slug || categories[0].name : 'ban',
        price: '',
        discount_price: '',
        stock: 10,
        dimensions: '',
        material: '',
        weight_kg: '',
        warranty_months: 12,
        warranty_terms: '',
        image_url: '',
        description: '',
      })
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Không thể tạo sản phẩm mới.'
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
            <span>✨</span> Thêm sản phẩm nội thất mới
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
                placeholder="VD: 12900000 (để trống nếu không KM)"
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
                placeholder="VD: Gỗ Óc Chó, Da Bò..."
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

          {/* Image URL */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              URL Hình ảnh đại diện
            </label>
            <input
              type="text"
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
            />
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
              placeholder="Mô tả phong cách thiết kế, công năng và tính năng nổi bật..."
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-white resize-none"
            />
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
              {submitting ? 'Đang lưu...' : 'Thêm sản phẩm'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}

export default AddProductModal
