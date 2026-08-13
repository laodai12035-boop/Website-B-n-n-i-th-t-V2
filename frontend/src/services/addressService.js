import api from './api'

export const addressService = {
  /**
   * Lấy danh sách địa chỉ giao hàng của người dùng.
   */
  async getAddresses() {
    const response = await api.get('/addresses')
    return response.data.data
  },

  /**
   * Thêm địa chỉ giao hàng mới (NT-07-CN-001).
   * @param {Object} data { recipient_name, phone, province, district, ward, detail_address, is_default }
   */
  async createAddress(data) {
    const response = await api.post('/addresses', data)
    return response.data.data
  },

  /**
   * Sửa thông tin địa chỉ giao hàng (NT-07-CN-002).
   * @param {number} id
   * @param {Object} data
   */
  async updateAddress(id, data) {
    const response = await api.put(`/addresses/${id}`, data)
    return response.data.data
  },

  /**
   * Xóa địa chỉ giao hàng (NT-07-CN-002).
   * @param {number} id
   */
  async deleteAddress(id) {
    const response = await api.delete(`/addresses/${id}`)
    return response.data.data
  },

  /**
   * Đặt địa chỉ làm địa chỉ mặc định (NT-07-CN-003).
   * @param {number} id
   */
  async setDefaultAddress(id) {
    const response = await api.patch(`/addresses/${id}/default`)
    return response.data.data
  },
}

export default addressService
