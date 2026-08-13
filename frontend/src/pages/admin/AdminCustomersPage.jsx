import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import AdminQuickSearch from '@/components/admin/AdminQuickSearch'
import customerService from '@/services/customerService'
import FormAlert from '@/components/ui/FormAlert'

/**
 * AdminCustomersPage — Trang Xem & Quản lý Danh sách Khách hàng (NT-12-CN-001).
 * Tuyến đường: /admin/customers
 */
const AdminCustomersPage = () => {
  const [customers, setCustomers] = useState([])
  const [summary, setSummary] = useState({ total_customers: 0, active_customers: 0, inactive_customers: 0 })
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total_items: 0, total_pages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filter states
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  const fetchCustomers = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await customerService.getAdminCustomers({
        search: search.trim() || undefined,
        status: statusFilter,
        page,
        limit: 10,
      })
      setCustomers(data.customers || [])
      setPagination(data.pagination || { page: 1, limit: 10, total_items: 0, total_pages: 1 })
      setSummary(data.summary || { total_customers: 0, active_customers: 0, inactive_customers: 0 })
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể nạp danh sách khách hàng.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [search, statusFilter, page])

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '0đ'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Chưa mua hàng'
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-1">
              <Link to="/admin" className="hover:text-amber-600 transition-colors">
                Quản trị
              </Link>
              <span>/</span>
              <span className="text-gray-900 font-bold">Danh Sách Khách Hàng</span>
            </div>
            <h1 className="text-2xl font-display font-extrabold text-gray-900 flex items-center gap-2">
              <span>👥</span> Quản Lý Danh Sách Khách Hàng (NT-12-CN-001)
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <AdminQuickSearch />
          </div>
        </div>

        {error && (
          <div className="mb-4">
            <FormAlert type="error" message={error} />
          </div>
        )}

        {/* KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase">Tổng Khách Hàng</span>
              <p className="text-2xl font-display font-extrabold text-gray-900 mt-1">
                {summary.total_customers} <span className="text-xs font-normal text-gray-500">tài khoản</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold">
              👥
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase">Khách Hàng Hoạt Động</span>
              <p className="text-2xl font-display font-extrabold text-emerald-600 mt-1">
                {summary.active_customers} <span className="text-xs font-normal text-gray-500">tài khoản</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
              ✅
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase">Tài Khoản Tạm Khóa</span>
              <p className="text-2xl font-display font-extrabold text-gray-500 mt-1">
                {summary.inactive_customers} <span className="text-xs font-normal text-gray-500">tài khoản</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-500 flex items-center justify-center text-xl font-bold">
              🔒
            </div>
          </div>
        </div>

        {/* Toolbar Filter */}
        <div className="bg-white rounded-3xl p-4 mb-6 border border-gray-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Tìm theo tên, email, SĐT..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all outline-none"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-2xl border border-gray-100 w-full sm:w-auto">
            {[
              { key: 'all', label: 'Tất cả' },
              { key: 'active', label: 'Đang hoạt động' },
              { key: 'inactive', label: 'Tạm khóa' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.key)
                  setPage(1)
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === tab.key
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Customers Table */}
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-xs space-y-3">
            <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="font-semibold">Đang nạp danh sách khách hàng...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center text-gray-400 border border-gray-100 shadow-xs space-y-2">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-2xl mx-auto font-bold">
              👥
            </div>
            <p className="font-bold text-gray-800 text-base">Không tìm thấy khách hàng nào</p>
            <p className="text-xs text-gray-500">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="py-4 px-6">Khách Hàng</th>
                    <th className="py-4 px-4">Số Điện Thoại</th>
                    <th className="py-4 px-4">Tổng Đơn Hàng</th>
                    <th className="py-4 px-4">Tổng Chi Tiêu</th>
                    <th className="py-4 px-4">Đơn Hàng Gần Nhất</th>
                    <th className="py-4 px-4">Ngày Đăng Ký</th>
                    <th className="py-4 px-6 text-center">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-amber-50/30 transition-colors group">
                      {/* Name & Email */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 font-extrabold flex items-center justify-center text-sm shrink-0 border border-amber-200">
                            {c.full_name ? c.full_name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                              {c.full_name || 'Khách hàng chưa đặt tên'}
                            </p>
                            <p className="text-[11px] font-mono text-gray-400">{c.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-4 px-4 font-mono font-medium text-gray-700">
                        {c.phone || 'Chưa cập nhật'}
                      </td>

                      {/* Total Orders */}
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-extrabold text-[11px]">
                          {c.total_orders} đơn
                        </span>
                      </td>

                      {/* Total Spent */}
                      <td className="py-4 px-4 font-bold text-gray-900">
                        {formatCurrency(c.total_spent)}
                      </td>

                      {/* Last Order At */}
                      <td className="py-4 px-4 text-gray-500 font-medium">
                        {formatDate(c.last_order_at)}
                      </td>

                      {/* Created At */}
                      <td className="py-4 px-4 text-gray-400 font-medium">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString('vi-VN') : '---'}
                      </td>

                      {/* Active Status Badge */}
                      <td className="py-4 px-6 text-center">
                        {c.is_active ? (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full inline-block">
                            Hoạt động
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-500 border border-gray-200 text-[10px] font-bold rounded-full inline-block">
                            Tạm khóa
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination.total_pages > 1 && (
              <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-400 font-medium">
                  Hiển thị {(page - 1) * pagination.limit + 1} - {Math.min(page * pagination.limit, pagination.total_items)} trên tổng số {pagination.total_items} khách hàng
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    ❮ Trước
                  </button>

                  <span className="font-bold text-gray-700 px-2">
                    Trang {page} / {pagination.total_pages}
                  </span>

                  <button
                    type="button"
                    disabled={page >= pagination.total_pages}
                    onClick={() => setPage((prev) => Math.min(pagination.total_pages, prev + 1))}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    Sau ❯
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default AdminCustomersPage
