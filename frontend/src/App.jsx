import { Routes, Route, Navigate } from 'react-router-dom'
import RegisterPage from '@/pages/auth/RegisterPage'
import LoginPage from '@/pages/auth/LoginPage'
import ProfilePage from '@/pages/user/ProfilePage'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

function App() {
  return (
    <Routes>
      {/* Public Auth routes */}
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />

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
