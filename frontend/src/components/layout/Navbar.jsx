import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { useCart } from '@/contexts/CartContext'
import SearchBar from '@/components/product/SearchBar'
import productService from '@/services/productService'

/**
 * Navbar — Thanh điều hướng chuẩn phong cách Nhà Xinh (Nội thất cao cấp).
 * 1. Nạp danh mục sản phẩm ĐỘNG từ Database (API getCategories).
 * 2. Ẩn thanh trượt xấu xí của trình duyệt, thay bằng 2 Mũi tên cuộn 2 đầu (‹ và ›) bấm cuộn mượt mà.
 * 3. Hỗ trợ ẩn thanh danh mục trên các trang Đăng nhập / Đăng ký.
 */
const Navbar = ({ hideCategoryNav = false }) => {
  const { user, isAuthenticated, logout } = useAuth()
  const { wishlistCount } = useWishlist()
  const { cartCount, setIsCartOpen } = useCart()
  const navigate = useNavigate()
  const location = useLocation()

  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(location.pathname)
  const shouldHideCategories = hideCategoryNav || isAuthPage

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [categories, setCategories] = useState([])

  // Category scroll bar state & ref
  const navRef = useRef(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(false)

  const dropdownRef = useRef(null)

  // Nạp danh mục động từ Database
  useEffect(() => {
    const fetchNavCategories = async () => {
      try {
        const catData = await productService.getCategories()
        if (Array.isArray(catData) && catData.length > 0) {
          setCategories(catData)
        }
      } catch (err) {
        console.warn('Lỗi khi nạp danh mục động cho Navbar:', err)
      }
    }
    fetchNavCategories()
  }, [])

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

  // Danh mục mặc định nếu chưa có từ DB
  const defaultCategories = [
    { id: 'phong-khach', name: 'PHÒNG KHÁCH' },
    { id: 'phong-an', name: 'PHÒNG ĂN' },
    { id: 'phong-ngu', name: 'PHÒNG NGỦ' },
    { id: 'ban', name: 'BÀN & GHẾ' },
    { id: 'tu-ke', name: 'TỦ & KỆ' },
  ]

  const activeCategories = categories.length > 0 ? categories : defaultCategories

  // Kiểm tra vị trí cuộn để ẩn/hiện 2 mũi tên 2 đầu
  const checkScroll = () => {
    if (!navRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = navRef.current
    setShowLeftArrow(scrollLeft > 10)
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10)
  }

  useEffect(() => {
    const el = navRef.current
    if (el) {
      el.addEventListener('scroll', checkScroll)
      // Check ban đầu
      checkScroll()
      // Tự động re-check sau khi render categories
      const timer = setTimeout(checkScroll, 300)
      return () => {
        el.removeEventListener('scroll', checkScroll)
        clearTimeout(timer)
      }
    }
  }, [activeCategories])

  const scrollNav = (direction) => {
    if (!navRef.current) return
    const scrollAmount = direction === 'left' ? -260 : 260
    navRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
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

            <span className="text-stone-300">|</span>

            {/* Account Menu / Login Button */}
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center gap-1.5 font-semibold text-stone-800 hover:text-amber-800 transition-colors cursor-pointer"
                >
                  <span className="w-5 h-5 rounded-full bg-amber-800 text-white text-[10px] font-bold flex items-center justify-center">
                    {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                  <span className="max-w-[100px] truncate">{user?.full_name || 'Tài khoản'}</span>
                  <svg className="w-3 h-3 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-stone-200 shadow-lg rounded-none py-1.5 z-50 text-xs">
                    <div className="px-4 py-2 border-b border-stone-100">
                      <p className="font-bold text-stone-900 truncate">{user?.full_name}</p>
                      <p className="text-[11px] text-stone-400 truncate">{user?.email}</p>
                    </div>

                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2 text-amber-800 font-bold hover:bg-amber-50 transition-colors"
                      >
                        Quản Trị Viên (Admin)
                      </Link>
                    )}

                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-stone-700 hover:bg-stone-50 transition-colors"
                    >
                      Hồ sơ cá nhân
                    </Link>

                    <Link
                      to="/profile/addresses"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-stone-700 hover:bg-stone-50 transition-colors"
                    >
                      Địa chỉ nhận hàng
                    </Link>

                    <Link
                      to="/orders"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2 text-stone-700 hover:bg-stone-50 transition-colors"
                    >
                      Lịch sử đơn hàng
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-600 font-semibold hover:bg-red-50 transition-colors border-t border-stone-100 mt-1 cursor-pointer"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 font-semibold">
                <Link to="/login" className="hover:text-amber-800 transition-colors">Đăng nhập</Link>
                <span className="text-stone-300">/</span>
                <Link to="/register" className="hover:text-amber-800 transition-colors">Đăng ký</Link>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* 2. MAIN BRAND HEADER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-4 border-b border-stone-100">
        
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((v) => !v)}
          className="lg:hidden p-2 text-stone-700 hover:text-stone-900 cursor-pointer"
          aria-label="Mở menu mobile"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Brand Logo Nhà Xinh */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-stone-900 text-white font-extrabold text-lg flex items-center justify-center rounded-none shadow-2xs font-heading">
            NX
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-heading font-black tracking-wider text-stone-900 block leading-none">
              NHÀ XINH <span className="text-amber-800 text-sm font-sans font-bold">V2</span>
            </span>
            <span className="text-[10px] font-sans font-semibold text-stone-400 uppercase tracking-widest block mt-0.5">
              NỘI THẤT CAO CẤP
            </span>
          </div>
        </Link>

        {/* Search Bar Center/Right (Ẩn trên các trang Đăng nhập / Đăng ký) */}
        {!isAuthPage && (
          <div className="flex-1 max-w-sm ml-auto">
            <SearchBar />
          </div>
        )}

      </div>

      {/* 3. DYNAMIC CATEGORY NAVIGATION MENU WITH FLEX SLOT ARROWS (KHÔNG BAO GIỜ BỊ CHỜM NẮM/ĐÈ LÊN CHỮ) */}
      {!shouldHideCategories && (
        <div className="hidden lg:block bg-white border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-2">
            
            {/* Slot Mũi tên Cuộn Trái (‹) */}
            <div className="w-8 shrink-0 flex items-center justify-start">
              {showLeftArrow && (
                <button
                  type="button"
                  onClick={() => scrollNav('left')}
                  className="w-7 h-7 bg-stone-900 text-white hover:bg-amber-800 shadow-md flex items-center justify-center text-base font-bold transition-all cursor-pointer rounded-none border border-stone-800"
                  title="Cuộn sang trái"
                >
                  ‹
                </button>
              )}
            </div>

            {/* Nav Container — Ẩn thanh trượt ngang mặc định */}
            <nav
              ref={navRef}
              className="flex-1 flex items-center gap-6 sm:gap-8 md:gap-10 text-[13px] font-semibold uppercase tracking-wider text-stone-800 overflow-x-auto scrollbar-none px-4 py-0 select-none border-x border-stone-100"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <Link to="/" className="py-3.5 hover:text-amber-800 border-b-2 border-transparent hover:border-amber-800 transition-all shrink-0">
                TRANG CHỦ
              </Link>

              <Link to="/products?sort=newest" className="py-3.5 text-amber-800 hover:text-amber-900 border-b-2 border-transparent hover:border-amber-800 transition-all shrink-0">
                SẢN PHẨM MỚI
              </Link>

              {/* Render các danh mục động từ Database */}
              {activeCategories.map((cat) => (
                <Link
                  key={cat.id || cat.slug}
                  to={`/products?category=${cat.id || cat.slug}`}
                  className="py-3.5 hover:text-amber-800 border-b-2 border-transparent hover:border-amber-800 transition-all shrink-0"
                >
                  {cat.name}
                </Link>
              ))}

              <Link to="/products" className="py-3.5 text-stone-900 hover:text-amber-800 border-b-2 border-transparent hover:border-amber-800 transition-all shrink-0">
                TẤT CẢ SẢN PHẨM
              </Link>
            </nav>

            {/* Slot Mũi tên Cuộn Phải (›) */}
            <div className="w-8 shrink-0 flex items-center justify-end">
              {showRightArrow && (
                <button
                  type="button"
                  onClick={() => scrollNav('right')}
                  className="w-7 h-7 bg-stone-900 text-white hover:bg-amber-800 shadow-md flex items-center justify-center text-base font-bold transition-all cursor-pointer rounded-none border border-stone-800"
                  title="Cuộn sang phải"
                >
                  ›
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* 4. MOBILE MENU DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-stone-900 text-white p-4 space-y-3 border-t border-stone-800 text-sm">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block py-2 border-b border-stone-800">Trang chủ</Link>
          <Link to="/products?sort=newest" onClick={() => setMobileMenuOpen(false)} className="block py-2 border-b border-stone-800 text-amber-400">Sản phẩm mới</Link>
          
          {activeCategories.map((cat) => (
            <Link
              key={cat.id || cat.slug}
              to={`/products?category=${cat.id || cat.slug}`}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 border-b border-stone-800"
            >
              {cat.name}
            </Link>
          ))}

          <Link to="/products" onClick={() => setMobileMenuOpen(false)} className="block py-2">Tất cả sản phẩm</Link>
        </div>
      )}

    </header>
  )
}

export default Navbar
