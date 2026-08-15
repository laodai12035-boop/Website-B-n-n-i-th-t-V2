import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { useCart } from '@/contexts/CartContext'
import SearchBar from '@/components/product/SearchBar'
import CategoryNav from '@/components/product/CategoryNav'

/**
 * Navbar — Thanh điều hướng Liquid Glass cao cấp cho Website Nội Thất V2.
 */
const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const { wishlistCount } = useWishlist()
  const { cartCount, setIsCartOpen } = useCart()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    setDropdownOpen(false)
    await logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-stone-200/70 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">

          {/* Logo Brand Luxury */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-11 h-11 rounded-xl bg-stone-900 flex items-center justify-center text-amber-500 shadow-md group-hover:bg-amber-800 group-hover:text-white transition-all duration-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div>
              <span className="font-serif font-bold text-xl sm:text-2xl text-stone-900 tracking-tight block leading-tight group-hover:text-amber-800 transition-colors">
                Nội Thất V2
              </span>
              <span className="text-[10px] text-stone-400 font-sans tracking-[0.25em] uppercase leading-none block mt-0.5">
                LUXURY FURNITURE
              </span>
            </div>
          </Link>

          {/* Category Dropdown */}
          <CategoryNav className="shrink-0 hidden md:block" />

          {/* Search Bar (Mobile & Desktop) */}
          <div className="flex-1 max-w-xs sm:max-w-sm md:max-w-md">
            <SearchBar />
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-stone-700 shrink-0">
            <Link to="/" className="hover:text-amber-700 transition-colors py-1 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-amber-700 hover:after:w-full after:transition-all">
              Trang chủ
            </Link>
            <Link to="/products" className="hover:text-amber-700 transition-colors py-1 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-amber-700 hover:after:w-full after:transition-all">
              Sản phẩm
            </Link>
          </nav>

          {/* Right Section: User Actions & Cart */}
          <div className="flex items-center gap-3">

            {/* Wishlist Icon */}
            <Link
              to="/wishlist"
              className="relative p-2.5 text-stone-600 hover:text-red-500 hover:bg-stone-100/80 transition-all rounded-full flex items-center justify-center cursor-pointer"
              title="Danh sách yêu thích"
            >
              <svg className="w-5.5 h-5.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-sm animate-pulse">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Icon */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 text-stone-600 hover:text-amber-700 hover:bg-stone-100/80 transition-all rounded-full flex items-center justify-center cursor-pointer"
              title="Giỏ hàng của bạn"
            >
              <svg className="w-6 h-6 text-stone-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-700 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>

            {isAuthenticated ? (
              /* User Menu Dropdown (Đã đăng nhập) */
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-stone-100/80 transition-colors focus:outline-none cursor-pointer"
                  aria-expanded={dropdownOpen}
                >
                  <div className="w-9 h-9 rounded-full bg-stone-900 text-amber-500 font-semibold flex items-center justify-center text-sm border border-amber-600/30 shadow-sm">
                    {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium text-stone-800 hidden sm:inline-block max-w-[120px] truncate">
                    {user?.full_name}
                  </span>
                  <svg className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-3 w-60 bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-stone-200/80 py-2.5 animate-fade-in z-50">
                    <div className="px-4 py-2.5 border-b border-stone-100">
                      <p className="text-xs font-semibold text-stone-900 truncate">{user?.full_name}</p>
                      <p className="text-[11px] text-stone-500 truncate">{user?.email}</p>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 hover:text-amber-800 transition-colors"
                    >
                      <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Hồ sơ cá nhân
                    </Link>

                    <Link
                      to="/orders"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 hover:text-amber-800 transition-colors"
                    >
                      <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      Lịch sử đơn hàng
                    </Link>

                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-amber-800 hover:bg-amber-50/80 transition-colors"
                      >
                        <svg className="w-4 h-4 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Trang quản trị
                      </Link>
                    )}

                    <div className="border-t border-stone-100 my-1"></div>

                    {/* Nút Đăng Xuất */}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left font-medium cursor-pointer"
                    >
                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Auth Buttons (Chưa đăng nhập) */
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-stone-700 hover:text-amber-800 transition-colors px-3 py-2"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="btn-gold text-xs px-5 py-2.5 rounded-xl"
                >
                  Đăng ký
                </Link>
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  )
}

export default Navbar
