import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { identityApi } from '../../api/identityApi'
import useUIStore from '../../store/uiStore'
import TokenModal from '../../components/auth/TokenModal'
import useDevLog from '../../utils/useDevLog'

export default function RegisterPage() {
  useDevLog('RegisterPage', arguments[0] || {})
  const { setCenterView } = useUIStore()

  // Form states
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  const [isConfirming, setIsConfirming] = useState(false)

  // 1. Register Mutation
  const registerMutation = useMutation({
    mutationFn: (data) => identityApi.register(data),
    onSuccess: () => {
      // Register başarılı olduğunda, zincirleme (chain) email gönderim isteğini tetikliyoruz
      requestEmailConfirmMutation.mutate({ emailOrUsername: email })
    },
    onError: (err) => {
      // Backend'den gelen "Wait 30 seconds max" gibi hatalar burada gösterilir
      setError(err.message || 'Kayıt işlemi başarısız.')
    }
  })

  // 2. Zincirleme Email İstek Mutation (Register'dan hemen sonra)
  const requestEmailConfirmMutation = useMutation({
    mutationFn: (data) => identityApi.requestEmailConfirm(data),
    onSuccess: () => {
      // Onay modalını aç
      setIsConfirming(true)
    },
    onError: (err) => {
      setError(err.message || 'Onay kodu gönderilirken hata oluştu.')
    }
  })

  const handleTimeout = () => {
    setIsConfirming(false)
    setError('Süreniz doldu (30 saniye). Lütfen tekrar deneyin.')
  }

  const handleRegisterSubmit = (e) => {
    e.preventDefault()
    setError(null)
    registerMutation.mutate({ username, email, password })
  }

  return (
    <>
      <div className="card-surface" style={{ maxWidth: 400, margin: '60px auto', padding: 32 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>Hesap Oluştur</h2>
        <p className="text-muted" style={{ textAlign: 'center', marginBottom: 24 }}>
          AiForum topluluğuna katılın.
        </p>

        <form onSubmit={handleRegisterSubmit} className="flex-col gap-4">
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

        {error && <div className="form-error text-center">{error}</div>}

        <button 
          type="submit" 
          className="btn btn-primary w-full"
          disabled={registerMutation.isPending || requestEmailConfirmMutation.isPending}
          style={{ marginTop: 8 }}
        >
          {registerMutation.isPending || requestEmailConfirmMutation.isPending ? 'İşleniyor...' : 'Kayıt Ol'}
        </button>
      </form>

      <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--color-text-secondary)' }}>
        Zaten hesabınız var mı? <button className="btn btn-ghost" style={{ padding: 0, color: 'var(--color-primary)' }} onClick={() => setCenterView('login')}>Giriş Yap</button>
      </div>
    </div>

    <TokenModal 
      isOpen={isConfirming} 
      email={email}
      onTimeout={handleTimeout}
      onSuccess={() => setIsConfirming(false)}
    />
  </>
  )
}
