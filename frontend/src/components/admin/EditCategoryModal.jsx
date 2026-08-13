import React, { useState, useEffect } from 'react'
import categoryService from '@/services/categoryService'
import FormAlert from '@/components/ui/FormAlert'

const EMOJI_PRESETS = ['🛏️', '🛋️', '🪑', '📚', '🚪', '💡', '🍽️', '🖼️', '🪴', '🪞']

const EditCategoryModal = ({ isOpen, onClose, categoryItem, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '🛏️',
  })

  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (categoryItem) {
      setFormData({
        name: categoryItem.name || '',
        description: categoryItem.description || '',
        icon: categoryItem.icon || '📁',
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
        icon: formData.icon || '📁',
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-display font-bold text-gray-900 flex items-center gap-2">
            <span>✏️</span> Chỉnh sửa danh mục sản phẩm
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {apiError && <FormAlert type="error" message={apiError} />}

          {/* Chọn Icon Emoji */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Biểu tượng (Icon Emoji)
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {EMOJI_PRESETS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, icon: emoji }))}
                  className={`w-9 h-9 text-lg rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    formData.icon === emoji
                      ? 'bg-amber-100 border-2 border-amber-600 shadow-xs scale-105'
                      : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Tên danh mục */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Tên danh mục <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ví dụ: Phòng ngủ, Bàn làm việc..."
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
            />
            {errors.name && <p className="text-[11px] text-red-500 font-medium mt-1">{errors.name}</p>}
          </div>

          {/* Mô tả chi tiết */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Mô tả danh mục (tùy chọn)
            </label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Mô tả nhóm sản phẩm..."
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-white resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
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

export default EditCategoryModal
