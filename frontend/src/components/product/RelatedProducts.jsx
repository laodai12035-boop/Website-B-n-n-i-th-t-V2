import { useState, useEffect } from 'react'
import ProductCard from '@/components/product/ProductCard'
import productService from '@/services/productService'

/**
 * RelatedProducts — Khối gợi ý sản phẩm cùng danh mục/mua kèm (Tối giản với ProductCard isCompact).
 */
const RelatedProducts = ({ productId }) => {
  const [relatedProducts, setRelatedProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRelated = async () => {
      if (!productId) return
      setLoading(true)
      try {
        const data = await productService.getRelatedProducts(productId, 4)
        setRelatedProducts(data || [])
      } catch (err) {
        console.error('Error fetching related products:', err)
        setRelatedProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchRelated()
  }, [productId])

  if (loading) {
    return (
      <div className="mt-12 animate-pulse">
        <div className="h-6 bg-stone-200 rounded-none w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[4/5] bg-stone-200 rounded-none"></div>
          ))}
        </div>
      </div>
    )
  }

  if (relatedProducts.length === 0) return null

  return (
    <section className="mt-12 pt-8 border-t border-stone-200/80">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-heading font-bold text-stone-900 uppercase tracking-wider">
            SẢN PHẨM LIÊN QUAN & GỢI Ý MUA KÈM
          </h2>
          <p className="text-xs text-stone-500 mt-1">Các sản phẩm cùng phong cách thiết kế nội thất bạn có thể thích</p>
        </div>
      </div>

      {/* Grid Display (Card dạng Compact tối giản) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {relatedProducts.map((prod) => (
          <ProductCard key={prod.id} product={prod} isCompact={true} />
        ))}
      </div>
    </section>
  )
}

export default RelatedProducts
