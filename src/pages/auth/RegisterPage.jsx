import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { identityApi } from '../../api/identityApi'
import TokenModal from '../../components/auth/TokenModal'
import { useNavigate } from 'react-router-dom'
import useDevLog from '../../utils/useDevLog'
import { useTranslation } from 'react-i18next'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider, microsoftProvider } from '../../config/firebase'
import useAuthStore from '../../store/authStore'
import { useQueryClient } from '@tanstack/react-query'

export default function RegisterPage() {
  useDevLog('RegisterPage', arguments[0] || {})
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const queryClient = useQueryClient()

  // Form states
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState(null)

  const [isConfirming, setIsConfirming] = useState(false)
  const { t } = useTranslation()

  // 1. Register Mutation
  const registerMutation = useMutation({
    mutationFn: (data) => identityApi.register(data),
    meta: { showErrorToast: true },
    onSuccess: () => {
      requestEmailConfirmMutation.mutate({ emailOrUsername: email })
    }
  })

  const firebaseLoginMutation = useMutation({
    mutationFn: (data) => identityApi.firebaseLogin(data),
    meta: { showErrorToast: true },
    onSuccess: (res) => {
      const actorId = res.data?.data?.actorId
      const isProfileCreated = res.data?.data?.isProfileCreated

      if (actorId) {
         setAuth(actorId, isProfileCreated, true)
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

  // 2. Zincirleme Email İstek Mutation (Register'dan hemen sonra)
  const requestEmailConfirmMutation = useMutation({
    mutationFn: (data) => identityApi.requestEmailConfirm(data),
    meta: { showErrorToast: true },
    onSuccess: () => {
      // Onay modalını aç
      setIsConfirming(true)
    }
  })

  const handleTimeout = () => {
    setIsConfirming(false)
    setError(t('auth.timeout'))
  }

  const handleRegisterSubmit = (e) => {
    e.preventDefault()
    setError(null)

    if (password !== passwordConfirm) {
      setError(t('auth.passwords_do_not_match'))
      return
    }

    registerMutation.mutate({ username, email, password })
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

        <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4">
        <div className="form-group">
          <label className="form-label">{t('auth.username')}</label>
          <input 
            className="input" 
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required 
            minLength={3}
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t('auth.email')}</label>
          <input 
            className="input" 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t('auth.password')}</label>
          <input 
            className="input" 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
            minLength={6}
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t('auth.password_confirm')}</label>
          <input 
            className="input" 
            type="password" 
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required 
            minLength={6}
          />
        </div>

        {error && <div className="form-error text-center">{error}</div>}

        <button 
          type="submit" 
          className="btn btn-primary w-full"
          disabled={registerMutation.isPending || requestEmailConfirmMutation.isPending}
          style={{ marginTop: 24 }}
        >
          {registerMutation.isPending || requestEmailConfirmMutation.isPending ? t('auth.processing') : t('common.register')}
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
            style={{ background: '#2F2F2F', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            type="button"
            disabled={firebaseLoginMutation.isPending}
            onClick={() => handleProviderLogin(microsoftProvider)}
          >
            <svg width="18" height="18" viewBox="0 0 21 21" style={{ marginRight: 8 }}>
              <path fill="#f25022" d="M1 1h9v9H1z"/>
              <path fill="#00a4ef" d="M1 11h9v9H1z"/>
              <path fill="#7fba00" d="M11 1h9v9h-9z"/>
              <path fill="#ffb900" d="M11 11h9v9h-9z"/>
            </svg>
            Microsoft
          </button>
        </div>

      <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--color-text-secondary)' }}>
        {t('auth.have_account')} <button className="btn btn-ghost" style={{ padding: 0, color: 'var(--color-primary)' }} onClick={() => navigate('/login')}>{t('common.login')}</button>
      </div>
    </div>

    <TokenModal 
      isOpen={isConfirming} 
      email={email}
      onTimeout={handleTimeout}
      onSuccess={() => setIsConfirming(false)}
      onClose={() => setIsConfirming(false)}
    />
  </>
  )
}
