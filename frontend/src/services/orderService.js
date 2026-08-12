import api from './api'

export const orderService = {
  /**
   * Tạo đơn hàng Thanh toán khi nhận hàng (COD).
   * @param {Object} orderData { recipient_name, recipient_phone, shipping_address, note, coupon_code }
   */
  async createCodOrder(orderData) {
    const response = await api.post('/orders/cod', orderData)
    return response.data.data
  },

  /**
   * Tạo đơn hàng Thanh toán QR ngân hàng (VietQR).
   * @param {Object} orderData { recipient_name, recipient_phone, shipping_address, note, coupon_code }
   * @returns {{ order_code, qr_url, qr_expire_at, bank_info, ... }}
   */
  async createQrOrder(orderData) {
    const response = await api.post('/orders/qr', orderData)
    return response.data.data
  },

  /**
   * Lấy trạng thái thanh toán QR — dùng cho polling.
   * @param {number|string} orderId
   * @returns {{ payment_status, expired, qr_url, qr_expire_at, ... }}
   */
  async getQrStatus(orderId) {
    const response = await api.get(`/orders/${orderId}/qr`)
    return response.data.data
  },

  /**
   * Lấy danh sách đơn hàng của người dùng.
   */
  async getUserOrders() {
    const response = await api.get('/orders')
    return response.data.data
  },

  /**
   * Lấy chi tiết đơn hàng.
   * @param {number|string} orderId
   */
  async getOrderDetail(orderId) {
    const response = await api.get(`/orders/${orderId}`)
    return response.data.data
  },
}

export default orderService
