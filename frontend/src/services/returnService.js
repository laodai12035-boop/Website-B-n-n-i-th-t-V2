import api from './api'

/**
 * Service xử lý các API liên quan đến Yêu cầu Đổi/Trả hàng (NT-06-CN-004, QTN-05).
 */
const returnService = {
  /**
   * Gửi yêu cầu đổi/trả sản phẩm cho một đơn hàng đã giao thành công.
   * @param {Object} payload
   * @param {number} payload.order_id
   * @param {string} payload.request_type - 'return' | 'exchange' | 'warranty'
   * @param {string} payload.reason
   * @param {string} [payload.proof_image_url]
   */
  async createReturnRequest(payload) {
    const response = await api.post('/returns', payload)
    return response.data
  },

  /**
   * Lấy danh sách các yêu cầu đổi/trả của khách hàng đang đăng nhập.
   */
  async getMyReturnRequests() {
    const response = await api.get('/returns/my-requests')
    return response.data.data
  },

  /**
   * Lấy thông tin yêu cầu đổi/trả theo order_id.
   * @param {number|string} orderId
   */
  async getReturnRequestByOrder(orderId) {
    const response = await api.get(`/returns/order/${orderId}`)
    return response.data.data
  },

  /**
   * Admin: Lấy danh sách tất cả các yêu cầu đổi/trả trong hệ thống.
   */
  async getAllReturnRequestsForAdmin() {
    const response = await api.get('/returns/admin')
    return response.data.data
  },

  // Alias methods for compatibility
  async getAllReturnRequests() {
    return this.getAllReturnRequestsForAdmin()
  },

  async getAdminReturnRequests() {
    return this.getAllReturnRequestsForAdmin()
  },

  /**
   * Admin: Cập nhật trạng thái duyệt/từ chối yêu cầu đổi/trả.
   * @param {number|string} requestId
   * @param {Object} data - { status: 'approved'|'rejected', admin_note: string }
   */
  async updateReturnRequestStatus(requestId, data) {
    const response = await api.patch(`/returns/admin/${requestId}`, data)
    return response.data.data
  },
}

export default returnService
