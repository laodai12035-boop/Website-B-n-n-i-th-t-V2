import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import AdminQuickSearch from '@/components/admin/AdminQuickSearch'

/**
 * AdminLayout — Bố cục Quản Trị Chuyên Nghiệp (nhaxinh.com style).
 * Thiết kế Sidebar bên trái màu Charcoal sẫm, KHÔNG DÙNG ICON theo yêu cầu.
 * Đầy đủ 11 phân hệ quản trị + Top Bar điều hướng.
 */
const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const navItems = [
    { path: '/admin', label: 'BẢNG ĐIỀU KHIỂN', exact: true },
    { path: '/admin/categories', label: 'DANH MỤC SẢN PHẨM' },
    { path: '/admin/products', label: 'TẤT CẢ SẢN PHẨM' },
    { path: '/admin/orders', label: 'QUẢN LÝ ĐƠN HÀNG' },
    { path: '/admin/returns', label: 'YÊU CẦU ĐỔI / TRẢ' },
    { path: '/admin/inventory', label: 'QUẢN LÝ KHO HÀNG' },
    { path: '/admin/combos', label: 'BỘ SẢN PHẨM COMBO' },
    { path: '/admin/coupons', label: 'MÃ GIẢM GIÁ VOUCHER' },
    { path: '/admin/banners', label: 'QUẢN LÝ BANNER' },
    { path: '/admin/reviews', label: 'ĐÁNH GIÁ & NHẬN XÉT' },
    { path: '/admin/customers', label: 'QUẢN LÝ TÀI KHOẢN' },
  ]

  const isCurrentActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path
    }
    return location.pathname.startsWith(item.path)
  }

  const currentActiveItem = navItems.find((item) => isCurrentActive(item)) || navItems[0]

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-admin text-stone-900 antialiased">
      <div className="flex-1 flex flex-col lg:flex-row">

        {/* 1. Mobile Sidebar Overlay Backdrop */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* 2. Admin Sidebar (Left Navigation Panel - Charcoal Theme, NO ICONS) */}
        <aside
          className={`fixed lg:sticky top-0 left-0 z-50 w-72 h-screen bg-[#1E1E22] text-stone-300 flex flex-col justify-between shrink-0 shadow-xl transition-transform duration-200 ease-in-out ${
            isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Brand Header */}
          <div>
            <div className="p-6 border-b border-stone-800 bg-[#161619] flex items-center justify-between">
              <div>
                <Link to="/admin" className="block">
                  <span className="text-lg font-heading font-extrabold text-white uppercase tracking-widest block">
                    NHÀ XINH
                  </span>
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block mt-0.5">
                    HỆ THỐNG QUẢN TRỊ V2
                  </span>
                </Link>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="lg:hidden text-stone-400 hover:text-white text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Navigation List (Text-Only, No Icons) */}
            <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-180px)] scrollbar-none">
              <div className="text-[10px] font-bold text-stone-500 uppercase tracking-widest px-3 py-2">
                MENU QUẢN TRỊ
              </div>
              {navItems.map((item) => {
                const active = isCurrentActive(item)
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className={`block px-4 py-3 rounded-none text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      active
                        ? 'bg-amber-800 text-white border-l-4 border-white shadow-2xs'
                        : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Sidebar Footer User Info */}
          <div className="p-4 border-t border-stone-800 bg-[#161619] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="min-w-0 pr-2">
                <p className="font-bold text-white truncate">{user?.full_name || 'Quản trị viên'}</p>
                <p className="text-[10px] text-stone-400 font-mono truncate">{user?.email}</p>
              </div>
              <span className="px-2 py-0.5 bg-amber-800 text-white rounded-none text-[10px] font-bold uppercase tracking-wider shrink-0">
                ADMIN
              </span>
            </div>

            <button
              type="button"
              onClick={logout}
              className="w-full py-2 bg-stone-800 hover:bg-red-950 hover:text-red-400 text-stone-300 rounded-none text-xs font-bold uppercase tracking-wider transition-colors text-center cursor-pointer block border border-stone-700"
            >
              ĐĂNG XUẤT
            </button>
          </div>
        </aside>

        {/* 3. Right Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Top Header Bar */}
          <header className="bg-white border-b border-stone-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-2xs">
            <div className="flex items-center gap-3">
              {/* Mobile Sidebar Toggle Button */}
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden p-2 bg-stone-100 hover:bg-stone-200 text-stone-900 rounded-none text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                MENU
              </button>

              <div>
                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                  KHU VỰC QUẢN TRỊ (ADMIN)
                </div>
                <h1 className="text-base sm:text-lg font-heading font-bold text-stone-900 uppercase tracking-wider truncate">
                  {currentActiveItem.label}
                </h1>
              </div>
            </div>

            {/* Top Right Utilities */}
            <div className="flex items-center gap-3">
              {/* Quick Search */}
              <div className="hidden sm:block">
                <AdminQuickSearch />
              </div>

              {/* Back to Client Website Button */}
              <Link
                to="/"
                target="_blank"
                className="px-4 py-2 border border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
                title="Mở Cửa hàng Bán lẻ trong thẻ mới"
              >
                XEM WEBSITE
              </Link>
            </div>
          </header>

          {/* Page Body View */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
            {children}
          </main>

        </div>

      </div>
    </div>
  )
}

export default AdminLayout
