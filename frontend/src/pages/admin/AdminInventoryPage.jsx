import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ImportStockModal from '@/components/admin/ImportStockModal'
import productService from '@/services/productService'
import stockService from '@/services/stockService'
import FormAlert from '@/components/ui/FormAlert'

/**
 * AdminInventoryPage — Trang Quản lý Tồn kho & Lịch sử Nhập kho dành cho Admin (nhaxinh.com style).
 * Góc cạnh vuông vức (rounded-none), KHÔNG SỬ DỤNG ICON.
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
    try {
      const data = await productService.getAdminProducts({ limit: 100 })
      setProducts(data.items || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải thông tin kho hàng.')
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
      console.error('Lỗi nạp lịch sử phiếu nhập:', err)
    } finally {
      setLoadingReceipts(false)
    }
  }

  const fetchLowStockWarnings = async () => {
    try {
      const res = await stockService.getLowStockWarnings()
      if (res) {
        setLowStockWarnings(res)
      }
    } catch (err) {
      console.error('Lỗi nạp cảnh báo tồn kho:', err)
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
    if (!amount) return '0đ'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '---'
    return new Date(dateStr).toLocaleString('vi-VN')
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
            QUẢN LÝ KHO & TỒN KHO
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Theo dõi số lượng hàng tồn kho thực tế và quản lý phiếu nhập hàng mới
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenImportModal(null)}
          className="px-5 py-3 bg-stone-900 hover:bg-amber-800 text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs cursor-pointer shrink-0"
        >
          + LẬP PHIẾU NHẬP KHO
        </button>
      </div>

      {error && <FormAlert type="error" message={error} />}

      {/* Banner Cảnh báo Tồn Kho Thấp */}
      {lowStockWarnings.count > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-none flex items-center justify-between gap-4 shadow-2xs">
          <div>
            <h3 className="text-xs font-bold text-red-900 uppercase tracking-wider">
              CẢNH BÁO TỒN KHO THẤP: CÓ {lowStockWarnings.count} SẢN PHẨM DƯỚI NGƯỠNG TỐI THIỂU!
            </h3>
            <p className="text-xs text-red-700 mt-0.5">
              Quản trị viên cần nhanh chóng lập phiếu nhập kho để bổ sung hàng cho kho tổng.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleOpenImportModal(lowStockWarnings.items[0])}
            className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors shrink-0 shadow-2xs cursor-pointer"
          >
            NHẬP KHO NHANH
          </button>
        </div>
      )}

      {/* Tabs navigation */}
      <div className="flex border-b border-stone-200 gap-6 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
            activeTab === 'inventory'
              ? 'border-amber-800 text-amber-800'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          TỒN KHO HIỆN TẠI ({products.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('receipts')}
          className={`pb-3 font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
            activeTab === 'receipts'
              ? 'border-amber-800 text-amber-800'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          LỊCH SỬ NHẬP KHO ({receipts.length})
        </button>
      </div>

      {/* TAB 1: Tồn Kho Sản Phẩm */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-none border border-stone-200/80 shadow-2xs overflow-hidden">
          {loadingProducts ? (
            <div className="py-16 text-center text-stone-400 text-xs space-y-3">
              <div className="w-8 h-8 border-2 border-amber-800 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="font-semibold">Đang nạp danh sách tồn kho...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center text-stone-400 text-xs space-y-2">
              <p className="font-heading font-bold text-stone-900 text-base uppercase tracking-wider">Chưa có sản phẩm nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200/80 text-stone-500 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Sản phẩm</th>
                    <th className="py-3.5 px-4">Danh mục</th>
                    <th className="py-3.5 px-4 text-right">Giá niêm yết</th>
                    <th className="py-3.5 px-4 text-center">Tồn kho hiện tại</th>
                    <th className="py-3.5 px-4 text-center">Trạng thái kho</th>
                    <th className="py-3.5 px-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {products.map((p) => {
                    const stock = p.stock || 0
                    const threshold = p.min_stock_threshold !== undefined && p.min_stock_threshold !== null ? p.min_stock_threshold : 10
                    let stockBadge = (
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-none font-bold text-[10px] uppercase tracking-wider">
                        Sẵn hàng ({stock})
                      </span>
                    )
                    if (stock === 0) {
                      stockBadge = (
                        <span className="px-2.5 py-0.5 bg-red-50 text-red-900 rounded-none font-bold text-[10px] border border-red-200 uppercase tracking-wider">
                          Hết hàng (0/{threshold})
                        </span>
                      )
                    } else if (stock < threshold) {
                      stockBadge = (
                        <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 rounded-none font-bold text-[10px] border border-amber-300 uppercase tracking-wider">
                          Dưới ngưỡng ({stock}/{threshold})
                        </span>
                      )
                    }

                    return (
                      <tr key={p.id} className={`hover:bg-stone-50 transition-colors ${stock < threshold ? 'bg-amber-50/20' : ''}`}>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc'}
                              alt={p.name}
                              className="w-10 h-12 rounded-none object-cover border border-stone-200 bg-stone-100 shrink-0"
                            />
                            <div>
                              <p className="font-bold text-stone-900 line-clamp-1">{p.name}</p>
                              <span className="text-[11px] text-stone-400 font-mono">ID: #{p.id} | Ngưỡng: {threshold}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-stone-800 uppercase tracking-wider">
                          {p.category}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-amber-800">
                          {formatVND(p.discount_price || p.price)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`text-sm font-bold font-mono ${stock < threshold ? 'text-red-600' : 'text-stone-900'}`}>{stock}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {stockBadge}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenImportModal(p)}
                            className="px-3 py-1.5 bg-stone-900 hover:bg-amber-800 text-white rounded-none font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            Nhập kho
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
        <div className="bg-white rounded-none border border-stone-200/80 shadow-2xs overflow-hidden">
          {loadingReceipts ? (
            <div className="py-16 text-center text-stone-400 text-xs space-y-3">
              <div className="w-8 h-8 border-2 border-amber-800 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="font-semibold">Đang nạp lịch sử phiếu nhập kho...</p>
            </div>
          ) : receipts.length === 0 ? (
            <div className="py-16 text-center text-stone-400 text-xs space-y-2">
              <p className="font-heading font-bold text-stone-900 text-base uppercase tracking-wider">Chưa có phiếu nhập kho nào</p>
              <button
                type="button"
                onClick={() => handleOpenImportModal(null)}
                className="mt-2 px-6 py-3 bg-stone-900 hover:bg-amber-800 text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                + Lập phiếu nhập kho đầu tiên
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200/80 text-stone-500 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Mã Phiếu</th>
                    <th className="py-3.5 px-4">Sản phẩm</th>
                    <th className="py-3.5 px-4 text-center">Số lượng nhập</th>
                    <th className="py-3.5 px-4">Nhà cung cấp</th>
                    <th className="py-3.5 px-4 text-right">Giá nhập 1 ĐV</th>
                    <th className="py-3.5 px-4">Ngày nhập</th>
                    <th className="py-3.5 px-4">Người lập phiếu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {receipts.map((r) => (
                    <tr key={r.id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-800">
                        #NK-{String(r.id).padStart(4, '0')}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {r.product_image && (
                            <img
                              src={r.product_image}
                              alt={r.product_name}
                              className="w-8 h-10 rounded-none object-cover border border-stone-200 shrink-0"
                            />
                          )}
                          <span className="font-bold text-stone-900">{r.product_name || `SP #${r.product_id}`}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-none font-bold text-xs font-mono">
                          +{r.quantity}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-stone-800 uppercase tracking-wider">
                        {r.supplier || '---'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-stone-900">
                        {formatVND(r.unit_cost)}
                      </td>
                      <td className="py-3.5 px-4 text-stone-500 text-[11px] font-mono">
                        {formatDate(r.import_date)}
                      </td>
                      <td className="py-3.5 px-4 text-stone-800 font-bold uppercase tracking-wider">
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
