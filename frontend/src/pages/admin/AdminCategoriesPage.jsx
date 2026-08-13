import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import AdminQuickSearch from '@/components/admin/AdminQuickSearch'
import AddCategoryModal from '@/components/admin/AddCategoryModal'
import EditCategoryModal from '@/components/admin/EditCategoryModal'
import categoryService from '@/services/categoryService'
import FormAlert from '@/components/ui/FormAlert'

/**
 * AdminCategoriesPage — Trang Quản lý Danh mục Sản phẩm dành cho Admin (NT-08-CN-001, NT-08-CN-002).
 * Tuyến đường: /admin/categories
 */
const AdminCategoriesPage = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editCategoryItem, setEditCategoryItem] = useState(null)
  
  // Confirmation delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const fetchCategories = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await categoryService.getCategories()
      setCategories(data)
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể nạp danh sách danh mục.'
      setError(msg)
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
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 animate-fade-in">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-1">
              <Link to="/admin" className="hover:text-amber-600 transition-colors">Quản trị</Link>
              <span>/</span>
              <span className="text-gray-900 font-bold">Danh mục sản phẩm</span>
            </div>
            <h1 className="text-2xl font-display font-extrabold text-gray-900 flex items-center gap-2">
              <span>📂</span> Quản lý Danh mục ({categories.length})
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <AdminQuickSearch />
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold transition-colors shadow-xs flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <span>+</span> Thêm danh mục mới
            </button>
          </div>
        </div>

        {/* Alert Error chung */}
        {error && (
          <div className="mb-4">
            <FormAlert type="error" message={error} />
          </div>
        )}

        {/* Categories Table / Cards */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs">
          {loading ? (
            <div className="py-16 text-center text-gray-400 text-xs space-y-3">
              <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="font-semibold">Đang nạp danh sách danh mục...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-xs space-y-3">
              <div className="text-4xl">📂</div>
              <p className="font-bold text-gray-700 text-sm">Chưa có danh mục nào</p>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="mt-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold transition-colors shadow-xs inline-block cursor-pointer"
              >
                + Thêm danh mục ngay
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {categories.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl border border-gray-100 hover:border-amber-300 bg-white hover:shadow-md transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="w-10 h-10 rounded-2xl bg-amber-50 text-2xl flex items-center justify-center border border-amber-100 group-hover:scale-110 transition-transform">
                        {item.icon || '📁'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold uppercase">
                          Hoạt động
                        </span>
                      </div>
                    </div>

                    <h3 className="font-extrabold text-base text-gray-900 group-hover:text-amber-800 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-xs text-gray-400 font-mono mb-2">slug: {item.slug}</p>
                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                      {item.description || 'Chưa có mô tả'}
                    </p>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-medium">ID: #{item.id}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditCategoryItem(item)}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>✏️</span> Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError(null)
                          setDeleteTarget(item)
                        }}
                        className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>🗑️</span> Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

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

      {/* Hộp thoại xác nhận Xóa danh mục */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden p-6 text-center animate-slide-up space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-2xl mx-auto">
              ⚠️
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900">Xác nhận xóa danh mục?</h3>
              <p className="text-xs text-gray-500 mt-1">
                Bạn có chắc chắn muốn xóa danh mục <span className="font-bold text-gray-900">"{deleteTarget.name}"</span> không?
              </p>
            </div>

            {deleteError && <FormAlert type="error" message={deleteError} />}

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteConfirm}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {deleting ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminCategoriesPage
