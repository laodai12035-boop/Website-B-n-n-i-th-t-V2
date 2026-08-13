import api from '@/services/api'

/**
 * bannerService — Service gọi API quản lý Banner quảng cáo (NT-11-CN-001).
 */
const bannerService = {
  /**
   * Lấy danh sách banner công khai cho trang chủ.
   * @returns {Promise<Array>}
   */
  async getPublicBanners() {
    const response = await api.get('/banners')
    return response.data.data
  },

  /**
   * Quản trị viên lấy tất cả banner.
   * @returns {Promise<Array>}
   */
  async getAdminBanners() {
    const response = await api.get('/admin/banners')
    return response.data.data
  },

  /**
   * Tạo banner mới.
   * @param {Object} bannerData
   * @returns {Promise<Object>}
   */
  async createBanner(bannerData) {
    const response = await api.post('/admin/banners', bannerData)
    return response.data.data
  },

  /**
   * Cập nhật banner.
   * @param {number|string} id
   * @param {Object} bannerData
   * @returns {Promise<Object>}
   */
  async updateBanner(id, bannerData) {
    const response = await api.put(`/admin/banners/${id}`, bannerData)
    return response.data.data
  },

  /**
   * Xóa banner.
   * @param {number|string} id
   * @returns {Promise<Object>}
   */
  async deleteBanner(id) {
    const response = await api.delete(`/admin/banners/${id}`)
    return response.data.data
  },
}

export default bannerService
