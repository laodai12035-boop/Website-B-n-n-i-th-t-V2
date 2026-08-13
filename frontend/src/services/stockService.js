/**
 * stockService.js — API client cho Quản lý kho & Nhập kho (NT-09-CN-001).
 */
import api from './api'

export const stockService = {
  /**
   * Lập phiếu nhập kho sản phẩm (Admin).
   * @param {Object} data - { product_id, quantity, import_date, supplier, unit_cost, note }
   */
  async importStock(data) {
    const response = await api.post('/admin/inventory/import', data)
    return response.data
  },

  /**
   * Lấy lịch sử các phiếu nhập kho.
   * @param {Object} params - { product_id }
   */
  async getStockReceipts(params = {}) {
    const response = await api.get('/admin/inventory/receipts', { params })
    return response.data.data
  },

  /**
   * Lấy danh sách cảnh báo tồn kho thấp (QTN-08).
   */
  async getLowStockWarnings() {
    const response = await api.get('/admin/inventory/low-stock-warnings')
    return response.data.data
  },
}

export default stockService
