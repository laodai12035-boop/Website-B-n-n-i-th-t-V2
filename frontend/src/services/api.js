/**
 * services/api.js — Axios instance trung tâm cho toàn bộ frontend.
 *
 * Cấu hình:
 * - Base URL: /api/v1 (Vite proxy chuyển sang http://localhost:5000)
 * - Timeout: 10 giây
 * - Tự động thêm JWT token vào header Authorization
 * - Tự động xử lý 401 (token hết hạn)
 */

import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ---- Request interceptor: gắn JWT token vào header ----
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ---- Response interceptor: xử lý lỗi tập trung ----
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token hết hạn hoặc không hợp lệ → xóa token, redirect login
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default api
