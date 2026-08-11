import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import ProductCard from '@/components/product/ProductCard'
import SearchBar from '@/components/product/SearchBar'
import ProductFilters from '@/components/product/ProductFilters'
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 animate-fade-in">

        {/* Page Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">
              {currentSearch ? (
                <>Kết quả tìm kiếm cho: <span className="text-primary-600 font-extrabold">"{currentSearch}"</span></>
              ) : currentCategory ? (
                <>Danh mục: <span className="text-primary-600 font-extrabold">{activeCategoryObj?.name || currentCategory}</span></>
              ) : (
                'Danh sách Sản phẩm Nội thất'
              )}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Khám phá các sản phẩm nội thất cao cấp cho không gian sống của bạn
            </p>
          </div>

          <div className="w-full md:w-80">
            <SearchBar />
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-3 mb-4 scrollbar-none">
          {categories.map((cat) => {
            const isActive = currentCategory === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span>{cat.name}</span>
                {cat.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                      isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse h-72">
                <div className="bg-gray-200 h-40 rounded-xl mb-4" />
                <div className="bg-gray-200 h-4 w-3/4 rounded mb-2" />
                <div className="bg-gray-200 h-4 w-1/2 rounded" />
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          /* Product Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
    </div>
  )
}

export default ProductListPage
