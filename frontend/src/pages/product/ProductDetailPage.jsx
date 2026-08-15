import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import productService from '@/services/productService'
import { useCompare } from '@/contexts/CompareContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'

import RelatedProducts from '@/components/product/RelatedProducts'
import ProductReviews from '@/components/product/ProductReviews'
import ComboSection from '@/components/product/ComboSection'

/**
 * ProductDetailPage — Trang Chi tiết sản phẩm phong cách Nhà Xinh (nhaxinh.com).
 * Tối giản, gallery thumbnail, Accordion thông tin, nút Mua ngay Solid & Thêm giỏ hàng Outline.
 */
const ProductDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isComparing, addToCompare, removeFromCompare } = useCompare()
  const { isWishlisted, toggleWishlist } = useWishlist()
  const { addToCart } = useCart()
  const { isAuthenticated } = useAuth()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedImage, setSelectedImage] = useState('')
  const [quantity, setQuantity] = useState(1)

  const [cartError, setCartError] = useState('')
  const [cartSuccess, setCartSuccess] = useState('')

  // Accordion open/close state (Mục 1 mở mặc định)
  const [openAccordion, setOpenAccordion] = useState({
    details: true,
    warranty: false,
    shipping: false,
  })

  const toggleAccordionSection = (key) => {
    setOpenAccordion((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleAddToCart = async () => {
    if (!product) return
    setCartError('')
    setCartSuccess('')
    try {
      await addToCart(product, quantity)
      setCartSuccess(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`)
      setTimeout(() => setCartSuccess(''), 3000)
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể thêm sản phẩm vào giỏ hàng'
      setCartError(msg)
      setTimeout(() => setCartError(''), 4000)
    }
  }

  const handleBuyNow = async () => {
    if (!product) return
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để thực hiện Mua ngay!')
      navigate('/login')
      return
    }
    if (product.stock <= 0) return
    navigate('/checkout', { state: { buyNowItem: { product, quantity } } })
  }

  const formatCurrency = (val) => {
    if (!val) return '0đ'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  }

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await productService.getProductById(id)
        setProduct(data)
        if (data?.image_url) {
          setSelectedImage(data.image_url)
        }
      } catch (err) {
        console.error('Error fetching product detail:', err)
        setError(err.response?.data?.message || 'Sản phẩm không tồn tại hoặc đã bị ngừng bán.')
        setProduct(null)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchProduct()
    }
  }, [id])

  const inCompare = product ? isComparing(product.id) : false

  const handleToggleCompare = () => {
    if (!product) return
    if (inCompare) {
      removeFromCompare(product.id)
    } else {
      addToCompare(product)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white p-8 rounded-none border border-stone-200 shadow-2xs">
            <div className="lg:col-span-6 aspect-[4/5] bg-stone-200 rounded-none"></div>
            <div className="lg:col-span-6 space-y-4">
              <div className="h-6 bg-stone-200 rounded-none w-1/4"></div>
              <div className="h-8 bg-stone-200 rounded-none w-3/4"></div>
              <div className="h-10 bg-stone-200 rounded-none w-1/2"></div>
              <div className="h-24 bg-stone-200 rounded-none"></div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto w-full p-6 text-center my-auto">
          <div className="bg-white rounded-none p-12 border border-stone-200 shadow-2xs max-w-md mx-auto">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-none flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-heading font-bold text-stone-900 mb-2">Sản phẩm không tồn tại</h2>
            <p className="text-sm text-stone-500 mb-6">{error || 'Rất tiếc, sản phẩm này không còn tồn tại hoặc đã bị ngừng kinh doanh.'}</p>
            <Link to="/products" className="bg-stone-900 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-none inline-block">
              Quay lại danh sách sản phẩm
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const hasDiscount = product.discount_price && Number(product.discount_price) < Number(product.price)
  const discountPercent = hasDiscount
    ? Math.round(((Number(product.price) - Number(product.discount_price)) / Number(product.price)) * 100)
    : 0

  // Danh sách ảnh gallery (Ảnh chính + ảnh bổ sung)
  const galleryImages = [
    product.image_url,
    ...(product.images || [
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80',
    ])
  ].filter(Boolean)

  const activeMainImg = selectedImage || product.image_url

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 animate-fade-in">

        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-medium text-stone-500 mb-6 overflow-x-auto scrollbar-none">
          <Link to="/" className="hover:text-amber-800 transition-colors">Trang chủ</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-amber-800 transition-colors">Sản phẩm</Link>
          <span>/</span>
          <Link to={`/products?category=${product.category}`} className="uppercase hover:text-amber-800 transition-colors">
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-stone-900 truncate max-w-xs font-semibold">{product.name}</span>
        </nav>

        {/* Product Details Main Container (Vuông vức sắc nét) */}
        <div className="bg-white rounded-none border border-stone-200/80 shadow-2xs p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-10 mb-10">

          {/* Left Column: Image Gallery Display (Ảnh chính 4:5 + Strip Thumbnails) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative aspect-[4/5] rounded-none overflow-hidden bg-stone-100 border border-stone-200/80">
              <img
                src={activeMainImg}
                alt={product.name}
                className="w-full h-full object-cover transition-all duration-300"
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc'
                }}
              />

              {/* Badge giảm giá Terracotta/Amber theo MASTER.md */}
              {hasDiscount && (
                <span className="absolute top-4 left-4 bg-amber-800 text-white font-bold text-xs px-3 py-1 rounded-none shadow-2xs tracking-wide">
                  Giảm {discountPercent}%
                </span>
              )}

              {product.stock <= 0 && (
                <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-[2px] flex items-center justify-center">
                  <span className="bg-stone-900 text-amber-400 font-semibold text-xs px-4 py-2 rounded-none border border-amber-500/30">
                    Tạm hết hàng
                  </span>
                </div>
              )}
            </div>

            {/* Gallery Thumbnail Strip (Click đổi ảnh chính, border accent khi chọn) */}
            {galleryImages.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
                {galleryImages.slice(0, 4).map((img, idx) => {
                  const isSelected = activeMainImg === img
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImage(img)}
                      className={`w-20 h-20 rounded-none overflow-hidden border-2 transition-all cursor-pointer shrink-0 bg-stone-100 ${
                        isSelected ? 'border-amber-800 scale-105 shadow-2xs' : 'border-stone-200/80 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right Column: Product Specs & Actions */}
          <div className="lg:col-span-6 flex flex-col justify-between">
            <div>
              {/* Rating badge & Category */}
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">
                  {product.category}
                </span>
                <button
                  type="button"
                  onClick={() => document.getElementById('product-reviews')?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 px-3 py-1 rounded-none text-xs font-medium text-stone-800 transition-colors cursor-pointer"
                  title="Xem tất cả đánh giá"
                >
                  <svg className="w-3.5 h-3.5 text-amber-500 fill-amber-500" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="font-bold text-stone-900">{product.rating ? Number(product.rating).toFixed(1) : '5.0'}</span>
                  <span className="text-stone-400 font-normal">({product.rating_count || 0} lượt đánh giá)</span>
                </button>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-heading font-bold text-stone-900 mb-4 leading-snug">
                {product.name}
              </h1>

              {/* Price Display (Accent Color) */}
              <div className="py-3 border-y border-stone-200/80 mb-6 flex items-baseline gap-3">
                <span className="text-3xl font-bold text-amber-800">
                  {formatCurrency(product.discount_price || product.price)}
                </span>
                {hasDiscount && (
                  <span className="text-base text-stone-400 line-through">
                    {formatCurrency(product.price)}
                  </span>
                )}
              </div>

              {/* Minimal Specs List (Đường kẻ mảnh phân cách tối giản chuẩn Nhà Xinh) */}
              <div className="space-y-3 mb-6 text-xs text-stone-800">
                <div className="flex justify-between py-2 border-b border-stone-100">
                  <span className="text-stone-500 font-medium">Chất liệu:</span>
                  <span className="font-semibold text-stone-900">{product.material || 'Gỗ tự nhiên cao cấp'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-stone-100">
                  <span className="text-stone-500 font-medium">Kích thước:</span>
                  <span className="font-semibold text-stone-900 font-mono">{product.dimensions || 'Đang cập nhật'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-stone-100">
                  <span className="text-stone-500 font-medium">Trạng thái tồn kho:</span>
                  {product.stock > 0 ? (
                    <span className="font-bold text-emerald-700">Còn hàng ({product.stock} sản phẩm)</span>
                  ) : (
                    <span className="font-bold text-red-600">Hết hàng</span>
                  )}
                </div>
                <div className="flex justify-between py-2 border-b border-stone-100">
                  <span className="text-stone-500 font-medium">Bảo hành:</span>
                  <span className="font-semibold text-amber-800">
                    {product.warranty_months !== undefined && product.warranty_months !== null
                      ? `${product.warranty_months} tháng chính hãng`
                      : '12 tháng chính hãng'}
                  </span>
                </div>
              </div>

              {/* Accordion 3 Mục Tối Giản (Chi tiết / Bảo hành / Giao hàng & Lắp đặt) */}
              <div className="border border-stone-200/80 rounded-none mb-6 divider-y divider-stone-200">
                
                {/* Mục 1: Chi tiết sản phẩm (Gom mô tả chi tiết vào đây) */}
                <div className="border-b border-stone-200/80">
                  <button
                    type="button"
                    onClick={() => toggleAccordionSection('details')}
                    className="w-full py-3.5 px-4 flex items-center justify-between text-xs font-bold text-stone-900 uppercase tracking-wider text-left bg-stone-50/50 hover:bg-stone-100 transition-colors"
                  >
                    <span>Mô tả chi tiết sản phẩm</span>
                    <span className="text-base font-mono">{openAccordion.details ? '−' : '+'}</span>
                  </button>
                  {openAccordion.details && (
                    <div className="p-4 text-xs text-stone-600 leading-relaxed space-y-2 bg-white">
                      <p className="whitespace-pre-line">{product.description}</p>
                    </div>
                  )}
                </div>

                {/* Mục 2: Bảo hành & Bảo trì */}
                <div className="border-b border-stone-200/80">
                  <button
                    type="button"
                    onClick={() => toggleAccordionSection('warranty')}
                    className="w-full py-3.5 px-4 flex items-center justify-between text-xs font-bold text-stone-900 uppercase tracking-wider text-left bg-stone-50/50 hover:bg-stone-100 transition-colors"
                  >
                    <span>Chính sách Bảo hành ({product.warranty_months || 12} Tháng)</span>
                    <span className="text-base font-mono">{openAccordion.warranty ? '−' : '+'}</span>
                  </button>
                  {openAccordion.warranty && (
                    <div className="p-4 text-xs text-stone-600 leading-relaxed bg-white">
                      <p>{product.warranty_terms || 'Bảo hành chính hãng cho các lỗi kỹ thuật và kết cấu khung gỗ từ nhà sản xuất trong vòng 12-24 tháng.'}</p>
                    </div>
                  )}
                </div>

                {/* Mục 3: Giao hàng & Lắp đặt */}
                <div>
                  <button
                    type="button"
                    onClick={() => toggleAccordionSection('shipping')}
                    className="w-full py-3.5 px-4 flex items-center justify-between text-xs font-bold text-stone-900 uppercase tracking-wider text-left bg-stone-50/50 hover:bg-stone-100 transition-colors"
                  >
                    <span>Giao hàng & Lắp đặt tận nhà</span>
                    <span className="text-base font-mono">{openAccordion.shipping ? '−' : '+'}</span>
                  </button>
                  {openAccordion.shipping && (
                    <div className="p-4 text-xs text-stone-600 leading-relaxed space-y-1.5 bg-white">
                      <p>• Miễn phí vận chuyển nội thành Hà Nội & TP. Hồ Chí Minh cho đơn hàng từ 5.000.000đ.</p>
                      <p>• Đội ngũ kỹ thuật viên chuyên nghiệp giao hàng và hỗ trợ lắp đặt miễn phí tại nhà.</p>
                      <p>• Hỗ trợ đổi trả trong vòng 7 ngày nếu có lỗi do vận chuyển hoặc sản xuất.</p>
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* Quantity Selector & Action Buttons (ĐẢO ĐỘ ƯU TIÊN: Mua ngay Solid Black, Thêm giỏ Outline) */}
            <div className="space-y-4 pt-4 border-t border-stone-200/80">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">Số lượng:</span>
                <div className="flex items-center border border-stone-300 rounded-none overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || product.stock <= 0}
                    className="px-3.5 py-1.5 text-stone-700 hover:bg-stone-100 disabled:opacity-40 font-bold"
                  >
                    -
                  </button>
                  <span className="px-4 py-1.5 text-xs font-bold text-stone-900 font-mono">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock || product.stock <= 0}
                    className="px-3.5 py-1.5 text-stone-700 hover:bg-stone-100 disabled:opacity-40 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Cart Alert Banners */}
              {cartSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-none text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-fade-in">
                  <svg className="w-4 h-4 text-emerald-600 fill-current" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{cartSuccess}</span>
                </div>
              )}
              {cartError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-none text-xs text-red-800 font-semibold flex items-center gap-2 animate-fade-in">
                  <svg className="w-4 h-4 text-red-600 fill-current" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{cartError}</span>
                </div>
              )}

              {/* ACTION BUTTONS (Định dạng chuẩn nhaxinh.com: Mua Ngay Solid, Thêm Giỏ Outline) */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                
                {/* 1. MUA NGAY (Hành động chính: Nút Solid Đen/Nâu sẫm) */}
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={product.stock <= 0}
                  className="flex-1 bg-stone-900 hover:bg-amber-800 text-white font-bold py-3.5 px-6 rounded-none transition-all shadow-sm flex items-center justify-center gap-2.5 disabled:bg-stone-200 disabled:text-stone-400 text-xs uppercase tracking-wider cursor-pointer"
                >
                  {/* SVG Icon Tia Sét Căn Giữa Chuẩn */}
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                  <span>MUA NGAY</span>
                </button>

                {/* 2. THÊM VÀO GIỎ HÀNG (Hành động phụ: Nút Outline) */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  className="flex-1 border border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white font-bold py-3.5 px-6 rounded-none transition-all flex items-center justify-center gap-2.5 disabled:border-stone-200 disabled:text-stone-400 text-xs uppercase tracking-wider cursor-pointer"
                >
                  {/* SVG Icon Giỏ Hàng (Shopping Bag) */}
                  <svg className="w-4 h-4 stroke-current shrink-0" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <span>{product.stock <= 0 ? 'Hết hàng' : 'Thêm vào giỏ hàng'}</span>
                </button>

                {/* Wishlist Button */}
                <button
                  type="button"
                  onClick={() => toggleWishlist(product)}
                  title={isWishlisted(product.id) ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'}
                  className={`p-3.5 rounded-none border transition-all cursor-pointer ${
                    isWishlisted(product.id)
                      ? 'bg-red-50 border-red-200 text-red-600'
                      : 'bg-white border-stone-200 text-stone-700 hover:text-red-500'
                  }`}
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </button>

                {/* Compare Toggle Button */}
                <button
                  type="button"
                  onClick={handleToggleCompare}
                  title={inCompare ? 'Bỏ so sánh' : 'Thêm vào so sánh'}
                  className={`p-3.5 rounded-none border transition-all cursor-pointer ${
                    inCompare
                      ? 'bg-amber-800 text-white border-amber-800'
                      : 'bg-white border-stone-200 text-stone-700 hover:text-amber-800'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* Furniture Combo Offer Section */}
        <ComboSection productId={product.id} />

        {/* Related & Recommended Products */}
        <RelatedProducts productId={product.id} />

        {/* Product Reviews & Rating */}
        <ProductReviews productId={product.id} />

      </main>
    </div>
  )
}

export default ProductDetailPage
