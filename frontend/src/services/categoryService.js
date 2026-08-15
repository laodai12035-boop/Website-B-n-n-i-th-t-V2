import api from './api'

export const categoryService = {
  /**
   * Lấy danh sách danh mục sản phẩm (Public & Admin).
   */
  async getCategories() {
    const response = await api.get('/categories')
    return response.data.data
  },

  // Alias methods for compatibility across components
  async getAllCategories() {
    return this.getCategories()
  },

  async getAdminCategories() {
    return this.getCategories()
  },

  /**
   * Admin tạo danh mục sản phẩm mới (NT-08-CN-001).
   * @param {Object} data { name, description, icon }
   */
  async createCategory(data) {
    const response = await api.post('/admin/categories', data)
    return response.data.data
  },

  /**
   * Admin sửa thông tin danh mục (NT-08-CN-002).
   * @param {number} id
   * @param {Object} data
   */
  async updateCategory(id, data) {
    const response = await api.put(`/admin/categories/${id}`, data)
    return response.data.data
  },

  /**
   * Admin xóa danh mục sản phẩm (NT-08-CN-002).
   * @param {number} id
   */
  async deleteCategory(id) {
    const response = await api.delete(`/admin/categories/${id}`)
    return response.data.data
  },
}

export default categoryService
