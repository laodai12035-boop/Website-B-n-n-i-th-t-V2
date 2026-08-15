import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import reviewService from '@/services/reviewService'
import FormAlert from '@/components/ui/FormAlert'

/**
 * AdminReviewsPage — Trang Quản lý Duyệt Bình Luận & Thống Kê Đánh Giá (nhaxinh.com style).
 * Góc cạnh vuông vức (rounded-none), KHÔNG SỬ DỤNG ICON.
 */
const AdminReviewsPage = () => {
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'approved' | 'hidden' | 'stats'
  
  // Reviews Moderation State
  const [reviews, setReviews] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total_items: 0, total_pages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionSuccessMsg, setActionSuccessMsg] = useState(null)
  const [actionLoadingId, setActionLoadingId] = useState(null)

  // Reviews Stats State
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
      const data = await reviewService.getAdminReviewAnalytics({
        search: search.trim() || undefined,
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
      fetchStats()
    } else {
      fetchReviews(activeTab, 1)
    }
  }, [activeTab])

  const handleModerate = async (reviewId, isApproved) => {
    setActionLoadingId(reviewId)
    setActionSuccessMsg(null)
    try {
      await reviewService.moderateReview(reviewId, isApproved)
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, is_approved: isApproved } : r))
      )
      setActionSuccessMsg(
        isApproved
          ? 'Đã duyệt công khai bình luận thành công!'
          : 'Đã ẩn bình luận thành công!'
      )
      setTimeout(() => setActionSuccessMsg(null), 4000)
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể cập nhật trạng thái bình luận.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleSearchStats = (e) => {
    e.preventDefault()
    fetchStats(statsSearch, statsSortBy)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      
      {/* Header */}
      <div className="bg-white rounded-none border border-stone-200/80 p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest bg-amber-100 px-2.5 py-0.5 rounded-none border border-amber-200 inline-block mb-1">
            Phân hệ Quản trị
          </span>
          <h1 className="text-2xl font-heading font-bold text-stone-900 uppercase tracking-wider">
            QUẢN LÝ & DUYỆT ĐÁNH GIÁ
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Duyệt hoặc ẩn bình luận đánh giá của khách hàng, theo dõi tỷ lệ hài lòng theo từng sản phẩm
          </p>
        </div>
      </div>

      {error && <FormAlert type="error" message={error} />}
      {actionSuccessMsg && <FormAlert type="success" message={actionSuccessMsg} />}

      {/* Tabs navigation */}
      <div className="flex border-b border-stone-200 gap-6 text-xs overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`pb-3 font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'all'
              ? 'border-amber-800 text-amber-800'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          TẤT CẢ BÌNH LUẬN ({pagination.total_items})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('approved')}
          className={`pb-3 font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'approved'
              ? 'border-emerald-800 text-emerald-800'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          ĐÃ DUYỆT HIỂN THỊ
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('hidden')}
          className={`pb-3 font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'hidden'
              ? 'border-red-700 text-red-700'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          ĐÃ ẨN / VI PHẠM
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('stats')}
          className={`pb-3 font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'stats'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          THỐNG KÊ ĐÁNH GIÁ SẢN PHẨM
        </button>
      </div>

      {/* TAB 4: THỐNG KÊ ĐÁNH GIÁ SẢN PHẨM */}
      {activeTab === 'stats' ? (
        <div className="space-y-6">
          {loadingStats ? (
            <div className="py-16 text-center text-stone-400 text-xs space-y-3 bg-white rounded-none border border-stone-200/80">
              <div className="w-8 h-8 border-2 border-amber-800 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="font-semibold">Đang tổng hợp dữ liệu thống kê đánh giá...</p>
            </div>
          ) : statsData ? (
            <>
              {/* KPI Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 bg-white rounded-none border border-stone-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">ĐIỂM TRUNG BÌNH TOÀN SÀN</span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-amber-800 font-mono">
                      {statsData.overview.overall_average_rating}
                    </span>
                    <span className="text-xs font-bold text-stone-400">/ 5.0</span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">Dựa trên bình luận đã duyệt</p>
                </div>

                <div className="p-5 bg-white rounded-none border border-stone-200/80 shadow-2xs">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">TỔNG LƯỢT ĐÁNH GIÁ</span>
                  <div className="mt-2 text-3xl font-bold text-stone-900 font-mono">
                    {statsData.overview.total_reviews}
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">Tất cả nhận xét từ khách hàng</p>
                </div>

                <div className="p-5 bg-white rounded-none border border-emerald-200 bg-emerald-50/20 shadow-2xs">
                  <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">ĐÃ DUYỆT HIỂN THỊ</span>
                  <div className="mt-2 text-3xl font-bold text-emerald-900 font-mono">
                    {statsData.overview.approved_reviews}
                  </div>
                  <p className="text-[11px] text-emerald-800 font-medium mt-1">Hiển thị công khai trên website</p>
                </div>

                <div className="p-5 bg-white rounded-none border border-red-200 bg-red-50/20 shadow-2xs">
                  <span className="text-[10px] font-bold text-red-900 uppercase tracking-wider block">ĐÃ ẨN VI PHẠM</span>
                  <div className="mt-2 text-3xl font-bold text-red-900 font-mono">
                    {statsData.overview.hidden_reviews}
                  </div>
                  <p className="text-[11px] text-red-700 font-medium mt-1">Đã loại bỏ khỏi trang sản phẩm</p>
                </div>
              </div>

              {/* Star Distribution & Product Filter */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Rating Breakdown */}
                <div className="p-6 bg-white rounded-none border border-stone-200/80 shadow-2xs">
                  <h3 className="text-xs font-heading font-bold text-stone-900 uppercase tracking-wider mb-4 pb-2 border-b border-stone-200/80">
                    PHÂN BỔ MỨC ĐÁNH GIÁ (SAO)
                  </h3>
                  <div className="space-y-3">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = statsData.overview.star_distribution[star] || 0
                      const pct = statsData.overview.approved_reviews > 0
                        ? roundPct((count / statsData.overview.approved_reviews) * 100)
                        : 0
                      return (
                        <div key={star} className="flex items-center gap-3 text-xs">
                          <span className="w-12 font-bold text-stone-700 font-mono">{star} sao</span>
                          <div className="flex-1 bg-stone-100 rounded-none h-2.5 overflow-hidden border border-stone-200">
                            <div
                              className="bg-amber-800 h-full rounded-none transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                          <span className="w-16 text-right font-mono font-bold text-stone-600">
                            {count} ({pct}%)
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Product Filter */}
                <div className="lg:col-span-2 p-6 bg-white rounded-none border border-stone-200/80 shadow-2xs flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-heading font-bold text-stone-900 uppercase tracking-wider mb-4 pb-2 border-b border-stone-200/80">
                      BỘ LỌC THỐNG KÊ THEO SẢN PHẨM
                    </h3>
                    <form onSubmit={handleSearchStats} className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        placeholder="Tìm sản phẩm theo tên..."
                        value={statsSearch}
                        onChange={(e) => setStatsSearch(e.target.value)}
                        className="flex-1 px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-none text-xs focus:outline-none focus:border-amber-800 bg-white text-stone-900"
                      />
                      <select
                        value={statsSortBy}
                        onChange={(e) => setStatsSortBy(e.target.value)}
                        className="px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-none text-xs font-bold text-stone-800 outline-none cursor-pointer bg-white"
                      >
                        <option value="reviews_desc">Lượt đánh giá: Nhiều nhất</option>
                        <option value="reviews_asc">Lượt đánh giá: Ít nhất</option>
                        <option value="rating_desc">Điểm sao: Cao nhất</option>
                        <option value="rating_asc">Điểm sao: Thấp nhất</option>
                      </select>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-stone-900 hover:bg-amber-800 text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors shrink-0 shadow-2xs cursor-pointer"
                      >
                        LỌC DỮ LIỆU
                      </button>
                    </form>
                  </div>

                  <div className="mt-4 p-3.5 bg-stone-50 rounded-none border border-stone-200 text-xs text-stone-600">
                    Quản trị viên có thể theo dõi tỷ lệ hài lòng (%) của từng sản phẩm để phát hiện và điều chỉnh những mẫu hàng có chất lượng phản hồi thấp từ phía khách hàng.
                  </div>
                </div>
              </div>

              {/* Product Stats Table */}
              <div className="bg-white rounded-none border border-stone-200/80 shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-stone-200/80 bg-stone-50">
                  <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                    THỐNG KÊ CHI TIẾT THEO SẢN PHẨM ({statsData.products.length})
                  </h3>
                </div>

                {statsData.products.length === 0 ? (
                  <div className="py-12 text-center text-stone-400 text-xs">
                    Không tìm thấy sản phẩm phù hợp.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-stone-50 border-b border-stone-200/80 text-stone-500 font-bold uppercase tracking-wider text-[11px]">
                          <th className="py-3.5 px-4">Sản phẩm</th>
                          <th className="py-3.5 px-4 text-center">Điểm sao Trung Bình</th>
                          <th className="py-3.5 px-4 text-center">Tổng Đánh Giá</th>
                          <th className="py-3.5 px-4 text-center">Đã Duyệt</th>
                          <th className="py-3.5 px-4 text-center">Đã Ẩn</th>
                          <th className="py-3.5 px-4 text-center">Tỷ Lệ Hài Lòng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 font-medium">
                        {statsData.products.map((p) => (
                          <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={p.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc'}
                                  alt={p.name}
                                  className="w-10 h-12 rounded-none object-cover border border-stone-200 bg-stone-100 shrink-0"
                                />
                                <div>
                                  <p className="font-bold text-stone-900 line-clamp-1">{p.name}</p>
                                  <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">{p.category}</span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              <span className="font-bold text-amber-800 text-sm font-mono">{p.average_rating} / 5.0</span>
                            </td>

                            <td className="py-3.5 px-4 text-center font-bold text-stone-900 font-mono">
                              {p.total_reviews}
                            </td>

                            <td className="py-3.5 px-4 text-center text-emerald-800 font-bold font-mono">
                              {p.approved_reviews}
                            </td>

                            <td className="py-3.5 px-4 text-center text-red-600 font-bold font-mono">
                              {p.hidden_reviews}
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              <span
                                className={`px-2.5 py-0.5 rounded-none text-[10px] font-bold font-mono uppercase tracking-wider border ${
                                  p.satisfaction_rate >= 80
                                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                    : p.satisfaction_rate >= 50
                                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                                    : 'bg-red-50 text-red-900 border-red-200'
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
        /* TAB 1-3: MODERATION TABLE */
        <div className="bg-white rounded-none border border-stone-200/80 shadow-2xs overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-stone-400 text-xs space-y-3">
              <div className="w-8 h-8 border-2 border-amber-800 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="font-semibold">Đang nạp danh sách bình luận...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-16 text-center text-stone-400 text-xs space-y-2">
              <p className="font-heading font-bold text-stone-900 text-base uppercase tracking-wider">Không có bình luận nào</p>
              <p className="text-stone-500">Không tìm thấy nhận xét phù hợp với bộ lọc hiện tại.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200/80 text-stone-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Khách hàng</th>
                    <th className="py-3.5 px-4">Sản phẩm</th>
                    <th className="py-3.5 px-4 text-center">Đánh giá</th>
                    <th className="py-3.5 px-4">Nội dung nhận xét</th>
                    <th className="py-3.5 px-4 text-center">Trạng thái</th>
                    <th className="py-3.5 px-4">Thời gian</th>
                    <th className="py-3.5 px-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {reviews.map((r) => (
                    <tr key={r.id} className="hover:bg-stone-50 transition-colors">
                      {/* Khách hàng */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-none bg-stone-100 text-amber-800 font-bold flex items-center justify-center shrink-0 text-xs uppercase font-heading border border-stone-200">
                            {r.user_name ? r.user_name.charAt(0) : 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-stone-900 line-clamp-1">{r.user_name}</p>
                            <span className="text-[10px] text-stone-400 font-mono">ID: #{r.user_id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Sản phẩm */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 max-w-[200px]">
                          <img
                            src={r.product_image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc'}
                            alt={r.product_name}
                            className="w-8 h-10 rounded-none object-cover border border-stone-200 shrink-0 bg-stone-100"
                          />
                          <span className="font-bold text-stone-800 line-clamp-2 leading-tight">
                            {r.product_name || `Sản phẩm #${r.product_id}`}
                          </span>
                        </div>
                      </td>

                      {/* Số sao */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="font-bold text-amber-800 font-mono text-xs">{r.rating} / 5 SAO</span>
                      </td>

                      {/* Nội dung nhận xét */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <p className="text-stone-800 font-normal leading-relaxed italic">
                          "{r.comment || 'Không có nhận xét chữ'}"
                        </p>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {r.is_approved ? (
                          <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-none font-bold text-[10px] uppercase tracking-wider">
                            HIỂN THỊ
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-red-50 text-red-900 border border-red-200 rounded-none font-bold text-[10px] uppercase tracking-wider">
                            ĐÃ ẨN
                          </span>
                        )}
                      </td>

                      {/* Thời gian */}
                      <td className="py-3.5 px-4 text-stone-500 font-mono text-[11px] whitespace-nowrap">
                        {formatDate(r.created_at)}
                      </td>

                      {/* Hành động */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {r.is_approved ? (
                          <button
                            type="button"
                            disabled={actionLoadingId === r.id}
                            onClick={() => handleModerate(r.id, false)}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-none font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer border border-red-200 disabled:opacity-50"
                          >
                            {actionLoadingId === r.id ? 'Đang xử lý...' : 'Ẩn bình luận'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={actionLoadingId === r.id}
                            onClick={() => handleModerate(r.id, true)}
                            className="px-3 py-1.5 bg-stone-900 hover:bg-amber-800 text-white rounded-none font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {actionLoadingId === r.id ? 'Đang xử lý...' : 'Duyệt hiển thị'}
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
    </div>
  )
}

const roundPct = (num) => Math.round(num * 10) / 10

export default AdminReviewsPage
