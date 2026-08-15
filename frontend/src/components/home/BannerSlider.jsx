import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import bannerService from '@/services/bannerService'

const DEFAULT_BANNERS = [
  {
    id: 'default-1',
    title: 'Victoria',
    subtitle: 'Từ cảm hứng miền quê Pháp đến cảm xúc ngôi nhà Việt đường cong mềm mại, chi tiết chạm tay và tông màu ấm cho từng không gian sống.',
    image_url: 'https://nhaxinh.com/wp-content/uploads/2026/07/nha-xinh-victoria-phong-khach-tong-quan-scaled.webp',
    link_url: '/products?category=ghe',
  },
  {
    id: 'default-2',
    title: 'Scandinavian',
    subtitle: 'Thiết kế tối giản, tinh tế mang đến giấc ngủ ngon chuẩn phong cách sống Châu Âu hiện đại.',
    image_url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1600&q=80',
    link_url: '/products?category=phong-ngu',
  },
  {
    id: 'default-3',
    title: 'Walnut Executive',
    subtitle: 'Nâng tầm không gian làm việc với chất liệu gỗ óc chó tự nhiên đường nét sắc sảo sang trọng.',
    image_url: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1600&q=80',
    link_url: '/products?category=ban',
  },
]

/**
 * BannerSlider — Full-bleed Hero Banner phong cách Nhà Xinh (nhaxinh.com).
 * Không bo góc, phông chữ Georgia nghiêng sang trọng, button vuông nhọn đẳng cấp.
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
    <div className="relative w-full overflow-hidden bg-stone-900 group rounded-none">
      {/* Slider Image with Center Overlay */}
      <div className="relative h-[480px] sm:h-[580px] md:h-[650px] w-full overflow-hidden">
        {banners.map((banner, index) => (
          <div
            key={banner.id || index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {/* Background Image */}
            <img
              src={banner.image_url}
              alt={banner.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null
                e.target.src = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1600&q=80'
              }}
            />

            {/* Dark Soft Overlay */}
            <div className="absolute inset-0 bg-black/35 flex flex-col items-center justify-center text-center px-4 sm:px-8">
              <div className="max-w-3xl space-y-3 sm:space-y-4 animate-fade-in">
                
                {/* Category Subtitle */}
                <span className="block text-xs sm:text-sm font-sans uppercase tracking-[0.3em] font-semibold text-white/90 drop-shadow-sm">
                  BỘ SƯU TẬP MỚI
                </span>

                {/* Main Serif Italic Title (Giống nhaxinh.com) */}
                <h1 className="font-heading font-serif italic text-4xl sm:text-6xl md:text-7xl font-normal text-white leading-tight drop-shadow-md">
                  {banner.title}
                </h1>

                {/* Subtitle / Description */}
                {banner.subtitle && (
                  <p className="font-sans text-xs sm:text-sm md:text-base text-white/90 max-w-2xl mx-auto font-normal leading-relaxed drop-shadow-sm px-4">
                    {banner.subtitle}
                  </p>
                )}

                {/* CTA Action Buttons (Thiết kế vuông sắc cạnh chuẩn Nhà Xinh) */}
                <div className="pt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                  {banner.link_url && (
                    <Link
                      to={banner.link_url}
                      className="bg-white text-stone-900 hover:bg-stone-100 px-6 sm:px-8 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors shadow-md rounded-none border border-white inline-block"
                    >
                      KHÁM PHÁ BỘ SƯU TẬP
                    </Link>
                  )}
                  <Link
                    to="/products"
                    className="border border-white text-white hover:bg-white hover:text-stone-900 px-6 sm:px-8 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all rounded-none inline-block"
                  >
                    CÂU CHUYỆN NỘI THẤT
                  </Link>
                </div>

              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrow Controls */}
      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-none bg-black/20 hover:bg-black/60 text-white flex items-center justify-center text-xl transition-all opacity-0 group-hover:opacity-100 cursor-pointer border border-white/20"
            aria-label="Previous Banner"
          >
            ❮
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-none bg-black/20 hover:bg-black/60 text-white flex items-center justify-center text-xl transition-all opacity-0 group-hover:opacity-100 cursor-pointer border border-white/20"
            aria-label="Next Banner"
          >
            ❯
          </button>

          {/* Minimal Dots Indicator */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {banners.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 transition-all duration-300 cursor-pointer ${
                  idx === currentIndex ? 'w-8 bg-white' : 'w-3 bg-white/40 hover:bg-white/70'
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
