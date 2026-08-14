import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/layout/Navbar'
import InputField from '@/components/ui/InputField'
import Button from '@/components/ui/Button'
import FormAlert from '@/components/ui/FormAlert'
import api from '@/services/api'

const PHONE_REGEX = /^0[0-9]{9}$/

/**
 * ProfilePage — Trang thông tin cá nhân (Protected Page).
 *
 * Tính năng:
 * - Xem thông tin tài khoản (Họ tên, Email, Số điện thoại, Vai trò, Avatar)
 * - Chế độ chỉnh sửa thông tin (Edit Mode)
 * - Chọn & tải tệp ảnh đại diện (Avatar) trực tiếp từ máy tính cá nhân (NT-01-CN-005)
 * - Client-side validation: Họ tên (2-100 chars), SĐT (10 chữ số VN)
 */
const ProfilePage = () => {
  const { user, logout, updateProfile } = useAuth()
  const fileInputRef = useRef(null)

  const [isEditing, setIsEditing] = useState(false)
  const [fields, setFields] = useState({
    full_name: '',
    phone: '',
    avatar_url: '',
  })
  const [previewAvatar, setPreviewAvatar] = useState(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
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
      setPreviewAvatar(user.avatar_url || null)
    }
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFields((prev) => ({ ...prev, [name]: value }))
    if (name === 'avatar_url') {
      setPreviewAvatar(value)
    }
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  // Xử lý chọn tệp ảnh từ máy tính (NT-01-CN-005)
  const handleAvatarFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 1. Kiểm tra kích thước file (tối đa 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setApiError('Dung lượng tệp ảnh quá lớn. Vui lòng chọn tệp dưới 5MB.')
      return
    }

    // 2. Client-side Live Preview
    const objectUrl = URL.createObjectURL(file)
    setPreviewAvatar(objectUrl)
    setApiError(null)

    // 3. Tải tệp lên server qua API
    const formData = new FormData()
    formData.append('avatar', file)

    setUploadingAvatar(true)
    try {
      const response = await api.post('/auth/upload-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const serverAvatarUrl = response.data.data.avatar_url
      setFields((prev) => ({ ...prev, avatar_url: serverAvatarUrl }))
      setPreviewAvatar(serverAvatarUrl)
      setSuccessMsg('Đã tải ảnh đại diện lên thành công! Nhấn "Lưu thay đổi" để hoàn tất.')
    } catch (err) {
      const msg = err.response?.data?.message || 'Lỗi tải ảnh đại diện từ máy tính'
      setApiError(msg)
    } finally {
      setUploadingAvatar(false)
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
      setPreviewAvatar(user.avatar_url || null)
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
    try {
      await updateProfile(fields)
      setIsEditing(false)
      setSuccessMsg('Cập nhật thông tin cá nhân thành công!')
    } catch (err) {
      if (err.fieldErrors) {
        const serverErrors = {}
        Object.entries(err.fieldErrors).forEach(([field, msgs]) => {
          serverErrors[field] = Array.isArray(msgs) ? msgs[0] : msgs
        })
        setErrors(serverErrors)
      } else {
        setApiError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8 animate-fade-in">
        <div className="card bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6 mb-6">
            <div className="flex items-center gap-4">
              {/* Avatar display with upload overlay */}
              <div className="relative group">
                <div className="w-20 h-20 rounded-2xl bg-amber-100 border-2 border-amber-200 overflow-hidden flex items-center justify-center shrink-0 shadow-sm relative">
                  {previewAvatar ? (
                    <img src={previewAvatar} alt={user?.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-extrabold text-amber-800">
                      {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  )}

                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>

                {/* Edit overlay camera button */}
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Chọn ảnh từ máy tính"
                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-amber-600 hover:bg-amber-700 text-white rounded-xl flex items-center justify-center text-xs shadow-md border-2 border-white transition-transform hover:scale-110 cursor-pointer"
                  >
                    📷
                  </button>
                )}
              </div>

              <div>
                <h1 className="text-2xl font-display font-extrabold text-gray-900">{user?.full_name}</h1>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/profile/addresses"
                className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <span>📍</span> Sổ địa chỉ
              </Link>
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-900 uppercase tracking-wider">
                {user?.role}
              </span>
              {!isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleStartEdit}
                  className="rounded-xl border-gray-300 font-bold"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Chỉnh sửa
                </Button>
              )}
            </div>
          </div>

          {/* Hidden File Input for Local Computer Avatar Selection (NT-01-CN-005) */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
            onChange={handleAvatarFileSelect}
            className="hidden"
          />

          {/* Alerts */}
          {successMsg && <div className="mb-6"><FormAlert type="success" message={successMsg} /></div>}
          {apiError && <div className="mb-6"><FormAlert type="error" message={apiError} /></div>}

          {/* Content Area */}
          {!isEditing ? (
            /* Chế độ xem (View Mode) */
            <div className="space-y-4 max-w-lg">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Họ và tên</label>
                <p className="text-base font-bold text-gray-900 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100">{user?.full_name}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Email (Khóa định danh)</label>
                <p className="text-base font-medium text-gray-500 bg-gray-100 px-4 py-2.5 rounded-xl border border-gray-200 cursor-not-allowed">{user?.email}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Số điện thoại</label>
                <p className="text-base font-bold text-gray-900 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100">{user?.phone || 'Chưa cập nhật'}</p>
              </div>

              {user?.avatar_url && (
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">URL Ảnh đại diện</label>
                  <p className="text-xs font-mono text-gray-600 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100 truncate">{user?.avatar_url}</p>
                </div>
              )}
            </div>
          ) : (
            /* Chế độ chỉnh sửa (Edit Mode Form) */
            <form onSubmit={handleSubmit} noValidate className="space-y-5 max-w-lg">
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

              {/* Avatar Section with Local Computer Picker Button (NT-01-CN-005) */}
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                  Ảnh đại diện (Avatar)
                </label>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <span>🖼️</span> {uploadingAvatar ? 'Đang tải ảnh...' : 'Chọn ảnh từ máy tính'}
                  </button>
                  <span className="text-xs text-gray-400 text-center sm:text-left">hoặc dán liên kết URL bên dưới</span>
                </div>

                <InputField
                  id="avatar_url"
                  name="avatar_url"
                  type="url"
                  label=""
                  placeholder="https://example.com/avatar.jpg"
                  value={fields.avatar_url}
                  onChange={handleChange}
                  error={errors.avatar_url}
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl px-6"
                >
                  {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  disabled={loading}
                  className="rounded-xl"
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
              className="px-4 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors cursor-pointer"
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
