import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCompare } from '@/contexts/CompareContext'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import productService from '@/services/productService'

/**
 * ProductComparePage — Trang Bảng so sánh thông số sản phẩm side-by-side (nhaxinh.com style).
 * Thiết kế vuông vức góc cạnh (rounded-none), bảng so sánh sản phẩm 2-4 mẫu tối giản sắc nét.
 */
const ProductComparePage = () => {
  const { compareItems, removeFromCompare, clearCompare } = useCompare()

  const [compareData, setCompareData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const formatCurrency = (val) => {
    if (!val) return '0đ'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  }

  useEffect(() => {
    const fetchCompareMatrix = async () => {
      if (compareItems.length < 2) {
        setCompareData(compareItems)
        return
      }

      setLoading(true)
      setError(null)
      try {
        const ids = compareItems.map((item) => item.id)
        const response = await productService.compareProducts(ids)
        setCompareData(response || compareItems)
      } catch (err) {
        console.error('Error comparing products:', err)
        setError(err.response?.data?.message || 'Đã xảy ra lỗi khi so sánh')
        setCompareData(compareItems)
      } finally {
        setLoading(false)
      }
    }

    fetchCompareMatrix()
  }, [compareItems])

  if (compareItems.length < 2) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto w-full p-6 text-center my-auto">
          <div className="bg-white rounded-none border border-stone-200/80 p-12 shadow-2xs max-w-md mx-auto">
            <div className="w-16 h-16 bg-stone-100 text-stone-400 rounded-none flex items-center justify-center mx-auto mb-4 border border-stone-200">
              <svg className="w-8 h-8 stroke-current" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-xl font-heading font-bold text-stone-900 mb-2 uppercase tracking-wider">CHƯA ĐỦ SẢN PHẨM ĐỂ SO SÁNH</h2>
            <p className="text-xs text-stone-500 mb-6 leading-relaxed">
              Bạn cần chọn ít nhất <strong>2 sản phẩm</strong> (tối đa 4 sản phẩm) để đối chiếu thông số kỹ thuật và giá cả.
            </p>
            <Link
              to="/products"
              className="px-8 py-3.5 bg-stone-900 hover:bg-amber-800 text-white font-bold text-xs uppercase tracking-wider rounded-none inline-block shadow-2xs transition-colors"
            >
              Quay lại danh sách sản phẩm
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 animate-fade-in">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-medium text-stone-500 mb-6">
          <Link to="/" className="hover:text-amber-800 transition-colors">Trang chủ</Link>
          <span>/</span>
          <span className="text-stone-900 font-semibold">Bảng so sánh sản phẩm</span>
        </nav>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-stone-200/80">
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-stone-900 uppercase tracking-wider">
              BẢNG SO SÁNH SẢN PHẨM
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Đối chiếu trực quan các thông số kỹ thuật, chất liệu, kích thước và giá bán giữa các sản phẩm nội thất
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={clearCompare}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Xóa tất cả
            </button>
            <Link
              to="/products"
              className="px-5 py-2 bg-stone-900 hover:bg-amber-800 text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs cursor-pointer"
            >
              + Thêm sản phẩm khác
            </Link>
          </div>
        </div>

        {/* Comparison Matrix Table (Vuông vức rounded-none) */}
        <div className="bg-white rounded-none border border-stone-200/80 shadow-2xs overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">

            <thead>
              <tr className="border-b border-stone-200/80 bg-stone-50/70">
                <th className="p-4 w-48 text-xs font-bold text-stone-500 uppercase tracking-wider align-middle">
                  Thông số
                </th>
                {compareData.map((prod) => (
                  <th key={prod.id} className="p-4 min-w-[240px] vertical-top">
                    <div className="relative group bg-white p-4 rounded-none border border-stone-200/80 shadow-2xs text-center">
                      <button
                        type="button"
                        onClick={() => removeFromCompare(prod.id)}
                        className="absolute top-2 right-2 text-stone-400 hover:text-red-600 p-1 cursor-pointer"
                        title="Xóa khỏi so sánh"
                      >
                        <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>

                      {/* Image (Tỷ lệ 4:5) */}
                      <img
                        src={prod.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc'}
                        alt={prod.name}
                        className="w-28 h-36 object-cover rounded-none mx-auto mb-3 border border-stone-200/60 bg-stone-100"
                      />
                      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest bg-stone-100 px-2 py-0.5 rounded-none border border-stone-200 inline-block mb-1.5">
                        {prod.category || 'Nội thất'}
                      </span>
                      <h3 className="text-sm font-bold text-stone-900 line-clamp-2 leading-snug mb-3">
                        {prod.name}
                      </h3>
                      <Link
                        to={`/products/${prod.id}`}
                        className="w-full py-2 bg-stone-900 hover:bg-amber-800 text-white rounded-none text-xs font-bold uppercase tracking-wider block text-center transition-colors cursor-pointer"
                      >
                        Xem chi tiết
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100 text-xs">

              {/* Price Row */}
              <tr>
                <td className="p-4 font-bold text-stone-900 uppercase tracking-wider bg-stone-50/50">
                  Giá bán
                </td>
                {compareData.map((prod) => {
                  const effectivePrice = prod.discount_price || prod.price
                  const hasDiscount = prod.discount_price && Number(prod.discount_price) < Number(prod.price)
                  return (
                    <td key={prod.id} className="p-4 font-bold text-amber-800 text-base">
                      {formatCurrency(effectivePrice)}
                      {hasDiscount && (
                        <span className="text-xs text-stone-400 line-through block font-normal mt-0.5">
                          {formatCurrency(prod.price)}
                        </span>
                      )}
                    </td>
                  )
                })}
              </tr>

              {/* Material Row */}
              <tr>
                <td className="p-4 font-bold text-stone-900 uppercase tracking-wider bg-stone-50/50">
                  Chất liệu
                </td>
                {compareData.map((prod) => (
                  <td key={prod.id} className="p-4 text-stone-800 leading-relaxed">
                    {prod.material || 'Gỗ tự nhiên cao cấp kết hợp khung kim loại'}
                  </td>
                ))}
              </tr>

              {/* Dimensions Row */}
              <tr>
                <td className="p-4 font-bold text-stone-900 uppercase tracking-wider bg-stone-50/50">
                  Kích thước
                </td>
                {compareData.map((prod) => (
                  <td key={prod.id} className="p-4 text-stone-900 font-mono font-semibold">
                    {prod.dimensions || 'Đang cập nhật'}
                  </td>
                ))}
              </tr>

              {/* Rating Row */}
              <tr>
                <td className="p-4 font-bold text-stone-900 uppercase tracking-wider bg-stone-50/50">
                  Đánh giá
                </td>
                {compareData.map((prod) => (
                  <td key={prod.id} className="p-4">
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <svg className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-stone-900">{prod.rating ? Number(prod.rating).toFixed(1) : '5.0'}</span>
                      <span className="text-stone-400 font-normal">({prod.rating_count || 12} lượt)</span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Stock Row */}
              <tr>
                <td className="p-4 font-bold text-stone-900 uppercase tracking-wider bg-stone-50/50">
                  Tồn kho
                </td>
                {compareData.map((prod) => (
                  <td key={prod.id} className="p-4">
                    {prod.stock > 0 ? (
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-none uppercase tracking-wider">
                        Còn hàng ({prod.stock})
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-red-50 text-red-800 border border-red-200 text-xs font-bold rounded-none uppercase tracking-wider">
                        Hết hàng
                      </span>
                    )}
                  </td>
                ))}
              </tr>

            </tbody>

          </table>
        </div>

      </main>

      <Footer />
    </div>
  )
}

export default ProductComparePage
