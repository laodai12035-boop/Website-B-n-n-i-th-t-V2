import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AddComboModal from '@/components/admin/AddComboModal'
import comboService from '@/services/comboService'
import FormAlert from '@/components/ui/FormAlert'

/**
 * AdminCombosPage — Trang Quản lý Combo / Bộ sản phẩm dành cho Admin (nhaxinh.com style).
 * Góc cạnh vuông vức (rounded-none), KHÔNG SỬ DỤNG ICON.
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
    <div className="space-y-6 font-sans animate-fade-in">
      
      {/* Header */}
      <div className="bg-white rounded-none border border-stone-200/80 p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest bg-amber-100 px-2.5 py-0.5 rounded-none border border-amber-200 inline-block mb-1">
            Phân hệ Quản trị
          </span>
          <h1 className="text-2xl font-heading font-bold text-stone-900 uppercase tracking-wider">
            QUẢN LÝ COMBO & BỘ SẢN PHẨM ({combos.length})
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Tạo và quản lý các bộ gói nội thất khuyến mãi ưu đãi cho phòng khách, phòng ngủ, phòng ăn
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-3 bg-stone-900 hover:bg-amber-800 text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs cursor-pointer shrink-0"
        >
          + TẠO COMBO MỚI
        </button>
      </div>

      {error && <FormAlert type="error" message={error} />}

      {/* Combos Grid */}
      {loading ? (
        <div className="py-16 text-center text-stone-400 text-xs space-y-3 bg-white rounded-none border border-stone-200/80">
          <div className="w-8 h-8 border-2 border-amber-800 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="font-semibold">Đang nạp danh sách combo...</p>
        </div>
      ) : combos.length === 0 ? (
        <div className="py-16 text-center text-stone-400 text-xs space-y-3 bg-white rounded-none border border-stone-200/80">
          <p className="font-heading font-bold text-stone-900 text-base uppercase tracking-wider">Chưa có combo nào được tạo</p>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-6 py-3 bg-stone-900 hover:bg-amber-800 text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            + Tạo Combo đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {combos.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-none border border-stone-200/80 p-6 shadow-2xs hover:border-amber-800/60 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="px-2.5 py-0.5 bg-amber-800 text-white rounded-none text-[10px] font-bold uppercase tracking-wider">
                      GIẢM {c.discount_percent}%
                    </span>
                    <h3 className="text-base font-heading font-bold text-stone-900 uppercase tracking-wider mt-2">{c.name}</h3>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-none uppercase tracking-wider">
                    TIẾT KIỆM {formatVND(c.savings)}
                  </span>
                </div>

                {c.description && (
                  <p className="text-xs text-stone-600 mb-4 line-clamp-2 leading-relaxed">{c.description}</p>
                )}

                {/* Items List */}
                <div className="bg-stone-50 rounded-none p-3.5 space-y-2 mb-4 border border-stone-200">
                  <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                    SẢN PHẨM THÀNH PHẦN ({c.items?.length || 0}):
                  </p>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {(c.items || []).map((item) => (
                      <div key={item.combo_item_id} className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-stone-800 line-clamp-1">
                          • {item.product_name} <span className="text-stone-400 font-mono">(x{item.quantity})</span>
                        </span>
                        <span className="font-mono font-bold text-stone-900">{formatVND(item.combo_price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer Prices */}
              <div className="pt-3 border-t border-stone-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">TỔNG GIÁ COMBO:</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-amber-800">{formatVND(c.combo_total)}</span>
                    <span className="text-xs text-stone-400 line-through font-mono">{formatVND(c.original_total)}</span>
                  </div>
                </div>

                <span className="px-3 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold rounded-none uppercase tracking-wider">
                  ĐANG HIỂN THỊ
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

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
