import api from '@/services/api'

/**
 * wishlistService — Service giao tiếp API danh sách sản phẩm yêu thích (Wishlist).
 */
const wishlistService = {
  /**
   * Lấy danh sách sản phẩm yêu thích của người dùng hiện tại.
   *
   * @returns {Promise<Array>} List of favorited product objects
   */
  async getWishlist() {
    const response = await api.get('/wishlist')
    return response.data.data.items || []
  },

  /**
   * Thêm hoặc bỏ sản phẩm khỏi danh sách yêu thích (Toggle).
   *
   * @param {number|string} productId
   * @returns {Promise<Object>} { is_wishlisted: boolean, message: string }
   */
  async toggleWishlist(productId) {
    const response = await api.post('/wishlist', { product_id: productId })
    return response.data.data
  },

  /**
   * Xóa trực tiếp sản phẩm khỏi danh sách yêu thích.
   *
   * @param {number|string} productId
   * @returns {Promise<Object>}
   */
  async removeFromWishlist(productId) {
    const response = await api.delete(`/wishlist/${productId}`)
    return response.data.data
  },
}

export default wishlistService
