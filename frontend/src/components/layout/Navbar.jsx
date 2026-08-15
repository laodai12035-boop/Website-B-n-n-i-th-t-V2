import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { useCart } from '@/contexts/CartContext'
import SearchBar from '@/components/product/SearchBar'

/**
 * Navbar — Thanh điều hướng chuẩn phong cách Nhà Xinh (Nội thất cao cấp).
 * Cấu trúc: Top utility bar + Main Header + Navigation Categories + Integrated Search.
 */
const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const { wishlistCount } = useWishlist()
  const { cartCount, setIsCartOpen } = useCart()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Đóng dropdown khi click ngoài
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
    <header className="sticky top-0 z-50 bg-white shadow-xs font-sans">
      
      {/* 1. TOP BAR (Thanh tiện ích Nhà Xinh) */}
      <div className="bg-stone-100 text-stone-600 border-b border-stone-200 text-[12px] py-1.5 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Topbar Left: Hotline & Info Links */}
          <div className="flex items-center gap-4 sm:gap-6">
            <a href="tel:0903884358" className="flex items-center gap-1.5 font-semibold text-amber-800 hover:text-amber-900 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h32a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm0 6a2 2 0 012-2h32a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2zm0 6a2 2 0 012-2h32a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2z" />
              </svg>
              <span>Hotline: 0903 884 358</span>
            </a>
            <span className="hidden md:inline text-stone-300">|</span>
            <Link to="/products?category=khuyen-mai" className="hidden md:inline hover:text-stone-900 transition-colors">Khuyến mãi</Link>
            <span className="hidden lg:inline text-stone-300">|</span>
            <Link to="/products?sort=discount" className="hidden lg:inline text-red-600 font-semibold hover:underline">
              🔥 Giảm giá đặc biệt
            </Link>
          </div>

          {/* Topbar Right: Wishlist, Cart, Account */}
          <div className="flex items-center gap-5">
            
            {/* Wishlist Link */}
            <Link to="/wishlist" className="flex items-center gap-1 hover:text-amber-800 transition-colors">
              <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="hidden sm:inline">Yêu thích</span>
              {wishlistCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Link Trigger */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-1 hover:text-amber-800 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>Giỏ hàng</span>
              <span className="bg-amber-800 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {cartCount}
              </span>
            </button>

            {/* User Account Menu */}
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 font-medium text-stone-800 hover:text-amber-800 cursor-pointer"
                >
                  <svg className="w-4 h-4 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="max-w-[100px] truncate">{user?.full_name}</span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-stone-200 rounded-lg shadow-lg py-2 z-50 text-xs text-stone-800">
                    <div className="px-3 py-1.5 border-b border-stone-100 font-semibold text-stone-900 truncate">
                      {user?.full_name}
                    </div>
                    <Link to="/profile" onClick={() => setDropdownOpen(false)} className="block px-3 py-2 hover:bg-stone-50">Hồ sơ cá nhân</Link>
                    <Link to="/orders" onClick={() => setDropdownOpen(false)} className="block px-3 py-2 hover:bg-stone-50">Lịch sử đơn hàng</Link>
                    {user?.role === 'admin' && (
                      <Link to="/admin" onClick={() => setDropdownOpen(false)} className="block px-3 py-2 font-bold text-amber-800 hover:bg-amber-50">Quản trị Admin</Link>
                    )}
                    <button type="button" onClick={handleLogout} className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 font-medium">Đăng xuất</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="hover:text-amber-800">Đăng nhập</Link>
                <span>/</span>
                <Link to="/register" className="hover:text-amber-800">Đăng ký</Link>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* 2. MAIN HEADER BAR (Logo + Navigation + Search) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between gap-6 border-b border-stone-100">
        
        {/* Mobile Hamburger Menu Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="lg:hidden text-stone-700 p-1"
          aria-label="Toggle Navigation"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Brand Logo (Nhà Xinh Minimal Premium Logo Style) */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 bg-stone-900 text-white font-bold text-lg flex items-center justify-center rounded">
            NX
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-bold tracking-wider uppercase text-stone-900 block leading-tight">
              NHÀ XINH <span className="text-amber-700 font-normal">V2</span>
            </span>
            <span className="text-[9px] uppercase tracking-[0.3em] text-stone-400 block -mt-0.5">
              NỘI THẤT CAO CẤP
            </span>
          </div>
        </Link>

        {/* Search Bar Center/Right */}
        <div className="flex-1 max-w-sm ml-auto">
          <SearchBar />
        </div>

      </div>

      {/* 3. CATEGORY NAVIGATION MENU (Phong cách Nhà Xinh uppercase, clean dividers) */}
      <div className="hidden lg:block bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-8">
          <nav className="flex items-center justify-between text-[13px] font-semibold uppercase tracking-wider text-stone-800">
            <Link to="/" className="py-3.5 hover:text-amber-800 border-b-2 border-transparent hover:border-amber-800 transition-all">
              TRANG CHỦ
            </Link>
            <Link to="/products?category=san-pham-moi" className="py-3.5 text-amber-800 hover:text-amber-900 border-b-2 border-transparent hover:border-amber-800 transition-all">
              SẢN PHẨM MỚI
            </Link>
            <Link to="/products?category=phong-khach" className="py-3.5 hover:text-amber-800 border-b-2 border-transparent hover:border-amber-800 transition-all">
              PHÒNG KHÁCH
            </Link>
            <Link to="/products?category=phong-an" className="py-3.5 hover:text-amber-800 border-b-2 border-transparent hover:border-amber-800 transition-all">
              PHÒNG ĂN
            </Link>
            <Link to="/products?category=phong-ngu" className="py-3.5 hover:text-amber-800 border-b-2 border-transparent hover:border-amber-800 transition-all">
              PHÒNG NGỦ
            </Link>
            <Link to="/products?category=ban" className="py-3.5 hover:text-amber-800 border-b-2 border-transparent hover:border-amber-800 transition-all">
              BÀN & GHẾ
            </Link>
            <Link to="/products?category=tu-ke" className="py-3.5 hover:text-amber-800 border-b-2 border-transparent hover:border-amber-800 transition-all">
              TỦ & KỆ
            </Link>
            <Link to="/products" className="py-3.5 text-stone-900 hover:text-amber-800 border-b-2 border-transparent hover:border-amber-800 transition-all">
              TẤT CẢ SẢN PHẨM
            </Link>
          </nav>
        </div>
      </div>

      {/* 4. MOBILE MENU DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-stone-900 text-white p-4 space-y-3 border-t border-stone-800 text-sm">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block py-2 border-b border-stone-800">Trang chủ</Link>
          <Link to="/products?category=san-pham-moi" onClick={() => setMobileMenuOpen(false)} className="block py-2 border-b border-stone-800 text-amber-400">Sản phẩm mới</Link>
          <Link to="/products?category=phong-khach" onClick={() => setMobileMenuOpen(false)} className="block py-2 border-b border-stone-800">Phòng khách</Link>
          <Link to="/products?category=phong-an" onClick={() => setMobileMenuOpen(false)} className="block py-2 border-b border-stone-800">Phòng ăn</Link>
          <Link to="/products?category=phong-ngu" onClick={() => setMobileMenuOpen(false)} className="block py-2 border-b border-stone-800">Phòng ngủ</Link>
          <Link to="/products" onClick={() => setMobileMenuOpen(false)} className="block py-2">Tất cả sản phẩm</Link>
        </div>
      )}

    </header>
  )
}

export default Navbar
