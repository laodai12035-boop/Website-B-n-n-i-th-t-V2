import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

/**
 * SearchBar — Ô tìm kiếm sản phẩm thông minh.
 * Dùng ở Navbar hoặc Header các trang.
 */
const SearchBar = ({ className = '' }) => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [keyword, setKeyword] = useState('')

  // Sync keyword từ URL search query param
  useEffect(() => {
    setKeyword(searchParams.get('search') || '')
  }, [searchParams])

  const handleSearch = (e) => {
    e.preventDefault()
    const trimmed = keyword.trim()
    if (trimmed) {
      navigate(`/products?search=${encodeURIComponent(trimmed)}`)
    } else {
      navigate('/products')
    }
  }

  const handleClear = () => {
    setKeyword('')
    navigate('/products')
  }

  return (
    <form onSubmit={handleSearch} className={`relative flex items-center w-full ${className}`}>
      <div className="relative w-full">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm sản phẩm (Sofa, bàn ăn, kệ sách...)"
          className="w-full pl-10 pr-10 py-2 bg-gray-100/80 hover:bg-gray-100 focus:bg-white text-sm text-gray-900 placeholder-gray-400 rounded-full border border-transparent focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all outline-none"
        />

        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Clear Icon Button */}
        {keyword && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </form>
  )
}

export default SearchBar
