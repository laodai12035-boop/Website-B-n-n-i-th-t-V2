import React, { useState, useEffect } from 'react'
import stockService from '@/services/stockService'
import productService from '@/services/productService'
import FormAlert from '@/components/ui/FormAlert'

const ImportStockModal = ({ isOpen, onClose, onSuccess, initialProduct = null }) => {
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  const [formData, setFormData] = useState({
    product_id: '',
    quantity: 50,
    import_date: new Date().toISOString().slice(0, 16),
    supplier: '',
    unit_cost: '',
    note: '',
  })

  const [selectedProduct, setSelectedProduct] = useState(null)
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setLoadingProducts(true)
      productService
        .getAdminProducts({ limit: 100 })
        .then((res) => {
          const list = res.items || []
          setProducts(list)
          if (initialProduct) {
            const found = list.find((p) => p.id === initialProduct.id) || initialProduct
            setFormData((prev) => ({ ...prev, product_id: found.id }))
            setSelectedProduct(found)
          } else if (list.length > 0) {
            setFormData((prev) => ({ ...prev, product_id: list[0].id }))
            setSelectedProduct(list[0])
          }
        })
        .catch(() => {})
        .finally(() => setLoadingProducts(false))
    }
  }, [isOpen, initialProduct])

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    if (name === 'product_id') {
      const p = products.find((prod) => prod.id === Number(value))
      setSelectedProduct(p || null)
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const validate = () => {
    const errs = {}
    if (!formData.product_id) {
      errs.product_id = 'Vui lòng chọn sản phẩm cần nhập kho'
    }

    const qty = parseInt(formData.quantity, 10)
    if (isNaN(qty) || qty <= 0) {
      errs.quantity = 'Số lượng nhập kho phải là số nguyên lớn hơn 0'
    }

    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError(null)

    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        product_id: Number(formData.product_id),
        quantity: parseInt(formData.quantity, 10),
        import_date: formData.import_date ? new Date(formData.import_date).toISOString() : null,
        supplier: formData.supplier.trim() || null,
        unit_cost: formData.unit_cost !== '' ? parseFloat(formData.unit_cost) : null,
        note: formData.note.trim() || null,
      }

      await stockService.importStock(payload)
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Không thể lưu phiếu nhập kho.'
      setApiError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const currentStock = selectedProduct ? selectedProduct.stock || 0 : 0
  const importQty = parseInt(formData.quantity, 10) || 0
  const expectedStock = currentStock + (importQty > 0 ? importQty : 0)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-display font-bold text-gray-900 flex items-center gap-2">
            <span>📦</span> Lập phiếu nhập kho sản phẩm (NT-09-CN-001)
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-200/60 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {apiError && <FormAlert type="error" message={apiError} />}

          {/* Chọn sản phẩm */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Chọn sản phẩm nhập kho <span className="text-red-500">*</span>
            </label>
            {loadingProducts ? (
              <p className="text-xs text-gray-400 font-medium py-2">Đang nạp danh sách sản phẩm...</p>
            ) : (
              <select
                name="product_id"
                value={formData.product_id}
                onChange={handleChange}
                disabled={!!initialProduct}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
              >
                <option value="">-- Chọn sản phẩm --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Tồn hiện tại: {p.stock || 0})
                  </option>
                ))}
              </select>
            )}
            {errors.product_id && <p className="text-[11px] text-red-500 font-medium mt-1">{errors.product_id}</p>}
          </div>

          {/* Card preview tồn kho */}
          {selectedProduct && (
            <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-100 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <img
                  src={selectedProduct.image_url || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc'}
                  alt={selectedProduct.name}
                  className="w-10 h-10 rounded-xl object-cover border border-amber-200"
                />
                <div>
                  <p className="font-extrabold text-gray-900">{selectedProduct.name}</p>
                  <p className="text-[11px] text-gray-500">Tồn hiện tại: <span className="font-bold text-gray-800">{currentStock}</span></p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-amber-800 font-extrabold uppercase block">Tồn kho sau nhập:</span>
                <span className="text-base font-extrabold text-emerald-700">{expectedStock} sản phẩm</span>
              </div>
            </div>
          )}

          {/* Số lượng & Ngày nhập */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Số lượng nhập kho <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="quantity"
                min="1"
                step="1"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="VD: 50"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-extrabold text-amber-800 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
              />
              {errors.quantity && <p className="text-[11px] text-red-500 font-medium mt-1">{errors.quantity}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Ngày giờ nhập kho
              </label>
              <input
                type="datetime-local"
                name="import_date"
                value={formData.import_date}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Nhà cung cấp & Giá nhập đơn vị */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Nhà cung cấp / Xưởng sản xuất
              </label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                placeholder="VD: Xưởng Gỗ Nam Định..."
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Giá nhập kho đơn vị (VNĐ)
              </label>
              <input
                type="number"
                name="unit_cost"
                min="0"
                step="1000"
                value={formData.unit_cost}
                onChange={handleChange}
                placeholder="VD: 1500000"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-white transition-colors font-semibold"
              />
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Ghi chú phiếu nhập kho
            </label>
            <textarea
              name="note"
              rows="2"
              value={formData.note}
              onChange={handleChange}
              placeholder="VD: Nhập bổ sung đợt 1 tháng 8/2026..."
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:bg-white transition-colors resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Đang lưu...' : 'Lưu phiếu nhập kho'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}

export default ImportStockModal
