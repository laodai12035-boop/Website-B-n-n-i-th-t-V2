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
  const [successData, setSuccessData] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError(null)
    setSuccessData(null)

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
      setSuccessData({
        message: response.data.message || 'Liên kết đặt lại mật khẩu đã được gửi đến hòm thư Gmail của bạn.',
        resetLink: response.data.data?.reset_link,
        recipientEmail: email,
      })
    } catch (err) {
      const msg = err.response?.data?.message || 'Đã xảy ra lỗi, vui lòng thử lại'
      setApiError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md animate-fade-in">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/20 mb-4 text-2xl">
            📧
          </div>
          <h1 className="text-3xl font-display font-extrabold text-gray-900">Quên mật khẩu</h1>
          <p className="text-gray-500 text-sm mt-1">
            Nhập email đăng ký để nhận ngay liên kết lấy lại mật khẩu qua Gmail
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xl shadow-amber-900/5">
          {apiError && (
            <div className="mb-6">
              <FormAlert type="error" message={apiError} />
            </div>
          )}

          {!successData ? (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <InputField
                id="email"
                name="email"
                type="email"
                label="Email tài khoản Gmail của bạn"
                placeholder="vd: tenban@gmail.com"
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
                className="py-3 bg-amber-600 hover:bg-amber-700 font-bold rounded-2xl text-sm shadow-md shadow-amber-600/20 cursor-pointer"
              >
                {loading ? 'Đang gửi email qua Gmail...' : '📩 Gửi liên kết qua Gmail ngay'}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-5 py-2">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl shadow-xs border border-emerald-200">
                ✅
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900">Đã gửi email thành công!</h3>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  Liên kết đặt lại mật khẩu đã được gửi đến hòm thư Gmail{' '}
                  <strong className="text-gray-900 font-mono underline">{successData.recipientEmail}</strong>.
                </p>
              </div>

              <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 text-left text-xs space-y-2">
                <p className="font-bold text-amber-900 flex items-center gap-1.5">
                  <span>💡</span> Hướng dẫn lấy lại mật khẩu:
                </p>
                <ol className="list-decimal list-inside text-amber-800 space-y-1">
                  <li>Mở hòm thư Gmail của bạn (kiểm tra cả mục <strong>Spam/Thư rác</strong> nếu không thấy).</li>
                  <li>Mở email chủ đề <strong>[Website Nội Thất V2] Hướng dẫn Đặt lại Mật Khẩu</strong>.</li>
                  <li>Bấm vào nút <strong>🔒 ĐẶT LẠI MẬT KHẨU NGAY</strong> (liên kết có hiệu lực trong 15 phút).</li>
                </ol>
              </div>

              {/* Dev mode quick link for test convenience */}
              {successData.resetLink && (
                <div className="pt-2">
                  <a
                    href={successData.resetLink}
                    className="inline-block w-full py-2.5 px-4 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-2xl font-bold text-xs transition-colors border border-amber-200"
                  >
                    🚀 Mở nhanh form Đặt lại mật khẩu (Dev Link) →
                  </a>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <Link
              to="/login"
              className="text-xs font-bold text-amber-700 hover:text-amber-800 transition-colors inline-flex items-center gap-1"
            >
              ← Quay lại trang Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
