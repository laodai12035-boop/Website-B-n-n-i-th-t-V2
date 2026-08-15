import { Routes, Route, Navigate } from 'react-router-dom'
import RegisterPage from '@/pages/auth/RegisterPage'
import LoginPage from '@/pages/auth/LoginPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'
import ProfilePage from '@/pages/user/ProfilePage'
import AddressListPage from '@/pages/user/AddressListPage'
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import AdminOrdersPage from '@/pages/admin/AdminOrdersPage'
import AdminCategoriesPage from '@/pages/admin/AdminCategoriesPage'
import AdminProductsPage from '@/pages/admin/AdminProductsPage'
import AdminInventoryPage from '@/pages/admin/AdminInventoryPage'
import AdminCombosPage from '@/pages/admin/AdminCombosPage'
import AdminReviewsPage from '@/pages/admin/AdminReviewsPage'
import AdminBannersPage from '@/pages/admin/AdminBannersPage'
import AdminCouponsPage from '@/pages/admin/AdminCouponsPage'
import AdminCustomersPage from '@/pages/admin/AdminCustomersPage'
import AdminReturnsPage from '@/pages/admin/AdminReturnsPage'
import ForbiddenPage from '@/pages/error/ForbiddenPage'
import ProductListPage from '@/pages/product/ProductListPage'
import ProductDetailPage from '@/pages/product/ProductDetailPage'
import ProductComparePage from '@/pages/product/ProductComparePage'
import WishlistPage from '@/pages/user/WishlistPage'
import CartPage from '@/pages/cart/CartPage'
import CheckoutPage from '@/pages/checkout/CheckoutPage'
import OrderHistoryPage from '@/pages/order/OrderHistoryPage'
import OrderDetailPage from '@/pages/order/OrderDetailPage'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import AdminRoute from '@/components/auth/AdminRoute'
import AdminLayout from '@/components/layout/AdminLayout'
import CartDrawer from '@/components/cart/CartDrawer'
import CompareDrawer from '@/components/product/CompareDrawer'

function App() {
  return (
    <>
      <Routes>
        {/* Public auth routes */}
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/403" element={<ForbiddenPage />} />

        {/* Public product & shopping routes */}
        <Route path="/products" element={<ProductListPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/compare" element={<ProductComparePage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/cart" element={<CartPage />} />

        {/* Protected Customer routes */}
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/addresses"
          element={
            <ProtectedRoute>
              <AddressListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <OrderHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <ProtectedRoute>
              <OrderDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Protected Admin routes with AdminLayout Sidebar */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminDashboardPage />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminCategoriesPage />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminProductsPage />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/inventory"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminInventoryPage />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/combos"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminCombosPage />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminOrdersPage />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/returns"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminReturnsPage />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/reviews"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminReviewsPage />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/banners"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminBannersPage />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/coupons"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminCouponsPage />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/customers"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminCustomersPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        {/* Default redirect về /products */}
        <Route path="/" element={<Navigate to="/products" replace />} />
      </Routes>

      {/* Floating Drawers & Modals */}
      <CartDrawer />
      <CompareDrawer />
    </>
  )
}

export default App
