import api from '@/services/api'

/**
 * reviewService — Service gọi API đánh giá và nhận xét sản phẩm.
 */
const reviewService = {
  /**
   * Lấy danh sách đánh giá sản phẩm kèm phân bổ sao.
   *
   * @param {number|string} productId
   * @returns {Promise<Object>} { reviews: [], summary: {}, can_review: boolean }
   */
  async getProductReviews(productId) {
    const response = await api.get(`/products/${productId}/reviews`)
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
