import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import ProductCard from '@/components/product/ProductCard'
import SearchBar from '@/components/product/SearchBar'
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

/**
 * ProductListPage — Trang Danh sách & Tìm kiếm sản phẩm.
 * Hỗ trợ từ khóa `search`, bộ lọc danh mục `category`, khoảng giá `min_price`/`max_price` và `sort`.
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
  }

  // Tên danh mục đang chọn (để hiển thị tiêu đề)
  const activeCategoryObj = categories.find((c) => c.id === currentCategory)

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <Navbar />

      {/* Banner Hero Slider Quảng Cáo tràn viền chuẩn nhaxinh.com */}
      {!currentSearch && !currentCategory && <BannerSlider />}

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 animate-fade-in">
        {/* Page Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-stone-900 tracking-tight">
              {currentSearch ? (
                <>Kết quả tìm kiếm cho: <span className="text-amber-800">"{currentSearch}"</span></>
              ) : currentCategory ? (
                <>Danh mục: <span className="text-amber-800">{activeCategoryObj?.name || currentCategory}</span></>
              ) : (
                'Tuyệt tác Nội Thất Cao Cấp'
              )}
            </h1>
            <p className="text-sm text-stone-500 mt-1.5 font-sans">
              Khám phá các sản phẩm nội thất sang trọng & độc bản cho không gian sống của bạn
            </p>
          </div>

          <div className="w-full md:w-80">
            <SearchBar />
          </div>
        </div>

        {/* Categories Bar (Vuông vức góc cạnh) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          {categories.map((cat) => {
            const isActive = currentCategory === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat.id)}
                className={`px-5 py-2.5 rounded-none text-xs font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-amber-800 text-white shadow-2xs font-semibold'
                    : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200/80'
                }`}
              >
                <span>{cat.name}</span>
                {cat.count !== undefined && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-none font-mono ${
                      isActive ? 'bg-amber-950/40 text-white' : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    {cat.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Price & Sort Filter Bar */}
        <ProductFilters />

        {/* Content Area */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-stone-200/80 animate-pulse h-80">
                <div className="bg-stone-200 h-48 rounded-xl mb-4" />
                <div className="bg-stone-200 h-4 w-3/4 rounded mb-2" />
                <div className="bg-stone-200 h-4 w-1/2 rounded" />
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          /* Product Grid: 375px (1 col), 768px (2 cols), 1024px+ (3-4 cols) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        ) : (
          /* Empty State (TC-02) */
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm max-w-lg mx-auto my-8">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-display font-bold text-gray-900 mb-1">
              Không tìm thấy sản phẩm nào
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {currentSearch
                ? `Không có sản phẩm nào khớp với từ khóa "${currentSearch}".`
                : 'Chưa có sản phẩm nào trong danh mục này.'}
            </p>
            <button
              type="button"
              onClick={() => handleCategorySelect('')}
              className="btn-primary text-sm px-5 py-2.5"
            >
              Xem tất cả sản phẩm
            </button>
          </div>
        )}

      </main>

      <Footer />
    </div>
  )
}

export default ProductListPage
