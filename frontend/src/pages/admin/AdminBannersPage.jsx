import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import bannerService from '@/services/bannerService'
import productService from '@/services/productService'
import categoryService from '@/services/categoryService'
import comboService from '@/services/comboService'
import FormAlert from '@/components/ui/FormAlert'

/**
 * AdminBannersPage — Trang Quản lý Banner Quảng Cáo Trang Chủ dành cho Admin (nhaxinh.com style).
 * Góc cạnh vuông vức (rounded-none), KHÔNG SỬ DỤNG ICON.
 */
const AdminBannersPage = () => {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  // Options lists for smart link selector
  const [productList, setProductList] = useState([])
  const [categoryList, setCategoryList] = useState([])
  const [comboList, setComboList] = useState([])

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState(null) // null = Create, object = Edit
  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState(null)

  // Smart Link Target State
  const [linkTargetType, setLinkTargetType] = useState('all') // 'all', 'product', 'category', 'combo', 'custom'
  const [selectedProduct, setSelectedProduct] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedCombo, setSelectedCombo] = useState('')

  // Form Data
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    link_url: '',
    display_order: 0,
    is_active: true,
    start_date: '',
    end_date: '',
  })

  // Sample banner images for quick selection
  const sampleImages = [
    { label: 'Sofa Phòng Khách', url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc' },
    { label: 'Bộ Bàn Ăn', url: 'https://images.unsplash.com/photo-1617806118233-18e1de247200' },
    { label: 'Giường Phố', url: 'https://images.unsplash.com/photo-1540518614846-7ede433c5172' },
  ]

  const fetchBanners = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await bannerService.getAllAdminBanners()
      setBanners(data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể nạp danh sách banner.')
    } finally {
      setLoading(false)
    }
  }

  const fetchLinkOptionsData = async () => {
    try {
      const pRes = await productService.getAdminProducts({ limit: 100 })
      if (pRes && pRes.items) {
        setProductList(pRes.items)
      }

      const cRes = await categoryService.getAllCategories()
      if (cRes) {
        setCategoryList(cRes)
      }

      const cbRes = await comboService.getAdminCombos()
      if (cbRes) {
        setComboList(cbRes)
      }
    } catch (e) {
      console.error('Lỗi khi nạp danh sách gợi ý liên kết:', e)
    }
  }

  useEffect(() => {
    fetchBanners()
    fetchLinkOptionsData()
  }, [])

  const detectLinkTargetType = (url) => {
    if (!url || url === '/products') return 'all'
    if (url.startsWith('/products/')) return 'product'
    if (url.startsWith('/products?category=')) return 'category'
    if (url.startsWith('/combos/') || url.includes('combo')) return 'combo'
    return 'custom'
  }

  const handleOpenModal = (banner = null) => {
    setEditingBanner(banner)
    setModalError(null)

    if (banner) {
      const currentUrl = banner.link_url || ''
      const targetType = detectLinkTargetType(currentUrl)
      setLinkTargetType(targetType)

      if (targetType === 'product') {
        const prodId = currentUrl.replace('/products/', '')
        setSelectedProduct(prodId)
      } else if (targetType === 'category') {
        const catSlug = currentUrl.replace('/products?category=', '')
        setSelectedCategory(catSlug)
      } else if (targetType === 'combo') {
        const comboId = currentUrl.replace('/combos/', '')
        setSelectedCombo(comboId)
      }

      setFormData({
        title: banner.title || '',
        subtitle: banner.subtitle || '',
        image_url: banner.image_url || '',
        link_url: banner.link_url || '',
        display_order: banner.display_order || 0,
        is_active: banner.is_active !== undefined ? banner.is_active : true,
        start_date: banner.start_date ? new Date(banner.start_date).toISOString().slice(0, 16) : '',
        end_date: banner.end_date ? new Date(banner.end_date).toISOString().slice(0, 16) : '',
      })
    } else {
      setLinkTargetType('all')
      setSelectedProduct(productList.length > 0 ? String(productList[0].id) : '')
      setSelectedCategory(categoryList.length > 0 ? (categoryList[0].slug || categoryList[0].name) : '')
      setSelectedCombo(comboList.length > 0 ? String(comboList[0].id) : '1')

      setFormData({
        title: '',
        subtitle: '',
        image_url: '',
        link_url: '/products',
        display_order: 0,
        is_active: true,
        start_date: '',
        end_date: '',
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingBanner(null)
    setModalError(null)
  }

  const handleLinkTargetTypeChange = (type) => {
    setLinkTargetType(type)
    if (type === 'all') {
      setFormData((prev) => ({ ...prev, link_url: '/products' }))
    } else if (type === 'product') {
      const prodId = selectedProduct || (productList.length > 0 ? productList[0].id : '')
      if (prodId) {
        setSelectedProduct(String(prodId))
        setFormData((prev) => ({ ...prev, link_url: `/products/${prodId}` }))
      }
    } else if (type === 'category') {
      const catSlug = selectedCategory || (categoryList.length > 0 ? (categoryList[0].slug || categoryList[0].name) : '')
      if (catSlug) {
        setSelectedCategory(catSlug)
        setFormData((prev) => ({ ...prev, link_url: `/products?category=${catSlug}` }))
      }
    } else if (type === 'combo') {
      const comboId = selectedCombo || (comboList.length > 0 ? comboList[0].id : '1')
      setSelectedCombo(String(comboId))
      setFormData((prev) => ({ ...prev, link_url: `/combos/${comboId}` }))
    }
  }

  const handleProductSelect = (e) => {
    const val = e.target.value
    setSelectedProduct(val)
    if (val) {
      setFormData((prev) => ({ ...prev, link_url: `/products/${val}` }))
    }
  }

  const handleCategorySelect = (e) => {
    const val = e.target.value
    setSelectedCategory(val)
    if (val) {
      setFormData((prev) => ({ ...prev, link_url: `/products?category=${val}` }))
    }
  }

  const handleComboSelect = (e) => {
    const val = e.target.value
    setSelectedCombo(val)
    if (val) {
      setFormData((prev) => ({ ...prev, link_url: `/combos/${val}` }))
    }
  }

  const handleBannerImageFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 15 * 1024 * 1024) {
      setModalError('Dung lượng tệp ảnh quá lớn. Vui lòng chọn tệp dưới 15MB.')
      return
    }

    const tempUrl = URL.createObjectURL(file)
    setFormData((prev) => ({ ...prev, image_url: tempUrl }))
    setModalError(null)

    const uploadData = new FormData()
    uploadData.append('image', file)

    try {
      const res = await bannerService.uploadBannerImage(uploadData)
      if (res && res.image_url) {
        setFormData((prev) => ({ ...prev, image_url: res.image_url }))
      }
    } catch (err) {
      console.warn('Lỗi upload server:', err)
    }
  }

  const handleSubmitForm = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setModalError(null)

    const payload = {
      ...formData,
      display_order: Number(formData.display_order || 0),
      start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
      end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
    }

    try {
      if (editingBanner) {
        await bannerService.updateBanner(editingBanner.id, payload)
        setSuccessMsg(`Cập nhật banner "${formData.title}" thành công!`)
      } else {
        await bannerService.createBanner(payload)
        setSuccessMsg(`Thêm mới banner "${formData.title}" thành công!`)
      }
      handleCloseModal()
      fetchBanners()
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err) {
      setModalError(err.response?.data?.message || 'Không thể lưu thông tin banner.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (banner) => {
    try {
      await bannerService.toggleBannerStatus(banner.id, !banner.is_active)
      fetchBanners()
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể chuyển trạng thái banner.')
    }
  }

  const handleDeleteBanner = async (banner) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn banner "${banner.title}" không?`)) {
      return
    }
    try {
      await bannerService.deleteBanner(banner.id)
      setSuccessMsg(`Đã xóa banner "${banner.title}".`)
      fetchBanners()
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xóa banner.')
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Không giới hạn'
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
            QUẢN LÝ BANNER QUẢNG CÁO ({banners.length})
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Quản lý banner slide quảng cáo trang chủ, thứ tự hiển thị và điều hướng liên kết
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenModal(null)}
          className="px-5 py-3 bg-stone-900 hover:bg-amber-800 text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs cursor-pointer shrink-0"
        >
          + THÊM BANNER MỚI
        </button>
      </div>

      {error && <FormAlert type="error" message={error} />}
      {successMsg && <FormAlert type="success" message={successMsg} />}

      {/* Banners Grid / List */}
      {loading ? (
        <div className="py-16 text-center text-stone-400 text-xs space-y-3 bg-white rounded-none border border-stone-200/80">
          <div className="w-8 h-8 border-2 border-amber-800 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="font-semibold">Đang nạp danh sách banner...</p>
        </div>
      ) : banners.length === 0 ? (
        <div className="bg-white rounded-none p-12 text-center text-stone-400 border border-stone-200/80 shadow-2xs space-y-3">
          <p className="font-heading font-bold text-stone-900 text-base uppercase tracking-wider">Chưa có banner quảng cáo nào</p>
          <button
            type="button"
            onClick={() => handleOpenModal(null)}
            className="px-6 py-3 bg-stone-900 hover:bg-amber-800 text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            + Thêm Banner Ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {banners.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-none border border-stone-200/80 shadow-2xs overflow-hidden flex flex-col hover:border-amber-800/60 transition-all group"
            >
              {/* Banner Image Preview */}
              <div className="relative h-48 sm:h-56 bg-stone-100 overflow-hidden">
                <img
                  src={b.image_url}
                  alt={b.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-4 text-white">
                  <span className="px-2.5 py-0.5 bg-black/60 rounded-none text-[10px] font-bold uppercase tracking-wider w-fit mb-1 border border-white/20 font-mono">
                    THỨ TỰ #{b.display_order}
                  </span>
                  <h3 className="text-base font-heading font-bold uppercase tracking-wider line-clamp-1">{b.title}</h3>
                  {b.subtitle && <p className="text-xs text-stone-200 line-clamp-1">{b.subtitle}</p>}
                </div>

                {/* Active Badge Top Right */}
                <div className="absolute top-3 right-3">
                  {b.is_active ? (
                    <span className="px-2.5 py-1 bg-emerald-700 text-white text-[10px] font-bold rounded-none uppercase tracking-wider">
                      ĐANG HIỂN THỊ
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-stone-800 text-stone-300 text-[10px] font-bold rounded-none uppercase tracking-wider">
                      TẠM ẨN
                    </span>
                  )}
                </div>
              </div>

              {/* Banner Info Details */}
              <div className="p-5 flex-1 flex flex-col justify-between gap-3 text-xs">
                <div className="space-y-1.5 text-stone-600">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-400 uppercase tracking-wider text-[11px]">ĐÍCH ĐẾN:</span>
                    <span className="font-mono text-stone-900 truncate">
                      {b.link_url || 'Không có liên kết'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-stone-500 font-mono">
                    <span>Bắt đầu: {formatDate(b.start_date)}</span>
                    <span>Kết thúc: {formatDate(b.end_date)}</span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-stone-200/80 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(b)}
                    className={`px-3 py-1.5 rounded-none font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer border ${
                      b.is_active
                        ? 'bg-stone-100 text-stone-900 border-stone-200 hover:bg-stone-200'
                        : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {b.is_active ? 'TẠM ẨN' : 'BẬT HIỂN THỊ'}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenModal(b)}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-900 rounded-none font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      SỬA
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBanner(b)}
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

      {/* MODAL THÊM / SỬA BANNER */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-white rounded-none max-w-2xl w-full p-6 shadow-2xl border border-stone-200/80 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-stone-200/80 pb-3">
              <h2 className="text-sm font-heading font-bold text-stone-900 uppercase tracking-wider">
                {editingBanner ? 'CHỈNH SỬA BANNER QUẢNG CÁO' : 'THÊM BANNER QUẢNG CÁO MỚI'}
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
                    Tiêu đề Banner <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Bộ Sưu Tập Sofa Ý 2026"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-none focus:outline-none focus:border-amber-800 bg-white text-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1 uppercase tracking-wider">Dòng Phụ đề (Subtitle)</label>
                  <input
                    type="text"
                    placeholder="VD: Ưu đãi giảm ngay 15% khi đặt trước"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-none focus:outline-none focus:border-amber-800 bg-white text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                  <span>Hình ảnh Banner <span className="text-red-600">*</span></span>
                  <span className="text-[10px] text-stone-400 font-normal">JPG, PNG, WEBP (Dưới 15MB)</span>
                </label>

                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                    <label className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-900 border border-stone-300 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center shrink-0">
                      Chọn ảnh từ máy tính
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerImageFileChange}
                        className="hidden"
                      />
                    </label>

                    <div className="relative flex-1">
                      <input
                        type="text"
                        required
                        placeholder="Hoặc dán URL ảnh từ Web (https://...)"
                        value={formData.image_url}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-none text-xs focus:outline-none focus:border-amber-800 bg-white text-stone-900"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Gợi ý ảnh mẫu nhanh:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {sampleImages.map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFormData({ ...formData, image_url: s.url })}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 rounded-none text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {formData.image_url && (
                    <div className="rounded-none overflow-hidden border border-stone-200 h-32 sm:h-36 bg-stone-100 relative shadow-2xs">
                      <img
                        src={formData.image_url}
                        alt="Banner Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Link Picker */}
              <div className="bg-stone-50 p-4 rounded-none border border-stone-200 space-y-3">
                <label className="block font-bold text-stone-900 uppercase tracking-wider">
                  Đích Đến Khi Nhấp Vào Banner (Link URL)
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {[
                    { type: 'all', label: 'TẤT CẢ SP' },
                    { type: 'product', label: 'SẢN PHẨM' },
                    { type: 'category', label: 'DANH MỤC' },
                    { type: 'combo', label: 'COMBO' },
                    { type: 'custom', label: 'TỰ NHẬP' },
                  ].map((btn) => (
                    <button
                      key={btn.type}
                      type="button"
                      onClick={() => handleLinkTargetTypeChange(btn.type)}
                      className={`px-2.5 py-1.5 rounded-none text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                        linkTargetType === btn.type
                          ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {linkTargetType === 'product' && (
                  <div>
                    <label className="block text-[10px] font-bold text-stone-700 mb-1 uppercase tracking-wider">Chọn sản phẩm đích:</label>
                    <select
                      value={String(selectedProduct)}
                      onChange={handleProductSelect}
                      className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-none font-bold text-xs text-stone-900 cursor-pointer"
                    >
                      {productList.map((p) => (
                        <option key={p.id} value={String(p.id)}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {linkTargetType === 'category' && (
                  <div>
                    <label className="block text-[10px] font-bold text-stone-700 mb-1 uppercase tracking-wider">Chọn danh mục đích:</label>
                    <select
                      value={String(selectedCategory)}
                      onChange={handleCategorySelect}
                      className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-none font-bold text-xs text-stone-900 cursor-pointer"
                    >
                      {categoryList.map((c) => (
                        <option key={c.id || c.slug} value={c.slug || c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {linkTargetType === 'combo' && (
                  <div>
                    <label className="block text-[10px] font-bold text-stone-700 mb-1 uppercase tracking-wider">Chọn Combo khuyến mãi đích:</label>
                    <select
                      value={String(selectedCombo)}
                      onChange={handleComboSelect}
                      className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-none font-bold text-xs text-stone-900 cursor-pointer"
                    >
                      {comboList.map((cb) => (
                        <option key={cb.id} value={String(cb.id)}>
                          {cb.name} ({cb.discount_percent}% OFF)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <input
                    type="text"
                    placeholder="VD: /products?category=sofa"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-stone-200 rounded-none font-mono text-[11px] focus:outline-none focus:border-amber-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1 uppercase tracking-wider">Thứ tự hiển thị</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-none font-mono font-bold text-center focus:outline-none focus:border-amber-800 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1 uppercase tracking-wider">Ngày bắt đầu</label>
                  <input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-none focus:outline-none focus:border-amber-800 bg-white text-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1 uppercase tracking-wider">Ngày kết thúc</label>
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-none focus:outline-none focus:border-amber-800 bg-white text-stone-900"
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-700 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-amber-800 rounded-none border-stone-300"
                  />
                  <span>Bật trạng thái hiển thị banner ngay lập tức</span>
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
                  {submitting ? 'ĐANG LƯU...' : editingBanner ? 'CẬP NHẬT BANNER' : 'THÊM BANNER MỚI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminBannersPage
