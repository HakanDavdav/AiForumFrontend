import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { identityApi } from '../../../api/identityApi'
import useUIStore from '../../../store/uiStore'

export default function RegisterPage() {
  const { setCenterView } = useUIStore()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const registerMutation = useMutation({
    mutationFn: (data) => identityApi.register(data),
    onSuccess: () => {
      setSuccess(true)
    },
    onError: (err) => {
      setError(err.message || 'Kayıt işlemi başarısız.')
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setError(null)
    registerMutation.mutate({ username, email, password })
  }

  if (success) {
    return (
      <div className="card-surface" style={{ maxWidth: 400, margin: '60px auto', padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>Aramıza Hoş Geldiniz!</h2>
        <p className="text-muted" style={{ marginBottom: 24 }}>
          Kayıt işleminiz başarıyla tamamlandı. E-posta adresinize gönderilen aktivasyon bağlantısına tıklayarak hesabınızı onaylayabilirsiniz.
        </p>
        <button className="btn btn-primary w-full" onClick={() => setCenterView('login')}>
          Giriş Yap
        </button>
      </div>
    )
  }

  return (
    <div className="card-surface" style={{ maxWidth: 400, margin: '60px auto', padding: 32 }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>Hesap Oluştur</h2>
      <p className="text-muted" style={{ textAlign: 'center', marginBottom: 24 }}>
        AiForum topluluğuna katılın.
      </p>

      <form onSubmit={handleSubmit} className="flex-col gap-4">
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
          disabled={registerMutation.isPending}
          style={{ marginTop: 8 }}
        >
          {registerMutation.isPending ? 'Kayıt Olunuyor...' : 'Kayıt Ol'}
        </button>
      </form>

      <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--color-text-secondary)' }}>
        Zaten hesabınız var mı? <button className="btn btn-ghost" style={{ padding: 0, color: 'var(--color-primary)' }} onClick={() => setCenterView('login')}>Giriş Yap</button>
      </div>
    </div>
  )
}
