import api from './api'

/**
 * productService — Service làm việc với các API Sản phẩm.
 */
const productService = {
  /**
   * Lấy danh sách & Tìm kiếm sản phẩm.
   *
   * @param {Object} params - { search, category, page, limit }
   * @returns {Promise<Object>} { items, pagination }
   */
  async getProducts(params = {}) {
    const response = await api.get('/products', { params })
    return response.data.data
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
}

export default productService
