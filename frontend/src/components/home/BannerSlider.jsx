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
 * BannerSlider — Component Slider Banner Quảng Cáo trên Trang Chủ (NT-11-CN-001).
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

  // Auto slide every 5 seconds
  useEffect(() => {
    if (banners.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [banners.length])

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length)
  }

  if (banners.length === 0) return null

  const currentBanner = banners[currentIndex]

  return (
    <div className="relative w-full mb-8 rounded-3xl overflow-hidden shadow-lg bg-gray-900 group">
      {/* Slider Image with Overlay */}
      <div className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden">
        {banners.map((banner, index) => (
          <div
            key={banner.id || index}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              index === currentIndex ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-105 pointer-events-none'
            }`}
          >
            <img
              src={banner.image_url}
              alt={banner.title}
              className="w-full h-full object-cover transform duration-1000"
            />
            {/* Dark Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent flex items-center">
              <div className="max-w-2xl px-6 sm:px-12 md:px-16 text-white space-y-3 animate-fade-in">
                <span className="inline-block px-3 py-1 bg-amber-500/90 text-white rounded-full text-xs font-bold uppercase tracking-wider shadow-xs">
                  🔥 Ưu Đãi Nổi Bật
                </span>
                <h2 className="text-xl sm:text-3xl md:text-4xl font-display font-extrabold leading-tight text-white drop-shadow-md">
                  {banner.title}
                </h2>
                {banner.subtitle && (
                  <p className="text-xs sm:text-sm text-gray-200 line-clamp-2 max-w-xl font-medium">
                    {banner.subtitle}
                  </p>
                )}
                {banner.link_url && (
                  <div className="pt-2">
                    <Link
                      to={banner.link_url}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-bold text-xs shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                    >
                      <span>Khám Phá Ngay</span>
                      <span>→</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Controls (Only if > 1 banner) */}
      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md text-white flex items-center justify-center text-lg font-bold transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
            aria-label="Previous Banner"
          >
            ❮
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md text-white flex items-center justify-center text-lg font-bold transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
            aria-label="Next Banner"
          >
            ❯
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {banners.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex ? 'w-8 bg-amber-500' : 'w-2 bg-white/50 hover:bg-white'
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
