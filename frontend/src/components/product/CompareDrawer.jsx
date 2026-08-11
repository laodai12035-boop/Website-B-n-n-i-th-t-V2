import { Link } from 'react-router-dom'
import { useCompare } from '@/contexts/CompareContext'

/**
 * CompareDrawer — Thanh tác vụ So sánh sản phẩm nổi ở đáy màn hình.
 */
const CompareDrawer = () => {
  const { compareItems, removeFromCompare, clearCompare } = useCompare()

  if (compareItems.length === 0) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-2xl w-[92%] bg-gray-900/95 backdrop-blur-md text-white rounded-3xl p-3.5 sm:p-4 shadow-2xl border border-gray-700/50 animate-slide-up">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">

        {/* Selected Products Thumbnails */}
        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <div className="shrink-0 text-left">
            <span className="text-xs font-bold text-amber-400 block uppercase tracking-wider">
              So sánh sản phẩm
            </span>
            <span className="text-[11px] text-gray-300">
              Đã chọn <strong className="text-white">{compareItems.length}/3</strong> sản phẩm
            </span>
          </div>

          <div className="flex items-center gap-2">
            {compareItems.map((item) => (
              <div
                key={item.id}
                className="relative group w-11 h-11 rounded-xl bg-gray-800 border border-gray-700 overflow-hidden shrink-0"
              >
                <img
                  src={item.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc'}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeFromCompare(item.id)}
                  className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 opacity-90 group-hover:opacity-100 transition-opacity"
                  title="Bỏ khỏi danh sách"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={clearCompare}
            className="text-xs text-gray-400 hover:text-white px-2 py-1.5 transition-colors"
          >
            Xóa hết
          </button>

          <Link
            to="/compare"
            className={`btn-primary text-xs px-4 py-2 rounded-xl whitespace-nowrap ${
              compareItems.length < 2 ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            So sánh ngay ({compareItems.length})
          </Link>
        </div>

      </div>
    </div>
  )
}

export default CompareDrawer
