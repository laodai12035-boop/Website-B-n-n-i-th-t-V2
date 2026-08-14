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
   * Lấy danh sách đơn hàng của người dùng (có thể lọc theo trạng thái).
   * @param {string} [statusFilter] - 'all' | 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled'
   */
  async getUserOrders(statusFilter) {
    const params = statusFilter && statusFilter !== 'all' ? { status: statusFilter } : {}
    const response = await api.get('/orders', { params })
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

  /**
   * Hủy đơn hàng (QTN-03, QTN-04).
   * @param {number|string} orderId
   * @param {string} [reason]
   */
  async cancelOrder(orderId, reason) {
    const response = await api.post(`/orders/${orderId}/cancel`, { reason })
    return response.data
  },

  /**
   * Admin cập nhật trạng thái đơn hàng (NT-06-CN-006, QTN-03).
   * @param {number|string} orderId
   * @param {string} status - 'confirmed' | 'shipping' | 'delivered' | 'cancelled'
   * @param {string} [note]
   */
  async updateOrderStatus(orderId, status, note) {
    const response = await api.put(`/admin/orders/${orderId}/status`, { status, note })
    return response.data
  },
}

export default orderService
