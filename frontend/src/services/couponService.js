import api from '@/services/api'

/**
 * couponService — Service gọi API Quản lý Mã giảm giá (NT-11-CN-002, QTN-01).
 */
const couponService = {
  /**
   * Lấy danh sách mã giảm giá công khai đang hoạt động.
   * @returns {Promise<Array>}
   */
  async getActiveCoupons() {
    const response = await api.get('/coupons')
    return response.data.data
  },

  /**
   * Khách hàng áp dụng mã giảm giá.
   * @param {string} code
   * @param {number} subtotal
   * @returns {Promise<Object>}
   */
  async applyCoupon(code, subtotal) {
    const response = await api.post('/coupons/apply', { code, subtotal })
    return response.data.data
  },

  /**
   * Quản trị viên lấy tất cả mã giảm giá.
   * @returns {Promise<Array>}
   */
  async getAdminCoupons() {
    const response = await api.get('/admin/coupons')
    return response.data.data
  },

  // Alias methods for compatibility across components
  async getAllCoupons() {
    return this.getAdminCoupons()
  },

  /**
   * Quản trị viên tạo mã giảm giá mới.
   * @param {Object} couponData
   * @returns {Promise<Object>}
   */
  async createCoupon(couponData) {
    const response = await api.post('/admin/coupons', couponData)
    return response.data.data
  },

  /**
   * Quản trị viên cập nhật mã giảm giá.
   * @param {number|string} id
   * @param {Object} couponData
   * @returns {Promise<Object>}
   */
  async updateCoupon(id, couponData) {
    const response = await api.put(`/admin/coupons/${id}`, couponData)
    return response.data.data
  },

  /**
   * Quản trị viên chuyển đổi trạng thái ẩn/hiển thị mã giảm giá.
   * @param {number|string} id
   * @param {boolean} isActive
   * @returns {Promise<Object>}
   */
  async toggleCouponStatus(id, isActive) {
    return this.updateCoupon(id, { is_active: isActive })
  },

  /**
   * Quản trị viên xóa mã giảm giá.
   * @param {number|string} id
   * @returns {Promise<Object>}
   */
  async deleteCoupon(id) {
    const response = await api.delete(`/admin/coupons/${id}`)
    return response.data.data
  },
}

export default couponService
