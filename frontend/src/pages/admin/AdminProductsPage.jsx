import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AddProductModal from '@/components/admin/AddProductModal'
import EditProductModal from '@/components/admin/EditProductModal'
import ImportStockModal from '@/components/admin/ImportStockModal'
import productService from '@/services/productService'
import FormAlert from '@/components/ui/FormAlert'

/**
 * AdminProductsPage — Trang Quản lý Sản phẩm dành cho Admin (nhaxinh.com style).
 * Thiết kế vuông vức góc cạnh (rounded-none), KHÔNG SỬ DỤNG ICON.
 */
const AdminProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchQuery = searchParams.get('search') || ''

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editProductItem, setEditProductItem] = useState(null)
  const [importStockItem, setImportStockItem] = useState(null)
  
  // Confirmation deactivate modal state
  const [deactivateTarget, setDeactivateTarget] = useState(null)
  const [deactivating, setDeactivating] = useState(false)
  const [deactivateError, setDeactivateError] = useState(null)

  const fetchProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { limit: 100 }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim()
      }
      const data = await productService.getAdminProducts(params)
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
  }, [searchQuery])

  const handleDeactivateConfirm = async () => {
    if (!deactivateTarget) return
    setDeactivating(true)
    setDeactivateError(null)

    try {
      await productService.toggleProductStatus(deactivateTarget.id, false)
      setDeactivateTarget(null)
      fetchProducts()
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Không thể chuyển trạng thái sản phẩm.'
      setDeactivateError(msg)
    } finally {
      setDeactivating(false)
    }
  }

  const formatVND = (amount) => {
    if (!amount) return '0đ'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
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
            QUẢN LÝ SẢN PHẨM NỘI THẤT ({products.length})
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Quản lý thông tin chi tiết, giá niêm yết, hình ảnh và tồn kho sản phẩm
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-3 bg-stone-900 hover:bg-amber-800 text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs cursor-pointer shrink-0"
        >
          + THÊM SẢN PHẨM MỚI
        </button>
      </div>

      {searchQuery && (
        <div className="p-3.5 bg-amber-50 rounded-none border border-amber-200 flex items-center justify-between shadow-2xs text-xs">
          <div className="flex items-center gap-2 text-amber-900">
            <span className="font-bold uppercase tracking-wider">LỌC THEO TỪ KHÓA:</span>
            <span className="px-2.5 py-0.5 bg-amber-200 text-amber-950 font-bold rounded-none font-mono">
              &quot;{searchQuery}&quot;
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSearchParams({})}
            className="text-xs font-bold text-amber-800 hover:text-amber-950 hover:underline uppercase tracking-wider cursor-pointer"
          >
            ✕ XÓA BỘ LỌC (XEM TẤT CẢ)
          </button>
        </div>
      )}

      {error && <FormAlert type="error" message={error} />}

      {/* Products Table */}
      <div className="bg-white rounded-none border border-stone-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-stone-400 text-xs space-y-3">
            <div className="w-8 h-8 border-2 border-amber-800 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="font-semibold">Đang nạp danh sách sản phẩm...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-stone-400 text-xs space-y-3">
            <p className="font-heading font-bold text-stone-900 text-base uppercase tracking-wider">Chưa có sản phẩm nào</p>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-6 py-3 bg-stone-900 hover:bg-amber-800 text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              + Thêm sản phẩm đầu tiên
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200/80 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Sản phẩm</th>
                  <th className="py-3.5 px-4">Danh mục</th>
                  <th className="py-3.5 px-4">Giá niêm yết</th>
                  <th className="py-3.5 px-4">Tồn kho</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
                {products.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-stone-50 transition-colors ${
                      !item.is_active ? 'bg-stone-50/60 opacity-75' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc'}
                          alt={item.name}
                          className="w-10 h-12 rounded-none object-cover border border-stone-200 bg-stone-100 shrink-0"
                        />
                        <div>
                          <p className={`font-bold transition-colors line-clamp-1 ${item.is_active ? 'text-stone-900' : 'text-stone-400 line-through'}`}>
                            {item.name}
                          </p>
                          <p className="text-[11px] text-stone-400 font-mono">#{item.id} • {item.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-stone-800 uppercase tracking-wider">
                      {item.category}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-amber-800">{formatVND(item.price)}</span>
                      {item.discount_price && (
                        <span className="block text-[10px] text-stone-400 line-through">
                          {formatVND(item.discount_price)}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold font-mono">
                      <span className={item.stock > 0 ? 'text-stone-900' : 'text-red-600'}>
                        {item.stock} cái
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {item.is_active ? (
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-900 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider rounded-none">
                          ĐANG BÁN
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-red-50 text-red-900 border border-red-200 text-[10px] font-bold uppercase tracking-wider rounded-none">
                          NGỪNG BÁN
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setImportStockItem(item)}
                          className="px-2.5 py-1.5 bg-stone-900 hover:bg-amber-800 text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Nhập kho
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditProductItem(item)}
                          className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-900 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Sửa
                        </button>
                        {item.is_active && (
                          <button
                            type="button"
                            onClick={() => {
                              setDeactivateError(null)
                              setDeactivateTarget(item)
                            }}
                            className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            Ngừng bán
                          </button>
                        )}
                        <Link
                          to={`/products/${item.id}`}
                          target="_blank"
                          className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-none text-xs font-bold uppercase tracking-wider transition-colors inline-block"
                        >
                          Xem →
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Thêm sản phẩm mới */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => fetchProducts()}
      />

      {/* Modal Sửa sản phẩm */}
      <EditProductModal
        isOpen={!!editProductItem}
        productItem={editProductItem}
        onClose={() => setEditProductItem(null)}
        onSuccess={() => fetchProducts()}
      />

      {/* Hộp thoại xác nhận Ngừng bán sản phẩm */}
      {deactivateTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="relative w-full max-w-sm bg-white rounded-none p-6 shadow-2xl border border-stone-200/80 text-center space-y-4">
            <h3 className="text-base font-heading font-bold text-stone-900 uppercase tracking-wider">Xác nhận ngừng kinh doanh</h3>
            <p className="text-xs text-stone-500">
              Sản phẩm <span className="font-bold text-stone-900">"{deactivateTarget.name}"</span> sẽ bị ẩn khỏi website và khách hàng sẽ không thể đặt mua.
            </p>

            {deactivateError && <FormAlert type="error" message={deactivateError} />}

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeactivateTarget(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={deactivating}
                onClick={handleDeactivateConfirm}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                {deactivating ? 'Đang cập nhật...' : 'Xác nhận ngừng bán'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nhập kho */}
      <ImportStockModal
        isOpen={!!importStockItem}
        onClose={() => setImportStockItem(null)}
        initialProduct={importStockItem}
        onSuccess={() => fetchProducts()}
      />
    </div>
  )
}

export default AdminProductsPage
