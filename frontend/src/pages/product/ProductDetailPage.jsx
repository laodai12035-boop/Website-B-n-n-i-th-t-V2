import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import productService from '@/services/productService'
import { useCompare } from '@/contexts/CompareContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { useCart } from '@/contexts/CartContext'

import RelatedProducts from '@/components/product/RelatedProducts'
import ProductReviews from '@/components/product/ProductReviews'

/**
 * ProductDetailPage — Trang Chi tiết sản phẩm.
 * Hiển thị đầy đủ thông số, giá, mô tả, đánh giá, tồn kho và nút mua hàng.
 */
const ProductDetailPage = () => {
  const { id } = useParams()
  const { isComparing, addToCompare, removeFromCompare } = useCompare()
  const { isWishlisted, toggleWishlist } = useWishlist()
  const { addToCart, buyNow } = useCart()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedImage, setSelectedImage] = useState('')
  const [quantity, setQuantity] = useState(1)

  const [cartError, setCartError] = useState('')
  const [cartSuccess, setCartSuccess] = useState('')

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
    setCartError('')
    try {
      await buyNow(product, quantity)
      navigate('/checkout')
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể thực hiện Mua ngay'
      setCartError(msg)
      setTimeout(() => setCartError(''), 4000)
    }
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
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="aspect-4/3 bg-gray-200 rounded-2xl"></div>
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-10 bg-gray-200 rounded w-1/2"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto w-full p-6 text-center my-auto">
          <div className="bg-white rounded-3xl p-12 border border-gray-100 shadow-sm max-w-md mx-auto">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-display font-bold text-gray-900 mb-2">Sản phẩm không tồn tại</h2>
            <p className="text-sm text-gray-500 mb-6">{error || 'Rất tiếc, sản phẩm này không còn tồn tại hoặc đã bị ngừng kinh doanh.'}</p>
            <Link to="/products" className="btn-primary text-sm px-5 py-2.5">
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 animate-fade-in">

        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-6 overflow-x-auto">
          <Link to="/" className="hover:text-primary-600">Trang chủ</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-primary-600">Sản phẩm</Link>
          <span>/</span>
          <Link to={`/products?category=${product.category}`} className="uppercase hover:text-primary-600">
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-gray-900 truncate max-w-xs">{product.name}</span>
        </nav>

        {/* Product Details Main Container */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">

          {/* Left Column: Image Gallery Display */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-gray-100 border border-gray-100">
              <img
                src={product.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc'}
                alt={product.name}
                className="w-full h-full object-cover"
              />

              {hasDiscount && (
                <span className="absolute top-4 left-4 bg-red-500 text-white font-bold text-xs px-3 py-1 rounded-full shadow-sm">
                  Giảm {discountPercent}%
                </span>
              )}

              {product.stock <= 0 && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                  <span className="bg-gray-900 text-white font-semibold text-sm px-4 py-2 rounded-full">
                    Hết hàng
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Product Specs & Actions */}
          <div className="lg:col-span-6 flex flex-col justify-between">
            <div>
              {/* Rating badge & Category */}
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                  {product.category}
                </span>
                <button
                  type="button"
                  onClick={() => document.getElementById('product-reviews')?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 px-3 py-1 rounded-full text-xs font-semibold text-amber-800 transition-colors"
                  title="Xem tất cả đánh giá"
                >
                  <span>⭐</span> {product.rating ? Number(product.rating).toFixed(1) : '5.0'}
                  <span className="text-gray-400 font-normal">({product.rating_count || 0} lượt đánh giá)</span>
                </button>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 mb-4">
                {product.name}
              </h1>

              {/* Price Display */}
              <div className="bg-gray-50/70 p-4 rounded-2xl mb-6 border border-gray-100 flex items-baseline gap-3">
                <span className="text-3xl font-bold text-red-600">
                  {formatCurrency(product.discount_price || product.price)}
                </span>
                {hasDiscount && (
                  <span className="text-base text-gray-400 line-through">
                    {formatCurrency(product.price)}
                  </span>
                )}
              </div>

              {/* Specs Box */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 mb-6 text-xs">
                <div>
                  <span className="text-gray-400 block font-medium mb-0.5">Chất liệu:</span>
                  <span className="font-semibold text-gray-800">{product.material || 'Gỗ tự nhiên cao cấp'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium mb-0.5">Kích thước:</span>
                  <span className="font-semibold text-gray-800 font-mono">{product.dimensions || 'Đang cập nhật'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium mb-0.5">Trạng thái tồn kho:</span>
                  {product.stock > 0 ? (
                    <span className="font-bold text-emerald-600">Còn hàng ({product.stock} sản phẩm)</span>
                  ) : (
                    <span className="font-bold text-red-600">Hết hàng</span>
                  )}
                </div>
                <div>
                  <span className="text-gray-400 block font-medium mb-0.5">Bảo hành:</span>
                  <span className="font-semibold text-gray-800">24 tháng chính hãng</span>
                </div>
              </div>
            </div>

            {/* Quantity Selector & Action Buttons */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Số lượng:</span>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || product.stock <= 0}
                    className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="px-4 py-1.5 text-sm font-bold text-gray-900 font-mono">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock || product.stock <= 0}
                    className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Cart Banners */}
              {cartSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-semibold flex items-center gap-2 animate-fade-in">
                  <span>✅</span> {cartSuccess}
                </div>
              )}
              {cartError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2 animate-fade-in">
                  <span>⚠️</span> {cartError}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  className="flex-1 bg-amber-700 hover:bg-amber-800 text-white font-bold py-3.5 px-5 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none text-xs sm:text-sm"
                >
                  <span>🛒</span> {product.stock <= 0 ? 'Hết hàng' : 'Thêm vào giỏ hàng'}
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={product.stock <= 0}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold py-3.5 px-5 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 disabled:shadow-none active:scale-98 text-xs sm:text-sm"
                >
                  <span>⚡</span> Mua ngay
                </button>

                {/* Wishlist Button */}
                <button
                  type="button"
                  onClick={() => toggleWishlist(product)}
                  title={isWishlisted(product.id) ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isWishlisted(product.id)
                      ? 'bg-red-50 border-red-200 text-red-600'
                      : 'bg-white border-gray-200 text-gray-600 hover:text-red-500 hover:border-red-200'
                  }`}
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </button>

                {/* Compare Toggle Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (isComparing(product.id)) {
                      removeFromCompare(product.id)
                    } else {
                      addToCompare(product)
                    }
                  }}
                  title={isComparing(product.id) ? 'Bỏ so sánh' : 'Thêm vào so sánh'}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isComparing(product.id)
                      ? 'bg-amber-100 border-amber-300 text-amber-800 font-bold'
                      : 'bg-white border-gray-200 text-gray-600 hover:text-amber-700'
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

        {/* Detailed Product Description & Customer Policies */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
          <h2 className="text-lg font-display font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
            Mô tả chi tiết sản phẩm
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line mb-8">
            {product.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-100 text-center">
            <div className="p-4 rounded-2xl bg-gray-50">
              <div className="w-10 h-10 bg-amber-100 text-amber-800 rounded-xl flex items-center justify-center mx-auto mb-2 font-bold">
                🚚
              </div>
              <h4 className="text-xs font-bold text-gray-900">Giao hàng tận nơi</h4>
              <p className="text-[11px] text-gray-500 mt-1">Miễn phí vận chuyển nội thành cho đơn hàng từ 5tr</p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50">
              <div className="w-10 h-10 bg-amber-100 text-amber-800 rounded-xl flex items-center justify-center mx-auto mb-2 font-bold">
                🛡️
              </div>
              <h4 className="text-xs font-bold text-gray-900">Bảo hành 24 tháng</h4>
              <p className="text-[11px] text-gray-500 mt-1">Cam kết chất lượng gỗ và da chính hãng</p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50">
              <div className="w-10 h-10 bg-amber-100 text-amber-800 rounded-xl flex items-center justify-center mx-auto mb-2 font-bold">
                🔄
              </div>
              <h4 className="text-xs font-bold text-gray-900">Đổi trả 7 ngày</h4>
              <p className="text-[11px] text-gray-500 mt-1">Hoàn tiền 100% nếu phát hiện lỗi từ nhà sản xuất</p>
            </div>
          </div>
        </div>

        {/* Related & Recommended Products */}
        <RelatedProducts productId={product.id} />

        {/* Product Reviews & Rating (QTN-06) */}
        <ProductReviews productId={product.id} />

      </main>
    </div>
  )
}

export default ProductDetailPage
