import React, { useState, useEffect } from 'react'
import productService from '@/services/productService'
import categoryService from '@/services/categoryService'
import FormAlert from '@/components/ui/FormAlert'

/**
 * AddProductModal — Modal Thêm sản phẩm mới phong cách Nhà Xinh (nhaxinh.com).
 * Góc cạnh vuông vức (rounded-none), chữ thuần tối giản (NO EMOJIS), hỗ trợ 5 ảnh sản phẩm.
 */
const AddProductModal = ({ isOpen, onClose, onSuccess }) => {
  const [categories, setCategories] = useState([])
  
  // 5 slots hình ảnh (Slot 0 = Ảnh chính, Slots 1-4 = Ảnh bộ sưu tập)
  const [imageSlots, setImageSlots] = useState(['', '', '', '', ''])
  const [activeSlotIdx, setActiveSlotIdx] = useState(0)

  const [formData, setFormData] = useState({
    name: '',
    category: 'ban',
    price: '',
    discount_price: '',
    stock: 10,
    min_stock_threshold: 10,
    dimensions: '',
    material: '',
    weight_kg: '',
    warranty_months: 12,
    warranty_terms: '',
    description: '',
  })

  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Bộ ảnh gợi ý nhanh 5 góc studio
  const samplePresets = [
    {
      name: 'Bộ Sofa Gỗ Óc Chó',
      images: [
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc',
        'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7',
        'https://images.unsplash.com/photo-1567016432779-094069958ea5',
        'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6',
      ],
    },
    {
      name: 'Bộ Bàn Ăn Gỗ Sồi 6 Ghế',
      images: [
        'https://images.unsplash.com/photo-1617806118233-18e1de247200',
        'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf',
        'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4',
        'https://images.unsplash.com/photo-1604578762246-41134e37f9cc',
        'https://images.unsplash.com/photo-1595428774223-ef52624120d2',
      ],
    },
    {
      name: 'Giường Ngủ & Tủ Đầu Giường',
      images: [
        'https://images.unsplash.com/photo-1540518614846-7ede433c5172',
        'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85',
        'https://images.unsplash.com/photo-1616594039964-ae9021a400a0',
        'https://images.unsplash.com/photo-1598928506311-c55ded91a20c',
        'https://images.unsplash.com/photo-1617325247661-675c8d64b934',
      ],
    },
  ]

  useEffect(() => {
    if (isOpen) {
      categoryService
        .getCategories()
        .then((cats) => {
          if (Array.isArray(cats)) {
            setCategories(cats)
            if (cats.length > 0 && !formData.category) {
              setFormData((prev) => ({ ...prev, category: cats[0].slug || cats[0].name }))
            }
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

  const handleSlotImageChange = (idx, value) => {
    setImageSlots((prev) => {
      const next = [...prev]
      next[idx] = value
      return next
    })
  }

  const handleImageFileUpload = (e, slotIdx) => {
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
        handleSlotImageChange(slotIdx, compressedBase64)
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }

  const handleApplyPreset = (presetImages) => {
    setImageSlots(presetImages.slice(0, 5))
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
      const validImages = imageSlots.map((s) => s.trim()).filter(Boolean)
      const mainImageUrl = validImages.length > 0 ? validImages[0] : 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc'

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
        image_url: mainImageUrl,
        description: formData.description.trim() || null,
      }

      await productService.createProduct(payload)
      
      // Reset Form
      setFormData({
        name: '',
        category: categories.length > 0 ? categories[0].slug || categories[0].name : 'ban',
        price: '',
        discount_price: '',
        stock: 10,
        min_stock_threshold: 10,
        dimensions: '',
        material: '',
        weight_kg: '',
        warranty_months: 12,
        warranty_terms: '',
        description: '',
      })
      setImageSlots(['', '', '', '', ''])

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans">
      <div className="relative w-full max-w-3xl bg-white rounded-none shadow-2xl border border-stone-200/80 overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header Bar — Tối giản vuông vức nhaxinh.com */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between shrink-0 border-b border-amber-800">
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">Phân hệ Quản trị</span>
            <h2 className="text-base font-heading font-bold uppercase tracking-wider">
              THÊM SẢN PHẨM NỘI THẤT MỚI
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {apiError && <FormAlert type="error" message={apiError} />}

          {/* 1. Tên sản phẩm & Danh mục */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Tên sản phẩm <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="VD: Bộ Sofa Gỗ Óc Chó Bọc Da Ý"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-none focus:outline-none focus:border-amber-800 bg-white text-stone-900"
              />
              {errors.name && <p className="text-[11px] text-red-600 font-bold mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Danh mục sản phẩm <span className="text-red-600">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-none focus:outline-none focus:border-amber-800 bg-white text-stone-900 font-bold uppercase tracking-wider cursor-pointer"
              >
                {categories.length > 0 ? (
                  categories.map((c) => (
                    <option key={c.id || c.slug} value={c.slug || c.name}>
                      {c.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="ban">BÀN & BÀN LÀM VIỆC</option>
                    <option value="ghe">GHẾ & SOFA</option>
                    <option value="ke">KỆ SÁCH & TIVI</option>
                    <option value="tu">TỦ QUẦN ÁO & TRANG TRÍ</option>
                    <option value="trang-tri">TRANG TRÍ & ĐÈN</option>
                  </>
                )}
              </select>
              {errors.category && <p className="text-[11px] text-red-600 font-bold mt-1">{errors.category}</p>}
            </div>
          </div>

          {/* 2. Giá niêm yết, Giá KM, Tồn kho & Ngưỡng tồn kho */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Giá niêm yết (VNĐ) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                name="price"
                step="10000"
                value={formData.price}
                onChange={handleChange}
                placeholder="VD: 15000000"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-none focus:outline-none focus:border-amber-800 bg-white text-stone-900 font-mono font-bold"
              />
              {errors.price && <p className="text-[11px] text-red-600 font-bold mt-1">{errors.price}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Giá khuyến mãi (VNĐ)
              </label>
              <input
                type="number"
                name="discount_price"
                step="10000"
                value={formData.discount_price}
                onChange={handleChange}
                placeholder="VD: 12900000"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-none focus:outline-none focus:border-amber-800 bg-white text-stone-900 font-mono font-bold"
              />
              {errors.discount_price && <p className="text-[11px] text-red-600 font-bold mt-1">{errors.discount_price}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Số lượng tồn kho
              </label>
              <input
                type="number"
                name="stock"
                min="0"
                value={formData.stock}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-none focus:outline-none focus:border-amber-800 bg-white text-stone-900 font-mono font-bold text-center"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Ngưỡng tồn tối thiểu
              </label>
              <input
                type="number"
                name="min_stock_threshold"
                min="0"
                value={formData.min_stock_threshold}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-none focus:outline-none focus:border-amber-800 bg-white text-stone-900 font-mono font-bold text-center"
              />
            </div>
          </div>

          {/* 3. Kích thước, Trọng lượng, Chất liệu */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Kích thước (cm)
              </label>
              <input
                type="text"
                name="dimensions"
                value={formData.dimensions}
                onChange={handleChange}
                placeholder="VD: 180x80x75 cm"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-none focus:outline-none focus:border-amber-800 bg-white text-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Trọng lượng (kg)
              </label>
              <input
                type="number"
                name="weight_kg"
                step="0.1"
                value={formData.weight_kg}
                onChange={handleChange}
                placeholder="VD: 25.5"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-none focus:outline-none focus:border-amber-800 bg-white text-stone-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Chất liệu chính
              </label>
              <input
                type="text"
                name="material"
                value={formData.material}
                onChange={handleChange}
                placeholder="VD: Gỗ Óc Chó, Da Bò..."
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-none focus:outline-none focus:border-amber-800 bg-white text-stone-900"
              />
            </div>
          </div>

          {/* 4. Bảo hành */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Bảo hành (Tháng)
              </label>
              <input
                type="number"
                name="warranty_months"
                min="0"
                value={formData.warranty_months}
                onChange={handleChange}
                placeholder="VD: 12"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-none focus:outline-none focus:border-amber-800 bg-white text-stone-900 font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Điều kiện bảo hành
              </label>
              <input
                type="text"
                name="warranty_terms"
                value={formData.warranty_terms}
                onChange={handleChange}
                placeholder="VD: Bảo hành 1 đổi 1 nếu lỗi mối mọt, cong vênh do nhà sản xuất..."
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-none focus:outline-none focus:border-amber-800 bg-white text-stone-900"
              />
            </div>
          </div>

          {/* 5. Bộ 5 Ảnh Sản Phẩm (BỘ SƯU TẬP GALLERY 5 GÓC CHỤP STUDIO) */}
          <div className="bg-stone-50 p-4 border border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-stone-900 uppercase tracking-wider">
                  BỘ SƯU TẬP HÌNH ẢNH SẢN PHẨM (5 GÓC CHỤP STUDIO)
                </label>
                <span className="text-[10px] text-stone-500 font-medium">
                  Slot 1 là Ảnh Đại Diện Chính. Slots 2 - 5 là các góc chụp chi tiết bộ sưu tập.
                </span>
              </div>
            </div>

            {/* Quick Sample Presets */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">GỢI Ý BỘ 5 ẢNH MẪU SẮN CÓ:</span>
              <div className="flex flex-wrap gap-2">
                {samplePresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(preset.images)}
                    className="px-3 py-1 bg-white hover:bg-stone-200 text-stone-800 border border-stone-300 rounded-none text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    + Bộ 5 Ảnh: {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 5 Slot Thumbnail Preview Strip */}
            <div className="grid grid-cols-5 gap-2">
              {[0, 1, 2, 3, 4].map((slotIdx) => {
                const imgUrl = imageSlots[slotIdx]
                const isActive = activeSlotIdx === slotIdx
                const isMain = slotIdx === 0
                return (
                  <div
                    key={slotIdx}
                    onClick={() => setActiveSlotIdx(slotIdx)}
                    className={`relative aspect-[4/5] bg-white border-2 cursor-pointer transition-all overflow-hidden flex flex-col items-center justify-center ${
                      isActive ? 'border-amber-800 ring-1 ring-amber-800' : 'border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={`Slot ${slotIdx + 1}`}
                        className="w-full h-full object-contain p-1 mix-blend-multiply"
                      />
                    ) : (
                      <div className="text-center p-1 text-stone-400">
                        <span className="text-[10px] font-bold block">+ TẢI ẢNH</span>
                      </div>
                    )}

                    {/* Slot Label Badge */}
                    <span
                      className={`absolute top-1 left-1 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-none ${
                        isMain ? 'bg-amber-800 text-white' : 'bg-stone-900/80 text-white'
                      }`}
                    >
                      {isMain ? 'ẢNH CHÍNH' : `GÓC ${slotIdx + 1}`}
                    </span>

                    {imgUrl && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSlotImageChange(slotIdx, '')
                        }}
                        className="absolute bottom-1 right-1 bg-red-600 text-white w-4 h-4 text-[10px] font-bold flex items-center justify-center rounded-none hover:bg-red-700"
                        title="Xóa ảnh slot này"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Active Slot Controls (Upload / URL Input) */}
            <div className="bg-white p-3 border border-stone-200 space-y-2">
              <span className="text-[11px] font-bold text-stone-900 uppercase tracking-wider block">
                ĐANG CHỈNH SỬA: {activeSlotIdx === 0 ? 'SLOT 1 — ẢNH ĐẠI DIỆN CHÍNH' : `SLOT ${activeSlotIdx + 1} — ẢNH CHI TIẾT ${activeSlotIdx + 1}`}
              </span>

              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <label className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-900 border border-stone-300 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center shrink-0">
                  Chọn ảnh từ máy tính
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageFileUpload(e, activeSlotIdx)}
                    className="hidden"
                  />
                </label>

                <input
                  type="text"
                  value={imageSlots[activeSlotIdx]}
                  onChange={(e) => handleSlotImageChange(activeSlotIdx, e.target.value)}
                  placeholder={`Dán URL ảnh cho Slot ${activeSlotIdx + 1} (https://...)`}
                  className="flex-1 px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-none text-xs focus:outline-none focus:border-amber-800 bg-white text-stone-900"
                />
              </div>
            </div>
          </div>

          {/* 6. Mô tả sản phẩm */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Mô tả chi tiết sản phẩm
            </label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Mô tả phong cách thiết kế, công năng và tính năng nổi bật của sản phẩm..."
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-none text-xs focus:outline-none focus:border-amber-800 bg-white text-stone-900 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-200/80 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-none font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              HỦY BỎ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-stone-900 hover:bg-amber-800 text-white rounded-none font-bold text-xs uppercase tracking-wider transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'ĐANG LƯU...' : 'THÊM SẢN PHẨM'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}

export default AddProductModal
