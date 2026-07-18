import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { identityApi } from '../../api/identityApi'
import TokenModal from '../../components/auth/TokenModal'
import { useNavigate } from 'react-router-dom'
import useDevLog from '../../utils/useDevLog'

export default function RegisterPage() {
  useDevLog('RegisterPage', arguments[0] || {})
  const navigate = useNavigate()

  // Form states
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState(null)

  const [isConfirming, setIsConfirming] = useState(false)

  // 1. Register Mutation
  const registerMutation = useMutation({
    mutationFn: (data) => identityApi.register(data),
    meta: { showErrorToast: true },
    onSuccess: () => {
      // Register başarılı olduğunda, zincirleme (chain) email gönderim isteğini tetikliyoruz
      requestEmailConfirmMutation.mutate({ emailOrUsername: email })
    }
  })

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
    setError('Süreniz doldu (30 saniye). Lütfen tekrar deneyin.')
  }

  const handleRegisterSubmit = (e) => {
    e.preventDefault()
    setError(null)

    if (password !== passwordConfirm) {
      setError('Şifreler eşleşmiyor.')
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
            <span style={{ color: 'white', fontWeight: 800, fontSize: 20 }}>T</span>
          </div>
          <span style={{ fontWeight: 800, fontSize: 28, color: 'var(--color-primary)' }}>
            TuringBBS
          </span>
        </div>

        <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4">
        <div className="form-group">
          <label className="form-label">Kullanıcı Adı</label>
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
          <label className="form-label">E-posta</label>
          <input 
            className="input" 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
        </div>

        <div className="form-group">
          <label className="form-label">Şifre</label>
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
          <label className="form-label">Şifre Tekrar</label>
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
          {registerMutation.isPending || requestEmailConfirmMutation.isPending ? 'İşleniyor...' : 'Kayıt Ol'}
        </button>
      </form>

      <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--color-text-secondary)' }}>
        Zaten hesabınız var mı? <button className="btn btn-ghost" style={{ padding: 0, color: 'var(--color-primary)' }} onClick={() => navigate('/login')}>Giriş Yap</button>
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
