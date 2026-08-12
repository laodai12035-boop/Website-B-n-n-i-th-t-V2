import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import ProductCard from '@/components/product/ProductCard'
import { useWishlist } from '@/contexts/WishlistContext'
import { useAuth } from '@/contexts/AuthContext'

/**
 * WishlistPage — Trang Danh sách sản phẩm yêu thích của Khách hàng.
 */
const WishlistPage = () => {
  const { user } = useAuth()
  const { wishlistItems, loading, removeFromWishlist } = useWishlist()

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto w-full p-6 text-center my-auto">
          <div className="bg-white rounded-3xl p-12 border border-gray-100 shadow-sm max-w-md mx-auto">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 fill-red-500" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
            <h2 className="text-xl font-display font-bold text-gray-900 mb-2">Vui lòng đăng nhập</h2>
            <p className="text-sm text-gray-500 mb-6">Bạn cần đăng nhập tài khoản để xem danh sách sản phẩm yêu thích đã lưu.</p>
            <Link to="/login" className="btn-primary text-sm px-6 py-2.5">
              Đăng nhập ngay
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 animate-fade-in">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="inline-block px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-semibold uppercase tracking-wider mb-1">
              Danh sách cá nhân
            </span>
            <h1 className="text-2xl font-display font-bold text-gray-900 flex items-center gap-2">
              <span>❤️</span> Sản phẩm yêu thích
            </h1>
          </div>
          <span className="text-xs font-semibold text-gray-500">
            Tổng cộng <strong className="text-gray-900">{wishlistItems.length}</strong> sản phẩm đã lưu
          </span>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-4/3 bg-gray-200 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : wishlistItems.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-gray-100 shadow-sm text-center max-w-md mx-auto my-8">
            <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Chưa có sản phẩm yêu thích</h3>
            <p className="text-xs text-gray-500 mb-6">
              Bạn chưa thả tim lưu sản phẩm nào. Hãy khám phá và lưu lại những món đồ nội thất ưa thích nhé!
            </p>
            <Link to="/products" className="btn-primary text-xs px-5 py-2.5">
              Khám phá sản phẩm ngay
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlistItems.map((product) => (
              <div key={product.id} className="relative group">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  )
}

export default WishlistPage
