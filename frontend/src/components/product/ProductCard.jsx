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
          <span className="text-[11px] font-semibold text-primary-600 uppercase tracking-wider block mb-1">
            {product.category || 'Nội thất'}
          </span>
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
