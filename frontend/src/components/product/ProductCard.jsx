import { Link } from 'react-router-dom'
import { useCompare } from '@/contexts/CompareContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { useCart } from '@/contexts/CartContext'

/**
 * ProductCard — Thẻ sản phẩm chuẩn Luxury Furniture Design System.
 */
const ProductCard = ({ product }) => {
  const { isComparing, addToCompare, removeFromCompare } = useCompare()
  const { isWishlisted, toggleWishlist } = useWishlist()
  const { addToCart } = useCart()

  const inCompare = isComparing(product.id)
  const wishlisted = isWishlisted(product.id)

  const handleToggleCompare = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (inCompare) {
      removeFromCompare(product.id)
    } else {
      addToCompare(product)
    }
  }

  const handleToggleWishlist = (e) => {
    e.preventDefault()
    e.stopPropagation()
    toggleWishlist(product)
  }

  const handleAddToCart = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    await addToCart(product, 1)
  }

  const formatCurrency = (val) => {
    if (!val) return '0đ'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  }

  const hasDiscount = product.discount_price && Number(product.discount_price) < Number(product.price)
  const discountPercent = hasDiscount
    ? Math.round(((Number(product.price) - Number(product.discount_price)) / Number(product.price)) * 100)
    : 0

  return (
    <div className="group bg-white rounded-2xl border border-stone-200/80 shadow-sm hover:shadow-card-hover transition-all duration-300 overflow-hidden flex flex-col h-full hover:-translate-y-1">

      {/* Image Container */}
      <Link to={`/products/${product.id}`} className="relative aspect-4/3 overflow-hidden bg-stone-100 block group/img">
        <img
          src={product.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc'}
          alt={product.name}
          className="w-full h-full object-cover group-hover/img:scale-108 transition-transform duration-700 ease-out"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null
            e.target.src = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc'
          }}
        />

        {/* Overlay gradient subtle */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badges & Actions overlay */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div>
            {hasDiscount ? (
              <span className="bg-amber-800 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm tracking-wide">
                -{discountPercent}%
              </span>
            ) : (
              <span className="bg-stone-900/80 backdrop-blur-md text-stone-100 text-[10px] uppercase tracking-widest font-semibold px-2.5 py-1 rounded-full border border-white/20">
                {product.category || 'Nội thất'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Wishlist Heart Button */}
            <button
              onClick={handleToggleWishlist}
              title={wishlisted ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'}
              className={`p-2 rounded-full transition-all duration-300 shadow-sm cursor-pointer ${
                wishlisted
                  ? 'bg-red-500 text-white scale-105'
                  : 'bg-white/90 hover:bg-white text-stone-700 hover:text-red-500 backdrop-blur-md'
              }`}
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </button>

            {/* Compare Checkbox Button */}
            <button
              onClick={handleToggleCompare}
              title={inCompare ? 'Bỏ so sánh' : 'Thêm vào so sánh'}
              className={`p-2 rounded-full transition-all duration-300 shadow-sm cursor-pointer ${
                inCompare
                  ? 'bg-amber-800 text-white'
                  : 'bg-white/90 hover:bg-white text-stone-700 hover:text-amber-800 backdrop-blur-md'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stock status badge */}
        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-stone-900 text-amber-400 text-xs font-semibold px-4 py-1.5 rounded-full border border-amber-500/30">
              Tạm hết hàng
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-widest">
              {product.category || 'Nội thất'}
            </span>
            {/* Rating Display */}
            <div className="flex items-center gap-1 bg-amber-50/80 px-2.5 py-0.5 rounded-full border border-amber-200/50">
              <svg className="w-3.5 h-3.5 text-amber-600 fill-amber-500" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs font-bold text-amber-900">
                {product.rating ? Number(product.rating).toFixed(1) : '5.0'}
              </span>
              {product.rating_count > 0 && (
                <span className="text-[10px] text-stone-400">({product.rating_count})</span>
              )}
            </div>
          </div>

          <h3 className="text-lg font-serif font-bold text-stone-900 line-clamp-2 leading-snug group-hover:text-amber-800 transition-colors">
            <Link to={`/products/${product.id}`} className="cursor-pointer">{product.name}</Link>
          </h3>
          <p className="text-xs text-stone-500 mt-1.5 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price & Action */}
        <div className="mt-5 pt-3.5 border-t border-stone-100 flex items-end justify-between gap-2">
          <div>
            {hasDiscount ? (
              <>
                <span className="text-lg font-bold text-amber-800 block leading-tight">
                  {formatCurrency(product.discount_price)}
                </span>
                <span className="text-xs text-stone-400 line-through">
                  {formatCurrency(product.price)}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-stone-900 block leading-tight">
                {formatCurrency(product.price)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className={`p-2.5 rounded-xl transition-all duration-200 shadow-sm flex items-center justify-center cursor-pointer ${
                product.stock <= 0
                  ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                  : 'bg-stone-900 hover:bg-amber-800 text-white active:scale-95'
              }`}
              title={product.stock <= 0 ? 'Hết hàng' : 'Thêm vào giỏ hàng'}
            >
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </button>

            <Link
              to={`/products/${product.id}`}
              className="p-2.5 rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors cursor-pointer"
              title="Xem chi tiết"
            >
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>

      </div>

    </div>
  )
}

export default ProductCard
