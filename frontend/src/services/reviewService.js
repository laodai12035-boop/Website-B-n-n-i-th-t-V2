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

  /**
   * Đăng đánh giá mới cho sản phẩm (Tuân thủ QTN-06).
   *
   * @param {number|string} productId
   * @param {Object} reviewData { rating: number, comment: string }
   * @returns {Promise<Object>}
   */
  async createReview(productId, { rating, comment }) {
    const response = await api.post(`/products/${productId}/reviews`, { rating, comment })
    return response.data.data
  },
}

export default reviewService
