import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import InputField from '@/components/ui/InputField'
import Button from '@/components/ui/Button'
import FormAlert from '@/components/ui/FormAlert'
import api from '@/services/api'

const PHONE_REGEX = /^0[0-9]{9}$/

/**
 * ProfilePage — Trang thông tin cá nhân phong cách Nhà Xinh (nhaxinh.com).
 * Dashboard quản lý thông tin tài khoản, avatar, nút liên kết Sổ địa chỉ & Lịch sử đơn hàng.
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

  const handleAvatarFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setApiError('Dung lượng tệp ảnh quá lớn. Vui lòng chọn tệp dưới 5MB.')
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setPreviewAvatar(objectUrl)
    setApiError(null)

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
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8 animate-fade-in">
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-medium text-stone-500 mb-6">
          <Link to="/" className="hover:text-amber-800 transition-colors">Trang chủ</Link>
          <span>/</span>
          <span className="text-stone-900 font-semibold">Tài khoản cá nhân</span>
        </nav>

        <div className="bg-white rounded-none p-6 sm:p-8 border border-stone-200/80 shadow-2xs">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-6 mb-6">
            <div className="flex items-center gap-4">
              {/* Avatar display */}
              <div className="relative group">
                <div className="w-20 h-20 rounded-none bg-stone-100 border border-stone-200 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs relative">
                  {previewAvatar ? (
                    <img src={previewAvatar} alt={user?.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-heading font-bold text-amber-800">
                      {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  )}

                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-bold">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>

                {isEditing && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Chọn ảnh từ máy tính"
                    className="absolute -bottom-2 -right-2 p-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-none text-xs shadow-2xs cursor-pointer border border-white"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M3 4V1h2v3h3v2H5v3H3V6H0V4h3zm3 6V7h3V4h7l1.83 2H21c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V10h2zm7 9c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0-8c1.65 0 3 1.35 3 3s-1.35 3-3 3-3-1.35-3-3 1.35-3 3-3z"/>
                    </svg>
                  </button>
                )}
              </div>

              <div>
                <h1 className="text-2xl font-heading font-bold text-stone-900 uppercase tracking-wider">{user?.full_name}</h1>
                <p className="text-xs text-stone-500 font-mono mt-0.5">{user?.email}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/orders"
                className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-900 border border-stone-200 rounded-none text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span>Đơn hàng</span>
              </Link>
              
              <Link
                to="/profile/addresses"
                className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-900 border border-stone-200 rounded-none text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4 text-amber-800 stroke-current" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span>Sổ địa chỉ</span>
              </Link>

              <span className="px-3 py-1 text-xs font-bold rounded-none bg-amber-800 text-white uppercase tracking-wider">
                {user?.role}
              </span>

              {!isEditing && (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="px-4 py-2 border border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Chỉnh sửa
                </button>
              )}
            </div>
          </div>

          {/* Hidden File Input */}
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
            /* View Mode */
            <div className="space-y-4 max-w-lg">
              <div>
                <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Họ và tên</label>
                <p className="text-sm font-bold text-stone-900 bg-stone-50 px-4 py-3 rounded-none border border-stone-200/80">{user?.full_name}</p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Email tài khoản</label>
                <p className="text-sm font-medium text-stone-500 bg-stone-100 px-4 py-3 rounded-none border border-stone-200 cursor-not-allowed font-mono">{user?.email}</p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Số điện thoại liên hệ</label>
                <p className="text-sm font-bold text-stone-900 bg-stone-50 px-4 py-3 rounded-none border border-stone-200/80">{user?.phone || 'Chưa cập nhật'}</p>
              </div>

              {user?.avatar_url && (
                <div>
                  <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest block mb-1">URL Ảnh đại diện</label>
                  <p className="text-xs font-mono text-stone-600 bg-stone-50 px-4 py-3 rounded-none border border-stone-200/80 truncate">{user?.avatar_url}</p>
                </div>
              )}
            </div>
          ) : (
            /* Edit Mode */
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

              <div>
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block mb-1.5">
                  Ảnh đại diện (Avatar)
                </label>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-900 border border-stone-300 rounded-none text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>🖼️ {uploadingAvatar ? 'Đang tải...' : 'Chọn ảnh từ máy tính'}</span>
                  </button>
                  <span className="text-xs text-stone-400 text-center sm:text-left">hoặc dán liên kết URL bên dưới</span>
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
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-stone-900 hover:bg-amber-800 text-white font-bold text-xs uppercase tracking-wider rounded-none transition-colors cursor-pointer shadow-2xs"
                >
                  {loading ? 'Đang lưu...' : 'LƯU THAY ĐỔI'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={loading}
                  className="px-6 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs uppercase tracking-wider rounded-none transition-colors cursor-pointer"
                >
                  HỦY
                </button>
              </div>
            </form>
          )}

          {/* Footer Actions */}
          <div className="mt-8 pt-6 border-t border-stone-200/80 flex justify-end">
            <button
              type="button"
              onClick={logout}
              className="px-5 py-2.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-none transition-colors cursor-pointer uppercase tracking-wider"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default ProfilePage
