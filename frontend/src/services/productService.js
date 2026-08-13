import api from './api'

/**
 * productService — Service làm việc với các API Sản phẩm.
 */
const productService = {
  /**
   * Lấy danh sách & Tìm kiếm, Lọc khoảng giá & Sắp xếp sản phẩm.
   *
   * @param {Object} params - { search, category, min_price, max_price, sort, page, limit }
   * @returns {Promise<Object>} { items, pagination }
   */
  async getProducts(params = {}) {
    const response = await api.get('/products', { params })
    return response.data.data
  },

  /**
   * Lấy danh sách các danh mục sản phẩm kèm số lượng sản phẩm.
   *
   * @returns {Promise<Array>} Array of { id, name, count }
   */
  async getCategories() {
    const response = await api.get('/products/categories')
    return response.data.data.categories
  },

  /**
   * Lấy chi tiết 1 sản phẩm theo ID.
   *
   * @param {number|string} id
   * @returns {Promise<Object>} product detail
   */
  async getProductById(id) {
    const response = await api.get(`/products/${id}`)
    return response.data.data.product
  },

  /**
   * So sánh thông số các sản phẩm (2 đến 3 sản phẩm).
   *
   * @param {Array<number>} productIds
   * @returns {Promise<Array>} List of product specs
   */
  async compareProducts(productIds = []) {
    const response = await api.post('/products/compare', { product_ids: productIds })
    return response.data.data.products
  },

  /**
   * Lấy danh sách sản phẩm liên quan (gợi ý mua kèm).
   *
   * @param {number|string} productId
   * @param {number} limit
   * @returns {Promise<Array>} List of related products
   */
  /**
   * Admin tạo sản phẩm mới (NT-08-CN-003).
   * @param {Object} data
   */
  async createProduct(data) {
    const response = await api.post('/admin/products', data)
    return response.data.data
  },

  /**
   * Admin lấy danh sách sản phẩm quản trị.
   * @param {Object} params
   */
  async getAdminProducts(params = {}) {
    const response = await api.get('/admin/products', { params })
    return response.data.data
  },

  /**
   * Admin chỉnh sửa sản phẩm (NT-08-CN-004).
   * @param {number} id
   * @param {Object} data
   */
  async updateProduct(id, data) {
    const response = await api.put(`/admin/products/${id}`, data)
    return response.data.data
  },

  /**
   * Admin chuyển sản phẩm sang ngừng bán (NT-08-CN-004).
   * @param {number} id
   */
  async deleteProduct(id) {
    const response = await api.delete(`/admin/products/${id}`)
    return response.data.data
  },
}

export default productService
