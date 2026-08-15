import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

const SORT_OPTIONS = [
  { id: 'newest', label: 'Mới nhất' },
  { id: 'price_asc', label: 'Giá: Thấp đến Cao' },
  { id: 'price_desc', label: 'Giá: Cao đến Thấp' },
  { id: 'rating_desc', label: 'Đánh giá cao nhất' },
]

const PRICE_PRESETS = [
  { label: 'Tất cả mức giá', min: '', max: '' },
  { label: 'Dưới 5 triệu', min: '', max: '5000000' },
  { label: '5 - 15 triệu', min: '5000000', max: '15000000' },
  { label: 'Trên 15 triệu', min: '15000000', max: '' },
]

/**
 * ProductFilters — Bộ lọc khoảng giá & Dropdown sắp xếp đồng bộ chuẩn MASTER.md.
 */
const ProductFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const currentSort = searchParams.get('sort') || 'newest'
  const currentMinPrice = searchParams.get('min_price') || ''
  const currentMaxPrice = searchParams.get('max_price') || ''

  const [minPriceInput, setMinPriceInput] = useState(currentMinPrice)
  const [maxPriceInput, setMaxPriceInput] = useState(currentMaxPrice)

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

  const handleSortChange = (e) => {
    updateFilters({ sort: e.target.value })
  }

  const handlePresetSelect = (preset) => {
    setMinPriceInput(preset.min)
    setMaxPriceInput(preset.max)
    updateFilters({ min_price: preset.min, max_price: preset.max })
  }

  const handleResetFilters = () => {
    setMinPriceInput('')
    setMaxPriceInput('')
    const params = new URLSearchParams(searchParams)
    params.delete('min_price')
    params.delete('max_price')
    params.delete('sort')
    setSearchParams(params)
  }

  const hasActiveFilters = currentMinPrice || currentMaxPrice || (currentSort && currentSort !== 'newest')

  return (
    <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">

      {/* Left: Price Presets (Đồng bộ style 100% với Category Tabs) */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider shrink-0">
          Khoảng giá:
        </span>

        {/* Price Preset Chips */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {PRICE_PRESETS.map((preset, idx) => {
            const isSelected = currentMinPrice === preset.min && currentMaxPrice === preset.max
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-800 text-white shadow-sm font-semibold'
                    : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200/80'
                }`}
              >
                {preset.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Right: Sort Selector & Reset */}
      <div className="flex items-center gap-3 shrink-0">

        {/* Sort Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="sort_select" className="text-xs font-semibold text-stone-500 uppercase tracking-wider shrink-0">
            Sắp xếp:
          </label>
          <select
            id="sort_select"
            value={currentSort}
            onChange={handleSortChange}
            className="px-3.5 py-2 bg-white text-xs font-medium text-stone-800 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-amber-800 cursor-pointer shadow-2xs"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Filter Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-xl border border-red-200 transition-colors cursor-pointer"
          >
            Xóa bộ lọc
          </button>
        )}

      </div>

    </div>
  )
}

export default ProductFilters
