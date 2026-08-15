import api from '@/services/api'

/**
 * customerService — Service gọi API Quản lý Tài Khoản Thành Viên & Admin.
 */
const customerService = {
  /**
   * Quản trị viên lấy danh sách tài khoản (khách hàng + admin).
   * @param {Object} params - { search, status, page, limit }
   * @returns {Promise<Object>} - { customers, pagination, summary }
   */
  async getAdminCustomers(params = {}) {
    const response = await api.get('/admin/customers', { params })
    return response.data.data
  },

  /**
   * Quản trị viên tạo tài khoản mới (Khách hàng hoặc Admin).
   * @param {Object} accountData
   * @returns {Promise<Object>}
   */
  async createAccount(accountData) {
    const response = await api.post('/admin/customers', accountData)
    return response.data.data
  },

  /**
   * Quản trị viên khóa hoặc mở khóa tài khoản (NT-12-CN-002).
   * @param {number} customerId
   * @param {boolean} isActive
   * @returns {Promise<Object>}
   */
  async updateCustomerStatus(customerId, isActive) {
    const response = await api.put(`/admin/customers/${customerId}/status`, { is_active: isActive })
    return response.data.data
  },

  /**
   * Quản trị viên phân quyền tài khoản (user/admin).
   * @param {number} customerId
   * @param {string} role - 'user' | 'admin'
   * @returns {Promise<Object>}
   */
  async updateCustomerRole(customerId, role) {
    const response = await api.put(`/admin/customers/${customerId}/role`, { role })
    return response.data.data
  },
}

export default customerService
