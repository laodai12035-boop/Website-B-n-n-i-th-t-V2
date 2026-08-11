import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import adminService from '@/services/adminService'

/**
 * AdminQuickSearch — Ô tìm kiếm nhanh cho Quản trị viên.
 * Hỗ trợ live search từ khóa sản phẩm, đơn hàng, khách hàng.
 */
const AdminQuickSearch = () => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ products: [], orders: [], customers: [] })
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const dropdownRef = useRef(null)

  // Turn off popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Live search with Debounce 300ms
  useEffect(() => {
    if (!query.trim()) {
      setResults({ products: [], orders: [], customers: [] })
      setIsOpen(false)
      return
    }

    setLoading(true)
    setIsOpen(true)

    const timer = setTimeout(async () => {
      try {
        const data = await adminService.quickSearch(query.trim())
        setResults(data || { products: [], orders: [], customers: [] })
      } catch (err) {
        console.error('Admin quick search error:', err)
        setResults({ products: [], orders: [], customers: [] })
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const totalResults =
    (results.products?.length || 0) +
    (results.orders?.length || 0) +
    (results.customers?.length || 0)

  const formatCurrency = (val) => {
    if (!val) return '0đ'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  }

  return (
    <div className="relative w-full max-w-md" ref={dropdownRef}>

      {/* Input Search Box */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setIsOpen(true)}
          placeholder="Tìm sản phẩm, đơn hàng, khách hàng... (Ctrl + K)"
          className="w-full bg-gray-50 hover:bg-gray-100/80 focus:bg-white text-gray-900 placeholder-gray-400 pl-10 pr-10 py-2.5 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-sm font-medium transition-all"
        />

        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Clear / Loading Spinner */}
        {query && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {loading ? (
              <svg className="animate-spin w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-gray-400 hover:text-gray-600 p-0.5 rounded-full"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results Dropdown Modal Popup */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl border border-gray-100 shadow-2xl overflow-hidden z-50 animate-slide-up max-h-[75vh] overflow-y-auto">

          {/* Header Summary */}
          <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Kết quả tra cứu nhanh
            </span>
            <span className="text-xs font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
              {totalResults} kết quả
            </span>
          </div>

          {loading ? (
            <div className="p-6 text-center text-sm text-gray-400">
              Đang tra cứu dữ liệu...
            </div>
          ) : totalResults === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">
              Không tìm thấy kết quả phù hợp với từ khóa &quot;<strong className="text-gray-900">{query}</strong>&quot;.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 text-sm">

              {/* Group 1: Products */}
              {results.products && results.products.length > 0 && (
                <div className="p-3">
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-2 flex items-center gap-1.5">
                    <span>📦 Sản phẩm</span>
                    <span className="font-mono text-gray-500">({results.products.length})</span>
                  </div>
                  <div className="space-y-1">
                    {results.products.map((prod) => (
                      <Link
                        key={prod.id}
                        to="/products"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-2xl transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={prod.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc'}
                            alt={prod.name}
                            className="w-9 h-9 rounded-xl object-cover border border-gray-100 shrink-0"
                          />
                          <div className="truncate">
                            <span className="font-bold text-gray-900 group-hover:text-amber-600 block truncate">
                              {prod.name}
                            </span>
                            <span className="text-xs text-gray-400 uppercase">{prod.category}</span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-red-600 shrink-0 ml-2">
                          {formatCurrency(prod.discount_price || prod.price)}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Group 2: Orders */}
              {results.orders && results.orders.length > 0 && (
                <div className="p-3">
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-2 flex items-center gap-1.5">
                    <span>🛒 Đơn hàng</span>
                    <span className="font-mono text-gray-500">({results.orders.length})</span>
                  </div>
                  <div className="space-y-1">
                    {results.orders.map((ord) => (
                      <div
                        key={ord.id}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-2xl transition-colors"
                      >
                        <div>
                          <span className="font-bold font-mono text-gray-900 block">{ord.id}</span>
                          <span className="text-xs text-gray-500">{ord.customer_name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-emerald-600 block">{formatCurrency(ord.total)}</span>
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold">
                            {ord.status || 'Mới đặt'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Group 3: Customers */}
              {results.customers && results.customers.length > 0 && (
                <div className="p-3">
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-2 flex items-center gap-1.5">
                    <span>👤 Khách hàng</span>
                    <span className="font-mono text-gray-500">({results.customers.length})</span>
                  </div>
                  <div className="space-y-1">
                    {results.customers.map((cust) => (
                      <div
                        key={cust.id}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-2xl transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs shrink-0">
                            {cust.full_name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div className="truncate">
                            <span className="font-bold text-gray-900 block truncate">{cust.full_name}</span>
                            <span className="text-xs text-gray-500 font-mono block truncate">{cust.email}</span>
                          </div>
                        </div>
                        <span className="text-xs font-mono text-gray-500 shrink-0 ml-2">
                          {cust.phone || 'Chưa cập nhật'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      )}

    </div>
  )
}

export default AdminQuickSearch
