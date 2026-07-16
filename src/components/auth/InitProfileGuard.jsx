import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

export default function InitProfileGuard({ children }) {
  const { actorId, isProfileCreated } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Sadece kullanıcı giriş yapmışsa ve profili tamamlanmamışsa
    if (actorId && !isProfileCreated && location.pathname !== '/init-profile') {
      navigate('/init-profile', { replace: true })
    }
  }, [actorId, isProfileCreated, location.pathname, navigate])

  return children
}
