/**
 * comboService.js — API client dịch vụ Combo bộ sản phẩm (NT-05-CN-005).
 */
import api from './api'

export const comboService = {
  /**
   * Lấy danh sách các bộ combo đang có chứa sản phẩm cụ thể.
   * @param {number|string} productId
   */
  async getCombosByProduct(productId) {
    const response = await api.get(`/combos/by-product/${productId}`)
    return response.data.data
  },

  /**
   * Thêm trọn bộ sản phẩm trong combo vào giỏ hàng.
   * @param {number|string} comboId
   */
  async addComboToCart(comboId) {
    const response = await api.post(`/combos/${comboId}/add-to-cart`)
    return response.data
  },
}

export default comboService
