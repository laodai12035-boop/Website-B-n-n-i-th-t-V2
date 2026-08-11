import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import InputField from '@/components/ui/InputField'
import Button from '@/components/ui/Button'
import FormAlert from '@/components/ui/FormAlert'

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

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [fields, setFields] = useState({
    password: '',
    confirm_password: '',
  })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFields((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const validate = () => {
    const errs = {}
    if (!fields.password) {
      errs.password = 'Mật khẩu mới là bắt buộc'
    } else if (fields.password.length < 8) {
      errs.password = 'Mật khẩu mới phải có ít nhất 8 ký tự'
    }

    if (!fields.confirm_password) {
      errs.confirm_password = 'Vui lòng xác nhận mật khẩu mới'
    } else if (fields.password !== fields.confirm_password) {
      errs.confirm_password = 'Mật khẩu xác nhận không khớp'
    }

    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError(null)

    if (!token) {
      setApiError('Mã xác thực không tồn tại. Vui lòng thử lại từ email.')
      return
    }

    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    // Logic kết nối API sẽ được nối ở CV-03
    setTimeout(() => {
      setLoading(false)
      setSuccessMsg('Đặt lại mật khẩu thành công! Đang chuyển hướng đến trang đăng nhập...')
      setTimeout(() => navigate('/login'), 1500)
    }, 500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-wood-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">

        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-500 shadow-lg mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Đặt lại mật khẩu</h1>
          <p className="text-gray-500 text-sm mt-1">Tạo mật khẩu mới cho tài khoản của bạn</p>
        </div>

        {/* Card */}
        <div className="card">
          {!token && (
            <div className="mb-4">
              <FormAlert type="error" message="Liên kết đặt lại mật khẩu không hợp lệ hoặc thiếu Token." />
            </div>
          )}

          {successMsg && <div className="mb-4"><FormAlert type="success" message={successMsg} /></div>}
          {apiError && <div className="mb-4"><FormAlert type="error" message={apiError} /></div>}

          {!successMsg && (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Mật khẩu mới */}
              <InputField
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                label="Mật khẩu mới"
                placeholder="Ít nhất 8 ký tự"
                value={fields.password}
                onChange={handleChange}
                error={errors.password}
                required
                disabled={!token}
                autoComplete="new-password"
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="cursor-pointer hover:text-gray-600 transition-colors"
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                }
              />

              {/* Xác nhận mật khẩu mới */}
              <InputField
                id="confirm_password"
                name="confirm_password"
                type={showConfirmPassword ? 'text' : 'password'}
                label="Xác nhận mật khẩu mới"
                placeholder="Nhập lại mật khẩu mới"
                value={fields.confirm_password}
                onChange={handleChange}
                error={errors.confirm_password}
                required
                disabled={!token}
                autoComplete="new-password"
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="cursor-pointer hover:text-gray-600 transition-colors"
                  >
                    <EyeIcon open={showConfirmPassword} />
                  </button>
                }
              />

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
                disabled={!token}
                className="mt-2"
              >
                {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
              </Button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage
