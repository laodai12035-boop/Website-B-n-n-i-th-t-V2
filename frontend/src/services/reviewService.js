import api from '@/services/api'

/**
 * reviewService — Service gọi API đánh giá và nhận xét sản phẩm.
 */
const reviewService = {
  /**
   * Lấy danh sách đánh giá sản phẩm kèm phân bổ sao và bộ lọc.
   *
   * @param {number|string} productId
   * @param {number|null} star
   * @returns {Promise<Object>} { reviews: [], summary: {}, can_review: boolean }
   */
  async getProductReviews(productId, star = null) {
    const params = star ? { star } : {}
    const response = await api.get(`/products/${productId}/reviews`, { params })
    return response.data.data
  },

  async createReview(productId, { rating, comment }) {
    const response = await api.post(`/products/${productId}/reviews`, { rating, comment })
    return response.data.data
  },

  /**
   * Admin lấy danh sách các bình luận đánh giá (NT-10-CN-001).
   * @param {Object} params - { status: 'all'|'approved'|'hidden', product_id, page, limit }
   */
  async getAdminReviews(params = {}) {
    const response = await api.get('/admin/reviews', { params })
    return response.data.data
  },

  /**
   * Admin duyệt (is_approved=true) hoặc ẩn (is_approved=false) bình luận.
   * @param {number|string} reviewId
   * @param {boolean} isApproved
   */
  async moderateReview(reviewId, isApproved) {
    const response = await api.put(`/admin/reviews/${reviewId}/moderate`, { is_approved: isApproved })
    return response.data.data
  },

  /**
   * Admin xem báo cáo thống kê đánh giá theo từng sản phẩm (NT-10-CN-002).
   * @param {Object} params - { search: string, sort_by: string }
   */
  async getAdminReviewStats(params = {}) {
    const response = await api.get('/admin/reviews/stats', { params })
    return response.data.data
  },
}

export default reviewService
