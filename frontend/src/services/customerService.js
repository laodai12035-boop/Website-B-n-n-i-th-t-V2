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
}

export default customerService
