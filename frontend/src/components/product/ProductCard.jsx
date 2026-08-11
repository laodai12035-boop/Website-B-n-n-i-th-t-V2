import { Link } from 'react-router-dom'

/**
 * ProductCard — Thẻ hiển thị sản phẩm nội thất.
 */
const ProductCard = ({ product }) => {
  const formatCurrency = (val) => {
    if (!val) return '0đ'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  }

  const hasDiscount = product.discount_price && Number(product.discount_price) < Number(product.price)
  const discountPercent = hasDiscount
    ? Math.round(((Number(product.price) - Number(product.discount_price)) / Number(product.price)) * 100)
    : 0

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full">

      {/* Image Container */}
      <div className="relative aspect-4/3 overflow-hidden bg-gray-100">
        <img
          src={product.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Discount Badge */}
        {hasDiscount && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
            -{discountPercent}%
          </span>
        )}

        {/* Stock status badge */}
        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-gray-900/90 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              Hết hàng
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[11px] font-semibold text-primary-600 uppercase tracking-wider">
              {product.category || 'Nội thất'}
            </span>
            {/* Rating Display */}
            <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
              <svg className="w-3.5 h-3.5 text-amber-500 fill-amber-500" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs font-bold text-amber-800">
                {product.rating ? Number(product.rating).toFixed(1) : '5.0'}
              </span>
              {product.rating_count > 0 && (
                <span className="text-[10px] text-gray-400">({product.rating_count})</span>
              )}
            </div>
          </div>

          <h3 className="text-base font-display font-semibold text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {product.name}
          </h3>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {product.description}
          </p>
        </div>

        {/* Price & Action */}
        <div className="mt-4 pt-3 border-t border-gray-50 flex items-end justify-between gap-2">
          <div>
            {hasDiscount ? (
              <>
                <span className="text-lg font-bold text-red-600 block leading-tight">
                  {formatCurrency(product.discount_price)}
                </span>
                <span className="text-xs text-gray-400 line-through">
                  {formatCurrency(product.price)}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-gray-900 block leading-tight">
                {formatCurrency(product.price)}
              </span>
            )}
          </div>

          <Link
            to={`/products/${product.id}`}
            className="p-2.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-primary-600 hover:text-white transition-colors"
            title="Xem chi tiết"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>

      </div>

    </div>
  )
}

export default ProductCard
