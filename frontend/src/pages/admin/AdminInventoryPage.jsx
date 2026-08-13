import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import AdminQuickSearch from '@/components/admin/AdminQuickSearch'
import ImportStockModal from '@/components/admin/ImportStockModal'
import productService from '@/services/productService'
import stockService from '@/services/stockService'
import FormAlert from '@/components/ui/FormAlert'

/**
 * AdminInventoryPage — Trang Quản lý Tồn kho & Lịch sử Nhập kho dành cho Admin (NT-09-CN-001).
 * Tuyến đường: /admin/inventory
 */
const AdminInventoryPage = () => {
  const [activeTab, setActiveTab] = useState('inventory') // 'inventory' | 'receipts'
  
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  const [receipts, setReceipts] = useState([])
  const [loadingReceipts, setLoadingReceipts] = useState(false)
  const [lowStockWarnings, setLowStockWarnings] = useState({ count: 0, items: [] })

  const [error, setError] = useState(null)
  
  // Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [selectedProductForImport, setSelectedProductForImport] = useState(null)

  const fetchProducts = async () => {
    setLoadingProducts(true)
    setError(null)
    try {
      const data = await productService.getAdminProducts({ limit: 100 })
      setProducts(data.items || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể nạp danh sách tồn kho sản phẩm.')
    } finally {
      setLoadingProducts(false)
    }
  }

  const fetchReceipts = async () => {
    setLoadingReceipts(true)
    try {
      const data = await stockService.getStockReceipts()
      setReceipts(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingReceipts(false)
    }
  }

  const fetchLowStockWarnings = async () => {
    try {
      const data = await stockService.getLowStockWarnings()
      setLowStockWarnings(data || { count: 0, items: [] })
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchProducts()
    fetchReceipts()
    fetchLowStockWarnings()
  }, [])

  const handleOpenImportModal = (product = null) => {
    setSelectedProductForImport(product)
    setIsImportModalOpen(true)
  }

  const formatVND = (amount) => {
    if (!amount) return '---'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '---'
    return new Date(dateStr).toLocaleString('vi-VN')
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
              <span className="text-gray-900 font-bold">Quản lý Kho & Tồn Kho</span>
            </div>
            <h1 className="text-2xl font-display font-extrabold text-gray-900 flex items-center gap-2">
              <span>📦</span> Quản lý Kho & Tồn Kho (NT-09-CN-001)
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <AdminQuickSearch />
            <button
              type="button"
              onClick={() => handleOpenImportModal(null)}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold transition-colors shadow-xs flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <span>+</span> Lập Phiếu Nhập Kho
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4">
            <FormAlert type="error" message={error} />
          </div>
        )}

        {/* Banner Cảnh báo Tồn Kho Thấp QTN-08 */}
        {lowStockWarnings.count > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-4 animate-slide-down shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl shrink-0 font-bold">
                ⚠️
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-900">
                  Cảnh báo tồn kho thấp (QTN-08): Có {lowStockWarnings.count} sản phẩm đang dưới ngưỡng tối thiểu!
                </h3>
                <p className="text-xs text-amber-700 mt-0.5">
                  Quản trị viên cần nhanh chóng lập phiếu nhập kho để bổ sung hàng cho showroom & kho tổng.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleOpenImportModal(lowStockWarnings.items[0])}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shrink-0 shadow-xs cursor-pointer"
            >
              📦 Nhập kho nhanh
            </button>
          </div>
        )}

        {/* Tabs navigation */}
        <div className="flex border-b border-gray-200 mb-6 gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`pb-3 text-xs font-extrabold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'inventory'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <span>🏷️</span> Tồn Kho Hiện Tại ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('receipts')}
            className={`pb-3 text-xs font-extrabold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'receipts'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <span>📋</span> Lịch Sử Nhập Kho ({receipts.length})
          </button>
        </div>

        {/* TAB 1: Tồn Kho Sản Phẩm */}
        {activeTab === 'inventory' && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
            {loadingProducts ? (
              <div className="py-16 text-center text-gray-400 text-xs space-y-3">
                <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="font-semibold">Đang nạp danh sách tồn kho...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-xs space-y-2">
                <p className="font-bold text-gray-700 text-sm">Chưa có sản phẩm nào</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                      <th className="py-4 px-6">Sản phẩm</th>
                      <th className="py-4 px-4">Danh mục</th>
                      <th className="py-4 px-4 text-right">Giá niêm yết</th>
                      <th className="py-4 px-4 text-center">Tồn kho hiện tại</th>
                      <th className="py-4 px-4 text-center">Trạng thái kho</th>
                      <th className="py-4 px-6 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {products.map((p) => {
                      const stock = p.stock || 0
                      const threshold = p.min_stock_threshold !== undefined && p.min_stock_threshold !== null ? p.min_stock_threshold : 10
                      let stockBadge = (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-[11px]">
                          Sẵn hàng ({stock})
                        </span>
                      )
                      if (stock === 0) {
                        stockBadge = (
                          <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded-xl font-bold text-[11px] border border-red-200 animate-pulse">
                            🚨 Hết hàng (0/{threshold})
                          </span>
                        )
                      } else if (stock < threshold) {
                        stockBadge = (
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-xl font-bold text-[11px] border border-amber-300">
                            ⚠️ Dưới ngưỡng ({stock}/{threshold})
                          </span>
                        )
                      }

                      return (
                        <tr key={p.id} className={`hover:bg-gray-50/60 transition-colors ${stock < threshold ? 'bg-amber-50/20' : ''}`}>
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc'}
                                alt={p.name}
                                className="w-10 h-10 rounded-xl object-cover border border-gray-200 shrink-0"
                              />
                              <div>
                                <p className="font-bold text-gray-900 line-clamp-1">{p.name}</p>
                                <span className="text-[11px] text-gray-400 font-mono">ID: #{p.id} | Ngưỡng min: {threshold}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-gray-600 capitalize">
                            {p.category}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-gray-900">
                            {formatVND(p.discount_price || p.price)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`text-base font-extrabold font-mono ${stock < threshold ? 'text-red-600' : 'text-gray-900'}`}>{stock}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {stockBadge}
                          </td>
                          <td className="py-3.5 px-6 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenImportModal(p)}
                              className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl font-extrabold text-xs transition-colors cursor-pointer border border-amber-200"
                            >
                              📦 Nhập kho
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Lịch sử Nhập Kho */}
        {activeTab === 'receipts' && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
            {loadingReceipts ? (
              <div className="py-16 text-center text-gray-400 text-xs space-y-3">
                <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="font-semibold">Đang nạp lịch sử phiếu nhập kho...</p>
              </div>
            ) : receipts.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-xs space-y-2">
                <p className="font-bold text-gray-700 text-sm">Chưa có phiếu nhập kho nào</p>
                <button
                  type="button"
                  onClick={() => handleOpenImportModal(null)}
                  className="mt-2 px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold"
                >
                  + Lập phiếu nhập kho đầu tiên
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                      <th className="py-4 px-6">Mã Phiếu</th>
                      <th className="py-4 px-6">Sản phẩm</th>
                      <th className="py-4 px-4 text-center">Số lượng nhập</th>
                      <th className="py-4 px-4">Nhà cung cấp</th>
                      <th className="py-4 px-4 text-right">Giá nhập 1 ĐV</th>
                      <th className="py-4 px-4">Ngày nhập</th>
                      <th className="py-4 px-6">Người lập phiếu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {receipts.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3.5 px-6 font-mono font-bold text-amber-800">
                          #NK-{String(r.id).padStart(4, '0')}
                        </td>
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            {r.product_image && (
                              <img
                                src={r.product_image}
                                alt={r.product_name}
                                className="w-8 h-8 rounded-lg object-cover border border-gray-200 shrink-0"
                              />
                            )}
                            <span className="font-bold text-gray-900">{r.product_name || `SP #${r.product_id}`}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-xl font-extrabold text-xs">
                            +{r.quantity}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-gray-700">
                          {r.supplier || '---'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-gray-900">
                          {formatVND(r.unit_cost)}
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 text-[11px]">
                          {formatDate(r.import_date)}
                        </td>
                        <td className="py-3.5 px-6 text-gray-800 font-semibold">
                          {r.creator_name || 'Admin'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Modal Nhập Kho */}
      <ImportStockModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        initialProduct={selectedProductForImport}
        onSuccess={() => {
          fetchProducts()
          fetchReceipts()
        }}
      />
    </div>
  )
}

export default AdminInventoryPage
