import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCompare } from '@/contexts/CompareContext'
import Navbar from '@/components/layout/Navbar'
import productService from '@/services/productService'

/**
 * ProductComparePage — Trang Bảng so sánh thông số sản phẩm side-by-side.
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
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto w-full p-6 text-center my-auto">
          <div className="card max-w-md mx-auto py-12">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-xl font-display font-bold text-gray-900 mb-2">Chưa đủ sản phẩm để so sánh</h2>
            <p className="text-sm text-gray-500 mb-6">
              Bạn cần chọn ít nhất <strong>2 sản phẩm</strong> (tối đa 3 sản phẩm) để tiến hành so sánh thông số kỹ thuật.
            </p>
            <Link to="/products" className="btn-primary text-sm px-5 py-2.5">
              Quay lại danh sách sản phẩm
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 animate-fade-in">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Bảng so sánh sản phẩm</h1>
            <p className="text-sm text-gray-500 mt-1">Đối chiếu thông số kỹ thuật và giá cả sản phẩm nội thất</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={clearCompare}
              className="btn-outline text-xs text-red-600 border-red-200 hover:bg-red-50"
            >
              Xóa tất cả
            </button>
            <Link to="/products" className="btn-primary text-xs px-4 py-2">
              + Thêm sản phẩm khác
            </Link>
          </div>
        </div>

        {/* Comparison Matrix Table */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">

            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="p-4 w-48 text-xs font-bold text-gray-400 uppercase tracking-wider">Thông số</th>
                {compareData.map((prod) => (
                  <th key={prod.id} className="p-4 min-w-[220px] vertical-top">
                    <div className="relative group bg-white p-3 rounded-2xl border border-gray-100 shadow-sm text-center">
                      <button
                        type="button"
                        onClick={() => removeFromCompare(prod.id)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1"
                        title="Xóa khỏi so sánh"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>

                      <img
                        src={prod.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc'}
                        alt={prod.name}
                        className="w-28 h-28 object-cover rounded-xl mx-auto mb-3"
                      />
                      <h3 className="text-sm font-bold text-gray-900 line-clamp-2 mb-1">{prod.name}</h3>
                      <span className="text-[11px] text-primary-600 uppercase font-semibold block">{prod.category}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-sm">

              {/* Price Row */}
              <tr>
                <td className="p-4 font-semibold text-gray-700 bg-gray-50/30">Giá bán</td>
                {compareData.map((prod) => {
                  const effectivePrice = prod.discount_price || prod.price
                  return (
                    <td key={prod.id} className="p-4 font-bold text-red-600 text-base">
                      {formatCurrency(effectivePrice)}
                      {prod.discount_price && (
                        <span className="text-xs text-gray-400 line-through block font-normal">
                          {formatCurrency(prod.price)}
                        </span>
                      )}
                    </td>
                  )
                })}
              </tr>

              {/* Material Row */}
              <tr>
                <td className="p-4 font-semibold text-gray-700 bg-gray-50/30">Chất liệu</td>
                {compareData.map((prod) => (
                  <td key={prod.id} className="p-4 text-gray-800">
                    {prod.material || 'Gỗ tự nhiên cao cấp kết hợp hợp kim'}
                  </td>
                ))}
              </tr>

              {/* Dimensions Row */}
              <tr>
                <td className="p-4 font-semibold text-gray-700 bg-gray-50/30">Kích thước</td>
                {compareData.map((prod) => (
                  <td key={prod.id} className="p-4 text-gray-800 font-mono text-xs">
                    {prod.dimensions || 'Đang cập nhật'}
                  </td>
                ))}
              </tr>

              {/* Rating Row */}
              <tr>
                <td className="p-4 font-semibold text-gray-700 bg-gray-50/30">Đánh giá</td>
                {compareData.map((prod) => (
                  <td key={prod.id} className="p-4">
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      ⭐ {prod.rating ? Number(prod.rating).toFixed(1) : '5.0'}
                      <span className="text-xs text-gray-400 font-normal">({prod.rating_count || 0} lượt)</span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Stock Row */}
              <tr>
                <td className="p-4 font-semibold text-gray-700 bg-gray-50/30">Tồn kho</td>
                {compareData.map((prod) => (
                  <td key={prod.id} className="p-4">
                    {prod.stock > 0 ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                        Còn hàng ({prod.stock})
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600">
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
    </div>
  )
}

export default ProductComparePage
