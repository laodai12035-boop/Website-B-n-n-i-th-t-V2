import api from '@/services/api'

/**
 * cartService — Service gọi API Quản lý Giỏ hàng.
 */
const cartService = {
  /**
   * Lấy danh sách items trong giỏ hàng.
   * @returns {Promise<Object>} { items: [], cart_count: 0, subtotal: 0.0 }
   */
  async getCart() {
    const response = await api.get('/cart')
    return response.data.data
  },

  /**
   * Thêm sản phẩm vào giỏ hàng (Tuân thủ QTN-02).
   * @param {number|string} productId
   * @param {number} quantity
   * @returns {Promise<Object>}
   */
  async addToCart(productId, quantity = 1) {
    const response = await api.post('/cart/items', { product_id: Number(productId), quantity: Number(quantity) })
    return response.data.data
  },

  /**
   * Mua ngay một sản phẩm và chuyển hướng sang Checkout (Tuân thủ QTN-02).
   * @param {number|string} productId
   * @param {number} quantity
   * @returns {Promise<Object>}
   */
  async buyNow(productId, quantity = 1) {
    const response = await api.post('/cart/buy-now', { product_id: Number(productId), quantity: Number(quantity) })
    return response.data.data
  },

  /**
   * Cập nhật số lượng sản phẩm trong giỏ hàng (Tuân thủ QTN-02).
   * @param {number|string} productId
   * @param {number} quantity
   * @returns {Promise<Object>}
   */
  async updateQuantity(productId, quantity) {
    const response = await api.put(`/cart/items/${productId}`, { quantity: Number(quantity) })
    return response.data.data
  },

  /**
   * Xóa một sản phẩm khỏi giỏ hàng.
   * @param {number|string} productId
   * @returns {Promise<Object>}
   */
  async removeFromCart(productId) {
    const response = await api.delete(`/cart/items/${productId}`)
    return response.data.data
  },

  /**
   * Xóa sạch toàn bộ giỏ hàng.
   * @returns {Promise<Object>}
   */
  async clearCart() {
    const response = await api.delete('/cart/clear')
    return response.data.data
  },
}

export default cartService
