import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { identityApi } from '../../api/identityApi'
import useAuthStore from '../../store/authStore'
import useUIStore from '../../store/uiStore'
import ForgotPasswordModal from '../../components/auth/ForgotPasswordModal'
import useDevLog from '../../utils/useDevLog'

export default function LoginPage() {
  useDevLog('LoginPage', arguments[0] || {})
  const { setAuth } = useAuthStore()
  const { setCenterView } = useUIStore()
  const queryClient = useQueryClient()

  const [identifier, setIdentifier] = useState('') // email veya username
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  
  // Forgot Password state
  const [isForgotOpen, setIsForgotOpen] = useState(false)
  
  // 2FA state
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false)
  const [twoFactorToken, setTwoFactorToken] = useState('')
  const [tempUserId, setTempUserId] = useState(null)

  const loginMutation = useMutation({
    mutationFn: (data) => identityApi.login(data),
    onSuccess: (res) => {
      // Backend'den "RequiresTwoFactor" gelirse state değiştir (backend implementasyonuna bağlı)
      const actorId = res.data?.data?.actorId
      const isProfileCreated = res.data?.data?.isProfileCreated

      if (actorId) {
         setAuth(actorId, isProfileCreated)
         queryClient.invalidateQueries()
         if (isProfileCreated) {
           setCenterView('feed')
         } else {
           setCenterView('init-profile')
         }
      } else {
         // 2FA senaryosu
         setRequiresTwoFactor(true)
         // Not: tempUserId'yi response'dan almak gerekebilir
      }
    },
    onError: (err) => {
      setError(err.message || 'Giriş başarısız.')
    }
  })

  const twoFactorMutation = useMutation({
    mutationFn: (data) => identityApi.loginTwoFactor(data),
    onSuccess: (res) => {
      const actorId = res.data?.data?.actorId
      const isProfileCreated = res.data?.data?.isProfileCreated

      if (actorId) {
         setAuth(actorId, isProfileCreated)
         queryClient.invalidateQueries()
         if (isProfileCreated) {
           setCenterView('feed')
         } else {
           setCenterView('init-profile')
         }
      }
    },
    onError: (err) => {
      setError(err.message || '2FA doğrulaması başarısız.')
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setError(null)
    
    // Backend login metodumuz username ve email istiyor, biz identifier'ı her ikisine de yolluyoruz.
    // Backend veritabanında önce username, sonra email üzerinden kontrol ediyor.
    loginMutation.mutate({ username: identifier, email: identifier, password })
  }

  const handleTwoFactorSubmit = (e) => {
    e.preventDefault()
    setError(null)
    twoFactorMutation.mutate({ userId: tempUserId, twoFactorToken, provider: 'Email' })
  }

  if (requiresTwoFactor) {
    return (
      <div className="card-surface" style={{ maxWidth: 400, margin: '60px auto', padding: 32 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>2 Adımlı Doğrulama</h2>
        <p className="text-muted" style={{ textAlign: 'center', marginBottom: 24 }}>
          E-posta adresinize gönderilen 6 haneli doğrulama kodunu girin.
        </p>

        <form onSubmit={handleTwoFactorSubmit} className="flex-col gap-4">
          <div className="form-group">
            <label className="form-label">Doğrulama Kodu</label>
            <input 
              className="input" 
              type="text" 
              value={twoFactorToken}
              onChange={(e) => setTwoFactorToken(e.target.value)}
              required 
              maxLength={6}
              style={{ textAlign: 'center', fontSize: 24, letterSpacing: 4 }}
            />
          </div>

          {error && <div className="form-error" style={{ textAlign: 'center' }}>{error}</div>}

          <button 
            type="submit" 
            className="btn btn-primary w-full"
            disabled={twoFactorMutation.isPending || twoFactorToken.length < 6}
          >
            {twoFactorMutation.isPending ? 'Doğrulanıyor...' : 'Doğrula'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <>
      <div className="card-surface" style={{ maxWidth: 400, margin: '60px auto', padding: 32 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>Tekrar Hoş Geldiniz!</h2>
        <p className="text-muted" style={{ textAlign: 'center', marginBottom: 24 }}>
          AiForum hesabınıza giriş yapın.
        </p>

        <form onSubmit={handleSubmit} className="flex-col gap-4">
          <div className="form-group">
            <label className="form-label">Kullanıcı Adı veya E-posta</label>
            <input 
              className="input" 
              type="text" 
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required 
            />
          </div>

          <div className="form-group">
            <div className="flex items-center justify-between">
              <label className="form-label">Şifre</label>
              <button type="button" className="btn btn-ghost" style={{ fontSize: 12, padding: 0 }} onClick={() => setIsForgotOpen(true)}>Şifremi Unuttum</button>
            </div>
            <input 
              className="input" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          {error && <div className="form-error text-center">{error}</div>}

          <button 
            type="submit" 
            className="btn btn-primary w-full"
            disabled={loginMutation.isPending}
            style={{ marginTop: 8 }}
          >
            {loginMutation.isPending ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--color-text-secondary)' }}>
          Hesabınız yok mu? <button className="btn btn-ghost" style={{ padding: 0, color: 'var(--color-primary)' }} onClick={() => setCenterView('register')}>Kayıt Ol</button>
        </div>
      </div>

      <ForgotPasswordModal isOpen={isForgotOpen} onClose={() => setIsForgotOpen(false)} />
    </>
  )
}
