import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import { useAddress } from '@/contexts/AddressContext'
import AddAddressModal from '@/components/address/AddAddressModal'

/**
 * AddressListPage — Trang Quản lý Sổ địa chỉ giao hàng của người dùng (NT-07).
 * Tuyến đường: /profile/addresses
 */
const AddressListPage = () => {
  const { addresses, loading, error, fetchAddresses } = useAddress()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

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
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold transition-colors shadow-xs flex items-center gap-2"
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
                className="mt-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold transition-colors shadow-xs inline-block"
              >
                + Thêm địa chỉ ngay
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((item) => (
                <div
                  key={item.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    item.is_default
                      ? 'border-amber-500 bg-amber-50/20 shadow-xs'
                      : 'border-gray-100 bg-white hover:border-gray-200 shadow-2xs'
                  }`}
                >
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

                  <div className="space-y-1 text-xs text-gray-600">
                    <p className="font-semibold text-gray-800">📞 {item.phone}</p>
                    <p className="leading-relaxed">
                      🏠 {item.detail_address}, {item.ward}, {item.district}, {item.province}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal Thêm địa chỉ */}
      <AddAddressModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => fetchAddresses()}
      />
    </div>
  )
}

export default AddressListPage
