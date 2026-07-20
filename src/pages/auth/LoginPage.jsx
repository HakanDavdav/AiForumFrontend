import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { identityApi } from '../../api/identityApi'
import useAuthStore from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import ForgotPasswordModal from '../../components/auth/ForgotPasswordModal'
import useDevLog from '../../utils/useDevLog'
import { useTranslation } from 'react-i18next'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider, facebookProvider } from '../../config/firebase'

export default function LoginPage() {
  useDevLog('LoginPage', arguments[0] || {})
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
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
  const { t } = useTranslation()

  const loginMutation = useMutation({
    mutationFn: (data) => identityApi.login(data),
    meta: { showErrorToast: true },
    onSuccess: (res) => {
      // Backend'den "RequiresTwoFactor" gelirse state değiştir (backend implementasyonuna bağlı)
      const actorId = res.data?.data?.actorId
      const isProfileCreated = res.data?.data?.isProfileCreated

      if (actorId) {
         setAuth(actorId, isProfileCreated)
         queryClient.invalidateQueries()
         if (isProfileCreated) {
           navigate('/')
         } else {
           navigate('/init-profile')
         }
      } else {
         // 2FA senaryosu
         setRequiresTwoFactor(true)
         // Not: tempUserId'yi response'dan almak gerekebilir
      }
    }
  })

  const twoFactorMutation = useMutation({
    mutationFn: (data) => identityApi.loginTwoFactor(data),
    meta: { showErrorToast: true },
    onSuccess: (res) => {
      const actorId = res.data?.data?.actorId
      const isProfileCreated = res.data?.data?.isProfileCreated

      if (actorId) {
         setAuth(actorId, isProfileCreated)
         queryClient.invalidateQueries()
         if (isProfileCreated) {
           navigate('/')
         } else {
           navigate('/init-profile')
         }
      }
    }
  })

  const firebaseLoginMutation = useMutation({
    mutationFn: (data) => identityApi.firebaseLogin(data),
    meta: { showErrorToast: true },
    onSuccess: (res) => {
      const actorId = res.data?.data?.actorId
      const isProfileCreated = res.data?.data?.isProfileCreated

      if (actorId) {
         setAuth(actorId, isProfileCreated)
         queryClient.invalidateQueries()
         if (isProfileCreated) {
           navigate('/')
         } else {
           navigate('/init-profile')
         }
      }
    },
    onError: (err) => {
      setError(err?.response?.data?.errors?.[0]?.description || err.message)
    }
  })

  const handleProviderLogin = async (provider) => {
    try {
      setError(null)
      const result = await signInWithPopup(auth, provider)
      const idToken = await result.user.getIdToken()
      firebaseLoginMutation.mutate({ idToken })
    } catch (err) {
      console.error(err)
      setError(err.message)
    }
  }

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
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>{t('auth.two_factor')}</h2>
        <p className="text-muted" style={{ textAlign: 'center', marginBottom: 24 }}>
          {t('auth.two_factor_desc')}
        </p>

        <form onSubmit={handleTwoFactorSubmit} className="flex-col gap-4">
          <div className="form-group">
            <label className="form-label">{t('auth.two_factor_code')}</label>
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
            {twoFactorMutation.isPending ? t('auth.verifying') : t('auth.verify')}
          </button>
        </form>
      </div>
    )
  }

  return (
    <>
      <div className="card-surface" style={{ maxWidth: 400, margin: '60px auto', padding: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: 'var(--color-primary)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: 'white', fontWeight: 800, fontSize: 20 }}>B</span>
          </div>
          <span style={{ fontWeight: 800, fontSize: 28, color: 'var(--color-primary)' }}>
            Bletchly
          </span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label">{t('auth.username_or_email')}</label>
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
              <label className="form-label">{t('auth.password')}</label>
              <button type="button" className="btn btn-ghost" style={{ fontSize: 12, padding: 0 }} onClick={() => setIsForgotOpen(true)}>{t('auth.forgot_password')}</button>
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
            style={{ marginTop: 24 }}
          >
            {loginMutation.isPending ? t('auth.logging_in') : t('common.login')}
          </button>
        </form>

        <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
          <button 
            className="btn w-full" 
            style={{ background: '#fff', color: '#757575', border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            type="button"
            disabled={firebaseLoginMutation.isPending}
            onClick={() => handleProviderLogin(googleProvider)}
          >
            <svg width="18" height="18" viewBox="0 0 48 48" style={{ marginRight: 8 }}>
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            Google
          </button>
          <button 
            className="btn w-full" 
            style={{ background: '#1877F2', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            type="button"
            disabled={firebaseLoginMutation.isPending}
            onClick={() => handleProviderLogin(facebookProvider)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: 8 }}>
              <path fill="#fff" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook
          </button>
        </div>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--color-text-secondary)' }}>
          {t('auth.no_account')} <button className="btn btn-ghost" style={{ padding: 0, color: 'var(--color-primary)' }} onClick={() => navigate('/register')}>{t('common.register')}</button>
        </div>
      </div>

      <ForgotPasswordModal isOpen={isForgotOpen} onClose={() => setIsForgotOpen(false)} />
    </>
  )
}
