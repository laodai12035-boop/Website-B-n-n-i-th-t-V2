import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import AdminQuickSearch from '@/components/admin/AdminQuickSearch'
import reviewService from '@/services/reviewService'
import FormAlert from '@/components/ui/FormAlert'

/**
 * AdminReviewsPage — Trang Quản lý Duyệt và Ẩn Bình Luận Đánh Giá (NT-10-CN-001).
 * Tuyến đường: /admin/reviews
 */
const AdminReviewsPage = () => {
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'approved' | 'hidden'
  const [reviews, setReviews] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total_items: 0, total_pages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionSuccessMsg, setActionSuccessMsg] = useState(null)
  const [actionLoadingId, setActionLoadingId] = useState(null)

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

  useEffect(() => {
    fetchReviews(activeTab, 1)
  }, [activeTab])

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
      // Cập nhật lại state trực tiếp
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
              <span className="text-gray-900 font-bold">Duyệt & Ẩn Bình Luận</span>
            </div>
            <h1 className="text-2xl font-display font-extrabold text-gray-900 flex items-center gap-2">
              <span>💬</span> Duyệt và Ẩn Bình Luận Đánh Giá (NT-10-CN-001)
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
        <div className="flex border-b border-gray-200 mb-6 gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`pb-3 text-xs font-extrabold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
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
            className={`pb-3 text-xs font-extrabold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
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
            className={`pb-3 text-xs font-extrabold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'hidden'
                ? 'border-red-600 text-red-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <span>🚫</span> Đã Ẩn / Vi Phạm
          </button>
        </div>

        {/* Reviews List Table */}
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
      </main>
    </div>
  )
}

export default AdminReviewsPage
