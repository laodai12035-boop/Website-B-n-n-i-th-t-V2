import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import AdminQuickSearch from '@/components/admin/AdminQuickSearch'
import reviewService from '@/services/reviewService'
import FormAlert from '@/components/ui/FormAlert'

/**
 * AdminReviewsPage — Trang Quản lý Duyệt Bình Luận (NT-10-CN-001) & Thống Kê Đánh Giá (NT-10-CN-002).
 * Tuyến đường: /admin/reviews
 */
const AdminReviewsPage = () => {
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'approved' | 'hidden' | 'stats'
  
  // Reviews Moderation State (NT-10-CN-001)
  const [reviews, setReviews] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total_items: 0, total_pages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionSuccessMsg, setActionSuccessMsg] = useState(null)
  const [actionLoadingId, setActionLoadingId] = useState(null)

  // Reviews Stats State (NT-10-CN-002)
  const [statsData, setStatsData] = useState(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [statsSearch, setStatsSearch] = useState('')
  const [statsSortBy, setStatsSortBy] = useState('reviews_desc')

  const fetchReviews = async (status = activeTab, page = 1) => {
    setLoading(true)
    setError(null)
    try {
      const data = await reviewService.getAdminReviews({
        status,
        page,
        limit: 20,
      })
      setReviews(data.items || [])
      setPagination(data.pagination || { page: 1, limit: 20, total_items: 0, total_pages: 1 })
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể nạp danh sách bình luận đánh giá.')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async (search = statsSearch, sortBy = statsSortBy) => {
    setLoadingStats(true)
    setError(null)
    try {
      const data = await reviewService.getAdminReviewStats({
        search,
        sort_by: sortBy,
      })
      setStatsData(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể nạp báo cáo thống kê đánh giá.')
    } finally {
      setLoadingStats(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'stats') {
      fetchStats(statsSearch, statsSortBy)
    } else {
      fetchReviews(activeTab, 1)
    }
  }, [activeTab, statsSortBy])

  const handleSearchStats = (e) => {
    e.preventDefault()
    fetchStats(statsSearch, statsSortBy)
  }

  const handleModerate = async (reviewId, targetStatus) => {
    setActionLoadingId(reviewId)
    setActionSuccessMsg(null)
    try {
      const result = await reviewService.moderateReview(reviewId, targetStatus)
      setActionSuccessMsg(
        targetStatus
          ? 'Duyệt hiển thị bình luận thành công!'
          : 'Đã ẩn bình luận vi phạm khỏi website.'
      )
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, is_approved: result.is_approved } : r))
      )
      setTimeout(() => setActionSuccessMsg(null), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể cập nhật trạng thái bình luận.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '---'
    return new Date(dateStr).toLocaleString('vi-VN')
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-amber-400 font-bold' : 'text-gray-300'}>
        ★
      </span>
    ))
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-1">
              <Link to="/admin" className="hover:text-amber-600 transition-colors">
                Quản trị
              </Link>
              <span>/</span>
              <span className="text-gray-900 font-bold">Duyệt & Thống Kê Đánh Giá</span>
            </div>
            <h1 className="text-2xl font-display font-extrabold text-gray-900 flex items-center gap-2">
              <span>💬</span> Quản Lý Đánh Giá & Bình Luận Sản Phẩm
            </h1>
          </div>

          <AdminQuickSearch />
        </div>

        {error && (
          <div className="mb-4">
            <FormAlert type="error" message={error} />
          </div>
        )}

        {actionSuccessMsg && (
          <div className="mb-4">
            <FormAlert type="success" message={actionSuccessMsg} />
          </div>
        )}

        {/* Tabs navigation */}
        <div className="flex border-b border-gray-200 mb-6 gap-6 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`pb-3 text-xs font-extrabold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'all'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <span>💬</span> Tất Cả Bình Luận ({pagination.total_items})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('approved')}
            className={`pb-3 text-xs font-extrabold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'approved'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <span>✅</span> Đã Duyệt Hiển Thị
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('hidden')}
            className={`pb-3 text-xs font-extrabold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'hidden'
                ? 'border-red-600 text-red-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <span>🚫</span> Đã Ẩn / Vi Phạm
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`pb-3 text-xs font-extrabold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'stats'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <span>📊</span> Thống Kê Đánh Giá Sản Phẩm (NT-10-CN-002)
          </button>
        </div>

        {/* TAB 4: THỐNG KÊ ĐÁNH GIÁ SẢN PHẨM (NT-10-CN-002) */}
        {activeTab === 'stats' ? (
          <div className="space-y-6">
            {loadingStats ? (
              <div className="py-16 text-center text-gray-400 text-xs space-y-3">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="font-semibold">Đang tổng hợp dữ liệu thống kê đánh giá...</p>
              </div>
            ) : statsData ? (
              <>
                {/* KPI Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-5 bg-white rounded-3xl border border-gray-100 shadow-xs">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Điểm Trung Bình Toàn Sàn</span>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-amber-500 font-display">
                        {statsData.overview.overall_average_rating}
                      </span>
                      <span className="text-sm font-bold text-gray-400">/ 5.0 ⭐</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">Dựa trên các bình luận đã duyệt</p>
                  </div>

                  <div className="p-5 bg-white rounded-3xl border border-gray-100 shadow-xs">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tổng Lượt Đánh Giá</span>
                    <div className="mt-2 text-3xl font-extrabold text-gray-900 font-display">
                      {statsData.overview.total_reviews}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">Tất cả nhận xét từ khách hàng</p>
                  </div>

                  <div className="p-5 bg-white rounded-3xl border border-emerald-100 bg-emerald-50/20 shadow-xs">
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Đã Duyệt Hiển Thị</span>
                    <div className="mt-2 text-3xl font-extrabold text-emerald-700 font-display">
                      {statsData.overview.approved_reviews}
                    </div>
                    <p className="text-[11px] text-emerald-600 font-medium mt-1">Hiển thị công khai trên website</p>
                  </div>

                  <div className="p-5 bg-white rounded-3xl border border-red-100 bg-red-50/20 shadow-xs">
                    <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Đã Ẩn Vi Phạm</span>
                    <div className="mt-2 text-3xl font-extrabold text-red-700 font-display">
                      {statsData.overview.hidden_reviews}
                    </div>
                    <p className="text-[11px] text-red-600 font-medium mt-1">Đã loại bỏ khỏi trang sản phẩm</p>
                  </div>
                </div>

                {/* Phân bổ số sao & Bộ lọc tìm kiếm sản phẩm */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Rating Breakdown Widget */}
                  <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-xs">
                    <h3 className="text-sm font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                      <span>⭐</span> Phân Bổ Mức Đánh Giá
                    </h3>
                    <div className="space-y-3">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = statsData.overview.star_distribution[star] || 0
                        const pct = statsData.overview.approved_reviews > 0
                          ? roundPct((count / statsData.overview.approved_reviews) * 100)
                          : 0
                        return (
                          <div key={star} className="flex items-center gap-3 text-xs">
                            <span className="w-10 font-bold text-gray-700 text-right">{star} sao</span>
                            <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                              <div
                                className="bg-amber-400 h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                            <span className="w-16 text-right font-mono font-bold text-gray-500">
                              {count} ({pct}%)
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Product Filter & Stats Info */}
                  <div className="lg:col-span-2 p-6 bg-white rounded-3xl border border-gray-100 shadow-xs flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-extrabold text-gray-900 mb-3 flex items-center gap-2">
                        <span>🔍</span> Bộ Lọc Thống Kê Theo Sản Phẩm
                      </h3>
                      <form onSubmit={handleSearchStats} className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="text"
                          placeholder="Tìm sản phẩm theo tên..."
                          value={statsSearch}
                          onChange={(e) => setStatsSearch(e.target.value)}
                          className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                        />
                        <select
                          value={statsSortBy}
                          onChange={(e) => setStatsSortBy(e.target.value)}
                          className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 outline-none cursor-pointer"
                        >
                          <option value="reviews_desc">Lượt đánh giá: Nhiều nhất</option>
                          <option value="reviews_asc">Lượt đánh giá: Ít nhất</option>
                          <option value="rating_desc">Điểm sao: Cao nhất</option>
                          <option value="rating_asc">Điểm sao: Thấp nhất</option>
                        </select>
                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-colors shrink-0 shadow-xs cursor-pointer"
                        >
                          Lọc dữ liệu
                        </button>
                      </form>
                    </div>

                    <div className="mt-4 p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center gap-3">
                      <span className="text-xl">💡</span>
                      <p className="text-xs text-indigo-900">
                        Quản trị viên có thể theo dõi **Tỷ lệ hài lòng (%)** của từng mặt hàng để kịp thời điều chỉnh sản phẩm có phản hồi thấp từ khách hàng.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Product Stats Table */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                      Danh sách Thống Kê Theo Sản Phẩm ({statsData.products.length})
                    </h3>
                  </div>

                  {statsData.products.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 text-xs">
                      Không tìm thấy sản phẩm phù hợp.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                            <th className="py-4 px-6">Sản phẩm</th>
                            <th className="py-4 px-4 text-center">Điểm sao Trung Bình</th>
                            <th className="py-4 px-4 text-center">Tổng Đánh Giá</th>
                            <th className="py-4 px-4 text-center">Đã Duyệt</th>
                            <th className="py-4 px-4 text-center">Đã Ẩn</th>
                            <th className="py-4 px-6 text-center">Tỷ Lệ Hài Lòng (4-5★)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-medium">
                          {statsData.products.map((p) => (
                            <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                              {/* Sản phẩm */}
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={p.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc'}
                                    alt={p.name}
                                    className="w-10 h-10 rounded-xl object-cover border border-gray-200 shrink-0"
                                  />
                                  <div>
                                    <p className="font-bold text-gray-900 line-clamp-1">{p.name}</p>
                                    <span className="text-[10px] text-gray-400 uppercase font-bold">{p.category}</span>
                                  </div>
                                </div>
                              </td>

                              {/* Điểm sao */}
                              <td className="py-4 px-4 text-center">
                                <div className="flex items-center justify-center gap-1 font-bold text-amber-600 text-sm">
                                  <span>{p.average_rating}</span>
                                  <span className="text-amber-400">★</span>
                                </div>
                              </td>

                              {/* Tổng Đánh Giá */}
                              <td className="py-4 px-4 text-center font-bold text-gray-900 font-mono text-sm">
                                {p.total_reviews}
                              </td>

                              {/* Đã Duyệt */}
                              <td className="py-4 px-4 text-center text-emerald-600 font-bold font-mono">
                                {p.approved_reviews}
                              </td>

                              {/* Đã Ẩn */}
                              <td className="py-4 px-4 text-center text-red-600 font-bold font-mono">
                                {p.hidden_reviews}
                              </td>

                              {/* Tỷ lệ hài lòng */}
                              <td className="py-4 px-6 text-center">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-extrabold inline-block ${
                                    p.satisfaction_rate >= 80
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : p.satisfaction_rate >= 50
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {p.satisfaction_rate}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        ) : (
          /* TAB 1-3: MODERATION TABLE (NT-10-CN-001) */
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
            {loading ? (
              <div className="py-16 text-center text-gray-400 text-xs space-y-3">
                <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="font-semibold">Đang nạp danh sách bình luận...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-xs space-y-2">
                <p className="font-bold text-gray-700 text-sm">Không có bình luận nào</p>
                <p className="text-gray-400">Không tìm thấy nhận xét phù hợp với bộ lọc hiện tại.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                      <th className="py-4 px-6">Khách hàng</th>
                      <th className="py-4 px-4">Sản phẩm</th>
                      <th className="py-4 px-4 text-center">Đánh giá</th>
                      <th className="py-4 px-6">Nội dung nhận xét</th>
                      <th className="py-4 px-4 text-center">Trạng thái</th>
                      <th className="py-4 px-4">Thời gian</th>
                      <th className="py-4 px-6 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {reviews.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50/60 transition-colors">
                        {/* Khách hàng */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0 text-xs uppercase">
                              {r.user_name ? r.user_name.charAt(0) : 'U'}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 line-clamp-1">{r.user_name}</p>
                              <span className="text-[10px] text-gray-400 font-mono">User ID: #{r.user_id}</span>
                            </div>
                          </div>
                        </td>

                        {/* Sản phẩm */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2 max-w-[200px]">
                            <img
                              src={r.product_image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc'}
                              alt={r.product_name}
                              className="w-8 h-8 rounded-lg object-cover border border-gray-200 shrink-0"
                            />
                            <span className="font-bold text-gray-800 line-clamp-2 leading-tight">
                              {r.product_name || `Sản phẩm #${r.product_id}`}
                            </span>
                          </div>
                        </td>

                        {/* Số sao */}
                        <td className="py-4 px-4 text-center">
                          <div className="text-sm tracking-tighter whitespace-nowrap">{renderStars(r.rating)}</div>
                          <span className="text-[10px] font-bold text-gray-500">{r.rating}/5 sao</span>
                        </td>

                        {/* Nội dung nhận xét */}
                        <td className="py-4 px-6">
                          <p className="text-gray-700 font-normal leading-relaxed max-w-sm italic">
                            "{r.comment || 'Không có nhận xét chữ'}"
                          </p>
                        </td>

                        {/* Trạng thái */}
                        <td className="py-4 px-4 text-center">
                          {r.is_approved ? (
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-[11px] inline-flex items-center gap-1">
                              <span>✅</span> Hiển thị
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-xl font-bold text-[11px] inline-flex items-center gap-1">
                              <span>🚫</span> Đã ẩn
                            </span>
                          )}
                        </td>

                        {/* Thời gian */}
                        <td className="py-4 px-4 text-gray-500 font-mono text-[11px] whitespace-nowrap">
                          {formatDate(r.created_at)}
                        </td>

                        {/* Hành động */}
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          {r.is_approved ? (
                            <button
                              type="button"
                              disabled={actionLoadingId === r.id}
                              onClick={() => handleModerate(r.id, false)}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl font-bold text-xs transition-colors cursor-pointer border border-red-200 shadow-2xs disabled:opacity-50"
                            >
                              {actionLoadingId === r.id ? 'Đang xử lý...' : '🚫 Ẩn bình luận'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={actionLoadingId === r.id}
                              onClick={() => handleModerate(r.id, true)}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold text-xs transition-colors cursor-pointer border border-emerald-200 shadow-2xs disabled:opacity-50"
                            >
                              {actionLoadingId === r.id ? 'Đang xử lý...' : '✅ Duyệt hiển thị'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

const roundPct = (num) => Math.round(num * 10) / 10

export default AdminReviewsPage
