import api from './api'

export const orderService = {
  /**
   * Tạo đơn hàng Thanh toán khi nhận hàng (COD).
   * @param {Object} orderData { recipient_name, recipient_phone, shipping_address, note, coupon_code }
   * @returns {Promise<Object>}
   */
  async createCodOrder(orderData) {
    const response = await api.post('/orders/cod', orderData)
    return response.data.data
  },

  /**
   * Lấy danh sách đơn hàng của người dùng.
   * @returns {Promise<Array>}
   */
  async getUserOrders() {
    const response = await api.get('/orders')
    return response.data.data
  },

  /**
   * Lấy chi tiết đơn hàng.
   * @param {number|string} orderId
   * @returns {Promise<Object>}
   */
  async getOrderDetail(orderId) {
    const response = await api.get(`/orders/${orderId}`)
    return response.data.data
  },
}

export default orderService
