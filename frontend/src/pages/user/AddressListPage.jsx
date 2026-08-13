import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import { useAddress } from '@/contexts/AddressContext'
import AddAddressModal from '@/components/address/AddAddressModal'
import EditAddressModal from '@/components/address/EditAddressModal'

/**
 * AddressListPage — Trang Quản lý Sổ địa chỉ giao hàng của người dùng (NT-07).
 * Tuyến đường: /profile/addresses
 */
const AddressListPage = () => {
  const { addresses, loading, error, fetchAddresses, removeAddress } = useAddress()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
  const [deletingAddressId, setDeletingAddressId] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const handleDeleteConfirm = async () => {
    if (!deletingAddressId) return
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await removeAddress(deletingAddressId)
      setDeletingAddressId(null)
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể xóa địa chỉ giao hàng này.'
      setDeleteError(msg)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        
        {/* Breadcrumb Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-1">
              <Link to="/profile" className="hover:text-amber-600 transition-colors">Tài khoản</Link>
              <span>/</span>
              <span className="text-gray-900 font-bold">Sổ địa chỉ</span>
            </div>
            <h1 className="text-2xl font-display font-extrabold text-gray-900 flex items-center gap-2">
              <span>📍</span> Địa chỉ giao hàng ({addresses.length}/10)
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <span>+</span> Thêm địa chỉ mới
          </button>
        </div>

        {/* Address Cards List */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs">
          {loading ? (
            <div className="py-16 text-center text-gray-400 text-xs space-y-3">
              <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="font-semibold">Đang nạp sổ địa chỉ...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-600 text-xs font-semibold">
              ⚠️ {error}
            </div>
          ) : addresses.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-xs space-y-3">
              <div className="text-4xl">🏡</div>
              <p className="font-bold text-gray-700 text-sm">Bạn chưa có địa chỉ giao hàng nào</p>
              <p className="text-gray-500">Hãy thêm địa chỉ giao hàng để thuận tiện khi đặt đơn nội thất</p>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="mt-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold transition-colors shadow-xs inline-block cursor-pointer"
              >
                + Thêm địa chỉ ngay
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((item) => (
                <div
                  key={item.id}
                  className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                    item.is_default
                      ? 'border-amber-500 bg-amber-50/20 shadow-xs ring-1 ring-amber-400/30'
                      : 'border-gray-100 bg-white hover:border-gray-200 shadow-2xs'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <span className="font-extrabold text-sm text-gray-900">{item.recipient_name}</span>
                        {item.is_default && (
                          <span className="ml-2 px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                            Mặc định
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-gray-600 mb-4">
                      <p className="font-semibold text-gray-800">📞 {item.phone}</p>
                      <p className="leading-relaxed">
                        🏠 {item.detail_address}, {item.ward}, {item.district}, {item.province}
                      </p>
                    </div>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="pt-3 border-t border-gray-100/80 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingAddress(item)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-amber-50 hover:text-amber-800 text-gray-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>✏️</span> Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingAddressId(item.id)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-700 text-gray-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>🗑️</span> Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal Thêm địa chỉ mới */}
      <AddAddressModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => fetchAddresses()}
      />

      {/* Modal Sửa địa chỉ */}
      <EditAddressModal
        isOpen={Boolean(editingAddress)}
        addressItem={editingAddress}
        onClose={() => setEditingAddress(null)}
        onSuccess={() => fetchAddresses()}
      />

      {/* Confirmation Dialog Xóa Địa Chỉ */}
      {deletingAddressId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 text-center animate-slide-up space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center text-2xl mx-auto">
              🗑️
            </div>
            <h3 className="text-base font-display font-bold text-gray-900">Xác nhận xóa địa chỉ</h3>
            <p className="text-xs text-gray-500">
              Bạn có chắc chắn muốn xóa địa chỉ này khỏi Sổ địa chỉ không? Thao tác này không thể hoàn tác.
            </p>
            {deleteError && (
              <p className="text-xs text-red-600 font-semibold bg-red-50 p-2.5 rounded-xl">
                ⚠️ {deleteError}
              </p>
            )}
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingAddressId(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'Đang xóa...' : 'Đồng ý xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AddressListPage
