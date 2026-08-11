import api from '@/services/api'

/**
 * adminService — API Service cho các chức năng Quản trị (Admin Only).
 */
const adminService = {
  /**
   * Tìm kiếm nhanh cho Admin (Sản phẩm, Đơn hàng, Khách hàng).
   *
   * @param {string} query
   * @returns {Promise<Object>} { products: [], orders: [], customers: [] }
   */
  async quickSearch(query = '') {
    const response = await api.get('/admin/quick-search', {
      params: { q: query },
    })
    return response.data.data
  },
}

export default adminService
