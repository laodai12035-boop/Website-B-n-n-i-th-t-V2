import { useState } from 'react'
import { Link } from 'react-router-dom'
import InputField from '@/components/ui/InputField'
import Button from '@/components/ui/Button'
import FormAlert from '@/components/ui/FormAlert'
import api from '@/services/api'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [apiError, setApiError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError(null)
    setSuccessMsg(null)

    if (!email) {
      setError('Email là bắt buộc')
      return
    } else if (!EMAIL_REGEX.test(email)) {
      setError('Email không hợp lệ')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/auth/forgot-password', { email })
      const message = response.data.message || 'Liên kết đặt lại mật khẩu đã được gửi đến email của bạn.'
      setSuccessMsg(message)
    } catch (err) {
      const msg = err.response?.data?.message || 'Đã xảy ra lỗi, vui lòng thử lại'
      setApiError(msg)
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 0121 9z" />
            </svg>
          </div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Quên mật khẩu</h1>
          <p className="text-gray-500 text-sm mt-1">Nhập email để nhận liên kết đặt lại mật khẩu</p>
        </div>

        {/* Card */}
        <div className="card">
          {successMsg && <div className="mb-4"><FormAlert type="success" message={successMsg} /></div>}
          {apiError && <div className="mb-4"><FormAlert type="error" message={apiError} /></div>}

          {!successMsg ? (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <InputField
                id="email"
                name="email"
                type="email"
                label="Email đăng ký"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (error) setError('')
                }}
                error={error}
                required
                autoComplete="email"
              />

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
                className="mt-2"
              >
                {loading ? 'Đang gửi yêu cầu...' : 'Gửi liên kết đặt lại mật khẩu'}
              </Button>
            </form>
          ) : (
            <div className="text-center pt-2">
              <p className="text-xs text-gray-500 mb-4">
                Nếu không thấy email trong hộp thư đến, vui lòng kiểm tra thư mục Spam hoặc thử lại.
              </p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
