import { Link } from 'react-router-dom'

/**
 * Footer — Chân trang chuẩn phong cách Nhà Xinh (Nội thất cao cấp #303036).
 */
const Footer = () => {
  return (
    <footer className="bg-[#303036] text-stone-300 font-sans pt-14 pb-8 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 1. TOP NEWSLETTER ROW (Đăng ký nhận thông tin ưu đãi) */}
        <div className="bg-[#25252a] rounded-2xl p-6 sm:p-8 mb-12 flex flex-col md:flex-row items-center justify-between gap-6 border border-stone-700/50">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-lg font-bold text-white uppercase tracking-wider">
              Đăng ký nhận tin tức & khuyến mãi từ Nhà Xinh V2
            </h3>
            <p className="text-xs text-stone-400">
              Cập nhật các bộ sưu tập nội thất mới nhất và nhận voucher ưu đãi đặc biệt.
            </p>
          </div>
          <div className="w-full md:w-auto flex items-center gap-2 max-w-md">
            <input
              type="email"
              placeholder="Nhập email của bạn..."
              className="px-4 py-2.5 rounded-lg bg-stone-900 border border-stone-700 text-sm text-white focus:outline-none focus:border-amber-600 w-full"
            />
            <button
              type="button"
              className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs uppercase tracking-wider rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              Đăng ký
            </button>
          </div>
        </div>

        {/* 2. MAIN FOOTER COLUMNS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-stone-700/60 text-xs">
          
          {/* Col 1: Brand & Contact */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white text-stone-900 font-bold text-base flex items-center justify-center rounded">
                NX
              </div>
              <span className="text-xl font-bold uppercase tracking-wider text-white">
                NHÀ XINH <span className="text-amber-500 font-normal">V2</span>
              </span>
            </div>
            <p className="text-stone-400 leading-relaxed">
              Thương hiệu nội thất cao cấp hàng đầu Việt Nam. Chuyên cung cấp sản phẩm nội thất gia đình thiết kế tinh tế & hiện đại.
            </p>
            <div className="space-y-2 text-stone-300 pt-1">
              <p className="flex items-center gap-2">
                <span className="font-semibold text-amber-500">Hotline:</span> 0903 884 358
              </p>
              <p className="flex items-center gap-2">
                <span className="font-semibold text-amber-500">Email:</span> contact@nhaxinhv2.com
              </p>
              <p className="flex items-start gap-2">
                <span className="font-semibold text-amber-500 shrink-0">Showroom:</span>
                <span>Hà Nội & TP. Hồ Chí Minh</span>
              </p>
            </div>
          </div>

          {/* Col 2: Categories */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-amber-600/40 pb-2 inline-block">
              Sản Phẩm Nội Thất
            </h4>
            <ul className="space-y-2.5 text-stone-400">
              <li><Link to="/products?category=phong-khach" className="hover:text-amber-400 transition-colors">Nội thất Phòng Khách</Link></li>
              <li><Link to="/products?category=phong-an" className="hover:text-amber-400 transition-colors">Nội thất Phòng Ăn</Link></li>
              <li><Link to="/products?category=phong-ngu" className="hover:text-amber-400 transition-colors">Nội thất Phòng Ngủ</Link></li>
              <li><Link to="/products?category=ban" className="hover:text-amber-400 transition-colors">Bàn làm việc & Ghế</Link></li>
              <li><Link to="/products?category=tu-ke" className="hover:text-amber-400 transition-colors">Tủ & Kệ trang trí</Link></li>
            </ul>
          </div>

          {/* Col 3: Customer Support */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-amber-600/40 pb-2 inline-block">
              Về Nhà Xinh & Hỗ Trợ
            </h4>
            <ul className="space-y-2.5 text-stone-400">
              <li><Link to="/profile" className="hover:text-amber-400 transition-colors">Tài khoản khách hàng</Link></li>
              <li><Link to="/orders" className="hover:text-amber-400 transition-colors">Kiểm tra đơn hàng</Link></li>
              <li><Link to="/cart" className="hover:text-amber-400 transition-colors">Giỏ hàng thanh toán</Link></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Chính sách bảo hành 12 tháng</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Chính sách đổi trả & Giao hàng</a></li>
            </ul>
          </div>

          {/* Col 4: Store Locations & Social */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-amber-600/40 pb-2 inline-block">
              Hệ Thống Cửa Hàng
            </h4>
            <p className="text-stone-400 leading-relaxed">
              Trải nghiệm thực tế các không gian mẫu tại các showroom Nhà Xinh trên toàn quốc.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="w-8 h-8 rounded bg-stone-800 flex items-center justify-center text-stone-300 hover:bg-amber-700 hover:text-white cursor-pointer transition-colors">FB</span>
              <span className="w-8 h-8 rounded bg-stone-800 flex items-center justify-center text-stone-300 hover:bg-amber-700 hover:text-white cursor-pointer transition-colors">IG</span>
              <span className="w-8 h-8 rounded bg-stone-800 flex items-center justify-center text-stone-300 hover:bg-amber-700 hover:text-white cursor-pointer transition-colors">YT</span>
            </div>
          </div>

        </div>

        {/* 3. BOTTOM COPYRIGHT ROW */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-stone-500 text-[11px]">
          <p>© 2026 Nội thất Nhà Xinh V2. Tất cả quyền được bảo lưu.</p>
          <div className="flex items-center gap-4">
            <span>Bảo mật thông tin</span>
            <span>•</span>
            <span>Điều khoản sử dụng</span>
          </div>
        </div>

      </div>
    </footer>
  )
}

export default Footer
