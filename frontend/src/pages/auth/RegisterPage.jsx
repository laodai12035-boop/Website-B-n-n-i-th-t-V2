import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import FormAlert from '@/components/ui/FormAlert'
import { useAuth } from '@/contexts/AuthContext'

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

const EyeIcon = ({ open }) =>
  open ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )

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
      const { confirm_password, ...payload } = fields
      await register(payload)

      setSuccessMsg('Tạo tài khoản thành công! Đang chuyển hướng đến trang đăng nhập...')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      if (err.fieldErrors) {
        const serverErrors = {}
        Object.entries(err.fieldErrors).forEach(([field, msgs]) => {
          serverErrors[field] = Array.isArray(msgs) ? msgs[0] : msgs
        })
        setErrors(serverErrors)
      } else {
        setApiError(err.message || 'Không thể tạo tài khoản, vui lòng thử lại.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex items-center justify-center my-auto py-12 animate-fade-in">
        <div className="bg-white rounded-none border border-stone-200/80 shadow-md w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          
          {/* Left Column: High-end Studio Showcase Image */}
          <div className="md:col-span-5 relative bg-stone-900 overflow-hidden flex flex-col justify-between p-8 text-white min-h-[360px] md:min-h-[520px]">
            <img
              src="https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=80"
              alt="Nhà Xinh Dining Showcase"
              className="absolute inset-0 w-full h-full object-cover opacity-60 hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900/95 via-stone-900/40 to-stone-900/30" />
            
            <div className="relative z-10">
              <span className="px-3 py-1 bg-amber-800 text-white text-[10px] font-bold uppercase tracking-widest rounded-none inline-block mb-3">
                THÀNH VIÊN MỚI
              </span>
              <h2 className="text-2xl font-heading font-bold uppercase tracking-wider text-white leading-tight">
                GIA NHẬP NHÀ XINH V2
              </h2>
            </div>

            <div className="relative z-10 space-y-2 border-l-2 border-amber-800 pl-4 py-1">
              <p className="text-xs font-heading italic text-stone-200 leading-relaxed">
                "Đăng ký tài khoản để nhận voucher ưu đãi đặc biệt và theo dõi đơn hàng dễ dàng."
              </p>
              <span className="text-[10px] text-stone-400 uppercase tracking-widest font-mono font-bold block">
                — QUYỀN LỢI THÀNH VIÊN VIP
              </span>
            </div>
          </div>

          {/* Right Column: Registration Form */}
          <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-center bg-white">
            <div className="mb-5">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest bg-amber-100 px-2.5 py-0.5 rounded-none border border-amber-200 inline-block mb-2">
                Đăng Ký Tài Khoản
              </span>
              <h1 className="text-xl font-heading font-bold text-stone-900 uppercase tracking-wider">
                TẠO TÀI KHOẢN MỚI
              </h1>
              <p className="text-xs text-stone-500 mt-1">
                Đã có tài khoản?{' '}
                <Link
                  to="/login"
                  className="text-amber-800 font-bold uppercase tracking-wider hover:underline transition-colors ml-1"
                >
                  Đăng nhập ngay
                </Link>
              </p>
            </div>

            {successMsg && <div className="mb-4"><FormAlert type="success" message={successMsg} /></div>}
            {apiError && <div className="mb-4"><FormAlert type="error" message={apiError} /></div>}

            <form onSubmit={handleSubmit} noValidate className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Họ và tên <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={fields.full_name}
                  onChange={handleChange}
                  placeholder="Nguyễn Văn A"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-none text-xs focus:outline-none focus:border-amber-800 bg-white text-stone-900"
                  required
                />
                {errors.full_name && <p className="text-[11px] text-red-600 font-bold mt-1">{errors.full_name}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Email <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={fields.email}
                    onChange={handleChange}
                    placeholder="email@example.com"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-none text-xs focus:outline-none focus:border-amber-800 bg-white text-stone-900"
                    required
                  />
                  {errors.email && <p className="text-[11px] text-red-600 font-bold mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Số điện thoại <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={fields.phone}
                    onChange={handleChange}
                    placeholder="0901234567"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-none text-xs focus:outline-none focus:border-amber-800 bg-white text-stone-900 font-mono"
                    required
                  />
                  {errors.phone && <p className="text-[11px] text-red-600 font-bold mt-1">{errors.phone}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Mật khẩu <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={fields.password}
                      onChange={handleChange}
                      placeholder="Ít nhất 8 ký tự"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-none text-xs focus:outline-none focus:border-amber-800 bg-white text-stone-900 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer p-1"
                    >
                      <EyeIcon open={showPassword} />
                    </button>
                  </div>
                  {errors.password && <p className="text-[11px] text-red-600 font-bold mt-1">{errors.password}</p>}
                </div>

                <div>
                  <label className="block font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Xác nhận mật khẩu <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirm_password"
                      value={fields.confirm_password}
                      onChange={handleChange}
                      placeholder="Nhập lại mật khẩu"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-none text-xs focus:outline-none focus:border-amber-800 bg-white text-stone-900 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer p-1"
                    >
                      <EyeIcon open={showConfirmPassword} />
                    </button>
                  </div>
                  {errors.confirm_password && <p className="text-[11px] text-red-600 font-bold mt-1">{errors.confirm_password}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-stone-900 hover:bg-amber-800 text-white font-bold text-xs uppercase tracking-wider rounded-none transition-colors shadow-2xs disabled:opacity-50 cursor-pointer mt-3"
              >
                {loading ? 'ĐANG TẠO TÀI KHOẢN...' : 'TẠO TÀI KHOẢN'}
              </button>
            </form>

            <p className="text-[10px] text-stone-400 text-center mt-3 uppercase tracking-wider">
              Bằng cách đăng ký, bạn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của Nhà Xinh V2.
            </p>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}

export default RegisterPage
