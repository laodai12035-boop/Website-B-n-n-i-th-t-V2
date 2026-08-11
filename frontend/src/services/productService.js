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
}

export default productService
