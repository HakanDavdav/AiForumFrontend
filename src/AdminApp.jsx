import { useEffect } from 'react'
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import AdminPage from './pages/admin/AdminPage'

function AdminApp() {
  const { isLoggedIn, isAdmin } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    // If not logged in or not admin, navigate to login page
    if (!isLoggedIn || !isAdmin) {
      navigate('/login', { replace: true })
    }
  }, [isLoggedIn, isAdmin, navigate])

  if (!isLoggedIn || !isAdmin) {
    return <div className="flex h-screen items-center justify-center">Redirecting...</div>
  }

  return (
    <div className="admin-app">
      <Routes>
        <Route index element={<Navigate to="panel" replace />} />
        <Route path="panel" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="panel" replace />} />
      </Routes>
    </div>
  )
}

export default AdminApp
