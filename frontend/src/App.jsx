import { Routes, Route, Navigate } from 'react-router-dom'
import RegisterPage from '@/pages/auth/RegisterPage'
import LoginPage from '@/pages/auth/LoginPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'
import ProfilePage from '@/pages/user/ProfilePage'
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import ForbiddenPage from '@/pages/error/ForbiddenPage'
import ProductListPage from '@/pages/product/ProductListPage'
import ProductDetailPage from '@/pages/product/ProductDetailPage'
import ProductComparePage from '@/pages/product/ProductComparePage'
import WishlistPage from '@/pages/user/WishlistPage'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import AdminRoute from '@/components/auth/AdminRoute'
import { CompareProvider } from '@/contexts/CompareContext'
import { WishlistProvider } from '@/contexts/WishlistContext'
import CompareDrawer from '@/components/product/CompareDrawer'

function App() {
  return (
    <WishlistProvider>
      <CompareProvider>
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

          {/* Protected User routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
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

        {/* Default redirect về /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>

      {/* Floating Compare Bar */}
      <CompareDrawer />
      </CompareProvider>
    </WishlistProvider>
  )
}

export default App
