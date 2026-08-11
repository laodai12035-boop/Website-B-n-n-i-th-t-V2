import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/layout/Navbar'
import InputField from '@/components/ui/InputField'
import Button from '@/components/ui/Button'
import FormAlert from '@/components/ui/FormAlert'

const PHONE_REGEX = /^0[0-9]{9}$/

/**
 * ProfilePage — Trang thông tin cá nhân (Protected Page).
 *
 * Tính năng:
 * - Xem thông tin tài khoản (Họ tên, Email, Số điện thoại, Vai trò, Avatar)
 * - Chế độ chỉnh sửa thông tin (Edit Mode)
 * - Client-side validation: Họ tên (2-100 chars), SĐT (10 chữ số VN)
 */
const ProfilePage = () => {
  const { user, logout } = useAuth()

  const [isEditing, setIsEditing] = useState(false)
  const [fields, setFields] = useState({
    full_name: '',
    phone: '',
    avatar_url: '',
  })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const [loading, setLoading] = useState(false)

  // Khởi tạo fields khi user state thay đổi
  useEffect(() => {
    if (user) {
      setFields({
        full_name: user.full_name || '',
        phone: user.phone || '',
        avatar_url: user.avatar_url || '',
      })
    }
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFields((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const validate = () => {
    const errs = {}
    if (!fields.full_name || fields.full_name.trim().length < 2) {
      errs.full_name = 'Họ tên phải có ít nhất 2 ký tự'
    } else if (fields.full_name.trim().length > 100) {
      errs.full_name = 'Họ tên không được quá 100 ký tự'
    }

    if (!fields.phone) {
      errs.phone = 'Số điện thoại là bắt buộc'
    } else if (!PHONE_REGEX.test(fields.phone)) {
      errs.phone = 'Số điện thoại không hợp lệ (phải bắt đầu bằng 0 và có 10 chữ số)'
    }

    return errs
  }

  const handleStartEdit = () => {
    setIsEditing(true)
    setSuccessMsg(null)
    setApiError(null)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setErrors({})
    setApiError(null)
    if (user) {
      setFields({
        full_name: user.full_name || '',
        phone: user.phone || '',
        avatar_url: user.avatar_url || '',
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError(null)

    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    // Nối với AuthContext.updateProfile() ở CV-03
    setTimeout(() => {
      setLoading(false)
      setIsEditing(false)
      setSuccessMsg('Cập nhật thông tin cá nhân thành công!')
    }, 500)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8 animate-fade-in">
        <div className="card">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6 mb-6">
            <div className="flex items-center gap-4">
              {/* Avatar display */}
              <div className="w-16 h-16 rounded-2xl bg-primary-100 border-2 border-primary-200 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-primary-700">
                    {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-gray-900">{user?.full_name}</h1>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-800 uppercase tracking-wider">
                {user?.role}
              </span>
              {!isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleStartEdit}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Chỉnh sửa
                </Button>
              )}
            </div>
          </div>

          {/* Alerts */}
          {successMsg && <div className="mb-6"><FormAlert type="success" message={successMsg} /></div>}
          {apiError && <div className="mb-6"><FormAlert type="error" message={apiError} /></div>}

          {/* Content Area */}
          {!isEditing ? (
            /* Chế độ xem (View Mode) */
            <div className="space-y-4 max-w-lg">
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Họ và tên</label>
                <p className="text-base font-medium text-gray-900 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100">{user?.full_name}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Email (Khóa định danh)</label>
                <p className="text-base font-medium text-gray-500 bg-gray-100 px-4 py-2.5 rounded-xl border border-gray-200 cursor-not-allowed">{user?.email}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Số điện thoại</label>
                <p className="text-base font-medium text-gray-900 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100">{user?.phone || 'Chưa cập nhật'}</p>
              </div>

              {user?.avatar_url && (
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">URL Ảnh đại diện</label>
                  <p className="text-sm font-mono text-gray-600 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100 truncate">{user?.avatar_url}</p>
                </div>
              )}
            </div>
          ) : (
            /* Chế độ chỉnh sửa (Edit Mode Form) */
            <form onSubmit={handleSubmit} noValidate className="space-y-4 max-w-lg">
              <InputField
                id="full_name"
                name="full_name"
                label="Họ và tên"
                placeholder="Nguyễn Văn A"
                value={fields.full_name}
                onChange={handleChange}
                error={errors.full_name}
                required
              />

              <InputField
                id="phone"
                name="phone"
                type="tel"
                label="Số điện thoại"
                placeholder="0901234567"
                value={fields.phone}
                onChange={handleChange}
                error={errors.phone}
                required
              />

              <InputField
                id="avatar_url"
                name="avatar_url"
                type="url"
                label="URL Ảnh đại diện (tùy chọn)"
                placeholder="https://example.com/avatar.jpg"
                value={fields.avatar_url}
                onChange={handleChange}
                error={errors.avatar_url}
              />

              <div className="flex items-center gap-3 pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                >
                  {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  disabled={loading}
                >
                  Hủy
                </Button>
              </div>
            </form>
          )}

          {/* Footer Actions */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
            <button
              type="button"
              onClick={logout}
              className="btn-outline text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            >
              Đăng xuất
            </button>
          </div>

        </div>
      </main>
    </div>
  )
}

export default ProfilePage
