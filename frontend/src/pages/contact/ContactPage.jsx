import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

const FAQ_ITEMS = [
  {
    question: 'Cửa hàng có dịch vụ khảo sát và tư vấn đo đạc tận nhà không?',
    answer: 'Có, Nhà Xinh cung cấp dịch vụ đội ngũ kiến trúc sư và chuyên viên đo đạc khảo sát thực tế tận nhà hoàn toàn miễn phí trong khu vực nội thành TP.HCM và Hà Nội.'
  },
  {
    question: 'Cửa hàng có nhận thiết kế và sản xuất đồ gỗ theo yêu cầu (may đo) không?',
    answer: 'Nhà Xinh sở hữu xưởng sản xuất riêng đáp ứng trọn gói nhu cầu may đo nội thất gỗ theo kích thước, chất liệu (gỗ sồi, óc chó, mdf chống ẩm) và kiểu dáng yêu cầu của khách hàng.'
  },
  {
    question: 'Chính sách vận chuyển và chi phí giao hàng các sản phẩm cồng kềnh ra sao?',
    answer: 'Chúng tôi miễn phí vận chuyển & lắp đặt cho đơn hàng từ 10.000.000đ trong bán kính 20km. Đơn hàng ngoại tỉnh sẽ được hỗ trợ gửi qua đối tác vận chuyển uy tín với chi phí ưu đãi nhất.'
  },
  {
    question: 'Làm thế nào để bảo quản đồ gỗ nội thất luôn bền đẹp và không bị ẩm mốc?',
    answer: 'Khách hàng nên đặt đồ gỗ nơi khô ráo, tránh ánh nắng trực tiếp chiếu quá mạnh. Lau chùi bằng khăn mềm hơi ẩm và định kỳ dưỡng bóng gỗ 6 tháng/lần.'
  },
  {
    question: 'Các hình thức thanh toán được hỗ trợ khi mua hàng là gì?',
    answer: 'Nhà Xinh chấp nhận đa dạng hình thức: Thanh toán tiền mặt (COD), chuyển khoản ngân hàng (VNPAY/QR Code), quẹt thẻ POS và trả góp 0% qua thẻ tín dụng.'
  },
  {
    question: 'Tôi có được kiểm tra sản phẩm trước khi thanh toán tiền không?',
    answer: 'Tất nhiên! Khách hàng hoàn toàn được quyền mở thùng kiểm tra chất lượng, bề mặt sơn và kiểu dáng trước khi ký biên bản bàn giao và thanh toán.'
  },
  {
    question: 'Quy trình xử lý sự cố hoặc hỗ trợ đổi trả nếu sản phẩm bị hư hỏng như thế nào?',
    answer: 'Nếu phát hiện lỗi nhà sản xuất hoặc trầy xước trong quá trình vận chuyển, quý khách chỉ cần báo hotline 0903 884 358. Đội ngũ kỹ thuật sẽ đến kiểm tra và bảo hành/đổi mới trong vòng 24h - 48h.'
  },
  {
    question: 'Tôi có thể liên hệ bộ phận hỗ trợ chăm sóc khách hàng qua các kênh nào?',
    answer: 'Quý khách có thể gọi trực tiếp Tổng đài 0903 884 358, gửi Email info@noithat.vn, nhắn tin qua Zalo Chăm sóc khách hàng hoặc để lại thông tin trong Form phản hồi ở trên.'
  }
]

