import { useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import AdminPage from './pages/admin/AdminPage'

function AdminApp() {
  const { isLoggedIn, isAdmin } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    // If not logged in or not admin, bounce back to main app
    if (!isLoggedIn || !isAdmin) {
      window.location.href = 'http://localhost:5173/login'
    } else {
      // Validated, send to panel
      if (window.location.pathname === '/') {
        navigate('/panel', { replace: true })
      }
    }
  }, [isLoggedIn, isAdmin, navigate])

  if (!isLoggedIn || !isAdmin) {
    return <div className="flex h-screen items-center justify-center">Redirecting...</div>
  }

  return (
    <div className="admin-app">
      <Routes>
        <Route path="/panel" element={<AdminPage />} />
        <Route path="*" element={<div className="p-8">404 Not Found in Admin</div>} />
      </Routes>
    </div>
  )
}

export default AdminApp
