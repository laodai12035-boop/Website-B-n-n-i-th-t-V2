import React, { useState, useEffect } from 'react'
import customerService from '@/services/customerService'
import FormAlert from '@/components/ui/FormAlert'

/**
 * AddAccountModal — Modal Thêm Tài Khoản Mới (Phong cách nhaxinh.com).
 * Góc cạnh vuông vức (rounded-none), chữ thuần tối giản (NO ICONS).
 */
const AddAccountModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'user',
    is_active: true,
  })

  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const validate = () => {
    const errs = {}
    if (!formData.full_name || !formData.full_name.trim()) {
      errs.full_name = 'Họ tên tài khoản là bắt buộc'
    }
    if (!formData.email || !formData.email.trim()) {
      errs.email = 'Email là bắt buộc'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Email không hợp lệ'
    }
    if (!formData.password || formData.password.length < 6) {
      errs.password = 'Mật khẩu phải có ít nhất 6 ký tự'
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
      await customerService.createAccount({
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        password: formData.password.trim(),
        role: formData.role,
        is_active: formData.is_active,
      })

      setFormData({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        role: 'user',
        is_active: true,
      })
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Không thể tạo tài khoản mới.'
      setApiError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans">
      <div className="relative w-full max-w-lg bg-white rounded-none shadow-2xl border border-stone-200/80 overflow-hidden animate-slide-up">
        
        {/* Header Bar */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between border-b border-amber-800">
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">Phân hệ Quản trị</span>
            <h2 className="text-base font-heading font-bold uppercase tracking-wider">
              THÊM TÀI KHOẢN MỚI
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-white transition-colors p-1 cursor-pointer font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {apiError && <FormAlert type="error" message={apiError} />}

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Họ và tên <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="VD: Nguyễn Văn Admin"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-none focus:outline-none focus:border-amber-800 bg-white text-stone-900"
            />
            {errors.full_name && <p className="text-[11px] text-red-600 font-bold mt-1">{errors.full_name}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Email đăng nhập <span className="text-red-600">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@example.com"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-none focus:outline-none focus:border-amber-800 bg-white text-stone-900"
              />
              {errors.email && <p className="text-[11px] text-red-600 font-bold mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Số điện thoại
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="VD: 0901234567"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-none focus:outline-none focus:border-amber-800 bg-white text-stone-900 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Mật khẩu <span className="text-red-600">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Nhập ít nhất 6 ký tự"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-none focus:outline-none focus:border-amber-800 bg-white text-stone-900"
              />
              {errors.password && <p className="text-[11px] text-red-600 font-bold mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Vai trò / Phân quyền <span className="text-red-600">*</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-none focus:outline-none focus:border-amber-800 bg-white text-stone-900 font-bold uppercase tracking-wider cursor-pointer"
              >
                <option value="user">NGƯỜI DÙNG (KHÁCH HÀNG)</option>
                <option value="admin">QUẢN TRỊ VIÊN (ADMIN)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="modal_is_active"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="w-4 h-4 rounded-none text-amber-800 border-stone-300 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="modal_is_active" className="text-xs font-bold text-stone-700 uppercase tracking-wider cursor-pointer">
              KÍCH HOẠT TÀI KHOẢN NGAY KHI TẠO
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-200/80">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-none text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              HỦY BỎ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-stone-900 hover:bg-amber-800 text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'ĐANG LƯU...' : 'TẠO TÀI KHOẢN'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}

/**
 * AdminCustomersPage — Trang Quản lý Tài Khoản Thành Viên & Admin (nhaxinh.com style).
 * Góc cạnh vuông vức (rounded-none), KHÔNG SỬ DỤNG ICON.
 */
const AdminCustomersPage = () => {
  const [customers, setCustomers] = useState([])
  const [summary, setSummary] = useState({ total_customers: 0, active_customers: 0, inactive_customers: 0 })
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total_items: 0, total_pages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  // Filter states
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  // Add Account Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

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
      setError(err.response?.data?.message || 'Không thể nạp danh sách tài khoản.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [search, statusFilter, page])

  const handleToggleStatus = async (customer) => {
    const newStatus = !customer.is_active
    try {
      await customerService.updateCustomerStatus(customer.id, newStatus)
      setCustomers((prev) =>
        prev.map((c) => (c.id === customer.id ? { ...c, is_active: newStatus } : c))
      )
      setSummary((prev) => ({
        ...prev,
        active_customers: newStatus ? prev.active_customers + 1 : prev.active_customers - 1,
        inactive_customers: newStatus ? prev.inactive_customers - 1 : prev.inactive_customers + 1,
      }))
      setSuccessMsg(
        newStatus
          ? `Mở khóa tài khoản "${customer.full_name || customer.email}" thành công!`
          : `Khóa tài khoản "${customer.full_name || customer.email}" thành công!`
      )
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể cập nhật trạng thái tài khoản.')
    }
  }

  const handleRoleChange = async (customer, newRole) => {
    if (customer.role === newRole) return
    try {
      await customerService.updateCustomerRole(customer.id, newRole)
      setCustomers((prev) =>
        prev.map((c) => (c.id === customer.id ? { ...c, role: newRole } : c))
      )
      setSuccessMsg(`Cập nhật phân quyền cho tài khoản "${customer.full_name || customer.email}" thành "${newRole.toUpperCase()}"!`)
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể thay đổi phân quyền tài khoản.')
    }
  }

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
    <div className="space-y-6 font-sans animate-fade-in">
      
      {/* Header Bar */}
      <div className="bg-white rounded-none border border-stone-200/80 p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest bg-amber-100 px-2.5 py-0.5 rounded-none border border-amber-200 inline-block mb-1">
            Phân hệ Quản trị
          </span>
          <h1 className="text-2xl font-heading font-bold text-stone-900 uppercase tracking-wider">
            QUẢN LÝ TÀI KHOẢN ({summary.total_customers})
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Xem danh sách tài khoản thành viên & Admin, phân quyền hệ thống và quản lý trạng thái truy cập
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-2.5 bg-stone-900 hover:bg-amber-800 text-white rounded-none text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs shrink-0 cursor-pointer"
        >
          + THÊM TÀI KHOẢN MỚI
        </button>
      </div>

      {error && <FormAlert type="error" message={error} />}
      {successMsg && <FormAlert type="success" message={successMsg} />}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-none p-5 border border-stone-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">TỔNG TÀI KHOẢN</span>
            <p className="text-2xl font-bold font-mono text-stone-900 mt-1">
              {summary.total_customers} <span className="text-xs font-normal text-stone-500">tài khoản</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-none p-5 border border-stone-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">TÀI KHOẢN HOẠT ĐỘNG</span>
            <p className="text-2xl font-bold font-mono text-emerald-800 mt-1">
              {summary.active_customers} <span className="text-xs font-normal text-stone-500">tài khoản</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-none p-5 border border-stone-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">TÀI KHOẢN TẠM KHÓA</span>
            <p className="text-2xl font-bold font-mono text-stone-500 mt-1">
              {summary.inactive_customers} <span className="text-xs font-normal text-stone-500">tài khoản</span>
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar Filter */}
      <div className="bg-white rounded-none border border-stone-200/80 p-5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Box */}
        <div className="w-full sm:w-80">
          <input
            type="text"
            placeholder="Tìm theo tên, email, SĐT..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full px-3.5 py-2 text-xs border border-stone-200 rounded-none focus:outline-none focus:border-amber-800 bg-stone-50 text-stone-900"
          />
        </div>

        {/* Status & Role Filter Tabs */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 border border-stone-200 rounded-none w-full sm:w-auto overflow-x-auto scrollbar-none">
          {[
            { key: 'all', label: 'TẤT CẢ' },
            { key: 'admin', label: 'ADMIN' },
            { key: 'user', label: 'NGƯỜI DÙNG' },
            { key: 'active', label: 'ĐANG HOẠT ĐỘNG' },
            { key: 'inactive', label: 'TẠM KHÓA' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setStatusFilter(tab.key)
                setPage(1)
              }}
              className={`px-3.5 py-1.5 rounded-none text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === tab.key
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Accounts Table */}
      {loading ? (
        <div className="py-16 text-center text-stone-400 text-xs space-y-3 bg-white rounded-none border border-stone-200/80">
          <div className="w-8 h-8 border-2 border-amber-800 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="font-semibold">Đang nạp danh sách tài khoản...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-none p-12 text-center text-stone-400 border border-stone-200/80 shadow-2xs space-y-2">
          <p className="font-heading font-bold text-stone-900 text-base uppercase tracking-wider">Không tìm thấy tài khoản nào</p>
          <p className="text-xs text-stone-500">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái</p>
        </div>
      ) : (
        <div className="bg-white rounded-none border border-stone-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200/80 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Tài Khoản</th>
                  <th className="py-3.5 px-4 text-center">Phân Quyền (Role)</th>
                  <th className="py-3.5 px-4">Số Điện Thoại</th>
                  <th className="py-3.5 px-4">Tổng Đơn / Chi Tiêu</th>
                  <th className="py-3.5 px-4">Ngày Đăng Ký</th>
                  <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                  <th className="py-3.5 px-4 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-stone-50 transition-colors">
                    {/* Name & Email */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-none bg-stone-100 text-amber-800 font-bold flex items-center justify-center text-xs shrink-0 border border-stone-200 font-heading">
                          {c.full_name ? c.full_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-stone-900">
                            {c.full_name || 'Tài khoản chưa đặt tên'}
                          </p>
                          <p className="text-[11px] font-mono text-stone-400">{c.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role Selector Badge */}
                    <td className="py-3.5 px-4 text-center">
                      <select
                        value={c.role || 'user'}
                        onChange={(e) => handleRoleChange(c, e.target.value)}
                        className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-none border cursor-pointer focus:outline-none ${
                          c.role === 'admin'
                            ? 'bg-amber-900 text-white border-amber-950 shadow-2xs'
                            : 'bg-stone-100 text-stone-700 border-stone-300'
                        }`}
                      >
                        <option value="user" className="bg-white text-stone-900">NGƯỜI DÙNG</option>
                        <option value="admin" className="bg-white text-stone-900">ADMIN</option>
                      </select>
                    </td>

                    {/* Phone */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-stone-800">
                      {c.phone || 'Chưa cập nhật'}
                    </td>

                    {/* Total Orders / Spent */}
                    <td className="py-3.5 px-4 font-mono">
                      <p className="font-bold text-amber-800">{formatCurrency(c.total_spent)}</p>
                      <p className="text-[10px] text-stone-400">{c.total_orders} đơn hàng</p>
                    </td>

                    {/* Created At */}
                    <td className="py-3.5 px-4 text-stone-400 font-mono text-[11px]">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString('vi-VN') : '---'}
                    </td>

                    {/* Active Status Badge */}
                    <td className="py-3.5 px-4 text-center">
                      {c.is_active ? (
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-900 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider rounded-none inline-block">
                          HOẠT ĐỘNG
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-stone-100 text-stone-500 border border-stone-200 text-[10px] font-bold uppercase tracking-wider rounded-none inline-block">
                          TẠM KHÓA
                        </span>
                      )}
                    </td>

                    {/* Actions Column */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(c)}
                        className={`px-3 py-1.5 rounded-none font-bold text-[11px] uppercase tracking-wider transition-colors cursor-pointer border ${
                          c.is_active
                            ? 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200'
                            : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border-emerald-200'
                        }`}
                      >
                        {c.is_active ? 'KHÓA' : 'MỞ KHÓA'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pagination.total_pages > 1 && (
            <div className="p-4 border-t border-stone-200/80 flex items-center justify-between text-xs bg-stone-50/50">
              <span className="text-stone-500 font-medium">
                Hiển thị {(page - 1) * pagination.limit + 1} - {Math.min(page * pagination.limit, pagination.total_items)} trên tổng số {pagination.total_items} tài khoản
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  className="px-3.5 py-1.5 bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 rounded-none font-bold uppercase tracking-wider disabled:opacity-40 transition-colors cursor-pointer"
                >
                  ← TRANG TRƯỚC
                </button>

                <span className="font-bold text-stone-900 font-mono px-2">
                  TRANG {page} / {pagination.total_pages}
                </span>

                <button
                  type="button"
                  disabled={page >= pagination.total_pages}
                  onClick={() => setPage((prev) => Math.min(pagination.total_pages, prev + 1))}
                  className="px-3.5 py-1.5 bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 rounded-none font-bold uppercase tracking-wider disabled:opacity-40 transition-colors cursor-pointer"
                >
                  TRANG SAU →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Thêm tài khoản mới */}
      <AddAccountModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchCustomers}
      />
    </div>
  )
}

export default AdminCustomersPage
