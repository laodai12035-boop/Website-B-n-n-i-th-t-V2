import api from './api'

export const categoryService = {
  /**
   * Lấy danh sách danh mục sản phẩm (Public).
   */
  async getCategories() {
    const response = await api.get('/categories')
    return response.data.data
  },

  /**
   * Admin tạo danh mục sản phẩm mới (NT-08-CN-001).
   * @param {Object} data { name, description, icon }
   */
  async createCategory(data) {
    const response = await api.post('/admin/categories', data)
    return response.data.data
  },
}

export default categoryService