const ContactPage = () => {
  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    content: '',
    captchaInput: '',
  })

  // Captcha Code Generator
  const [captchaCode, setCaptchaCode] = useState('')
  const [captchaError, setCaptchaError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Open FAQ accordion states
  const [openFaqIndex, setOpenFaqIndex] = useState(null)

  const generateCaptcha = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString()
    setCaptchaCode(code)
  }

  useEffect(() => {
    generateCaptcha()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (name === 'captchaInput') setCaptchaError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (formData.captchaInput.trim() !== captchaCode) {
      setCaptchaError('Mã xác nhận không chính xác. Vui lòng thử lại!')
      generateCaptcha()
      return
    }

    setSubmitting(true)
    setCaptchaError('')

    // Giả lập gửi tin nhắn phản hồi
    setTimeout(() => {
      setSubmitting(false)
      setSubmitSuccess(true)
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        content: '',
        captchaInput: '',
      })
      generateCaptcha()
    }, 800)
  }

  const toggleFaq = (index) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index))
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 animate-fade-in">
        {/* Breadcrumb Header */}
        <div className="mb-6 pb-4 border-b border-stone-200">
          <div className="text-xs text-stone-500 mb-2 flex items-center gap-2">
            <Link to="/" className="hover:text-amber-800 transition-colors">Trang chủ</Link>
            <span>/</span>
            <span className="text-amber-800 font-semibold">Liên hệ</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-stone-900 tracking-tight">
            Liên Hệ Với Chúng Tôi
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Hãy liên hệ với Nhà Xinh nếu bạn có bất kỳ thắc mắc hoặc cần tư vấn về sản phẩm nội thất
          </p>
        </div>

        {/* SECTION 1: THÔNG TIN LIÊN HỆ & GOOGLE MAPS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 items-stretch">
          
          {/* Left Column: Contact Cards */}
          <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
            <h2 className="text-base font-bold uppercase tracking-wider text-amber-800 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Thông tin liên hệ
            </h2>

            {/* Card 1: Showroom */}
            <div className="bg-white p-5 border border-stone-200 shadow-2xs flex items-start gap-4 hover:border-amber-800 transition-colors">
              <div className="w-12 h-12 rounded-full bg-amber-800 text-white flex items-center justify-center shrink-0 shadow-xs">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m3 0h1m-4-8l2-2 2 2m-4-4l2-2 2 2" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 mb-1">Văn phòng & Showroom chính</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  160C Trường Chinh, Phường 12, Quận Tân Bình, TP.HCM
                </p>
              </div>
            </div>

            {/* Card 2: Hotline */}
            <div className="bg-white p-5 border border-stone-200 shadow-2xs flex items-start gap-4 hover:border-amber-800 transition-colors">
              <div className="w-12 h-12 rounded-full bg-amber-800 text-white flex items-center justify-center shrink-0 shadow-xs">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 mb-1">Hotline hỗ trợ tổng đài</h3>
                <p className="text-xs text-stone-600 font-medium">
                  <a href="tel:0977456123" className="text-amber-800 font-bold hover:underline">0977.456.123</a> (8:00 - 22:00 từ T2 - Chủ Nhật)
                </p>
              </div>
            </div>

            {/* Card 3: Email */}
            <div className="bg-white p-5 border border-stone-200 shadow-2xs flex items-start gap-4 hover:border-amber-800 transition-colors">
              <div className="w-12 h-12 rounded-full bg-amber-800 text-white flex items-center justify-center shrink-0 shadow-xs">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 mb-1">Email phản hồi & hợp tác</h3>
                <p className="text-xs text-stone-600">
                  <a href="mailto:info@noithat.vn" className="text-amber-800 font-semibold hover:underline">info@noithat.vn</a>
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Map */}
          <div className="lg:col-span-7 bg-white p-2 border border-stone-200 shadow-2xs h-[360px] lg:h-auto min-h-[320px]">
            <iframe
              title="Bản đồ Showroom Nhà Xinh"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.262985160867!2d106.6508933!3d10.7911487!2m3!1f0!0!f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3175293774640103%3A0x6b63d919d3f1a0b3!2zMTYwIMOCbyBUcsaw4budbmcgQ2jDrW5oLCBQaMaw4budbmcgMTIsIFTDom4gQsOsbmgsIFRow6BuaCBwaOG7kSBI4buTIENow60gTWluaCwgVmlldG5hbQ!5e0!3m2!1svi!2s!4v1700000000000!5m2!1svi!2s"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full min-h-[300px]"
            />
          </div>
        </div>

        {/* SECTION 2: GỬI TIN NHẮN PHẢN HỒI (FEEDBACK FORM) */}
        <div className="bg-white p-6 sm:p-8 border border-stone-200 shadow-2xs mb-12">
          <h2 className="text-base font-bold uppercase tracking-wider text-amber-800 flex items-center gap-2 mb-6 pb-3 border-b border-stone-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Gửi tin nhắn phản hồi
          </h2>

          {submitSuccess && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-none flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Cảm ơn bạn đã gửi tin nhắn! Bộ phận CSKH của Nhà Xinh sẽ phản hồi lại trong thời gian sớm nhất.</span>
              </div>
              <button
                type="button"
                onClick={() => setSubmitSuccess(false)}
                className="text-emerald-700 hover:text-emerald-900 font-bold ml-4"
              >
                ✕
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 max-w-3xl">
            {/* Input: Full Name */}
            <div>
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Họ và tên của bạn *"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 text-xs text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-amber-800 transition-colors"
              />
            </div>

            {/* Input: Email */}
            <div>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="Địa chỉ Email *"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 text-xs text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-amber-800 transition-colors"
              />
            </div>

            {/* Input: Phone */}
            <div>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Số điện thoại liên lạc"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 text-xs text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-amber-800 transition-colors"
              />
            </div>

            {/* Textarea: Content */}
            <div>
              <textarea
                name="content"
                required
                rows={4}
                value={formData.content}
                onChange={handleChange}
                placeholder="Nội dung cần hỗ trợ *"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 text-xs text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-amber-800 transition-colors"
              />
            </div>

            {/* Captcha 4 Digits Security Code */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
              <input
                type="text"
                name="captchaInput"
                required
                maxLength={4}
                value={formData.captchaInput}
                onChange={handleChange}
                placeholder="Mã xác nhận 4 số *"
                className="w-full sm:w-48 px-4 py-2.5 bg-stone-50 border border-stone-200 text-xs text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:border-amber-800 font-mono tracking-wider"
              />

              <div className="flex items-center gap-2">
                <span className="px-4 py-2 bg-stone-100 border border-stone-300 font-mono text-base font-bold tracking-widest text-stone-800 select-none">
                  {captchaCode}
                </span>

                <button
                  type="button"
                  onClick={generateCaptcha}
                  className="p-2 text-stone-500 hover:text-amber-800 hover:bg-stone-100 transition-colors"
                  title="Đổi mã khác"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>

            {captchaError && (
              <p className="text-xs text-red-600 font-semibold">{captchaError}</p>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-8 py-3.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Đang gửi tin nhắn...' : 'Gửi tin nhắn ngay ›'}
              </button>
            </div>
          </form>
        </div>

        {/* SECTION 3: CÂU HỎI THƯỜNG GẶP (FAQ ACCORDION) */}
        <div className="bg-white p-6 sm:p-8 border border-stone-200 shadow-2xs mb-8">
          <h2 className="text-base font-bold uppercase tracking-wider text-amber-800 flex items-center gap-2 mb-6 pb-3 border-b border-stone-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Câu hỏi thường gặp
          </h2>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaqIndex === idx
              return (
                <div
                  key={idx}
                  className="border border-stone-200/90 transition-all duration-200"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full text-left p-4 bg-stone-50 hover:bg-stone-100 transition-colors flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm font-semibold text-stone-900">
                      {item.question}
                    </span>
                    <span className="text-amber-800 font-bold text-lg leading-none shrink-0">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="p-4 bg-white border-t border-stone-100 text-xs text-stone-600 leading-relaxed animate-fade-in">
                      {item.answer}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default ContactPage
