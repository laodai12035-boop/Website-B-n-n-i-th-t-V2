/**
 * shippingService.js — API client cho tính phí vận chuyển QTN-07.
 */
import api from './api'

export const shippingService = {
  /**
   * Tính phí vận chuyển theo giỏ hàng hiện tại và địa chỉ giao hàng.
   * @param {string} shippingAddress - Địa chỉ giao hàng
   * @returns {{ fee, zone, total_weight, missing_data_warning, breakdown }}
   */
  async calculateShipping(shippingAddress) {
    const response = await api.post('/shipping/calculate', {
      shipping_address: shippingAddress,
    })
    return response.data.data
  },
}

export default shippingService
