import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import AdminQuickSearch from '@/components/admin/AdminQuickSearch'
import AddComboModal from '@/components/admin/AddComboModal'
import comboService from '@/services/comboService'
import FormAlert from '@/components/ui/FormAlert'

/**
 * AdminCombosPage — Trang Quản lý Combo / Bộ sản phẩm dành cho Admin (NT-08-CN-006).
 * Tuyến đường: /admin/combos
 */
const AdminCombosPage = () => {
  const [combos, setCombos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const fetchCombos = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await comboService.getAdminCombos()
      setCombos(data || [])
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể nạp danh sách combo sản phẩm.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCombos()
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
              <span className="text-gray-900 font-bold">Danh sách Combo & Bộ sản phẩm</span>
            </div>
            <h1 className="text-2xl font-display font-extrabold text-gray-900 flex items-center gap-2">
              <span>🎁</span> Quản lý Combo & Bộ sản phẩm ({combos.length})
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <AdminQuickSearch />
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold transition-colors shadow-xs flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <span>+</span> Tạo Combo mới
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4">
            <FormAlert type="error" message={error} />
          </div>
        )}

        {/* Combos Grid */}
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-xs space-y-3 bg-white rounded-3xl border border-gray-100 shadow-xs">
            <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="font-semibold">Đang nạp danh sách combo...</p>
          </div>
        ) : combos.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-xs space-y-3 bg-white rounded-3xl border border-gray-100 shadow-xs">
            <div className="text-4xl">🎁</div>
            <p className="font-bold text-gray-700 text-sm">Chưa có combo nào được tạo</p>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="mt-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold transition-colors shadow-xs inline-block cursor-pointer"
            >
              + Tạo Combo đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {combos.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-extrabold uppercase">
                        Giảm {c.discount_percent}%
                      </span>
                      <h3 className="text-base font-extrabold text-gray-900 mt-1">{c.name}</h3>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl">
                      Tiết kiệm {formatVND(c.savings)}
                    </span>
                  </div>

                  {c.description && (
                    <p className="text-xs text-gray-500 mb-4 line-clamp-2">{c.description}</p>
                  )}

                  {/* Items List */}
                  <div className="bg-gray-50 rounded-2xl p-3 space-y-2 mb-4 border border-gray-100">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Sản phẩm thành phần ({c.items?.length || 0}):
                    </p>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {(c.items || []).map((item) => (
                        <div key={item.combo_item_id} className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-gray-800 line-clamp-1">
                            • {item.product_name} <span className="text-gray-400">(x{item.quantity})</span>
                          </span>
                          <span className="font-mono font-bold text-gray-700">{formatVND(item.combo_price)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Prices */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-gray-400 font-medium block">Tổng giá combo:</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-extrabold text-amber-700">{formatVND(c.combo_total)}</span>
                      <span className="text-xs text-gray-400 line-through">{formatVND(c.original_total)}</span>
                    </div>
                  </div>

                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200">
                    Đang hiển thị
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal Tạo Combo Mới */}
      <AddComboModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => fetchCombos()}
      />
    </div>
  )
}

export default AdminCombosPage
