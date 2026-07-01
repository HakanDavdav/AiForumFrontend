import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { identityApi } from '../../api/identityApi'
import useUIStore from '../../store/uiStore'

export default function TokenModal({ isOpen, email, onSuccess, onTimeout }) {
  const [confirmToken, setConfirmToken] = useState('')
  const [countdown, setCountdown] = useState(30)
  const [confirmError, setConfirmError] = useState(null)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const { setCenterView } = useUIStore()

  const confirmEmailMutation = useMutation({
    mutationFn: (data) => identityApi.confirmEmail(data),
    onSuccess: () => {
      setIsConfirmed(true)
      setTimeout(() => {
        if (onSuccess) onSuccess()
        setCenterView('login')
      }, 1500)
    },
    onError: (err) => {
      setConfirmError(err.message || 'Onay kodu geçersiz.')
    }
  })

  useEffect(() => {
    let timer = null
    if (isOpen) {
      if (countdown > 0 && !isConfirmed) {
        timer = setInterval(() => {
          setCountdown((prev) => prev - 1)
        }, 1000)
      } else if (countdown === 0 && !isConfirmed) {
        if (onTimeout) onTimeout()
      }
    } else {
      // Reset state when closed
      setCountdown(30)
      setConfirmToken('')
      setConfirmError(null)
      setIsConfirmed(false)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [isOpen, countdown, isConfirmed, onTimeout])

  const handleConfirmSubmit = (e) => {
    e.preventDefault()
    setConfirmError(null)
    confirmEmailMutation.mutate({ emailOrUsername: email, token: confirmToken })
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" style={{ zIndex: 100 }}>
      <div className="modal-box" style={{ maxWidth: 400, padding: 32, textAlign: 'center' }}>
        {isConfirmed ? (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16, color: 'var(--color-success)' }}>Confirmed!</h2>
            <p className="text-muted" style={{ marginBottom: 24 }}>
              E-posta adresiniz başarıyla onaylandı. Giriş ekranına yönlendiriliyorsunuz...
            </p>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>Onay Kodu Gönderildi</h2>
            <p className="text-muted" style={{ marginBottom: 24 }}>
              <strong>{email}</strong> adresine bir onay kodu gönderdik. Lütfen aşağıdaki alana girin.
            </p>
            
            <form onSubmit={handleConfirmSubmit} className="flex-col gap-4">
              <div className="form-group">
                <input 
                  className="input text-center" 
                  type="text" 
                  value={confirmToken}
                  onChange={(e) => setConfirmToken(e.target.value)}
                  required 
                  placeholder="Onay Kodu"
                  style={{ fontSize: 24, letterSpacing: 4 }}
                />
              </div>

              {confirmError && <div className="form-error text-center">{confirmError}</div>}

              <button 
                type="submit" 
                className="btn btn-primary w-full"
                disabled={confirmEmailMutation.isPending}
              >
                {confirmEmailMutation.isPending ? 'Onaylanıyor...' : 'Onayla'}
              </button>
            </form>

            <div style={{ marginTop: 24, fontSize: 14, color: countdown <= 10 ? 'var(--color-error)' : 'var(--color-text-secondary)' }}>
              Kalan Süre: <strong>{countdown} sn</strong>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
