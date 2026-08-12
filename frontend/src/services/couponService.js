import api from './api'

export const couponService = {
  /**
   * Áp dụng mã giảm giá (Tuân thủ QTN-01).
   * @param {string} couponCode
   * @param {number} subtotal
   * @returns {Promise<Object>}
   */
  async applyCoupon(couponCode, subtotal) {
    const response = await api.post('/coupons/apply', {
      coupon_code: couponCode,
      subtotal: Number(subtotal),
    })
    return response.data.data
  },

  /**
   * Lấy danh sách mã giảm giá đang kích hoạt.
   * @returns {Promise<Array>}
   */
  async getActiveCoupons() {
    const response = await api.get('/coupons/active')
    return response.data.data
  },
}

export default couponService
