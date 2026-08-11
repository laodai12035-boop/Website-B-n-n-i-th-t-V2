import { Routes, Route, Navigate } from 'react-router-dom'
import RegisterPage from '@/pages/auth/RegisterPage'

function App() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/register" element={<RegisterPage />} />

      {/* Redirect root về register tạm thời */}
      <Route path="/" element={<Navigate to="/register" replace />} />
    </Routes>
  )
}

export default App
