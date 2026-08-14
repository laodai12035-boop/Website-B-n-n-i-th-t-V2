import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/layout/Navbar'
import returnService from '@/services/returnService'
import OrderDetailModal from '@/components/order/OrderDetailModal'

/**
 * AdminReturnsPage — Trang Quản lý & Xử lý Yêu cầu Đổi/Trả/Bảo hành dành riêng cho Admin (NT-06-CN-004, QTN-05).
 * Tuyến đường: /admin/returns
 */
const AdminReturnsPage = () => {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('pending')
  const [searchQuery, setSearchQuery] = useState('')

  // Modal xử lý duyệt / từ chối
  const [selectedReq, setSelectedReq] = useState(null)
  const [actionType, setActionType] = useState('approve') // 'approve' | 'reject'
  const [adminNote, setAdminNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Modal xem đơn hàng gốc
  const [selectedOrderId, setSelectedOrderId] = useState(null)

  // Preview ảnh minh chứng
  const [previewImage, setPreviewImage] = useState(null)

  const fetchReturnRequests = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await returnService.getAllReturnRequestsForAdmin()
      setRequests(data || [])
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể nạp danh sách yêu cầu đổi/trả.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReturnRequests()
  }, [])

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)
  }

  const formatDate = (isoStr) => {
    if (!isoStr) return ''
    const str = (typeof isoStr === 'string' && !isoStr.endsWith('Z') && !isoStr.includes('+'))
      ? isoStr + 'Z'
      : isoStr
    return new Date(str).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Lọc theo tab & ô tìm kiếm
  const filteredRequests = requests.filter((req) => {
    const matchesTab = activeTab === 'all' || req.status === activeTab
    const q = searchQuery.toLowerCase().trim()
    const matchesQuery = !q || (
      (req.order?.order_code && req.order.order_code.toLowerCase().includes(q)) ||
      (req.user?.full_name && req.user.full_name.toLowerCase().includes(q)) ||
      (req.reason && req.reason.toLowerCase().includes(q))
    )
    return matchesTab && matchesQuery
  })

  // Thống kê nhanh
  const summary = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  }

  const handleOpenActionModal = (req, type) => {
    setSelectedReq(req)
    setActionType(type)
    setAdminNote(type === 'approve' ? 'Đã đồng ý xử lý yêu cầu đổi/trả hàng.' : 'Từ chối yêu cầu do không đủ điều kiện quy định.')
    setModalError('')
  }

  const handleConfirmAction = async (e) => {
    e.preventDefault()
    if (!selectedReq) return
    setSubmitting(true)
    setModalError('')

    const newStatus = actionType === 'approve' ? 'approved' : 'rejected'

    try {
      await returnService.updateReturnRequestStatus(selectedReq.id, {
        status: newStatus,
        admin_note: adminNote.trim(),
      })

      setSuccessMsg(`Đã ${actionType === 'approve' ? 'DUYỆT' : 'TỪ CHỐI'} yêu cầu đổi/trả đơn hàng thành công!`)
      setSelectedReq(null)
      fetchReturnRequests()
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err) {
      setModalError(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật yêu cầu.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        
        {/* Header Breadcrumb */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-1">
              <Link to="/admin" className="hover:text-amber-600 transition-colors">Admin Dashboard</Link>
              <span>/</span>
              <span className="text-gray-900 font-bold">Xử lý Đổi / Trả hàng</span>
            </div>
            <h1 className="text-2xl font-display font-extrabold text-gray-900 flex items-center gap-2">
              <span>🔄</span> Quản lý Yêu cầu Đổi / Trả Hàng (Admin)
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/orders"
              className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-2xl text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5"
            >
              🛒 Quản lý Đơn hàng
            </Link>
            <Link
              to="/admin"
              className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5"
            >
              ← Về Dashboard
            </Link>
          </div>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center gap-2 animate-fade-in shadow-xs">
            <span>✅</span> {successMsg}
          </div>
        )}

        {/* Summary Counter Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div
            onClick={() => setActiveTab('pending')}
            className={`p-4.5 rounded-3xl border cursor-pointer transition-all ${
              activeTab === 'pending'
                ? 'bg-amber-500 text-white border-amber-500 shadow-md scale-102'
                : 'bg-white text-amber-900 border-amber-100 hover:border-amber-200 shadow-2xs'
            }`}
          >
            <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">⏳ Chờ Admin duyệt</div>
            <div className="text-2xl font-black mt-1">{summary.pending}</div>
          </div>

          <div
            onClick={() => setActiveTab('approved')}
            className={`p-4.5 rounded-3xl border cursor-pointer transition-all ${
              activeTab === 'approved'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-102'
                : 'bg-white text-emerald-900 border-emerald-100 hover:border-emerald-200 shadow-2xs'
            }`}
          >
            <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">✅ Đã chấp nhận</div>
            <div className="text-2xl font-black mt-1">{summary.approved}</div>
          </div>

          <div
            onClick={() => setActiveTab('rejected')}
            className={`p-4.5 rounded-3xl border cursor-pointer transition-all ${
              activeTab === 'rejected'
                ? 'bg-red-600 text-white border-red-600 shadow-md scale-102'
                : 'bg-white text-red-900 border-red-100 hover:border-red-200 shadow-2xs'
            }`}
          >
            <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">❌ Đã từ chối</div>
            <div className="text-2xl font-black mt-1">{summary.rejected}</div>
          </div>

          <div
            onClick={() => setActiveTab('all')}
            className={`p-4.5 rounded-3xl border cursor-pointer transition-all ${
              activeTab === 'all'
                ? 'bg-gray-900 text-white border-gray-900 shadow-md scale-102'
                : 'bg-white text-gray-700 border-gray-100 hover:border-gray-200 shadow-2xs'
            }`}
          >
            <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">📋 Tất cả yêu cầu</div>
            <div className="text-2xl font-black mt-1">{summary.total}</div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-2xs mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-2xl border border-gray-100 w-full sm:w-auto">
            {[
              { key: 'pending', label: `Chờ duyệt (${summary.pending})` },
              { key: 'approved', label: `Đã duyệt (${summary.approved})` },
              { key: 'rejected', label: `Từ chối (${summary.rejected})` },
              { key: 'all', label: `Tất cả (${summary.total})` },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.key
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Tìm theo Mã đơn, Khách hàng, Lý do..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-2xl focus:outline-none focus:border-amber-500 bg-gray-50/50"
            />
          </div>
        </div>

        {/* Main Content Table */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-gray-400 text-xs space-y-3">
              <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="font-semibold">Đang tải danh sách yêu cầu đổi/trả hàng...</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-red-600 text-xs font-bold">{error}</div>
          ) : filteredRequests.length === 0 ? (
            <div className="py-16 text-center text-gray-400 space-y-2">
              <span className="text-4xl block">📭</span>
              <p className="text-sm font-bold text-gray-700">Không có yêu cầu đổi/trả nào</p>
              <p className="text-xs text-gray-400">Không tìm thấy yêu cầu phù hợp với bộ lọc hiện tại</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50/80 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="py-3.5 px-4">Mã Đơn Hàng</th>
                    <th className="py-3.5 px-4">Khách Hàng</th>
                    <th className="py-3.5 px-4">Loại Yêu Cầu</th>
                    <th className="py-3.5 px-4">Lý Do & Minh Chứng</th>
                    <th className="py-3.5 px-4">Ngày Gửi</th>
                    <th className="py-3.5 px-4">Trạng Thái</th>
                    <th className="py-3.5 px-4 text-center">Thao Tác Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Order Code */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => setSelectedOrderId(req.order_id)}
                          className="font-bold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer flex items-center gap-1 font-mono"
                        >
                          <span>📦</span> #{req.order?.order_code || req.order_id}
                        </button>
                        {req.order?.total_amount && (
                          <div className="text-[10px] text-gray-400 font-bold mt-0.5">
                            {formatCurrency(req.order.total_amount)}
                          </div>
                        )}
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900">{req.user?.full_name || 'Khách hàng'}</div>
                        <div className="text-[11px] text-gray-400">{req.user?.email}</div>
                      </td>

                      {/* Request Type */}
                      <td className="py-3.5 px-4">
                        {req.request_type === 'return' ? (
                          <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-bold text-[11px]">
                            📦 Trả hàng & Hoàn tiền
                          </span>
                        ) : req.request_type === 'exchange' ? (
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl font-bold text-[11px]">
                            🔄 Đổi sản phẩm
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl font-bold text-[11px]">
                            🛡️ Bảo hành
                          </span>
                        )}
                      </td>

                      {/* Reason & Proof Image */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-gray-800 line-clamp-2 italic font-medium">"{req.reason}"</p>
                        {req.proof_image_url && (
                          <button
                            onClick={() => setPreviewImage(req.proof_image_url)}
                            className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:underline"
                          >
                            <span>🖼️ Xem minh chứng</span>
                          </button>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-gray-500 font-medium">
                        {formatDate(req.created_at)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {req.status === 'pending' ? (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-bold text-[11px] inline-flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> Chờ Admin duyệt
                          </span>
                        ) : req.status === 'approved' ? (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-bold text-[11px] inline-flex items-center gap-1">
                            <span>✅</span> Đã chấp nhận
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-red-50 text-red-800 border border-red-200 rounded-full font-bold text-[11px] inline-flex items-center gap-1">
                            <span>❌</span> Đã từ chối
                          </span>
                        )}
                        {req.admin_note && (
                          <div className="text-[10px] text-gray-500 italic mt-1 max-w-[150px] truncate" title={req.admin_note}>
                            Ghi chú: {req.admin_note}
                          </div>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {req.status === 'pending' ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenActionModal(req, 'approve')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-2xs flex items-center gap-1"
                            >
                              <span>✅</span> Duyệt
                            </button>
                            <button
                              onClick={() => handleOpenActionModal(req, 'reject')}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors shadow-2xs flex items-center gap-1"
                            >
                              <span>❌</span> Từ chối
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400 font-semibold italic">Đã xử lý</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal Duyệt / Từ Chối Yêu Cầu Đổi Trả */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-display font-extrabold text-gray-900 flex items-center gap-2">
                <span>{actionType === 'approve' ? '✅ Duyệt Yêu Cầu Đổi/Trả' : '❌ Từ Chối Yêu Cầu Đổi/Trả'}</span>
              </h3>
              <button
                onClick={() => setSelectedReq(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-gray-50 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Mã đơn hàng:</span>
                <span className="font-bold text-gray-900">#{selectedReq.order?.order_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Khách hàng:</span>
                <span className="font-bold text-gray-900">{selectedReq.user?.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Loại yêu cầu:</span>
                <span className="font-bold text-amber-800">
                  {selectedReq.request_type === 'return' ? 'Trả hàng & Hoàn tiền' : selectedReq.request_type === 'exchange' ? 'Đổi sản phẩm khác' : 'Bảo hành'}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <span className="text-gray-500 block mb-1">Lý do từ khách hàng:</span>
                <p className="text-gray-800 italic font-medium">"{selectedReq.reason}"</p>
              </div>
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl">
                ⚠️ {modalError}
              </div>
            )}

            <form onSubmit={handleConfirmAction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Ghi chú phản hồi của Admin (hiển thị cho khách hàng):
                </label>
                <textarea
                  rows={3}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Ghi chú kết quả xử lý..."
                  className="w-full p-3 text-xs border border-gray-200 rounded-2xl focus:outline-none focus:border-amber-500"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReq(null)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl text-xs font-bold transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 py-2.5 text-white rounded-2xl text-xs font-bold transition-colors shadow-sm ${
                    actionType === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {submitting ? 'Đang xử lý...' : actionType === 'approve' ? 'Xác nhận Duyệt 🚀' : 'Xác nhận Từ Chối'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Preview Ảnh Minh Chứng */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fade-in" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-2xl max-h-[85vh] bg-white p-2 rounded-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <img src={previewImage} alt="Proof" className="max-w-full max-h-[75vh] object-contain rounded-2xl mx-auto" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 w-9 h-9 bg-black/60 text-white rounded-full flex items-center justify-center font-bold text-sm hover:bg-black"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Modal Xem chi tiết đơn hàng */}
      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          isOpen={!!selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  )
}

export default AdminReturnsPage
