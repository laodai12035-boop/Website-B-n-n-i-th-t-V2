import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

const CATEGORY_ITEMS = [
  { id: '', name: 'Tất cả sản phẩm', icon: '🏠' },
  { id: 'ban', name: 'Bàn ăn & Bàn làm việc', icon: '🪑' },
  { id: 'ghe', name: 'Ghế & Sofa', icon: '🛋️' },
  { id: 'ke', name: 'Kệ sách & Tivi', icon: '📚' },
  { id: 'tu', name: 'Tủ quần áo & Trang trí', icon: '🚪' },
  { id: 'trang-tri', name: 'Trang trí & Đèn', icon: '💡' },
  { id: 'phong-ngu', name: 'Phòng ngủ (Danh mục mới)', icon: '🛏️' },
]

/**
 * CategoryNav — Dropdown Menu & Quick Bar chọn danh mục sản phẩm.
 */
const CategoryNav = ({ className = '' }) => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const currentCategory = searchParams.get('category') || ''

  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectCategory = (catId) => {
    setIsOpen(false)
    if (catId) {
      navigate(`/products?category=${catId}`)
    } else {
      navigate('/products')
    }
  }

  const activeItem = CATEGORY_ITEMS.find((item) => item.id === currentCategory) || CATEGORY_ITEMS[0]

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200/80 text-sm font-semibold text-gray-800 transition-colors focus:outline-none"
      >
        <span>{activeItem.icon}</span>
        <span className="hidden sm:inline-block max-w-[140px] truncate">{activeItem.name}</span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-card border border-gray-100 py-2 z-50 animate-fade-in">
          <div className="px-4 py-2 border-b border-gray-100">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
              Danh mục đồ nội thất
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto py-1">
            {CATEGORY_ITEMS.map((item) => {
              const isSelected = currentCategory === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectCategory(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors text-left ${
                    isSelected
                      ? 'bg-primary-50 text-primary-700 font-bold'
                      : 'text-gray-700 hover:bg-gray-50 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </div>
                  {isSelected && (
                    <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default CategoryNav
