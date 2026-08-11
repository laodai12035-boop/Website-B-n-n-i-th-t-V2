import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import InputField from '@/components/ui/InputField'
import Button from '@/components/ui/Button'
import FormAlert from '@/components/ui/FormAlert'
import { useAuth } from '@/contexts/AuthContext'

// =============================================
// Validation helpers (client-side)
// =============================================
const PHONE_REGEX = /^0[0-9]{9}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const validate = (fields) => {
  const errors = {}

  if (!fields.full_name || fields.full_name.trim().length < 2) {
    errors.full_name = 'Họ tên phải có ít nhất 2 ký tự'
  } else if (fields.full_name.trim().length > 100) {
    errors.full_name = 'Họ tên không được quá 100 ký tự'
  }

  if (!fields.email) {
    errors.email = 'Email là bắt buộc'
  } else if (!EMAIL_REGEX.test(fields.email)) {
    errors.email = 'Email không hợp lệ'
  }

  if (!fields.phone) {
    errors.phone = 'Số điện thoại là bắt buộc'
  } else if (!PHONE_REGEX.test(fields.phone)) {
    errors.phone = 'Số điện thoại không hợp lệ (10 chữ số, bắt đầu bằng 0)'
  }

  if (!fields.password) {
    errors.password = 'Mật khẩu là bắt buộc'
  } else if (fields.password.length < 8) {
    errors.password = 'Mật khẩu phải có ít nhất 8 ký tự'
  }

  if (!fields.confirm_password) {
    errors.confirm_password = 'Vui lòng xác nhận mật khẩu'
  } else if (fields.password !== fields.confirm_password) {
    errors.confirm_password = 'Mật khẩu xác nhận không khớp'
  }

  return errors
}

// =============================================
// Icon component nhỏ — toggle password
// =============================================
const EyeIcon = ({ open }) =>
  open ? (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )

// =============================================
// RegisterPage — UI only (logic nối API ở CV-03)
// =============================================
const RegisterPage = () => {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [fields, setFields] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
  })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState(null)

  // ---- Handlers ----
  const handleChange = (e) => {
    const { name, value } = e.target
    setFields((prev) => ({ ...prev, [name]: value }))
    // Xóa lỗi của field ngay khi user bắt đầu sửa
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError(null)

    // Client-side validation
    const validationErrors = validate(fields)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    try {
      // Loại bỏ confirm_password trước khi gửi lên API
      const { confirm_password, ...payload } = fields
      await register(payload)

      setSuccessMsg('Tạo tài khoản thành công! Đang chuyển hướng đến trang đăng nhập...')
      // Redirect sang /login sau 1.5 giây
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      // Lỗi field-level từ server (validate server-side)
      if (err.fieldErrors) {
        const serverErrors = {}
        Object.entries(err.fieldErrors).forEach(([field, msgs]) => {
          serverErrors[field] = Array.isArray(msgs) ? msgs[0] : msgs
        })
        setErrors(serverErrors)
      } else {
        // Lỗi tổng thể (email trùng, server error, ...)
        setApiError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-wood-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg animate-slide-up">

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-500 shadow-lg mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Nội Thất Đẹp</h1>
          <p className="text-gray-500 text-sm mt-1">Nội thất đẹp – Đặt hàng dễ – Giao tận nhà</p>
        </div>

        {/* Card */}
        <div className="card">
          <div className="mb-6">
            <h2 className="text-xl font-display font-semibold text-gray-900">Tạo tài khoản mới</h2>
            <p className="text-sm text-gray-500 mt-1">
              Đã có tài khoản?{' '}
              <Link
                to="/login"
                className="text-primary-600 font-medium hover:text-primary-700 transition-colors"
              >
                Đăng nhập ngay
              </Link>
            </p>
          </div>

          {/* Success message */}
          {successMsg && <div className="mb-4"><FormAlert type="success" message={successMsg} /></div>}

          {/* API Error */}
          {apiError && <div className="mb-4"><FormAlert type="error" message={apiError} /></div>}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Họ tên */}
            <InputField
              id="full_name"
              name="full_name"
              label="Họ và tên"
              placeholder="Nguyễn Văn A"
              value={fields.full_name}
              onChange={handleChange}
              error={errors.full_name}
              required
              autoComplete="name"
            />

            {/* Email */}
            <InputField
              id="email"
              name="email"
              type="email"
              label="Email"
              placeholder="email@example.com"
              value={fields.email}
              onChange={handleChange}
              error={errors.email}
              required
              autoComplete="email"
            />

            {/* Số điện thoại */}
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
              autoComplete="tel"
            />

            {/* Mật khẩu */}
            <InputField
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              label="Mật khẩu"
              placeholder="Ít nhất 8 ký tự"
              value={fields.password}
              onChange={handleChange}
              error={errors.password}
              required
              autoComplete="new-password"
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="cursor-pointer hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  <EyeIcon open={showPassword} />
                </button>
              }
            />

            {/* Xác nhận mật khẩu */}
            <InputField
              id="confirm_password"
              name="confirm_password"
              type={showConfirmPassword ? 'text' : 'password'}
              label="Xác nhận mật khẩu"
              placeholder="Nhập lại mật khẩu"
              value={fields.confirm_password}
              onChange={handleChange}
              error={errors.confirm_password}
              required
              autoComplete="new-password"
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="cursor-pointer hover:text-gray-600 transition-colors"
                  aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  <EyeIcon open={showConfirmPassword} />
                </button>
              }
            />

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              className="mt-2"
            >
              {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
            </Button>
          </form>

          {/* Terms */}
          <p className="text-xs text-gray-400 text-center mt-4">
            Bằng cách đăng ký, bạn đồng ý với{' '}
            <a href="#" className="underline hover:text-gray-600">Điều khoản dịch vụ</a>
            {' '}và{' '}
            <a href="#" className="underline hover:text-gray-600">Chính sách bảo mật</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
