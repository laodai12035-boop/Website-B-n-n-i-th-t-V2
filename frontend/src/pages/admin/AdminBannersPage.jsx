import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import AdminQuickSearch from '@/components/admin/AdminQuickSearch'
import bannerService from '@/services/bannerService'
import productService from '@/services/productService'
import categoryService from '@/services/categoryService'
import comboService from '@/services/comboService'
import FormAlert from '@/components/ui/FormAlert'

/**
 * AdminBannersPage — Trang Quản lý Banner Quảng Cáo Trang Chủ (NT-11-CN-001).
 * Tuyến đường: /admin/banners
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
    { label: 'Bộ Sưu Tập Sofa 2026', url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Ưu Đãi Nội Thất Phòng Ngủ', url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Không Gian Phòng Ăn Sang Trọng', url: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80' },
  ]

  const fetchBanners = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await bannerService.getAdminBanners()
      setBanners(data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể nạp danh sách banner quảng cáo.')
    } finally {
      setLoading(false)
    }
  }

  const fetchOptions = async () => {
    try {
      const [prods, cats, combos] = await Promise.all([
        productService.getProducts().catch(() => ({ products: [] })),
        categoryService.getCategories().catch(() => []),
        comboService.getCombos().catch(() => []),
      ])
      const pArr = prods.products || prods || []
      setProductList(pArr)
      setCategoryList(cats || [])
      setComboList(combos || [])
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchBanners()
    fetchOptions()
  }, [])

  const handleBannerImageFileChange = (e) => {
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
        const MAX_WIDTH = 1200
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

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8)
        setFormData((prev) => ({ ...prev, image_url: compressedBase64 }))
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }

  const handleLinkTargetTypeChange = (type) => {
    setLinkTargetType(type)
    if (type === 'all') {
      setFormData((prev) => ({ ...prev, link_url: '/products' }))
    } else if (type === 'product' && productList.length > 0) {
      const pId = selectedProduct || productList[0].id
      setSelectedProduct(pId)
      setFormData((prev) => ({ ...prev, link_url: `/products/${pId}` }))
    } else if (type === 'category' && categoryList.length > 0) {
      const catSlug = selectedCategory || categoryList[0].slug || categoryList[0].name
      setSelectedCategory(catSlug)
      setFormData((prev) => ({ ...prev, link_url: `/products?category=${catSlug}` }))
    } else if (type === 'combo' && comboList.length > 0) {
      const cId = selectedCombo || comboList[0].id
      setSelectedCombo(cId)
      setFormData((prev) => ({ ...prev, link_url: `/products?combo=${cId}` }))
    }
  }

  const handleProductSelect = (e) => {
    const pId = e.target.value
    setSelectedProduct(pId)
    setFormData((prev) => ({ ...prev, link_url: `/products/${pId}` }))
  }

  const handleCategorySelect = (e) => {
    const catSlug = e.target.value
    setSelectedCategory(catSlug)
    setFormData((prev) => ({ ...prev, link_url: `/products?category=${catSlug}` }))
  }

  const handleComboSelect = (e) => {
    const cId = e.target.value
    setSelectedCombo(cId)
    setFormData((prev) => ({ ...prev, link_url: `/products?combo=${cId}` }))
  }

  const handleOpenModal = (banner = null) => {
    setModalError(null)
    setLinkTargetType('custom')
    if (banner) {
      setEditingBanner(banner)
      setFormData({
        title: banner.title || '',
        subtitle: banner.subtitle || '',
        image_url: banner.image_url || '',
        link_url: banner.link_url || '',
        display_order: banner.display_order ?? 0,
        is_active: banner.is_active ?? true,
        start_date: banner.start_date ? banner.start_date.substring(0, 16) : '',
        end_date: banner.end_date ? banner.end_date.substring(0, 16) : '',
      })
    } else {
      setEditingBanner(null)
      setFormData({
        title: 'Bộ Sưu Tập Nội Thất Mới 2026',
        subtitle: 'Giảm giá lên đến 20% cho tất cả đơn hàng trọn bộ',
        image_url: sampleImages[0].url,
        link_url: '/products',
        display_order: banners.length + 1,
        is_active: true,
        start_date: '',
        end_date: '',
      })
      setLinkTargetType('all')
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingBanner(null)
    setModalError(null)
  }

  const handleSubmitForm = async (e) => {
    e.preventDefault()
    setModalError(null)

    // Validation (TC-02: Chưa chọn ảnh banner)
    if (!formData.image_url || !formData.image_url.trim()) {
      setModalError('Vui lòng chọn hoặc nhập đường dẫn hình ảnh banner (Bắt buộc).')
      return
    }

    setSubmitting(true)

    const payload = {
      title: formData.title.trim() || 'Banner Quảng Cáo',
      subtitle: formData.subtitle.trim() || null,
      image_url: formData.image_url.trim(),
      link_url: formData.link_url.trim() || null,
      display_order: parseInt(formData.display_order, 10) || 0,
      is_active: formData.is_active,
      start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
      end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
    }

    try {
      if (editingBanner) {
        await bannerService.updateBanner(editingBanner.id, payload)
        setSuccessMsg('Cập nhật banner quảng cáo thành công!')
      } else {
        await bannerService.createBanner(payload)
        setSuccessMsg('Thêm banner quảng cáo mới thành công!')
      }
      handleCloseModal()
      fetchBanners()
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err) {
      setModalError(err.response?.data?.message || 'Đã xảy ra lỗi khi lưu thông tin banner.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteBanner = async (banner) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa banner "${banner.title}" không?`)) return

    try {
      await bannerService.deleteBanner(banner.id)
      setSuccessMsg('Xóa banner quảng cáo thành công!')
      fetchBanners()
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể xóa banner quảng cáo.')
    }
  }

  const handleToggleActive = async (banner) => {
    try {
      await bannerService.updateBanner(banner.id, { is_active: !banner.is_active })
      setBanners((prev) =>
        prev.map((b) => (b.id === banner.id ? { ...b, is_active: !b.is_active } : b))
      )
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể cập nhật trạng thái banner.')
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Không giới hạn'
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
              <span className="text-gray-900 font-bold">Quản Lý Banner Quảng Cáo</span>
            </div>
            <h1 className="text-2xl font-display font-extrabold text-gray-900 flex items-center gap-2">
              <span>🖼️</span> Quản Lý Banner Quảng Cáo Trang Chủ (NT-11-CN-001)
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <AdminQuickSearch />
            <button
              type="button"
              onClick={() => handleOpenModal(null)}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
            >
              <span>+</span> Thêm Banner Mới
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

        {/* Banners Grid / List */}
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-xs space-y-3">
            <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="font-semibold">Đang nạp danh sách banner...</p>
          </div>
        ) : banners.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center text-gray-400 border border-gray-100 shadow-xs space-y-3">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-2xl mx-auto font-bold">
              🖼️
            </div>
            <p className="font-bold text-gray-800 text-base">Chưa có banner quảng cáo nào</p>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Hãy thêm banner đầu tiên để hiển thị các chương trình khuyến mãi và bộ sưu tập mới tới khách hàng trên trang chủ!
            </p>
            <button
              type="button"
              onClick={() => handleOpenModal(null)}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <span>+</span> Thêm Banner Ngay
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {banners.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden flex flex-col hover:shadow-md transition-shadow group"
              >
                {/* Banner Image Preview */}
                <div className="relative h-48 sm:h-56 bg-gray-100 overflow-hidden">
                  <img
                    src={b.image_url}
                    alt={b.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex flex-col justify-end p-4 text-white">
                    <span className="px-2.5 py-0.5 bg-black/40 backdrop-blur-md rounded-full text-[10px] font-bold w-fit mb-1 border border-white/20">
                      Thứ tự #{b.display_order}
                    </span>
                    <h3 className="text-base font-extrabold line-clamp-1">{b.title}</h3>
                    {b.subtitle && <p className="text-xs text-gray-200 line-clamp-1">{b.subtitle}</p>}
                  </div>

                  {/* Active Badge Top Right */}
                  <div className="absolute top-3 right-3">
                    {b.is_active ? (
                      <span className="px-2.5 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded-full shadow-xs flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                        Đang Hiển Thị
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-gray-600 text-gray-200 text-[10px] font-bold rounded-full shadow-xs">
                        Tạm Ẩn
                      </span>
                    )}
                  </div>
                </div>

                {/* Banner Info Details */}
                <div className="p-4 flex-1 flex flex-col justify-between gap-3 text-xs">
                  <div className="space-y-1.5 text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-400">🔗 Đích đến:</span>
                      <span className="font-mono text-gray-800 truncate">
                        {b.link_url || 'Không có liên kết'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-gray-500 font-medium">
                      <span>📅 Bắt đầu: {formatDate(b.start_date)}</span>
                      <span>🏁 Kết thúc: {formatDate(b.end_date)}</span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(b)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer border ${
                        b.is_active
                          ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      {b.is_active ? '⏸️ Tạm Ẩn' : '▶️ Bật Hiển Thị'}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenModal(b)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBanner(b)}
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

      {/* MODAL THÊM / SỬA BANNER */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <h2 className="text-lg font-display font-extrabold text-gray-900 flex items-center gap-2">
                <span>{editingBanner ? '✏️' : '✨'}</span>
                {editingBanner ? 'Chỉnh Sửa Banner Quảng Cáo' : 'Thêm Banner Quảng Cáo Mới'}
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
              {/* Tiêu đề & Phụ đề */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Tiêu đề Banner <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Bộ Sưu Tập Sofa Da Bò Ý 2026"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Dòng Phụ đề (Subtitle)</label>
                  <input
                    type="text"
                    placeholder="VD: Ưu đãi giảm ngay 15% khi đặt hàng trước"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all outline-none"
                  />
                </div>
              </div>

              {/* Hình ảnh Banner (Upload từ máy tính / Nhập URL / Gợi ý mẫu) */}
              <div>
                <label className="block font-bold text-gray-700 mb-1.5 flex items-center justify-between">
                  <span>🖼️ Hình ảnh Banner Quảng Cáo <span className="text-red-500">*</span></span>
                  <span className="text-[10px] text-gray-400 font-normal">Hỗ trợ JPG, PNG, WEBP (Tối đa 15MB)</span>
                </label>

                <div className="space-y-3">
                  {/* Controls: Chọn file từ PC hoặc Nhập URL */}
                  <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                    <label className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-2xs">
                      <span>📁</span> Chọn ảnh từ máy tính
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
                        className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all outline-none"
                      />
                      {formData.image_url && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, image_url: '' })}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 font-bold text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Quick Selection Samples */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Gợi ý ảnh mẫu nhanh:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {sampleImages.map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFormData({ ...formData, image_url: s.url })}
                          className="px-2.5 py-1 bg-gray-100 hover:bg-amber-50 hover:border-amber-200 text-gray-700 hover:text-amber-800 border border-gray-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          📷 {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live Preview Image */}
                  {formData.image_url && (
                    <div className="rounded-2xl overflow-hidden border border-gray-200 h-32 sm:h-36 bg-gray-100 relative shadow-2xs">
                      <img
                        src={formData.image_url}
                        alt="Banner Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc'
                        }}
                      />
                      <span className="absolute bottom-2.5 left-2.5 px-2.5 py-1 bg-black/65 backdrop-blur-xs text-white rounded-lg text-[10px] font-bold">
                        ✓ Xem trước ảnh banner
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Liên kết điều hướng (Link URL Picker) */}
              <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-200/80 space-y-3">
                <label className="block font-bold text-gray-800">
                  🎯 Đích Đến Khi Nhấp Vào Banner (Link URL)
                </label>

                {/* Target Type Selector Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleLinkTargetTypeChange('all')}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                      linkTargetType === 'all'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    🛒 Tất cả SP
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLinkTargetTypeChange('product')}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                      linkTargetType === 'product'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    🪑 Sản phẩm
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLinkTargetTypeChange('category')}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                      linkTargetType === 'category'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    📁 Danh mục
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLinkTargetTypeChange('combo')}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                      linkTargetType === 'combo'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    🧩 Combo
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLinkTargetTypeChange('custom')}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer col-span-2 sm:col-span-1 ${
                      linkTargetType === 'custom'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    🔗 Tự nhập
                  </button>
                </div>

                {/* Sub-selectors depending on target type */}
                {linkTargetType === 'product' && (
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Chọn sản phẩm đích:</label>
                    <select
                      value={selectedProduct}
                      onChange={handleProductSelect}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 outline-none text-xs"
                    >
                      {productList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {p.price_formatted || `${p.price}đ`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {linkTargetType === 'category' && (
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Chọn danh mục đích:</label>
                    <select
                      value={selectedCategory}
                      onChange={handleCategorySelect}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 outline-none text-xs"
                    >
                      {categoryList.map((c) => (
                        <option key={c.id || c.slug} value={c.slug || c.name}>
                          📁 {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {linkTargetType === 'combo' && (
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Chọn Combo khuyến mãi đích:</label>
                    <select
                      value={selectedCombo}
                      onChange={handleComboSelect}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 outline-none text-xs"
                    >
                      {comboList.length > 0 ? (
                        comboList.map((cb) => (
                          <option key={cb.id} value={cb.id}>
                            🧩 {cb.name} ({cb.discount_percent}% OFF)
                          </option>
                        ))
                      ) : (
                        <option value="1">🧩 Combo Nội Thất Tiết Kiệm</option>
                      )}
                    </select>
                  </div>
                )}

                {/* Standard Link URL text input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Đường dẫn thực tế:</span>
                  </div>
                  <input
                    type="text"
                    placeholder="VD: /products?category=sofa"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl font-mono text-[11px] focus:ring-2 focus:ring-amber-500 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Display Order, Start Date & End Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Thứ tự hiển thị</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-center focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Ngày bắt đầu</label>
                  <input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Ngày kết thúc</label>
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all outline-none"
                  />
                </div>
              </div>

              {/* Active Checkbox */}
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-amber-600 rounded-md focus:ring-amber-500 border-gray-300"
                  />
                  <span>Bật trạng thái hiển thị banner ngay lập tức</span>
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
                  {submitting ? 'Đang lưu...' : editingBanner ? 'Cập Nhật Banner' : 'Thêm Banner Mới'}
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
