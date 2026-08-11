import { Routes, Route, Navigate } from 'react-router-dom'
import RegisterPage from '@/pages/auth/RegisterPage'
import LoginPage from '@/pages/auth/LoginPage'

function App() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Redirect root về login tạm thời */}
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
