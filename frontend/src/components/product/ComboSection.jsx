import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import comboService from '@/services/comboService'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'

/**
 * ComboSection — Component hiển thị các bộ sản phẩm Combo ưu đãi (Terracotta/Amber badges & square buttons).
 */
const ComboSection = ({ productId }) => {
  const { refreshCart, setIsCartOpen } = useCart()
  const { isAuthenticated } = useAuth()
  const [combos, setCombos] = useState([])
  const [loading, setLoading] = useState(true)
  const [addingComboId, setAddingComboId] = useState(null)
  const [msg, setMsg] = useState({ type: '', text: '', comboId: null })

  useEffect(() => {
    if (!productId) return
    const loadCombos = async () => {
      setLoading(true)
      try {
        const data = await comboService.getCombosByProduct(productId)
        setCombos(data || [])
      } catch {
        setCombos([])
      } finally {
        setLoading(false)
      }
    }
    loadCombos()
  }, [productId])

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)
  }

  const handleAddCombo = async (comboId) => {
    if (!isAuthenticated) {
      setMsg({ type: 'error', text: 'Vui lòng đăng nhập để thêm combo vào giỏ hàng!', comboId })
      setTimeout(() => setMsg({ type: '', text: '', comboId: null }), 4000)
      return
    }
    setAddingComboId(comboId)
    setMsg({ type: '', text: '', comboId: null })
    try {
      const res = await comboService.addComboToCart(comboId)
      if (refreshCart) await refreshCart()
      if (setIsCartOpen) setIsCartOpen(true)
      setMsg({ type: 'success', text: res.message || 'Đã thêm combo vào giỏ hàng!', comboId })
      setTimeout(() => setMsg({ type: '', text: '', comboId: null }), 4000)
    } catch (err) {
      const errorText = err.response?.data?.message || err.response?.data?.msg || 'Không thể thêm combo vào giỏ hàng.'
      setMsg({ type: 'error', text: errorText, comboId })
      setTimeout(() => setMsg({ type: '', text: '', comboId: null }), 5000)
    } finally {
      setAddingComboId(null)
    }
  }

  if (loading || combos.length === 0) return null

  return (
    <div className="mt-10 bg-white rounded-none p-6 sm:p-8 border border-stone-200/80 shadow-2xs">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-stone-100">
        <div className="w-10 h-10 bg-amber-800 text-white rounded-none flex items-center justify-center font-bold">
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M13.5 2c-1.39 0-2.73.55-3.71 1.54L3.5 9.83c-1.95 1.95-1.95 5.12 0 7.07l3.6 3.6c1.95 1.95 5.12 1.95 7.07 0l6.29-6.29c.99-.98 1.54-2.32 1.54-3.71V4.5c0-1.38-1.12-2.5-2.5-2.5h-6zm4 5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-heading font-bold text-stone-900 uppercase tracking-wider">
            ƯU ĐÃI MUA THEO BỘ (COMBO NỘI THẤT)
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Sở hữu trọn bộ sản phẩm đồng bộ thiết kế với mức giá ưu đãi đặc biệt
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {combos.map((combo) => (
          <div
            key={combo.id}
            className="bg-stone-50/50 rounded-none p-5 border border-stone-200/80 shadow-2xs space-y-4"
          >
            {/* Combo Title & Badge Terracotta/Amber */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/80 pb-3">
              <div>
                <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <span>{combo.name}</span>
                </h4>
                {combo.description && (
                  <p className="text-xs text-stone-500 mt-0.5">{combo.description}</p>
                )}
              </div>
              {/* Badge Tiết Kiệm chuẩn màu Terracotta/Amber theo MASTER.md */}
              <span className="px-3 py-1 bg-amber-800 text-white text-xs font-bold rounded-none shadow-2xs tracking-wide">
                TIẾT KIỆM {combo.discount_percent}%
              </span>
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {combo.items.map((item) => (
                <div
                  key={item.combo_item_id}
                  className="flex items-center gap-3 p-2.5 rounded-none bg-white border border-stone-200/80"
                >
                  <img
                    src={item.product_image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc'}
                    alt={item.product_name}
                    className="w-12 h-12 object-cover rounded-none bg-stone-100 border border-stone-200/80 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/products/${item.product_id}`}
                      className="text-xs font-bold text-stone-800 hover:text-amber-800 truncate block"
                    >
                      {item.product_name}
                    </Link>
                    <div className="text-[11px] text-stone-400">x{item.quantity} sản phẩm</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs font-bold text-amber-800">
                        {formatCurrency(item.combo_price)}
                      </span>
                      {item.original_price > item.combo_price && (
                        <span className="text-[10px] text-stone-400 line-through">
                          {formatCurrency(item.original_price)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Price Total & Action Button */}
            <div className="pt-3 border-t border-stone-200/80 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="text-xs text-stone-500 flex items-center gap-2">
                  <span>Giá mua lẻ: <span className="line-through">{formatCurrency(combo.original_total)}</span></span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-stone-700">Giá trọn bộ:</span>
                  <span className="text-lg font-bold text-amber-800">
                    {formatCurrency(combo.combo_total)}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700">
                    (Tiết kiệm {formatCurrency(combo.savings)})
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleAddCombo(combo.id)}
                disabled={addingComboId === combo.id}
                className="px-6 py-3 bg-amber-800 hover:bg-amber-900 text-white rounded-none text-xs font-bold uppercase tracking-wider shadow-2xs active:scale-98 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {addingComboId === combo.id ? (
                  'Đang xử lý...'
                ) : (
                  <>
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                    <span>THÊM TRỌN BỘ VÀO GIỎ</span>
                  </>
                )}
              </button>
            </div>

            {/* Message alert per combo */}
            {msg.comboId === combo.id && (
              <div
                className={`p-3 rounded-none text-xs font-semibold flex items-center gap-2 ${
                  msg.type === 'error'
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                <span>{msg.type === 'error' ? '⚠️' : '✅'}</span>
                {msg.text}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ComboSection
