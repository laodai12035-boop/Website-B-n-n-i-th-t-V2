import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import returnService from '@/services/returnService'
import OrderDetailModal from '@/components/order/OrderDetailModal'

/**
 * AdminReturnsPage — Trang Quản lý & Xử lý Yêu cầu Đổi/Trả/Bảo hành dành cho Admin (nhaxinh.com style).
 * Góc cạnh vuông vức (rounded-none), KHÔNG SỬ DỤNG ICON.
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
  const [actionType, setActionType] = useState('approve')
  const [adminNote, setAdminNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  // Preview ảnh minh chứng
  const [previewImage, setPreviewImage] = useState(null)
  // Modal xem đơn hàng
  const [selectedOrderId, setSelectedOrderId] = useState(null)

  const fetchReturns = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await returnService.getAllReturnRequests()
      setRequests(data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách yêu cầu đổi/trả.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReturns()
  }, [])

  const handleOpenActionModal = (req, type) => {
    setSelectedReq(req)
    setActionType(type)
    setAdminNote(type === 'approve' ? 'Đã duyệt yêu cầu đổi/trả hàng.' : 'Từ chối yêu cầu đổi/trả hàng.')
    setModalError(null)
  }

  const handleConfirmAction = async (e) => {
    e.preventDefault()
    if (!selectedReq) return

    setSubmitting(true)
    setModalError(null)
    const newStatus = actionType === 'approve' ? 'approved' : 'rejected'

    try {
      await returnService.updateReturnStatus(selectedReq.id, newStatus, adminNote)
      setSelectedReq(null)
      setSuccessMsg(`Đã ${actionType === 'approve' ? 'chấp nhận' : 'từ chối'} yêu cầu đổi/trả hàng thành công!`)
      setTimeout(() => setSuccessMsg(null), 4000)
      fetchReturns()
    } catch (err) {
      setModalError(err.response?.data?.message || 'Lỗi khi cập nhật trạng thái yêu cầu.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const str = (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.includes('+'))
      ? dateStr + 'Z'
      : dateStr
    return new Date(str).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const filteredRequests = requests.filter((r) => {
    const matchStatus = activeTab === 'all' || r.status === activeTab
    const q = searchQuery.toLowerCase().trim()
    const matchQuery =
      !q ||
      r.order?.order_code?.toLowerCase().includes(q) ||
      r.user?.full_name?.toLowerCase().includes(q) ||
      r.reason?.toLowerCase().includes(q)
    return matchStatus && matchQuery
  })

  const summary = {
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
    total: requests.length,
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
            QUẢN LÝ YÊU CẦU ĐỔI / TRẢ HÀNG
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Duyệt hoặc từ chối các yêu cầu đổi trả sản phẩm, hoàn tiền và bảo hành từ phía khách hàng
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/orders"
            className="px-4 py-2.5 bg-stone-900 hover:bg-amber-800 text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs cursor-pointer"
          >
            QUẢN LÝ ĐƠN HÀNG
          </Link>
        </div>
      </div>

      {/* Success Alert */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-none text-xs text-emerald-900 font-bold animate-fade-in shadow-2xs">
          ✅ {successMsg}
        </div>
      )}

      {/* Summary Counter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: 'pending', label: 'CHỜ ADMIN DUYỆT', count: summary.pending },
          { key: 'approved', label: 'ĐÃ CHẤP NHẬN', count: summary.approved },
          { key: 'rejected', label: 'ĐÃ TỪ CHỐI', count: summary.rejected },
          { key: 'all', label: 'TẤT CẢ YÊU CẦU', count: summary.total },
        ].map((item) => (
          <div
            key={item.key}
            onClick={() => setActiveTab(item.key)}
            className={`p-4 rounded-none border cursor-pointer transition-all ${
              activeTab === item.key
                ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                : 'bg-white text-stone-700 border-stone-200/80 hover:border-stone-400 shadow-2xs'
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-widest opacity-75">{item.label}</div>
            <div className="text-xl font-bold font-mono mt-1">{item.count}</div>
          </div>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-none border border-stone-200/80 p-5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-stone-100 p-1 border border-stone-200 rounded-none w-full sm:w-auto overflow-x-auto scrollbar-none">
          {[
            { key: 'pending', label: `CHỜ DUYỆT (${summary.pending})` },
            { key: 'approved', label: `ĐÃ DUYỆT (${summary.approved})` },
            { key: 'rejected', label: `TỪ CHỐI (${summary.rejected})` },
            { key: 'all', label: `TẤT CẢ (${summary.total})` },
          ].map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-3.5 py-1.5 rounded-none text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-80">
          <input
            type="text"
            placeholder="Tìm theo Mã đơn, Khách hàng, Lý do..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2 text-xs border border-stone-200 rounded-none focus:outline-none focus:border-amber-800 bg-stone-50 text-stone-900"
          />
        </div>
      </div>

      {/* Main Content Table */}
      <div className="bg-white rounded-none border border-stone-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-stone-400 text-xs space-y-3">
            <div className="w-8 h-8 border-2 border-amber-800 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="font-semibold">Đang tải danh sách yêu cầu đổi/trả hàng...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-red-600 text-xs font-bold">{error}</div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-16 text-center text-stone-400 space-y-2 text-xs">
            <p className="font-heading font-bold text-stone-900 text-base uppercase tracking-wider">Không có yêu cầu đổi/trả nào</p>
            <p className="text-stone-500">Không tìm thấy yêu cầu phù hợp với bộ lọc hiện tại</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-600 border-collapse">
              <thead className="bg-stone-50 text-[11px] font-bold text-stone-500 uppercase tracking-wider border-b border-stone-200/80">
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
              <tbody className="divide-y divide-stone-100">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-stone-50 transition-colors">
                    {/* Order Code */}
                    <td className="py-3.5 px-4 font-mono font-bold">
                      <button
                        onClick={() => setSelectedOrderId(req.order_id)}
                        className="text-amber-800 hover:underline cursor-pointer block"
                      >
                        #{req.order?.order_code || req.order_id}
                      </button>
                      {req.order?.total_amount && (
                        <div className="text-[10px] text-stone-400 font-semibold mt-0.5">
                          {formatCurrency(req.order.total_amount)}
                        </div>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-stone-900">{req.user?.full_name || 'Khách hàng'}</div>
                      <div className="text-[11px] text-stone-400 font-mono">{req.user?.email}</div>
                    </td>

                    {/* Request Type */}
                    <td className="py-3.5 px-4">
                      {req.request_type === 'return' ? (
                        <span className="px-2.5 py-1 bg-red-50 text-red-900 border border-red-200 rounded-none font-bold text-[10px] uppercase tracking-wider">
                          Trả hàng & Hoàn tiền
                        </span>
                      ) : req.request_type === 'exchange' ? (
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-900 border border-blue-200 rounded-none font-bold text-[10px] uppercase tracking-wider">
                          Đổi sản phẩm
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-purple-50 text-purple-900 border border-purple-200 rounded-none font-bold text-[10px] uppercase tracking-wider">
                          Bảo hành
                        </span>
                      )}
                    </td>

                    {/* Reason & Proof Image */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-stone-800 line-clamp-2 italic font-medium">"{req.reason}"</p>
                      {req.proof_image_url && (
                        <button
                          onClick={() => setPreviewImage(req.proof_image_url)}
                          className="mt-1.5 inline-block text-[11px] font-bold text-amber-800 hover:underline uppercase tracking-wider cursor-pointer"
                        >
                          Xem minh chứng ảnh →
                        </button>
                      )}
                    </td>

                    {/* Created Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-stone-500 font-mono text-[11px]">
                      {formatDate(req.created_at)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {req.status === 'pending' ? (
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-none font-bold text-[10px] uppercase tracking-wider">
                          Chờ Admin duyệt
                        </span>
                      ) : req.status === 'approved' ? (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-none font-bold text-[10px] uppercase tracking-wider">
                          Đã chấp nhận
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-red-50 text-red-900 border border-red-200 rounded-none font-bold text-[10px] uppercase tracking-wider">
                          Đã từ chối
                        </span>
                      )}
                      {req.admin_note && (
                        <div className="text-[10px] text-stone-500 italic mt-1 max-w-[150px] truncate" title={req.admin_note}>
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
                            className="px-3 py-1.5 bg-stone-900 hover:bg-amber-800 text-white font-bold rounded-none text-xs uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => handleOpenActionModal(req, 'reject')}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-none text-xs uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            Từ chối
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-stone-400 font-bold uppercase tracking-wider">Đã xử lý</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Duyệt / Từ Chối Yêu Cầu Đổi Trả */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-none max-w-md w-full p-6 shadow-2xl space-y-4 border border-stone-200/80">
            <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
              <h3 className="text-xs font-heading font-bold text-stone-900 uppercase tracking-wider">
                {actionType === 'approve' ? 'XÁC NHẬN DUYỆT YÊU CẦU' : 'XÁC NHẬN TỪ CHỐI YÊU CẦU'}
              </h3>
              <button
                onClick={() => setSelectedReq(null)}
                className="text-stone-400 hover:text-stone-900 transition-colors p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 bg-stone-50 rounded-none border border-stone-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500 uppercase tracking-wider">Mã đơn hàng:</span>
                <span className="font-bold text-stone-900 font-mono">#{selectedReq.order?.order_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 uppercase tracking-wider">Khách hàng:</span>
                <span className="font-bold text-stone-900">{selectedReq.user?.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 uppercase tracking-wider">Loại yêu cầu:</span>
                <span className="font-bold text-amber-800 uppercase tracking-wider">
                  {selectedReq.request_type === 'return' ? 'Trả hàng & Hoàn tiền' : selectedReq.request_type === 'exchange' ? 'Đổi sản phẩm khác' : 'Bảo hành'}
                </span>
              </div>
              <div className="pt-2 border-t border-stone-200">
                <span className="text-stone-500 block mb-1 uppercase tracking-wider">Lý do từ khách hàng:</span>
                <p className="text-stone-900 italic font-medium">"{selectedReq.reason}"</p>
              </div>
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-none border border-red-200">
                ⚠️ {modalError}
              </div>
            )}

            <form onSubmit={handleConfirmAction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5 uppercase tracking-wider">
                  Ghi chú phản hồi của Admin:
                </label>
                <textarea
                  rows={3}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Ghi chú kết quả xử lý cho khách hàng..."
                  className="w-full p-3 text-xs border border-stone-200 rounded-none focus:outline-none focus:border-amber-800 bg-white text-stone-900"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReq(null)}
                  className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  HỦY BỎ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 py-2.5 text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs cursor-pointer ${
                    actionType === 'approve'
                      ? 'bg-stone-900 hover:bg-amber-800'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {submitting ? 'ĐANG XỬ LÝ...' : actionType === 'approve' ? 'XÁC NHẬN DUYỆT' : 'XÁC NHẬN TỪ CHỐI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Preview Ảnh Minh Chứng */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fade-in" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-2xl max-h-[85vh] bg-white p-2 rounded-none overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <img src={previewImage} alt="Proof" className="max-w-full max-h-[75vh] object-contain rounded-none mx-auto" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 text-white bg-black/60 hover:bg-black p-2 font-bold text-xs"
            >
              ✕ ĐÓNG
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
