import { Routes, Route, Navigate } from 'react-router-dom'
import RegisterPage from '@/pages/auth/RegisterPage'
import LoginPage from '@/pages/auth/LoginPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'
import ProfilePage from '@/pages/user/ProfilePage'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

function App() {
  return (
    <Routes>
      {/* Public Auth routes */}
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected routes */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Default redirect về /login */}
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
