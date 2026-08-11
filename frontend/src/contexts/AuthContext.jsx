/**
 * contexts/AuthContext.jsx — Global Auth state management.
 *
 * Dùng React Context API (không Redux theo rules dự án).
 * Cung cấp: user state, register(), login(), logout(), loading flag.
 */

import { createContext, useContext, useState, useCallback } from 'react'
import api from '@/services/api'

const AuthContext = createContext(null)

// =============================================
// AuthProvider — Bọc toàn bộ app
// =============================================
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)

  /**
   * register — Đăng ký tài khoản mới.
   *
   * @param {Object} payload - { full_name, email, phone, password }
   * @returns {Object} user data từ API
   * @throws {Error} với message từ API khi đăng ký thất bại
   */
  const register = useCallback(async (payload) => {
    setLoading(true)
    try {
      const response = await api.post('/auth/register', payload)
      // Đăng ký thành công — không auto-login, chuyển sang trang login
      return response.data.data
    } catch (error) {
      // Propagate lỗi lên component để hiển thị
      const apiMessage =
        error.response?.data?.message || 'Đã xảy ra lỗi, vui lòng thử lại'
      const apiCode = error.response?.data?.code || 'UNKNOWN_ERROR'
      const apiErrors = error.response?.data?.errors || null

      const err = new Error(apiMessage)
      err.code = apiCode
      err.fieldErrors = apiErrors
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * logout — Xóa token và reset user state.
   */
  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setUser(null)
  }, [])

  const value = {
    user,
    loading,
    register,
    logout,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// =============================================
// useAuth hook — dùng trong components
// =============================================
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth phải được dùng bên trong <AuthProvider>')
  }
  return context
}

export default AuthContext
