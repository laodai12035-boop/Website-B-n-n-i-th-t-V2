import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import comboService from '@/services/comboService'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'

/**
 * ComboSection — Component hiển thị các bộ sản phẩm Combo ưu đãi trên trang chi tiết sản phẩm.
 */
const ComboSection = ({ productId }) => {
  const { fetchCart } = useCart()
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
      await fetchCart()
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
    <div className="mt-12 bg-gradient-to-br from-amber-50/60 via-orange-50/40 to-yellow-50/60 rounded-3xl p-6 sm:p-8 border border-amber-200/70 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">🔥</span>
        <div>
          <h3 className="text-lg font-display font-extrabold text-gray-900">
            ƯU ĐÃI MUA THEO BỘ (COMBO)
          </h3>
          <p className="text-xs text-gray-600">
            Mua trọn bộ nội thất đồng bộ để nhận ngay giá ưu đãi hấp dẫn
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {combos.map((combo) => (
          <div
            key={combo.id}
            className="bg-white rounded-2xl p-5 border border-amber-100 shadow-xs hover:shadow-md transition-shadow space-y-4"
          >
            {/* Combo Title & Badge */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <span>✨</span> {combo.name}
                </h4>
                {combo.description && (
                  <p className="text-xs text-gray-500 mt-0.5">{combo.description}</p>
                )}
              </div>
              <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-extrabold rounded-full animate-pulse">
                TIẾT KIỆM {combo.discount_percent}%
              </span>
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {combo.items.map((item) => (
                <div
                  key={item.combo_item_id}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50/80 border border-gray-100"
                >
                  <img
                    src={item.product_image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc'}
                    alt={item.product_name}
                    className="w-12 h-12 object-cover rounded-lg bg-white border border-gray-100 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/products/${item.product_id}`}
                      className="text-xs font-bold text-gray-800 hover:text-amber-600 truncate block"
                    >
                      {item.product_name}
                    </Link>
                    <div className="text-[11px] text-gray-500">x{item.quantity} sản phẩm</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs font-extrabold text-amber-700 font-display">
                        {formatCurrency(item.combo_price)}
                      </span>
                      {item.original_price > item.combo_price && (
                        <span className="text-[10px] text-gray-400 line-through">
                          {formatCurrency(item.original_price)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Price Total & Action Button */}
            <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <span>Giá mua lẻ: <span className="line-through">{formatCurrency(combo.original_total)}</span></span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-gray-700">Giá trọn bộ:</span>
                  <span className="text-lg font-extrabold text-amber-700 font-display">
                    {formatCurrency(combo.combo_total)}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600">
                    (Tiết kiệm {formatCurrency(combo.savings)})
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleAddCombo(combo.id)}
                disabled={addingComboId === combo.id}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-extrabold shadow-sm active:scale-98 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {addingComboId === combo.id ? (
                  'Đang xử lý...'
                ) : (
                  <>
                    <span>🛒</span> Thêm trọn bộ vào giỏ
                  </>
                )}
              </button>
            </div>

            {/* Message alert per combo */}
            {msg.comboId === combo.id && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  msg.type === 'error'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
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
