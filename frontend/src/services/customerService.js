import api from '@/services/api'

/**
 * customerService — Service gọi API Quản lý Khách Hàng (NT-12-CN-001).
 */
const customerService = {
  /**
   * Quản trị viên lấy danh sách khách hàng kèm số đơn và chi tiêu.
   * @param {Object} params - { search, status, page, limit }
   * @returns {Promise<Object>} - { customers, pagination, summary }
   */
  async getAdminCustomers(params = {}) {
    const response = await api.get('/admin/customers', { params })
    return response.data.data
  },

  /**
   * Quản trị viên khóa hoặc mở khóa tài khoản khách hàng (NT-12-CN-002).
   * @param {number} customerId
   * @param {boolean} isActive
   * @returns {Promise<Object>}
   */
  async updateCustomerStatus(customerId, isActive) {
    const response = await api.put(`/admin/customers/${customerId}/status`, { is_active: isActive })
    return response.data.data
  },
}

export default customerService
