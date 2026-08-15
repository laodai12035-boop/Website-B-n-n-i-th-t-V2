import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import reviewService from '@/services/reviewService'

/**
 * ProductReviews — Khối Đánh giá & Bình luận sản phẩm (Chuẩn MASTER.md, nút submit accent bg-amber-800 rounded-none).
 */
const ProductReviews = ({ productId }) => {
  const { user, isAuthenticated } = useAuth()

  const [reviews, setReviews] = useState([])
  const [summary, setSummary] = useState({
    average_rating: 5.0,
    total_reviews: 0,
    rating_breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  })
  const [canReview, setCanReview] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedStar, setSelectedStar] = useState(null)

  // Form state
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')

  useEffect(() => {
    const fetchReviewsData = async () => {
      if (!productId) return
      setLoading(true)
      try {
        const data = await reviewService.getProductReviews(productId, selectedStar)
        setReviews(data.reviews || [])
        setSummary(data.summary || summary)
        setCanReview(data.can_review || false)
      } catch (err) {
        console.error('Error fetching reviews:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchReviewsData()
  }, [productId, isAuthenticated, selectedStar])

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setFormError('')
    setFormSuccess('')

    if (!isAuthenticated) {
      setFormError('Vui lòng đăng nhập để viết đánh giá!')
      return
    }

    if (!comment.trim()) {
      setFormError('Vui lòng nhập nội dung nhận xét của bạn!')
      return
    }

    setSubmitting(true)
    try {
      await reviewService.createReview(productId, { rating, comment })
      setFormSuccess('Cảm ơn bạn đã gửi đánh giá sản phẩm!')
      setComment('')
      const data = await reviewService.getProductReviews(productId)
      setReviews(data.reviews || [])
      setSummary(data.summary || summary)
      setCanReview(false)
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Có lỗi xảy ra khi gửi đánh giá.'
      setFormError(errorMsg)
    } finally {
      setSubmitting(false)
    }
  }

  const renderStars = (starCount, size = 'w-4 h-4') => {
    return (
      <div className="flex items-center gap-0.5 text-amber-500">
        {[1, 2, 3, 4, 5].map((s) => (
          <svg
            key={s}
            className={`${size} ${s <= starCount ? 'fill-amber-500 text-amber-500' : 'fill-stone-200 text-stone-200'}`}
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    )
  }

  return (
    <section id="product-reviews" className="mt-12 pt-8 border-t border-stone-200/80 scroll-mt-24">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-heading font-bold text-stone-900 uppercase tracking-wider">
            ĐÁNH GIÁ & NHẬN XÉT SẢN PHẨM
          </h2>
          <p className="text-xs text-stone-500 mt-1">Ý kiến thực tế từ khách hàng đã mua và sử dụng sản phẩm</p>
        </div>
      </div>

      {/* Summary Header Breakdown */}
      <div className="bg-white rounded-none p-6 border border-stone-200/80 shadow-2xs mb-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Big Rating Score */}
        <div className="text-center md:border-r border-stone-200/80 pr-4">
          <div className="text-4xl font-heading font-bold text-stone-900 mb-1">
            {summary.average_rating ? summary.average_rating.toFixed(1) : '5.0'}
            <span className="text-sm font-normal text-stone-400">/5</span>
          </div>
          <div className="flex justify-center mb-2">{renderStars(Math.round(summary.average_rating || 5), 'w-5 h-5')}</div>
          <p className="text-xs text-stone-500">Dựa trên {summary.total_reviews} nhận xét</p>
        </div>

        {/* Rating Bars */}
        <div className="space-y-2 md:col-span-2">
          {[5, 4, 3, 2, 1].map((s) => {
            const count = summary.rating_breakdown?.[s] || 0
            const percent = summary.total_reviews > 0 ? (count / summary.total_reviews) * 100 : 0
            return (
              <div key={s} className="flex items-center gap-3 text-xs">
                <span className="w-8 font-medium text-stone-600 flex items-center gap-1">
                  {s} <span className="text-amber-500">★</span>
                </span>
                <div className="flex-1 bg-stone-100 rounded-none h-2 overflow-hidden">
                  <div
                    className="bg-amber-700 h-full rounded-none transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
                <span className="w-8 text-right text-stone-400 text-[11px]">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Star Filter Buttons */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider mr-2">Lọc nhận xét:</span>
        <button
          type="button"
          onClick={() => setSelectedStar(null)}
          className={`px-4 py-2 rounded-none text-xs font-medium transition-all cursor-pointer ${
            selectedStar === null
              ? 'bg-amber-800 text-white shadow-2xs font-semibold'
              : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200/80'
          }`}
        >
          Tất cả ({summary.total_reviews})
        </button>
        {[5, 4, 3, 2, 1].map((s) => {
          const count = summary.rating_breakdown?.[s] || 0
          return (
            <button
              key={s}
              type="button"
              onClick={() => setSelectedStar(s)}
              className={`px-4 py-2 rounded-none text-xs font-medium transition-all flex items-center gap-1 cursor-pointer ${
                selectedStar === s
                  ? 'bg-amber-800 text-white shadow-2xs font-semibold'
                  : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200/80'
              }`}
            >
              <span>{s}★</span>
              <span className="text-[10px] opacity-80">({count})</span>
            </button>
          )
        })}
      </div>

      {/* Review Form Area */}
      {canReview ? (
        <div className="bg-white rounded-none p-6 border border-stone-200/80 shadow-2xs mb-8 animate-fade-in">
          <h3 className="text-base font-bold text-stone-900 mb-1 uppercase tracking-wider">
            Viết nhận xét của bạn
          </h3>
          <p className="text-xs text-stone-500 mb-4">Bạn đã mua sản phẩm này. Hãy chia sẻ trải nghiệm thực tế nhé!</p>

          {formError && (
            <div className="p-3 bg-red-50 text-red-800 rounded-none text-xs font-medium mb-4 border border-red-200">
              {formError}
            </div>
          )}

          {formSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-none text-xs font-medium mb-4 border border-emerald-200">
              {formSuccess}
            </div>
          )}

          <form onSubmit={handleSubmitReview} className="space-y-4">
            {/* Star Picker */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5 uppercase tracking-wider">Đánh giá số sao:</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 focus:outline-none transition-transform hover:scale-125 cursor-pointer"
                  >
                    <svg
                      className={`w-7 h-7 ${
                        s <= (hoverRating || rating) ? 'fill-amber-500 text-amber-500' : 'fill-stone-200 text-stone-200'
                      }`}
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
                <span className="text-xs font-bold text-amber-800 ml-2">
                  {rating === 5 && 'Tuyệt vời!'}
                  {rating === 4 && 'Hài lòng'}
                  {rating === 3 && 'Bình thường'}
                  {rating === 2 && 'Chưa hài lòng'}
                  {rating === 1 && 'Rất tệ'}
                </span>
              </div>
            </div>

            {/* Comment Textarea */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1 uppercase tracking-wider">Nội dung nhận xét:</label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Chia sẻ về chất lượng gỗ, màu sắc, đệm bọc, cảm giác sử dụng..."
                className="w-full text-xs p-3.5 rounded-none border border-stone-200 focus:ring-2 focus:ring-amber-800 focus:border-amber-800 outline-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs uppercase tracking-wider px-7 py-3 rounded-none disabled:opacity-50 transition-colors cursor-pointer shadow-2xs"
            >
              {submitting ? 'Đang gửi...' : 'GỬI ĐÁNH GIÁ'}
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-none p-4 border border-stone-200/80 mb-8 flex items-center gap-3 text-xs text-stone-500">
          <span className="text-stone-400 font-bold">ℹ️</span>
          <p>
            Chỉ khách hàng đã mua sản phẩm và đơn hàng được <strong>giao thành công</strong> mới có thể viết đánh giá.
          </p>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-stone-200 rounded-none animate-pulse"></div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8 text-xs text-stone-400 bg-white border border-stone-200/80">
          Chưa có đánh giá nào cho sản phẩm này.
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div key={rev.id} className="bg-white rounded-none p-5 border border-stone-200/80 shadow-2xs">
              <div className="flex items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-none bg-amber-800 text-white font-bold flex items-center justify-center text-xs">
                    {rev.user_name ? rev.user_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 flex items-center gap-2">
                      {rev.user_name || 'Khách hàng'}
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[10px] px-2 py-0.5 rounded-none font-medium border border-emerald-200">
                        ✓ Đã mua hàng
                      </span>
                    </h4>
                    <div className="mt-0.5">{renderStars(rev.rating)}</div>
                  </div>
                </div>
                <span className="text-[11px] text-stone-400 font-mono">
                  {rev.created_at ? new Date(rev.created_at).toLocaleDateString('vi-VN') : ''}
                </span>
              </div>
              <p className="text-xs text-stone-700 leading-relaxed mt-2 pl-12">{rev.comment}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default ProductReviews
