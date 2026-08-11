/**
 * contexts/AuthContext.jsx — Global Auth state management.
 *
 * Dùng React Context API (không Redux theo rules dự án).
 * Cung cấp: user state, register(), login(), logout(), loading flag.
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import api from '@/services/api'

const AuthContext = createContext(null)

// =============================================
// AuthProvider — Bọc toàn bộ app
// =============================================
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // Initial check loading

  // ---- Tự động khôi phục phiên đăng nhập khi app load ----
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const response = await api.get('/auth/me')
        setUser(response.data.data.user)
      } catch (err) {
        // Token không hợp lệ hoặc đã hết hạn
        localStorage.removeItem('token')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchCurrentUser()
  }, [])

  /**
   * register — Đăng ký tài khoản mới.
   */
  const register = useCallback(async (payload) => {
    setLoading(true)
    try {
      const response = await api.post('/auth/register', payload)
      return response.data.data
    } catch (error) {
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
   * login — Đăng nhập hệ thống.
   *
   * @param {string} email
   * @param {string} password
   * @returns {Object} user object
   */
  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const response = await api.post('/auth/login', { email, password })
      const { token, user: loggedUser } = response.data.data

      localStorage.setItem('token', token)
      setUser(loggedUser)
      return loggedUser
    } catch (error) {
      const apiMessage =
        error.response?.data?.message || 'Đã xảy ra lỗi, vui lòng thử lại'
      const apiCode = error.response?.data?.code || 'UNKNOWN_ERROR'

      const err = new Error(apiMessage)
      err.code = apiCode
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
    login,
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
