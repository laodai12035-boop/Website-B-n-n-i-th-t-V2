import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
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
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex items-center justify-center my-auto py-12 animate-fade-in">
        <div className="bg-white rounded-none border border-stone-200/80 shadow-md w-full max-w-xl p-6 sm:p-10">
          
          <div className="mb-6 text-center">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest bg-amber-100 px-2.5 py-0.5 rounded-none border border-amber-200 inline-block mb-2">
              Khôi Phục Mật Khẩu
            </span>
            <h1 className="text-2xl font-heading font-bold text-stone-900 uppercase tracking-wider">
              QUÊN MẬT KHẨU
            </h1>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              Nhập email tài khoản đã đăng ký để nhận ngay liên kết lấy lại mật khẩu qua Gmail.
            </p>
          </div>

          {apiError && (
            <div className="mb-6">
              <FormAlert type="error" message={apiError} />
            </div>
          )}

          {!successData ? (
            <form onSubmit={handleSubmit} noValidate className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Email tài khoản Gmail của bạn <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (error) setError('')
                  }}
                  placeholder="vd: tenban@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-none text-xs focus:outline-none focus:border-amber-800 bg-white text-stone-900"
                  required
                  autoComplete="email"
                />
                {error && <p className="text-[11px] text-red-600 font-bold mt-1">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-stone-900 hover:bg-amber-800 text-white font-bold text-xs uppercase tracking-wider rounded-none transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'ĐANG GỬI EMAIL KHÔI PHỤC...' : 'GỬI LIÊN KẾT QUA GMAIL'}
              </button>
            </form>
          ) : (
            <div className="space-y-5 py-2 text-xs">
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-none border border-emerald-200">
                <span className="font-bold block mb-1">✓ Đã gửi email thành công!</span>
                <p className="text-xs text-stone-700">
                  Liên kết đặt lại mật khẩu đã được gửi tới{' '}
                  <strong className="font-mono text-stone-900 underline">{successData.recipientEmail}</strong>.
                </p>
              </div>

              <div className="p-4 bg-stone-50 rounded-none border border-stone-200 text-stone-700 space-y-2">
                <p className="font-bold text-stone-900 uppercase tracking-wider">
                  Hướng dẫn lấy lại mật khẩu:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-stone-600">
                  <li>Mở hòm thư Gmail của bạn (kiểm tra cả mục Spam / Thư rác).</li>
                  <li>Mở email chủ đề <strong>[Website Nội Thất V2] Hướng dẫn Đặt lại Mật Khẩu</strong>.</li>
                  <li>Bấm vào nút <strong>ĐẶT LẠI MẬT KHẨU NGAY</strong> (liên kết có hiệu lực trong 15 phút).</li>
                </ol>
              </div>
            </div>
          )}

          <div className="mt-8 pt-5 border-t border-stone-200/80 text-center">
            <Link
              to="/login"
              className="text-xs font-bold text-amber-800 hover:underline uppercase tracking-wider inline-flex items-center gap-1"
            >
              ← QUAY LẠI TRANG ĐĂNG NHẬP
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}

export default ForgotPasswordPage
