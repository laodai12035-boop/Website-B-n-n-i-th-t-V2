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
import { CompareProvider } from '@/contexts/CompareContext'
import { WishlistProvider } from '@/contexts/WishlistContext'
import { CartProvider } from '@/contexts/CartContext'
import { AddressProvider } from '@/contexts/AddressContext'
import CartDrawer from '@/components/cart/CartDrawer'
import CompareDrawer from '@/components/product/CompareDrawer'

function App() {
  return (
    <WishlistProvider>
      <CompareProvider>
        <CartProvider>
          <AddressProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/403" element={<ForbiddenPage />} />
              <Route path="/products" element={<ProductListPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/compare" element={<ProductComparePage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />

              {/* Protected User routes */}
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

              {/* Protected Admin routes (QTN-09) */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboardPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/categories"
                element={
                  <AdminRoute>
                    <AdminCategoriesPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/products"
                element={
                  <AdminRoute>
                    <AdminProductsPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/inventory"
                element={
                  <AdminRoute>
                    <AdminInventoryPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/combos"
                element={
                  <AdminRoute>
                    <AdminCombosPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/orders"
                element={
                  <AdminRoute>
                    <AdminOrdersPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/returns"
                element={
                  <AdminRoute>
                    <AdminReturnsPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/reviews"
                element={
                  <AdminRoute>
                    <AdminReviewsPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/banners"
                element={
                  <AdminRoute>
                    <AdminBannersPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/coupons"
                element={
                  <AdminRoute>
                    <AdminCouponsPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/customers"
                element={
                  <AdminRoute>
                    <AdminCustomersPage />
                  </AdminRoute>
                }
              />

              {/* Default redirect về /products */}
              <Route path="/" element={<Navigate to="/products" replace />} />
            </Routes>

            {/* Floating Drawers */}
            <CompareDrawer />
            <CartDrawer />
          </AddressProvider>
        </CartProvider>
      </CompareProvider>
    </WishlistProvider>
  )
}

export default App
