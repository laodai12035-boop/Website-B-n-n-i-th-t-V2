import React from 'react'
import { Link } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ProductCard from '@/components/product/ProductCard'
import { useWishlist } from '@/contexts/WishlistContext'
import { useAuth } from '@/contexts/AuthContext'

/**
 * WishlistPage — Trang Danh sách sản phẩm yêu thích của Khách hàng (nhaxinh.com style).
 * Góc cạnh vuông vức (rounded-none), thiết kế card 4:5 sang trọng, icon vector SVG.
 */
const WishlistPage = () => {
  const { user } = useAuth()
  const { wishlistItems, loading } = useWishlist()

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto w-full p-6 text-center my-auto">
          <div className="bg-white rounded-none p-12 border border-stone-200/80 shadow-2xs max-w-md mx-auto">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-none flex items-center justify-center mx-auto mb-4 border border-red-200">
              <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
            <h2 className="text-xl font-heading font-bold text-stone-900 mb-2 uppercase tracking-wider">VUI LÒNG ĐĂNG NHẬP</h2>
            <p className="text-xs text-stone-500 mb-6 leading-relaxed">
              Bạn cần đăng nhập tài khoản để lưu trữ và quản lý danh sách các món đồ nội thất yêu thích.
            </p>
            <Link
              to="/login"
              className="px-8 py-3.5 bg-stone-900 hover:bg-amber-800 text-white font-bold text-xs uppercase tracking-wider rounded-none inline-block shadow-2xs transition-colors"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 animate-fade-in">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-medium text-stone-500 mb-6">
          <Link to="/" className="hover:text-amber-800 transition-colors">Trang chủ</Link>
          <span>/</span>
          <span className="text-stone-900 font-semibold">Sản phẩm yêu thích</span>
        </nav>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-stone-200/80">
          <div>
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest bg-amber-100 px-2.5 py-0.5 rounded-none border border-amber-200 inline-block mb-1">
              Bộ sưu tập cá nhân
            </span>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2.5">
              <svg className="w-6 h-6 text-red-500 fill-current" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              SẢN PHẨM YÊU THÍCH
            </h1>
          </div>
          <span className="text-xs font-semibold text-stone-500">
            Tổng cộng <strong className="text-stone-900 font-mono text-sm">{wishlistItems.length}</strong> sản phẩm đã lưu
          </span>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[4/5] bg-stone-200 rounded-none animate-pulse"></div>
            ))}
          </div>
        ) : wishlistItems.length === 0 ? (
          /* Empty Wishlist State */
          <div className="bg-white rounded-none p-12 border border-stone-200/80 shadow-2xs text-center max-w-md mx-auto my-12">
            <div className="w-16 h-16 bg-stone-100 text-stone-400 rounded-none flex items-center justify-center mx-auto mb-4 border border-stone-200">
              <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
            <h3 className="text-base font-heading font-bold text-stone-900 mb-2 uppercase tracking-wider">
              Chưa có sản phẩm yêu thích
            </h3>
            <p className="text-xs text-stone-500 mb-6 leading-relaxed">
              Bạn chưa lưu sản phẩm nào vào danh sách. Hãy khám phá và nhấn biểu tượng trái tim để lưu lại những món đồ nội thất ưa thích nhé!
            </p>
            <Link
              to="/products"
              className="px-8 py-3.5 bg-stone-900 hover:bg-amber-800 text-white font-bold text-xs uppercase tracking-wider rounded-none inline-block shadow-2xs transition-colors"
            >
              Khám phá sản phẩm ngay
            </Link>
          </div>
        ) : (
          /* Wishlist Product Cards Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlistItems.map((product) => (
              <div key={product.id} className="relative group">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}

      </main>

      <Footer />
    </div>
  )
}

export default WishlistPage
