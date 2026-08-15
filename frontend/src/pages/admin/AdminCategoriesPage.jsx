import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AddCategoryModal from '@/components/admin/AddCategoryModal'
import EditCategoryModal from '@/components/admin/EditCategoryModal'
import categoryService from '@/services/categoryService'
import FormAlert from '@/components/ui/FormAlert'

/**
 * AdminCategoriesPage — Trang Quản lý Danh mục Sản phẩm dành cho Admin (nhaxinh.com style).
 * Góc cạnh vuông vức (rounded-none), KHÔNG SỬ DỤNG ICON.
 */
const AdminCategoriesPage = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editCategoryItem, setEditCategoryItem] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const fetchCategories = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await categoryService.getAllCategories()
      setCategories(data || [])
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Không thể nạp danh sách danh mục.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError(null)

    try {
      await categoryService.deleteCategory(deleteTarget.id)
      setDeleteTarget(null)
      fetchCategories()
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Không thể xóa danh mục.'
      setDeleteError(msg)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      
      {/* Header */}
      <div className="bg-white rounded-none border border-stone-200/80 p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest bg-amber-100 px-2.5 py-0.5 rounded-none border border-amber-200 inline-block mb-1">
            Phân hệ Quản trị
          </span>
          <h1 className="text-2xl font-heading font-bold text-stone-900 uppercase tracking-wider">
            QUẢN LÝ DANH MỤC SẢN PHẨM ({categories.length})
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Quản lý các danh mục phân loại đồ nội thất (Sofa, Bàn ăn, Tủ kệ, Đèn trang trí...)
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-3 bg-stone-900 hover:bg-amber-800 text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs cursor-pointer shrink-0"
        >
          + THÊM DANH MỤC MỚI
        </button>
      </div>

      {/* Alert Error */}
      {error && <FormAlert type="error" message={error} />}

      {/* Categories Grid */}
      <div className="bg-white rounded-none border border-stone-200/80 p-6 shadow-2xs">
        {loading ? (
          <div className="py-16 text-center text-stone-400 text-xs space-y-3">
            <div className="w-8 h-8 border-2 border-amber-800 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="font-semibold">Đang nạp danh sách danh mục...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="py-16 text-center text-stone-400 text-xs space-y-3">
            <p className="font-heading font-bold text-stone-900 text-base uppercase tracking-wider">Chưa có danh mục nào</p>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-6 py-3 bg-stone-900 hover:bg-amber-800 text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              + Thêm danh mục ngay
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-none border border-stone-200/80 bg-white hover:border-amber-800/60 shadow-2xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest bg-stone-100 px-2 py-0.5 border border-stone-200 font-mono">
                      ID: #{item.id}
                    </span>
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-900 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider rounded-none">
                      HOẠT ĐỘNG
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-base text-stone-900 uppercase tracking-wider mb-1">
                    {item.name}
                  </h3>
                  <p className="text-xs text-stone-400 font-mono mb-2">slug: {item.slug}</p>
                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                    {item.description || 'Chưa có mô tả chi tiết'}
                  </p>
                </div>

                {/* Actions Footer */}
                <div className="mt-4 pt-3 border-t border-stone-200/80 flex items-center justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setEditCategoryItem(item)}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-900 rounded-none font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError(null)
                      setDeleteTarget(item)
                    }}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-none font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Thêm danh mục mới */}
      <AddCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => fetchCategories()}
      />

      {/* Modal Sửa danh mục */}
      <EditCategoryModal
        isOpen={!!editCategoryItem}
        categoryItem={editCategoryItem}
        onClose={() => setEditCategoryItem(null)}
        onSuccess={() => fetchCategories()}
      />

      {/* Confirmation Dialog Xóa */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="relative w-full max-w-sm bg-white rounded-none p-6 shadow-2xl border border-stone-200/80 text-center space-y-4">
            <h3 className="text-base font-heading font-bold text-stone-900 uppercase tracking-wider">Xác nhận xóa danh mục</h3>
            <p className="text-xs text-stone-500">
              Bạn có chắc chắn muốn xóa danh mục <span className="font-bold text-stone-900">"{deleteTarget.name}"</span> không? Thao tác này không thể hoàn tác.
            </p>

            {deleteError && <FormAlert type="error" message={deleteError} />}

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteConfirm}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                {deleting ? 'Đang xóa...' : 'Đồng ý xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminCategoriesPage
