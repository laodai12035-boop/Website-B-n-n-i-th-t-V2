import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import bannerService from '@/services/bannerService'

const DEFAULT_BANNERS = [
  {
    id: 'default-1',
    tag: 'BỘ SƯU TẬP MỚI',
    title: 'Victoria',
    subtitle: 'Từ cảm hứng miền quê Pháp đến cảm xúc ngôi nhà Việt đường cong mềm mại, chi tiết chạm tay và tông màu ấm cho từng không gian sống.',
    image_url: 'https://nhaxinh.com/wp-content/uploads/2026/07/nha-xinh-victoria-phong-khach-tong-quan-scaled.webp',
    link_url: '/products?category=ghe',
  },
  {
    id: 'default-2',
    tag: 'BỘ SƯU TẬP NỔI BẬT',
    title: 'Pianosa',
    subtitle: 'Vẻ đẹp thanh lịch phong cách Ý hiện đại, sự kết hợp hoàn hảo giữa chất liệu da bò Ý tinh khôi và khung gỗ sồi cao cấp.',
    image_url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1600&q=80',
    link_url: '/products?category=phong-ngu',
  },
  {
    id: 'default-3',
    tag: 'KHÔNG GIAN LÀM VIỆC',
    title: 'Scandinavian',
    subtitle: 'Tối giản, tinh tế và tràn đầy cảm hứng sáng tạo với thiết kế công thái học vượt thời gian.',
    image_url: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1600&q=80',
    link_url: '/products?category=ban',
  },
]

/**
 * BannerSlider — Hero Banner chuẩn phong cách Nhà Xinh (nhaxinh.com).
 * Tiêu đề bộ sưu tập dùng font Serif Italic (Victoria, Pianosa...) tạo cảm xúc nghệ thuật bay bổng.
 */
const BannerSlider = () => {
  const [banners, setBanners] = useState(DEFAULT_BANNERS)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const data = await bannerService.getPublicBanners()
        if (data && data.length > 0) {
          // Gán fallback tag nếu từ DB
          const formatted = data.map((item, i) => ({
            ...item,
            tag: item.tag || DEFAULT_BANNERS[i % DEFAULT_BANNERS.length].tag,
          }))
          setBanners(formatted)
        }
      } catch (err) {
        console.error('Error fetching public banners:', err)
      }
    }
    fetchBanners()
  }, [])

  // Auto slide mỗi 6 giây
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
    <div className="relative w-full mb-12 overflow-hidden bg-stone-900 group">
      {/* Slider Image with Overlay */}
      <div className="relative h-[480px] sm:h-[560px] md:h-[620px] w-full overflow-hidden">
        {banners.map((banner, index) => (
          <div
            key={banner.id || index}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              index === currentIndex ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-105 pointer-events-none'
            }`}
          >
            <img
              src={banner.image_url}
              alt={banner.title}
              className="w-full h-full object-cover transform duration-1000"
              onError={(e) => {
                e.target.onerror = null
                e.target.src = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1600&q=80'
              }}
            />
            {/* Lớp phủ tối nhẹ để nổi bật chữ */}
            <div className="absolute inset-0 bg-stone-900/40 backdrop-brightness-90 flex items-center justify-center text-center">
              <div className="max-w-3xl px-6 sm:px-12 text-white space-y-4 animate-fade-in py-10">
                
                {/* Tagline nhỏ phía trên */}
                <span className="block text-xs sm:text-sm uppercase tracking-[0.25em] font-sans font-medium text-stone-200/90">
                  {banner.tag || 'BỘ SƯU TẬP MỚI'}
                </span>

                {/* Tiêu đề Bộ Sưu Tập - Italic Serif bay bổng kiểu Victoria nhaxinh.com */}
                <h2 className="text-5xl sm:text-7xl md:text-8xl font-serif italic font-normal text-white drop-shadow-lg tracking-wide leading-tight">
                  {banner.title}
                </h2>

                {/* Đoạn mô tả cảm xúc */}
                {banner.subtitle && (
                  <p className="text-xs sm:text-sm md:text-base text-stone-100 max-w-2xl mx-auto font-sans font-normal leading-relaxed text-shadow drop-shadow-sm">
                    {banner.subtitle}
                  </p>
                )}

                {/* Hàng nút bấm Call To Action chuẩn Nhà Xinh */}
                <div className="pt-4 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                  {banner.link_url && (
                    <Link
                      to={banner.link_url}
                      className="px-7 py-3 bg-white hover:bg-stone-100 text-stone-900 font-bold text-xs uppercase tracking-wider rounded-md shadow-md transition-all transform hover:scale-105 cursor-pointer"
                    >
                      KHÁM PHÁ BỘ SƯU TẬP
                    </Link>
                  )}
                  <Link
                    to="/products"
                    className="px-4 py-3 text-white hover:text-amber-300 font-bold text-xs uppercase tracking-wider underline underline-offset-8 transition-colors cursor-pointer"
                  >
                    CÂU CHUYỆN BỘ SƯU TẬP
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
            className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center text-xl font-light transition-all opacity-0 group-hover:opacity-100 cursor-pointer backdrop-blur-xs border border-white/20"
            aria-label="Previous Banner"
          >
            ❮
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center text-xl font-light transition-all opacity-0 group-hover:opacity-100 cursor-pointer backdrop-blur-xs border border-white/20"
            aria-label="Next Banner"
          >
            ❯
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
            {banners.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentIndex ? 'w-10 bg-amber-500' : 'w-2.5 bg-white/50 hover:bg-white'
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
