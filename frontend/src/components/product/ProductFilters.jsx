import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

const PRICE_PRESETS = [
  { label: 'Tất cả mức giá', min: '', max: '' },
  { label: 'Dưới 5 triệu', min: '', max: '5000000' },
  { label: '5 - 15 triệu', min: '5000000', max: '15000000' },
  { label: '15 - 30 triệu', min: '15000000', max: '30000000' },
  { label: 'Trên 30 triệu', min: '30000000', max: '' },
]

/**
 * ProductFilters — Cột bên Trái (Left Sidebar) bộ lọc chuẩn E-commerce.
 * Chứa: Tìm kiếm, Danh mục sản phẩm (vertical list), Mức giá chọn nhanh & Khoảng giá tùy chỉnh.
 */
const ProductFilters = ({ categories = [], currentCategory = '', onCategorySelect }) => {
  const [searchParams, setSearchParams] = useSearchParams()

  const currentSearch = searchParams.get('search') || ''
  const currentMinPrice = searchParams.get('min_price') || ''
  const currentMaxPrice = searchParams.get('max_price') || ''
  const currentSort = searchParams.get('sort') || 'newest'

  const [searchInput, setSearchInput] = useState(currentSearch)
  const [minPriceInput, setMinPriceInput] = useState(currentMinPrice)
  const [maxPriceInput, setMaxPriceInput] = useState(currentMaxPrice)

  useEffect(() => {
    setSearchInput(currentSearch)
  }, [currentSearch])

  useEffect(() => {
    setMinPriceInput(currentMinPrice)
    setMaxPriceInput(currentMaxPrice)
  }, [currentMinPrice, currentMaxPrice])

  const updateFilters = (newParams) => {
    const params = new URLSearchParams(searchParams)
    Object.entries(newParams).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.set(key, val)
      } else {
        params.delete(key)
      }
    })
    setSearchParams(params)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    updateFilters({ search: searchInput.trim() })
  }

  const handlePresetSelect = (preset) => {
    setMinPriceInput(preset.min)
    setMaxPriceInput(preset.max)
    updateFilters({ min_price: preset.min, max_price: preset.max })
  }

  const handleCustomPriceApply = (e) => {
    e.preventDefault()
    updateFilters({ min_price: minPriceInput, max_price: maxPriceInput })
  }

  const handleResetFilters = () => {
    setSearchInput('')
    setMinPriceInput('')
    setMaxPriceInput('')
    const params = new URLSearchParams()
    if (currentSort && currentSort !== 'newest') {
      params.set('sort', currentSort)
    }
    setSearchParams(params)
    if (onCategorySelect) {
      onCategorySelect('')
    }
  }

  const hasActiveFilters = currentSearch || currentCategory || currentMinPrice || currentMaxPrice

  return (
    <div className="space-y-6">
      {/* Header Sidebar & Reset Button */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200">
        <h3 className="text-sm font-heading font-bold uppercase tracking-wider text-stone-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Bộ Lọc Sản Phẩm
        </h3>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-[11px] font-semibold text-red-600 hover:text-red-700 hover:underline transition-colors"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* 1. KHỐI TÌM KIẾM (SEARCH BOX) */}
      <div className="bg-white p-4 border border-stone-200/80 shadow-2xs">
        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800 mb-3 pb-2 border-b border-stone-100 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-8 after:h-0.5 after:bg-amber-800">
          Tìm kiếm
        </h4>
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm sản phẩm..."
            className="w-full pl-3 pr-10 py-2 text-xs bg-stone-50 border border-stone-200 text-stone-900 placeholder-stone-400 focus:outline-none focus:bg-white focus:border-amber-800 transition-colors"
          />
          <button
            type="submit"
            className="absolute right-0 top-0 bottom-0 px-3 bg-amber-800 hover:bg-amber-900 text-white transition-colors flex items-center justify-center"
            title="Tìm kiếm"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </form>
      </div>

      {/* 2. KHỐI DANH MỤC SẢN PHẨM (VERTICAL CATEGORY LIST) */}
      {categories && categories.length > 0 && (
        <div className="bg-white p-4 border border-stone-200/80 shadow-2xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800 mb-3 pb-2 border-b border-stone-100 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-8 after:h-0.5 after:bg-amber-800">
            Danh Mục
          </h4>
          <ul className="space-y-1">
            {categories.map((cat) => {
              const isActive = currentCategory === cat.id
              return (
                <li key={cat.id || 'all'}>
                  <button
                    type="button"
                    onClick={() => onCategorySelect && onCategorySelect(cat.id)}
                    className={`w-full text-left px-3 py-2 text-xs transition-all duration-200 flex items-center justify-between group cursor-pointer ${
                      isActive
                        ? 'bg-amber-800 text-white font-semibold shadow-2xs'
                        : 'text-stone-700 hover:bg-stone-100 hover:text-amber-800'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span className={`w-1.5 h-1.5 shrink-0 transition-all ${isActive ? 'bg-white' : 'bg-stone-300 group-hover:bg-amber-800'}`} />
                      <span className="truncate">{cat.name}</span>
                    </span>

                    {cat.count !== undefined && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 font-mono shrink-0 ml-2 ${
                          isActive ? 'bg-amber-950/40 text-amber-100' : 'bg-stone-100 text-stone-500 group-hover:bg-stone-200'
                        }`}
                      >
                        {cat.count}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* 3. KHỐI LỌC KHOẢNG GIÁ (PRICE FILTER) */}
      <div className="bg-white p-4 border border-stone-200/80 shadow-2xs">
        <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800 mb-3 pb-2 border-b border-stone-100 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-8 after:h-0.5 after:bg-amber-800">
          Khoảng Giá
        </h4>

        {/* Price Presets List */}
        <div className="space-y-1.5 mb-4">
          {PRICE_PRESETS.map((preset, idx) => {
            const isSelected = currentMinPrice === preset.min && currentMaxPrice === preset.max
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                className={`w-full text-left px-3 py-1.5 text-xs transition-all duration-150 flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'text-amber-800 font-bold bg-amber-50 border-l-2 border-amber-800 pl-2.5'
                    : 'text-stone-600 hover:text-amber-800 hover:bg-stone-50'
                }`}
              >
                <div className={`w-3 h-3 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-amber-800 bg-amber-800' : 'border-stone-300'}`}>
                  {isSelected && <div className="w-1 h-1 bg-white rounded-full" />}
                </div>
                <span>{preset.label}</span>
              </button>
            )
          })}
        </div>

        {/* Custom Price Range Input */}
        <form onSubmit={handleCustomPriceApply} className="pt-3 border-t border-stone-100">
          <span className="text-[11px] font-medium text-stone-500 block mb-2">Tùy chọn khoảng giá (đ):</span>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input
              type="number"
              placeholder="Từ"
              value={minPriceInput}
              onChange={(e) => setMinPriceInput(e.target.value)}
              className="w-full px-2 py-1.5 text-xs bg-stone-50 border border-stone-200 text-stone-800 focus:outline-none focus:border-amber-800"
            />
            <input
              type="number"
              placeholder="Đến"
              value={maxPriceInput}
              onChange={(e) => setMaxPriceInput(e.target.value)}
              className="w-full px-2 py-1.5 text-xs bg-stone-50 border border-stone-200 text-stone-800 focus:outline-none focus:border-amber-800"
            />
          </div>
          <button
            type="submit"
            className="w-full py-1.5 bg-stone-800 hover:bg-amber-800 text-white text-xs font-medium uppercase tracking-wider transition-colors cursor-pointer"
          >
            Áp dụng
          </button>
        </form>
      </div>
    </div>
  )
}

export default ProductFilters

