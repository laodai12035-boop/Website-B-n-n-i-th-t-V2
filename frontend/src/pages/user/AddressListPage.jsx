import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { useAddress } from '@/contexts/AddressContext'
import AddAddressModal from '@/components/address/AddAddressModal'
import EditAddressModal from '@/components/address/EditAddressModal'

/**
 * AddressListPage — Trang Quản lý Sổ địa chỉ giao hàng phong cách Nhà Xinh (nhaxinh.com).
 * Góc cạnh vuông vức (rounded-none), thiết kế card tối giản sắc nét.
 */
const AddressListPage = () => {
  const { addresses, loading, error, fetchAddresses, removeAddress, setAsDefault } = useAddress()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
  const [deletingAddressId, setDeletingAddressId] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const handleSetDefault = async (id) => {
    try {
      await setAsDefault(id)
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể thiết lập địa chỉ mặc định.')
    }
  }

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
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 animate-fade-in">
        
        {/* Breadcrumb Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-stone-200/80 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-stone-500 mb-1">
              <Link to="/profile" className="hover:text-amber-800 transition-colors">Tài khoản</Link>
              <span>/</span>
              <span className="text-stone-900 font-semibold">Sổ địa chỉ</span>
            </div>
            <h1 className="text-2xl font-heading font-bold text-stone-900 uppercase tracking-wider">
              ĐỊA CHỈ GIAO HÀNG ({addresses.length}/10)
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-3 bg-stone-900 hover:bg-amber-800 text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs flex items-center gap-2 cursor-pointer"
          >
            <span>+ THÊM ĐỊA CHỈ MỚI</span>
          </button>
        </div>

        {/* Address Cards List */}
        <div className="bg-white rounded-none border border-stone-200/80 p-6 shadow-2xs">
          {loading ? (
            <div className="py-16 text-center text-stone-400 text-xs space-y-3">
              <div className="w-8 h-8 border-2 border-amber-800 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="font-semibold">Đang nạp sổ địa chỉ...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-600 text-xs font-semibold">
              ⚠️ {error}
            </div>
          ) : addresses.length === 0 ? (
            <div className="py-16 text-center text-stone-400 text-xs space-y-3">
              <div className="w-16 h-16 bg-stone-100 text-stone-400 rounded-none flex items-center justify-center mx-auto mb-2 border border-stone-200">
                <svg className="w-8 h-8 stroke-current" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <p className="font-heading font-bold text-stone-900 text-base uppercase tracking-wider">Bạn chưa có địa chỉ giao hàng nào</p>
              <p className="text-stone-500">Hãy thêm địa chỉ giao hàng để thuận tiện hơn khi đặt mua nội thất.</p>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="mt-2 px-6 py-3 bg-stone-900 hover:bg-amber-800 text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs inline-block cursor-pointer"
              >
                + Thêm địa chỉ ngay
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((item) => (
                <div
                  key={item.id}
                  className={`p-5 rounded-none border flex flex-col justify-between transition-all ${
                    item.is_default
                      ? 'border-2 border-stone-900 bg-stone-50/70 shadow-2xs'
                      : 'border-stone-200/80 bg-white hover:border-stone-400 shadow-2xs'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-stone-900">{item.recipient_name}</span>
                        {item.is_default && (
                          <span className="px-2.5 py-0.5 bg-amber-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-none">
                            Mặc định
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-stone-600 mb-4">
                      <p className="font-semibold text-stone-800">SĐT: {item.phone}</p>
                      <p className="leading-relaxed">
                        Địa chỉ: {item.detail_address}, {item.ward}, {item.district}, {item.province}
                      </p>
                    </div>
                  </div>

                  {/* Actions: Set Default, Edit & Delete */}
                  <div className="pt-3 border-t border-stone-200/80 flex items-center justify-between gap-2">
                    <div>
                      {!item.is_default && (
                        <button
                          type="button"
                          onClick={() => handleSetDefault(item.id)}
                          className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-900 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          ★ Đặt mặc định
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingAddress(item)}
                        className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingAddressId(item.id)}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="relative w-full max-w-sm bg-white rounded-none p-6 shadow-2xl border border-stone-200/80 text-center space-y-4">
            <div className="w-12 h-12 bg-red-50 text-red-600 flex items-center justify-center mx-auto rounded-none border border-red-200">
              <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-base font-heading font-bold text-stone-900 uppercase tracking-wider">Xác nhận xóa địa chỉ</h3>
            <p className="text-xs text-stone-500">
              Bạn có chắc chắn muốn xóa địa chỉ này khỏi Sổ địa chỉ không? Thao tác này không thể hoàn tác.
            </p>
            {deleteError && (
              <p className="text-xs text-red-600 font-semibold bg-red-50 p-2.5 rounded-none border border-red-200">
                ⚠️ {deleteError}
              </p>
            )}
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingAddressId(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
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
