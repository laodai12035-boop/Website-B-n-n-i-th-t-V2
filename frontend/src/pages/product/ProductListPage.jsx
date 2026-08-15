import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ProductCard from '@/components/product/ProductCard'
import ProductFilters from '@/components/product/ProductFilters'
import BannerSlider from '@/components/home/BannerSlider'
import productService from '@/services/productService'

const DEFAULT_CATEGORIES = [
  { id: '', name: 'Tất cả sản phẩm' },
  { id: 'ban', name: 'Bàn' },
  { id: 'ghe', name: 'Ghế & Sofa' },
  { id: 'ke', name: 'Kệ sách & Tivi' },
  { id: 'tu', name: 'Tủ quần áo' },
  { id: 'trang-tri', name: 'Trang trí' },
  { id: 'phong-ngu', name: 'Phòng ngủ' },
]

const SORT_OPTIONS = [
  { id: 'newest', label: 'Sản phẩm mới nhất' },
  { id: 'discount', label: '🔥 Giảm giá nhiều nhất' },
  { id: 'price_asc', label: 'Giá từ thấp tới cao' },
  { id: 'price_desc', label: 'Giá từ cao tới thấp' },
  { id: 'rating_desc', label: 'Đánh giá cao nhất' },
]

/**
 * ProductListPage — Trang Danh sách & Tìm kiếm sản phẩm.
 * Layout chuẩn E-commerce: Cột bên TRÁI là Bộ lọc & Danh mục, Cột PHẢI là Toolbar Sắp xếp & Lưới sản phẩm.
 */
const ProductListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const currentSearch = searchParams.get('search') || ''
  const currentCategory = searchParams.get('category') || ''
  const currentMinPrice = searchParams.get('min_price') || ''
  const currentMaxPrice = searchParams.get('max_price') || ''
  const currentSort = searchParams.get('sort') || 'newest'

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, total_items: 0, total_pages: 1 })
  const [showMobileFilter, setShowMobileFilter] = useState(false)

  // Nạp danh sách danh mục động kèm số lượng sản phẩm
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const catData = await productService.getCategories()
        if (catData && catData.length > 0) {
          setCategories([{ id: '', name: 'Tất cả sản phẩm' }, ...catData])
        }
      } catch (err) {
        console.error('Error fetching categories:', err)
      }
    }
    fetchCategories()
  }, [])

  // Nạp sản phẩm theo search / category / price / sort
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const data = await productService.getProducts({
          search: currentSearch,
          category: currentCategory,
          min_price: currentMinPrice,
          max_price: currentMaxPrice,
          sort: currentSort,
        })
        setProducts(data.items || [])
        setPagination(data.pagination || { page: 1, total_items: 0, total_pages: 1 })
      } catch (err) {
        console.error('Error fetching products:', err)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [currentSearch, currentCategory, currentMinPrice, currentMaxPrice, currentSort])

  const handleCategorySelect = (catId) => {
    const params = new URLSearchParams(searchParams)
    if (catId) {
      params.set('category', catId)
    } else {
      params.delete('category')
    }
    setSearchParams(params)
    setShowMobileFilter(false)
  }

  const handleSortChange = (e) => {
    const params = new URLSearchParams(searchParams)
    if (e.target.value) {
      params.set('sort', e.target.value)
    } else {
      params.delete('sort')
    }
    setSearchParams(params)
  }

  // Tên danh mục đang chọn (để hiển thị tiêu đề)
  const activeCategoryObj = categories.find((c) => c.id === currentCategory)

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <Navbar />

      {/* Banner Flash Sale / Giảm giá đặc biệt */}
      {(currentSort === 'discount' || currentCategory === 'khuyen-mai') && (
        <div className="bg-stone-900 text-white border-b border-amber-800 p-6 sm:p-8 animate-fade-in">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <span className="px-3 py-1 bg-amber-800 text-white font-bold text-[10px] uppercase tracking-widest rounded-none inline-block">
                CHƯƠNG TRÌNH TRI ÂN KHÁCH HÀNG 2026
              </span>
              <h2 className="text-2xl sm:text-3xl font-heading font-bold uppercase tracking-wider text-amber-400">
                🔥 FLASH SALE & GIẢM GIÁ ĐẶC BIỆT
              </h2>
              <p className="text-xs text-stone-300 max-w-xl font-sans leading-relaxed">
                Ưu đãi đặc biệt giảm giá trực tiếp từ 10% đến 30% cho các sản phẩm nội thất phòng khách, phòng ăn & phòng ngủ cao cấp.
              </p>
            </div>
            <div className="bg-amber-950/80 p-4 border border-amber-800/80 text-center shrink-0 min-w-[220px]">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">MÃ KHUYẾN MÃI HOT</span>
              <span className="text-lg font-mono font-bold text-white block my-1">GIAM200K</span>
              <span className="text-[10px] text-stone-300 block">Giảm 200.000đ đơn từ 2.000.000đ</span>
            </div>
          </div>
        </div>
      )}

      {/* Banner Hero Slider Quảng Cáo tràn viền chuẩn nhaxinh.com */}
      {!currentSearch && !currentCategory && currentSort !== 'discount' && <BannerSlider />}

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 animate-fade-in">

        {/* Breadcrumb & Title */}
        <div className="mb-6 pb-4 border-b border-stone-200">
          <div className="text-xs text-stone-500 mb-2 flex items-center gap-2 font-sans">
            <span>Trang chủ</span>
            <span>/</span>
            <span>Sản Phẩm</span>
            {activeCategoryObj && activeCategoryObj.id && (
              <>
                <span>/</span>
                <span className="text-amber-800 font-semibold">{activeCategoryObj.name}</span>
              </>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-stone-900 tracking-tight">
            {currentSearch ? (
              <>Kết quả tìm kiếm: <span className="text-amber-800">"{currentSearch}"</span></>
            ) : currentSort === 'discount' || currentCategory === 'khuyen-mai' ? (
              <>Sản phẩm <span className="text-amber-800">Giảm giá Đặc biệt</span></>
            ) : activeCategoryObj && activeCategoryObj.id ? (
              <>{activeCategoryObj.name}</>
            ) : (
              'Tất Cả Sản Phẩm Nội Thất'
            )}
          </h1>
        </div>

        {/* 2-COLUMN E-COMMERCE LAYOUT */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* LEFT SIDEBAR FILTER (Desktop: Visible | Mobile: Modal/Drawer toggle) */}
          <aside className={`w-full lg:w-64 xl:w-72 shrink-0 ${showMobileFilter ? 'block' : 'hidden lg:block'}`}>
            <ProductFilters
              categories={categories}
              currentCategory={currentCategory}
              onCategorySelect={handleCategorySelect}
            />
          </aside>

          {/* RIGHT MAIN CONTENT AREA */}
          <div className="flex-1 w-full min-w-0">

            {/* TOP BAR: Product count, Mobile Filter Button, Sort Dropdown */}
            <div className="bg-white p-4 border border-stone-200/80 shadow-2xs mb-6 flex flex-wrap items-center justify-between gap-4">
              
              {/* Product Count & Mobile Toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowMobileFilter(!showMobileFilter)}
                  className="lg:hidden px-3 py-1.5 bg-stone-800 text-white text-xs font-medium flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span>{showMobileFilter ? 'Ẩn bộ lọc' : 'Bộ lọc & Danh mục'}</span>
                </button>

                <span className="text-xs text-stone-600 font-sans">
                  Hiển thị <span className="font-bold text-amber-800">{pagination.total_items || products.length}</span> sản phẩm
                </span>
              </div>

              {/* Sort Selector Dropdown */}
              <div className="flex items-center gap-2 shrink-0">
                <label htmlFor="sort_select" className="text-xs font-semibold text-stone-600 uppercase tracking-wider">
                  Sắp xếp:
                </label>
                <select
                  id="sort_select"
                  value={currentSort}
                  onChange={handleSortChange}
                  className="px-3 py-1.5 bg-stone-50 text-xs font-medium text-stone-800 rounded-none border border-stone-200 focus:outline-none focus:border-amber-800 cursor-pointer"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {/* Product Grid Area */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-none p-4 border border-stone-200/80 animate-pulse h-80">
                    <div className="bg-stone-200 h-48 mb-4" />
                    <div className="bg-stone-200 h-4 w-3/4 mb-2" />
                    <div className="bg-stone-200 h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              /* Product Grid: 3 columns on desktop, 2 on tablet, 1 on mobile */
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="bg-white rounded-none p-12 text-center border border-stone-200 shadow-2xs max-w-lg mx-auto my-8">
                <div className="w-16 h-16 bg-amber-50 text-amber-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-heading font-bold text-stone-900 mb-1">
                  Không tìm thấy sản phẩm nào
                </h3>
                <p className="text-xs text-stone-500 mb-6">
                  {currentSearch
                    ? `Không có sản phẩm nào khớp với từ khóa "${currentSearch}".`
                    : 'Chưa có sản phẩm nào phù hợp với bộ lọc hiện tại.'}
                </p>
                <button
                  type="button"
                  onClick={() => handleCategorySelect('')}
                  className="px-5 py-2.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold uppercase tracking-wider transition-colors"
                >
                  Xem tất cả sản phẩm
                </button>
              </div>
            )}

          </div>

        </div>

      </main>

      <Footer />
    </div>
  )
}

export default ProductListPage

