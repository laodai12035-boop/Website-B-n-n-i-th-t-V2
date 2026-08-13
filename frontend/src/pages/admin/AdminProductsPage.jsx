import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import AdminQuickSearch from '@/components/admin/AdminQuickSearch'
import AddProductModal from '@/components/admin/AddProductModal'
import productService from '@/services/productService'
import FormAlert from '@/components/ui/FormAlert'

/**
 * AdminProductsPage — Trang Quản lý Sản phẩm dành cho Admin (NT-08-CN-003).
 * Tuyến đường: /admin/products
 */
const AdminProductsPage = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const fetchProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await productService.getAdminProducts({ limit: 50 })
      setProducts(data.items || [])
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể nạp danh sách sản phẩm.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const formatVND = (amount) => {
    if (!amount) return '0đ'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 animate-fade-in">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-1">
              <Link to="/admin" className="hover:text-amber-600 transition-colors">Quản trị</Link>
              <span>/</span>
              <span className="text-gray-900 font-bold">Danh sách sản phẩm</span>
            </div>
            <h1 className="text-2xl font-display font-extrabold text-gray-900 flex items-center gap-2">
              <span>🪑</span> Quản lý Sản phẩm ({products.length})
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <AdminQuickSearch />
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold transition-colors shadow-xs flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <span>+</span> Thêm sản phẩm mới
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4">
            <FormAlert type="error" message={error} />
          </div>
        )}

        {/* Products Table */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-gray-400 text-xs space-y-3">
              <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="font-semibold">Đang nạp danh sách sản phẩm...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-xs space-y-3">
              <div className="text-4xl">📦</div>
              <p className="font-bold text-gray-700 text-sm">Chưa có sản phẩm nào</p>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="mt-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold transition-colors shadow-xs inline-block cursor-pointer"
              >
                + Thêm sản phẩm đầu tiên
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Sản phẩm</th>
                    <th className="py-3.5 px-4">Danh mục</th>
                    <th className="py-3.5 px-4">Giá niêm yết</th>
                    <th className="py-3.5 px-4">Tồn kho</th>
                    <th className="py-3.5 px-4">Trạng thái</th>
                    <th className="py-3.5 px-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                  {products.map((item) => (
                    <tr key={item.id} className="hover:bg-amber-50/40 transition-colors group">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc'}
                            alt={item.name}
                            className="w-10 h-10 rounded-xl object-cover border border-gray-100 shadow-2xs group-hover:scale-105 transition-transform"
                          />
                          <div>
                            <p className="font-bold text-gray-900 group-hover:text-amber-800 transition-colors line-clamp-1">
                              {item.name}
                            </p>
                            <p className="text-[11px] text-gray-400 font-mono">#{item.id} • {item.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-600 capitalize">
                        {item.category}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-amber-700">{formatVND(item.price)}</span>
                        {item.discount_price && (
                          <span className="block text-[10px] text-red-500 line-through">
                            {formatVND(item.discount_price)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold">
                        <span className={item.stock > 0 ? 'text-gray-900' : 'text-red-500'}>
                          {item.stock} cái
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold uppercase">
                          Đang bán
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/products/${item.id}`}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-bold transition-colors inline-block"
                        >
                          Xem Web →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal Thêm sản phẩm mới */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => fetchProducts()}
      />
    </div>
  )
}

export default AdminProductsPage
