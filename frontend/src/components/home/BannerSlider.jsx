import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import bannerService from '@/services/bannerService'

const DEFAULT_BANNERS = [
  {
    id: 'default-1',
    title: 'Bộ Sưu Tập Nội Thất Gỗ Óc Chó Sang Trọng 2026',
    subtitle: 'Nâng tầm đẳng cấp không gian sống với ưu đãi giảm giá lên đến 20% trọn bộ',
    image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1600&q=80',
    link_url: '/products?category=ghe',
  },
  {
    id: 'default-2',
    title: 'Không Gian Phòng Ngủ Scandinavian Ấm Củng',
    subtitle: 'Thiết kế tối giản, tinh tế mang đến giấc ngủ ngon chuẩn khách sạn 5 sao',
    image_url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1600&q=80',
    link_url: '/products?category=phong-ngu',
  },
  {
    id: 'default-3',
    title: 'Góc Làm Việc Hiện Đại & Sáng Tạo',
    subtitle: 'Bàn làm việc thông minh kết hợp ghế công thái học bảo vệ sức khỏe',
    image_url: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1600&q=80',
    link_url: '/products?category=ban',
  },
]

/**
 * BannerSlider — Component Hero Banner Quảng Cáo phong cách Editorial Luxury.
 */
const BannerSlider = () => {
  const [banners, setBanners] = useState(DEFAULT_BANNERS)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const data = await bannerService.getPublicBanners()
        if (data && data.length > 0) {
          setBanners(data)
        }
      } catch (err) {
        console.error('Error fetching public banners:', err)
      }
    }
    fetchBanners()
  }, [])

  // Auto slide every 6 seconds
  useEffect(() => {
    if (banners.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length)
    }, 6000)

    return () => clearInterval(timer)
  }, [banners.length])

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length)
  }

  if (banners.length === 0) return null

  return (
    <div className="relative w-full mb-10 rounded-3xl overflow-hidden shadow-2xl bg-stone-900 group">
      {/* Slider Image with Overlay */}
      <div className="relative h-72 sm:h-96 md:h-[440px] w-full overflow-hidden">
        {banners.map((banner, index) => (
          <div
            key={banner.id || index}
            className={`absolute inset-0 transition-all duration-1000 ease-out ${
              index === currentIndex ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-105 pointer-events-none'
            }`}
          >
            <img
              src={banner.image_url}
              alt={banner.title}
              className="w-full h-full object-cover transform duration-1000"
            />
            {/* Dark Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-stone-950/85 via-stone-900/60 to-transparent flex items-center">
              <div className="max-w-2xl px-8 sm:px-14 md:px-20 text-white space-y-4 animate-fade-in">
                <span className="inline-block px-3.5 py-1 bg-amber-700/90 backdrop-blur-md text-amber-100 rounded-full text-xs font-semibold uppercase tracking-widest border border-amber-600/30">
                  Bộ Sưu Tập Mới 2026
                </span>
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-serif font-bold leading-tight text-white tracking-tight drop-shadow-md">
                  {banner.title}
                </h2>
                {banner.subtitle && (
                  <p className="text-xs sm:text-sm md:text-base text-stone-300 line-clamp-2 max-w-xl font-normal leading-relaxed">
                    {banner.subtitle}
                  </p>
                )}
                {banner.link_url && (
                  <div className="pt-3">
                    <Link
                      to={banner.link_url}
                      className="btn-gold text-xs sm:text-sm px-6 py-3 rounded-xl inline-flex items-center gap-2.5 font-medium tracking-wide shadow-luxury hover:scale-105"
                    >
                      <span>Khám Phá Ngay</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Controls */}
      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-stone-900/40 hover:bg-stone-900/80 backdrop-blur-md text-white border border-white/20 flex items-center justify-center text-sm font-bold transition-all opacity-0 group-hover:opacity-100 cursor-pointer hover:scale-110"
            aria-label="Previous Banner"
          >
            ❮
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="absolute right-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-stone-900/40 hover:bg-stone-900/80 backdrop-blur-md text-white border border-white/20 flex items-center justify-center text-sm font-bold transition-all opacity-0 group-hover:opacity-100 cursor-pointer hover:scale-110"
            aria-label="Next Banner"
          >
            ❯
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
            {banners.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentIndex ? 'w-9 bg-amber-600' : 'w-2.5 bg-white/40 hover:bg-white'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default BannerSlider
