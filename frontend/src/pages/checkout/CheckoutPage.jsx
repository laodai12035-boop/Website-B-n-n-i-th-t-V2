import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { useAddress } from '@/contexts/AddressContext'
import AddAddressModal from '@/components/address/AddAddressModal'
import CouponSelectorModal from '@/components/checkout/CouponSelectorModal'
import couponService from '@/services/couponService'
import orderService from '@/services/orderService'
import shippingService from '@/services/shippingService'

/**
 * CheckoutPage — Trang Thanh toán đặt hàng phong cách Nhà Xinh (nhaxinh.com).
 * Bố cục 2 cột chuẩn thương mại điện tử cao cấp, góc cạnh vuông vức (rounded-none), SVG vector icons.
 */
const CheckoutPage = () => {
  const { items, cartTotal, fetchCart } = useCart()
  const { user } = useAuth()
  const { addresses, defaultAddress, fetchAddresses } = useAddress()
  const navigate = useNavigate()
  const location = useLocation()

  const buyNowItem = location.state?.buyNowItem

  const displayItems = useMemo(() => {
    if (buyNowItem?.product) {
      const p = buyNowItem.product
      const price = parseFloat(
        p.discount_price && parseFloat(p.discount_price) > 0 && parseFloat(p.discount_price) < parseFloat(p.price)
          ? p.discount_price
          : p.price
      )
      const qty = buyNowItem.quantity || 1
      return [
        {
          id: 'buynow-' + p.id,
          product_id: p.id,
          quantity: qty,
          price: price,
          subtotal: price * qty,
          product: p,
        },
      ]
    }
    return items
  }, [buyNowItem, items])

  const displaySubtotal = useMemo(() => {
    if (buyNowItem?.product) {
      const p = buyNowItem.product
      const price = parseFloat(
        p.discount_price && parseFloat(p.discount_price) > 0 && parseFloat(p.discount_price) < parseFloat(p.price)
          ? p.discount_price
          : p.price
      )
      return price * (buyNowItem.quantity || 1)
    }
    return cartTotal
  }, [buyNowItem, cartTotal])

  // Address Selection States
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState(false)

  // Form State
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [address, setAddress] = useState('')
  const [note, setNote] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cod')

  // Auto-fill default address when loaded
  useEffect(() => {
    if (defaultAddress && !address) {
      setFullName(defaultAddress.recipient_name)
      setPhone(defaultAddress.phone)
      setAddress(`${defaultAddress.detail_address}, ${defaultAddress.ward}, ${defaultAddress.district}, ${defaultAddress.province}`)
      setSelectedAddressId(defaultAddress.id)
    } else if (addresses && addresses.length > 0 && !address) {
      const first = addresses[0]
      setFullName(first.recipient_name)
      setPhone(first.phone)
      setAddress(`${first.detail_address}, ${first.ward}, ${first.district}, ${first.province}`)
      setSelectedAddressId(first.id)
    }
  }, [defaultAddress, addresses])

  const handleSelectAddress = (item) => {
    setSelectedAddressId(item.id)
    setFullName(item.recipient_name)
    setPhone(item.phone)
    setAddress(`${item.detail_address}, ${item.ward}, ${item.district}, ${item.province}`)
  }

  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false)

  const handleSelectCouponFromModal = async (code) => {
    setCouponCode(code)
    setCouponError('')
    setCouponLoading(true)
    try {
      const result = await couponService.applyCoupon(code, displaySubtotal)
      setAppliedCoupon(result)
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Không thể áp dụng mã giảm giá này')
      setAppliedCoupon(null)
    } finally {
      setCouponLoading(false)
    }
  }

  // Restore coupon passed from CartPage
  useEffect(() => {
    if (location.state?.appliedCoupon) {
      setAppliedCoupon(location.state.appliedCoupon)
      setCouponCode(location.state.appliedCoupon.coupon_code || '')
    }
  }, [location.state])

  const [submitting, setSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [createdOrderInfo, setCreatedOrderInfo] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  // QR payment states
  const [qrOrderInfo, setQrOrderInfo] = useState(null)
  const [qrPaymentStatus, setQrPaymentStatus] = useState('pending_payment')
  const [qrExpired, setQrExpired] = useState(false)
  const [qrSecondsLeft, setQrSecondsLeft] = useState(900)
  const pollingRef = useRef(null)
  const countdownRef = useRef(null)

  // Shipping fee states
  const [shippingFee, setShippingFee] = useState(null)
  const [shippingZone, setShippingZone] = useState(null)
  const [shippingWarning, setShippingWarning] = useState(false)
  const [shippingLoading, setShippingLoading] = useState(false)
  const shippingDebounceRef = useRef(null)

  // Debounce tính phí vận chuyển khi user nhập địa chỉ (800ms)
  useEffect(() => {
    if (shippingDebounceRef.current) clearTimeout(shippingDebounceRef.current)
    if (!address.trim() || address.trim().length < 5) {
      setShippingFee(null)
      setShippingZone(null)
      return
    }
    shippingDebounceRef.current = setTimeout(async () => {
      setShippingLoading(true)
      try {
        const res = await shippingService.calculateShipping(address.trim())
        setShippingFee(res.fee)
        setShippingZone(res.zone)
        setShippingWarning(res.missing_data_warning)
      } catch {
        setShippingFee(120000)
      } finally {
        setShippingLoading(false)
      }
    }, 800)
    return () => clearTimeout(shippingDebounceRef.current)
  }, [address])

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)
  }

  const handleApplyCoupon = async (e) => {
    e.preventDefault()
    setCouponError('')
    if (!couponCode.trim()) return

    setCouponLoading(true)
    try {
      const res = await couponService.applyCoupon(couponCode, displaySubtotal)
      setAppliedCoupon(res)
      setCouponError('')
    } catch (err) {
      setAppliedCoupon(null)
      const msg = err.response?.data?.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn.'
      setCouponError(msg)
    } finally {
      setCouponLoading(false)
    }
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!fullName.trim() || !phone.trim() || !address.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ Họ tên, Số điện thoại và Địa chỉ giao hàng.')
      return
    }

    setSubmitting(true)
    try {
      const orderPayload = {
        recipient_name: fullName.trim(),
        recipient_phone: phone.trim(),
        shipping_address: address.trim(),
        note: note.trim(),
        coupon_code: appliedCoupon ? appliedCoupon.coupon_code : null,
        buy_now_item: buyNowItem ? { product_id: buyNowItem.product.id, quantity: buyNowItem.quantity || 1 } : null,
      }

      if (paymentMethod === 'qr') {
        const result = await orderService.createQrOrder(orderPayload)
        setQrOrderInfo(result)
        const expireAt = new Date(result.qr_expire_at + 'Z')
        const secondsLeft = Math.max(0, Math.floor((expireAt - Date.now()) / 1000))
        setQrSecondsLeft(secondsLeft)
        if (fetchCart && !buyNowItem) await fetchCart()
        pollingRef.current = setInterval(async () => {
          try {
            const status = await orderService.getQrStatus(result.id)
            setQrPaymentStatus(status.payment_status)
            setQrExpired(status.expired)
            if (status.payment_status === 'paid' || status.expired) {
              clearInterval(pollingRef.current)
            }
          } catch {}
        }, 5000)
        countdownRef.current = setInterval(() => {
          setQrSecondsLeft(s => {
            if (s <= 1) {
              clearInterval(countdownRef.current)
              clearInterval(pollingRef.current)
              setQrExpired(true)
              return 0
            }
            return s - 1
          })
        }, 1000)
      } else {
        const createdOrder = await orderService.createCodOrder(orderPayload)
        setCreatedOrderInfo(createdOrder)
        if (fetchCart && !buyNowItem) await fetchCart()
        setOrderSuccess(true)
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Đã có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại!'
      setErrorMsg(msg)
    } finally {
      setSubmitting(false)
    }
  }

  // ---- QR Screen ----
  if (qrOrderInfo) {
    const mm = String(Math.floor(qrSecondsLeft / 60)).padStart(2, '0')
    const ss = String(qrSecondsLeft % 60).padStart(2, '0')
    const isPaid = qrPaymentStatus === 'paid'

    return (
      <div className="min-h-screen bg-stone-50 flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 max-w-lg mx-auto w-full p-6 my-8 flex flex-col items-center text-center animate-fade-in">
          {isPaid ? (
            <>
              <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-none flex items-center justify-center mb-4 shadow-2xs">
                <svg className="w-8 h-8 stroke-current" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-heading font-bold text-stone-900 mb-1 uppercase tracking-wider">
                Thanh toán thành công!
              </h2>
              <p className="text-xs text-amber-800 font-bold bg-amber-100 px-3 py-1 rounded-none mb-4 tracking-wide font-mono">
                MÃ ĐƠN HÀNG: {qrOrderInfo.order_code}
              </p>
              <p className="text-xs text-stone-600 mb-6 leading-relaxed">
                Đơn hàng đã được xác nhận và đang được đóng gói giao tới bạn. Cảm ơn bạn đã lựa chọn <strong>Nội thất Nhà Xinh</strong>!
              </p>
              <Link to="/products" className="w-full py-3.5 bg-stone-900 hover:bg-amber-800 text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs">
                Tiếp tục mua sắm
              </Link>
            </>
          ) : qrExpired ? (
            <>
              <div className="w-16 h-16 bg-red-100 text-red-700 rounded-none flex items-center justify-center mb-4">
                <svg className="w-8 h-8 stroke-current" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-heading font-bold text-stone-900 mb-2 uppercase tracking-wider">
                Mã QR đã hết hạn
              </h2>
              <p className="text-xs text-stone-500 mb-6">
                Quá thời hạn 15 phút chưa ghi nhận chuyển khoản. Đơn hàng giữ trạng thái chưa thanh toán.
              </p>
              <p className="text-xs text-amber-800 bg-amber-100 px-3 py-1 rounded-none mb-6 font-mono font-bold">
                MÃ ĐƠN HÀNG: {qrOrderInfo.order_code}
              </p>
              <Link to="/products" className="w-full py-3.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-none text-xs font-bold uppercase tracking-wider transition-colors">
                Quay lại mua sắm
              </Link>
            </>
          ) : (
            <>
              <h2 className="text-xl font-heading font-bold text-stone-900 mb-1 uppercase tracking-wider">
                QUÉT MÃ QR ĐỂ THANH TOÁN
              </h2>
              <p className="text-xs text-amber-800 font-bold bg-amber-100 px-3 py-1 rounded-none mb-4 tracking-wide font-mono">
                MÃ ĐƠN HÀNG: {qrOrderInfo.order_code}
              </p>

              {/* QR Code Image */}
              <div className="bg-white p-4 rounded-none shadow-2xs border border-stone-200/80 mb-4 w-fit mx-auto">
                <img
                  src={qrOrderInfo.qr_url}
                  alt="Mã QR ngân hàng"
                  className="w-56 h-56 object-contain"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              </div>

              {/* Countdown */}
              <div className="flex items-center gap-2 mb-4 text-xs font-semibold">
                <span className="text-stone-500">Hết hạn sau:</span>
                <span className={`font-mono font-bold text-lg ${qrSecondsLeft < 60 ? 'text-red-600' : 'text-amber-800'}`}>
                  {mm}:{ss}
                </span>
              </div>

              {/* Bank Info Card */}
              <div className="bg-white rounded-none border border-stone-200/80 p-4 w-full text-left text-xs space-y-2 mb-6 shadow-2xs">
                <p className="font-bold text-stone-900 text-xs uppercase tracking-wider mb-2 pb-1 border-b border-stone-100">
                  THÔNG TIN CHUYỂN KHOẢN
                </p>
                <div className="flex justify-between">
                  <span className="text-stone-500">Ngân hàng:</span>
                  <span className="font-bold text-stone-900">{qrOrderInfo.bank_info?.bank_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Số tài khoản:</span>
                  <span className="font-bold text-stone-900 font-mono tracking-wider">{qrOrderInfo.bank_info?.account_no}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Chủ tài khoản:</span>
                  <span className="font-bold text-stone-900">{qrOrderInfo.bank_info?.account_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Số tiền:</span>
                  <span className="font-bold text-amber-800">{formatCurrency(qrOrderInfo.total_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Nội dung chuyển khoản:</span>
                  <span className="font-bold text-amber-800 font-mono tracking-wide">{qrOrderInfo.bank_info?.transfer_content}</span>
                </div>
              </div>

              <p className="text-[11px] text-stone-400">
                Hệ thống đang tự động kiểm tra giao dịch chuyển khoản...
              </p>
            </>
          )}
        </main>
        <Footer />
      </div>
    )
  }

  // ---- COD Success Screen ----
  if (orderSuccess && createdOrderInfo) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 max-w-lg mx-auto w-full p-6 my-8 flex flex-col items-center justify-center text-center animate-fade-in">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-none flex items-center justify-center mb-4 shadow-2xs">
            <svg className="w-8 h-8 stroke-current" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-heading font-bold text-stone-900 mb-1 uppercase tracking-wider">
            ĐẶT HÀNG THÀNH CÔNG!
          </h2>
          <p className="text-xs text-amber-800 font-bold bg-amber-100 px-3.5 py-1 rounded-none mb-4 font-mono">
            MÃ ĐƠN HÀNG: {createdOrderInfo.order_code}
          </p>
          <p className="text-xs text-stone-600 mb-6 leading-relaxed">
            Cảm ơn bạn đã đặt mua nội thất tại <strong className="text-stone-900">Nội thất Nhà Xinh</strong>. Đơn hàng của bạn đang ở trạng thái <span className="font-bold text-amber-800 uppercase">Chờ xác nhận</span> và sẽ sớm được nhân viên liên hệ giao hàng.
          </p>

          <div className="bg-white rounded-none border border-stone-200/80 p-5 w-full text-left text-xs space-y-2.5 mb-6 shadow-2xs">
            <div className="flex justify-between border-b border-stone-100 pb-2">
              <span className="text-stone-500">Người nhận:</span>
              <span className="font-bold text-stone-900">{createdOrderInfo.recipient_name} ({createdOrderInfo.recipient_phone})</span>
            </div>
            <div className="flex justify-between border-b border-stone-100 pb-2">
              <span className="text-stone-500">Địa chỉ giao:</span>
              <span className="font-bold text-stone-900 truncate max-w-[200px]">{createdOrderInfo.shipping_address}</span>
            </div>
            <div className="flex justify-between border-b border-stone-100 pb-2">
              <span className="text-stone-500">Hình thức thanh toán:</span>
              <span className="font-bold text-amber-800 uppercase">Thanh toán khi nhận hàng (COD)</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-stone-900 font-bold uppercase">Tổng thanh toán:</span>
              <span className="font-bold text-amber-800 text-sm">{formatCurrency(createdOrderInfo.total_amount)}</span>
            </div>
          </div>

          <div className="flex gap-3 w-full">
            <Link
              to="/products"
              className="flex-1 py-3.5 bg-stone-900 hover:bg-amber-800 text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors text-center shadow-2xs"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 animate-fade-in">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-medium text-stone-500 mb-6">
          <Link to="/" className="hover:text-amber-800 transition-colors">Trang chủ</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-amber-800 transition-colors">Sản phẩm</Link>
          <span>/</span>
          <span className="text-stone-900 font-semibold">Thanh toán</span>
        </nav>

        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-stone-900 mb-8 pb-4 border-b border-stone-200/80 uppercase tracking-wider">
          THANH TOÁN ĐƠN HÀNG
        </h1>

        {displayItems.length === 0 ? (
          <div className="bg-white rounded-none border border-stone-200/80 p-10 text-center max-w-md mx-auto my-8 shadow-2xs">
            <div className="w-16 h-16 bg-stone-100 text-stone-400 rounded-none flex items-center justify-center mx-auto mb-3 border border-stone-200">
              <svg className="w-8 h-8 stroke-current" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className="text-stone-500 text-xs font-medium mb-4">Bạn chưa chọn sản phẩm nào để thanh toán.</p>
            <Link
              to="/products"
              className="px-6 py-3 bg-stone-900 text-white rounded-none text-xs font-bold uppercase tracking-wider hover:bg-amber-800 transition-colors inline-block"
            >
              Chọn sản phẩm mua sắm
            </Link>
          </div>
        ) : (
          <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* CỘT TRÁI: Form thông tin giao hàng & Phương thức thanh toán (lg:col-span-7) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* 1. Shipping Address Section */}
              <div className="bg-white rounded-none border border-stone-200/80 shadow-2xs p-6 space-y-5">
                <h3 className="text-sm font-heading font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-stone-200/80">
                  <svg className="w-4 h-4 text-amber-800 stroke-current" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>THÔNG TIN GIAO HÀNG</span>
                </h3>

                {errorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-none text-xs text-red-800 font-semibold flex items-center gap-2">
                    <svg className="w-4 h-4 text-red-600 fill-current shrink-0" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Sổ địa chỉ dropdown select */}
                {addresses && addresses.length > 0 && (
                  <div className="bg-stone-50 p-4 rounded-none border border-stone-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="address_dropdown_select" className="text-xs font-bold text-stone-900 uppercase tracking-wider cursor-pointer">
                        Chọn từ Sổ địa chỉ của bạn:
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsAddAddressModalOpen(true)}
                        className="text-[11px] font-bold text-amber-800 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>+ Thêm địa chỉ mới</span>
                      </button>
                    </div>

                    <select
                      id="address_dropdown_select"
                      value={selectedAddressId || ''}
                      onChange={(e) => {
                        const val = e.target.value
                        if (!val) return
                        const found = addresses.find((a) => String(a.id) === String(val))
                        if (found) handleSelectAddress(found)
                      }}
                      className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-none text-xs font-medium text-stone-800 focus:outline-none focus:border-amber-800 shadow-2xs cursor-pointer"
                    >
                      {addresses.map((item) => {
                        const fullStr = `${item.detail_address}, ${item.ward}, ${item.district}, ${item.province}`
                        return (
                          <option key={item.id} value={item.id}>
                            {item.is_default ? '⭐ [MẶC ĐỊNH] ' : ''}{item.recipient_name} ({item.phone}) — {fullStr}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1 uppercase tracking-wider">
                      Họ và tên người nhận <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full px-3.5 py-2.5 text-xs border border-stone-200 rounded-none focus:outline-none focus:border-amber-800 text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1 uppercase tracking-wider">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0901234567"
                      className="w-full px-3.5 py-2.5 text-xs border border-stone-200 rounded-none focus:outline-none focus:border-amber-800 text-stone-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1 uppercase tracking-wider">
                    Địa chỉ nhận hàng chi tiết <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Số nhà, Tên đường, Phường/Xã, Quận/Huyện, TP"
                    className="w-full px-3.5 py-2.5 text-xs border border-stone-200 rounded-none focus:outline-none focus:border-amber-800 text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1 uppercase tracking-wider">Ghi chú giao hàng (Tùy chọn)</label>
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi đến 15 phút"
                    className="w-full px-3.5 py-2.5 text-xs border border-stone-200 rounded-none focus:outline-none focus:border-amber-800 text-stone-900"
                  />
                </div>
              </div>

              {/* 2. Payment Method Selector */}
              <div className="bg-white rounded-none border border-stone-200/80 shadow-2xs p-6 space-y-4">
                <h3 className="text-sm font-heading font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-stone-200/80">
                  <svg className="w-4 h-4 text-amber-800 stroke-current" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>PHƯƠNG THỨC THANH TOÁN</span>
                </h3>

                <div className="space-y-3">
                  {/* Option 1: COD */}
                  <label
                    className={`flex items-center gap-3.5 p-4 rounded-none border cursor-pointer transition-all ${
                      paymentMethod === 'cod'
                        ? 'border-2 border-stone-900 bg-stone-50/70 shadow-2xs'
                        : 'border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="w-4 h-4 text-amber-800 focus:ring-amber-800 cursor-pointer"
                    />
                    <div className="w-9 h-9 bg-stone-100 text-stone-800 rounded-none flex items-center justify-center shrink-0 border border-stone-200">
                      <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">Thanh toán khi nhận hàng (COD)</h4>
                      <p className="text-[11px] text-stone-500 mt-0.5">Khách hàng kiểm tra sản phẩm và thanh toán tiền mặt trực tiếp cho nhân viên giao hàng</p>
                    </div>
                  </label>

                  {/* Option 2: VietQR */}
                  <label
                    className={`flex items-center gap-3.5 p-4 rounded-none border cursor-pointer transition-all ${
                      paymentMethod === 'qr'
                        ? 'border-2 border-amber-800 bg-amber-50/40 shadow-2xs'
                        : 'border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="qr"
                      checked={paymentMethod === 'qr'}
                      onChange={() => setPaymentMethod('qr')}
                      className="w-4 h-4 text-amber-800 focus:ring-amber-800 cursor-pointer"
                    />
                    <div className="w-9 h-9 bg-amber-800 text-white rounded-none flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v2h-3v-2zm-3 0h2v3h-2v-3zm3 3h3v5h-3v-5zm-3 2h2v3h-2v-3zm-3-2h2v5h-2v-5z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">Chuyển khoản QR ngân hàng (VietQR)</h4>
                      <p className="text-[11px] text-stone-500 mt-0.5">Quét mã QR bằng ứng dụng ngân hàng — tự động xác nhận tức thì, hỗ trợ tất cả ngân hàng Việt Nam</p>
                    </div>
                  </label>
                </div>
              </div>

            </div>

            {/* CỘT PHẢI: Khối Tóm tắt đơn hàng & Mã giảm giá (lg:col-span-5) */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-none border border-stone-200/80 shadow-2xs p-6 space-y-6 sticky top-24">
                <h3 className="text-sm font-heading font-bold text-stone-900 pb-3 border-b border-stone-200/80 uppercase tracking-wider">
                  SẢN PHẨM ĐẶT MUA ({displayItems.length})
                </h3>

                {/* Items List Compact (Tỷ lệ 4:5) */}
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {displayItems.map((item) => (
                    <div key={item.id || item.product_id} className="flex gap-3 items-center p-2 bg-stone-50 border border-stone-200/60">
                      <img
                        src={item.product?.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc'}
                        alt={item.product?.name}
                        className="w-14 h-16 object-cover rounded-none bg-stone-100 border border-stone-200/80 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-stone-900 truncate">{item.product?.name}</h4>
                        <p className="text-[11px] text-stone-400">Số lượng: {item.quantity}</p>
                      </div>
                      <div className="text-xs font-bold text-stone-900">
                        {formatCurrency(item.subtotal)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Calculation Breakdown */}
                <div className="pt-3 border-t border-stone-200/80 space-y-2 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Tạm tính:</span>
                    <span className="font-bold text-stone-900">{formatCurrency(displaySubtotal)}</span>
                  </div>

                  {/* Shipping Fee */}
                  <div className="flex justify-between text-stone-600">
                    <span className="flex items-center gap-1">
                      <span>Phí vận chuyển</span>
                      {shippingZone && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-700 border border-stone-200">
                          {shippingZone === 'inner_city' ? 'Nội thành' : 'Tỉnh khác'}
                        </span>
                      )}
                    </span>
                    <span className="font-bold text-stone-900">
                      {shippingLoading ? (
                        <span className="text-stone-400 text-[11px]">Đang tính...</span>
                      ) : shippingFee !== null ? (
                        formatCurrency(shippingFee)
                      ) : (
                        <span className="text-stone-400 text-[11px]">Nhập địa chỉ để tính</span>
                      )}
                    </span>
                  </div>

                  {shippingWarning && (
                    <p className="text-[10px] text-amber-800 bg-amber-50 p-2 border border-amber-200">
                      ⚠️ Một số sản phẩm thiếu trọng lượng chuẩn. Phí vận chuyển ước tính.
                    </p>
                  )}

                  {appliedCoupon && (
                    <div className="flex justify-between text-emerald-800 bg-emerald-50 p-2 border border-emerald-200 text-xs font-semibold">
                      <span>Mã {appliedCoupon.coupon_code}:</span>
                      <span className="font-bold">-{formatCurrency(appliedCoupon.discount_amount)}</span>
                    </div>
                  )}
                </div>

                {/* Coupon Form */}
                <form onSubmit={handleApplyCoupon} className="space-y-2 pt-2 border-t border-stone-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">Mã giảm giá / Voucher:</span>
                    <button
                      type="button"
                      onClick={() => setIsCouponModalOpen(true)}
                      className="text-[11px] font-bold text-amber-800 hover:underline cursor-pointer"
                    >
                      Kho Voucher
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Mã giảm giá"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 text-xs border border-stone-200 rounded-none focus:outline-none focus:border-amber-800 uppercase font-semibold text-stone-900"
                    />
                    <button
                      type="submit"
                      disabled={couponLoading || !couponCode.trim()}
                      className="px-4 py-2.5 bg-stone-900 hover:bg-amber-800 text-white text-xs font-bold uppercase tracking-wider rounded-none transition-colors disabled:bg-stone-200 disabled:text-stone-400 cursor-pointer"
                    >
                      {couponLoading ? '...' : 'Áp dụng'}
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-[11px] text-red-600 font-semibold px-1">
                      ⚠️ {couponError}
                    </p>
                  )}
                </form>

                {/* Total Price Row */}
                <div className="pt-3 border-t border-stone-200/80 flex justify-between items-baseline">
                  <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">Tổng thanh toán:</span>
                  <span className="text-xl font-bold text-amber-800">
                    {formatCurrency(
                      (appliedCoupon ? appliedCoupon.final_total : displaySubtotal) + (shippingFee || 0)
                    )}
                  </span>
                </div>

                {/* Primary CTA Order Button (Solid Đen Sẫm góc cạnh) */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-stone-900 hover:bg-amber-800 text-white rounded-none text-xs font-bold uppercase tracking-wider text-center transition-colors shadow-2xs disabled:bg-stone-200 disabled:text-stone-400 cursor-pointer block"
                >
                  {submitting ? 'ĐANG XỬ LÝ ĐƠN HÀNG...' : 'XÁC NHẬN ĐẶT HÀNG'}
                </button>
              </div>
            </div>

          </form>
        )}
      </main>

      <Footer />

      {/* Modal Thêm địa chỉ mới trực tiếp từ Checkout */}
      <AddAddressModal
        isOpen={isAddAddressModalOpen}
        onClose={() => setIsAddAddressModalOpen(false)}
        onSuccess={() => fetchAddresses()}
      />

      {/* Modal Chọn Mã Giảm Giá / Voucher Khả Dụng */}
      <CouponSelectorModal
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
        subtotal={displaySubtotal}
        onSelectCoupon={handleSelectCouponFromModal}
        currentCouponCode={couponCode}
      />
    </div>
  )
}

export default CheckoutPage
