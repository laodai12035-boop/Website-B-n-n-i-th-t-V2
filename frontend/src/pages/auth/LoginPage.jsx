import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import InputField from '@/components/ui/InputField'
import Button from '@/components/ui/Button'
import FormAlert from '@/components/ui/FormAlert'
import { useAuth } from '@/contexts/AuthContext'

// =============================================
// Validation helper (client-side)
// =============================================
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const validate = (fields) => {
  const errors = {}

  if (!fields.email) {
    errors.email = 'Email là bắt buộc'
  } else if (!EMAIL_REGEX.test(fields.email)) {
    errors.email = 'Email không hợp lệ'
  }

  if (!fields.password) {
    errors.password = 'Mật khẩu là bắt buộc'
  }

  return errors
}

// Icon toggle password
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
// LoginPage Component
// =============================================
const LoginPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [fields, setFields] = useState({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFields((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError(null)

    const validationErrors = validate(fields)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    try {
      await login(fields.email, fields.password)
      navigate('/')
    } catch (err) {
      setApiError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-wood-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">

        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-500 shadow-lg mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Nội Thất Đẹp</h1>
          <p className="text-gray-500 text-sm mt-1">Đăng nhập tài khoản của bạn</p>
        </div>

        {/* Card */}
        <div className="card">
          <div className="mb-6">
            <h2 className="text-xl font-display font-semibold text-gray-900">Chào mừng quay trở lại</h2>
            <p className="text-sm text-gray-500 mt-1">
              Chưa có tài khoản?{' '}
              <Link
                to="/register"
                className="text-primary-600 font-medium hover:text-primary-700 transition-colors"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>

          {/* API Error alert */}
          {apiError && <div className="mb-4"><FormAlert type="error" message={apiError} /></div>}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
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

            {/* Mật khẩu */}
            <InputField
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              label="Mật khẩu"
              placeholder="Nhập mật khẩu"
              value={fields.password}
              onChange={handleChange}
              error={errors.password}
              required
              autoComplete="current-password"
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

            <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-400" />
                <span>Ghi nhớ đăng nhập</span>
              </label>
              <a href="#" className="hover:text-primary-600 transition-colors">Quên mật khẩu?</a>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              className="mt-2"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
