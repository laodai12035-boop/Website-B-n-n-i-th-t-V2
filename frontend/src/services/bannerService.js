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

  // Alias methods for compatibility across components
  async getAllAdminBanners() {
    return this.getAdminBanners()
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
   * Đổi trạng thái hiển thị banner.
   * @param {number|string} id
   * @param {boolean} isActive
   * @returns {Promise<Object>}
   */
  async toggleBannerStatus(id, isActive) {
    return this.updateBanner(id, { is_active: isActive })
  },

  /**
   * Upload tệp hình ảnh banner.
   * @param {FormData} formData
   * @returns {Promise<Object>}
   */
  async uploadBannerImage(formData) {
    try {
      const response = await api.post('/admin/banners/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data.data
    } catch (e) {
      console.warn('Upload API unavailable, using local image url fallback:', e)
      return null
    }
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
