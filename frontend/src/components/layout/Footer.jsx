import { Link } from 'react-router-dom'

/**
 * Footer — Chân trang phong cách Luxury E-Commerce theo MASTER.md
 */
const Footer = () => {
  return (
    <footer className="bg-stone-900 text-stone-300 pt-16 pb-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-stone-800">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-700 flex items-center justify-center text-white font-serif font-bold text-xl shadow-md">
                N
              </div>
              <div>
                <span className="font-serif font-bold text-2xl text-white tracking-tight block">
                  Nội Thất V2
                </span>
                <span className="text-[10px] text-amber-500 font-sans tracking-[0.2em] uppercase block">
                  LUXURY FURNITURE STORE
                </span>
              </div>
            </Link>
            <p className="text-sm text-stone-400 leading-relaxed max-w-sm">
              Chuyên cung cấp sản phẩm nội thất cao cấp, sang trọng được thiết kế tinh tế phù hợp cho không gian sống hiện đại & đẳng cấp.
            </p>
            <div className="flex items-center gap-3 text-stone-400 pt-2">
              <a href="#" className="w-9 h-9 rounded-full bg-stone-800 flex items-center justify-center hover:bg-amber-700 hover:text-white transition-colors cursor-pointer" title="Facebook">
                <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-stone-800 flex items-center justify-center hover:bg-amber-700 hover:text-white transition-colors cursor-pointer" title="Instagram">
                <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-serif font-semibold text-white text-base tracking-wide uppercase text-xs text-amber-500">
              Khám Phá
            </h4>
            <ul className="space-y-2 text-sm text-stone-400">
              <li>
                <Link to="/products" className="hover:text-amber-500 transition-colors">Tất cả sản phẩm</Link>
              </li>
              <li>
                <Link to="/products?category=ban" className="hover:text-amber-500 transition-colors">Bàn làm việc & Ăn</Link>
              </li>
              <li>
                <Link to="/products?category=ghe" className="hover:text-amber-500 transition-colors">Ghế & Sofa Cao Cấp</Link>
              </li>
              <li>
                <Link to="/products?category=phong-ngu" className="hover:text-amber-500 transition-colors">Nội thất Phòng ngủ</Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-3">
            <h4 className="font-serif font-semibold text-white text-base tracking-wide uppercase text-xs text-amber-500">
              Hỗ Trợ Khách Hàng
            </h4>
            <ul className="space-y-2 text-sm text-stone-400">
              <li>
                <Link to="/profile" className="hover:text-amber-500 transition-colors">Tài khoản cá nhân</Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-amber-500 transition-colors">Lịch sử đơn hàng</Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-amber-500 transition-colors">Giỏ hàng của tôi</Link>
              </li>
              <li>
                <Link to="/wishlist" className="hover:text-amber-500 transition-colors">Sản phẩm yêu thích</Link>
              </li>
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div className="space-y-3">
            <h4 className="font-serif font-semibold text-white text-base tracking-wide uppercase text-xs text-amber-500">
              Liên Hệ
            </h4>
            <div className="space-y-2 text-sm text-stone-400">
              <p className="flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                <span>Hà Nội / TP. Hồ Chí Minh</span>
              </p>
              <p className="flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h32a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm0 6a2 2 0 012-2h32a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2zm0 6a2 2 0 012-2h32a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2z"/></svg>
                <span>Hotline: 1900 8888</span>
              </p>
              <p className="flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                <span>support@noithatv2.vn</span>
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Section */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>© 2026 Nội Thất V2 Store. Tất cả quyền được bảo lưu.</p>
          <div className="flex items-center gap-6">
            <span>Bảo mật thông tin</span>
            <span>Điều khoản dịch vụ</span>
            <span>Chính sách đổi trả</span>
          </div>
        </div>

      </div>
    </footer>
  )
}

export default Footer
