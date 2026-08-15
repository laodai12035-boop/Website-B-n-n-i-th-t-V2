import React, { useState, useEffect } from 'react'
import categoryService from '@/services/categoryService'
import FormAlert from '@/components/ui/FormAlert'

/**
 * EditCategoryModal — Modal Chỉnh sửa danh mục sản phẩm (nhaxinh.com style).
 * Góc cạnh vuông vức (rounded-none), chữ thuần tối giản (NO EMOJIS).
 */
const EditCategoryModal = ({ isOpen, onClose, categoryItem, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (categoryItem) {
      setFormData({
        name: categoryItem.name || '',
        description: categoryItem.description || '',
      })
      setErrors({})
      setApiError(null)
    }
  }, [categoryItem, isOpen])

  if (!isOpen || !categoryItem) return null

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
      errs.name = 'Tên danh mục không được để trống'
    } else if (formData.name.trim().length < 2) {
      errs.name = 'Tên danh mục phải có ít nhất 2 ký tự'
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
      await categoryService.updateCategory(categoryItem.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
      })
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Không thể cập nhật danh mục.'
      setApiError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans">
      <div className="relative w-full max-w-md bg-white rounded-none shadow-2xl border border-stone-200/80 overflow-hidden animate-slide-up">
        
        {/* Header Bar */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between border-b border-amber-800">
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">Phân hệ Quản trị</span>
            <h2 className="text-base font-heading font-bold uppercase tracking-wider">
              CHỈNH SỬA DANH MỤC #{categoryItem.id}
            </h2>
          </div>
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

          {/* Tên danh mục */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Tên danh mục sản phẩm <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="VD: Phòng ngủ, Bàn làm việc..."
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-none text-xs focus:outline-none focus:border-amber-800 bg-white text-stone-900"
            />
            {errors.name && <p className="text-[11px] text-red-600 font-bold mt-1">{errors.name}</p>}
          </div>

          {/* Mô tả chi tiết */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Mô tả danh mục (Tùy chọn)
            </label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Mô tả nhóm sản phẩm..."
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-none text-xs focus:outline-none focus:border-amber-800 bg-white text-stone-900 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-200/80">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              HỦY BỎ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-stone-900 hover:bg-amber-800 text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'ĐANG LƯU...' : 'LƯU THAY ĐỔI'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}

export default EditCategoryModal
