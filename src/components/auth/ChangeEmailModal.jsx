import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { identityApi } from '../../api/identityApi'
import useAuthStore from '../../store/authStore'
import useDevLog from '../../utils/useDevLog'
import { X } from 'lucide-react'

const TOTAL_SECONDS = 120

export default function ChangeEmailModal({ isOpen, onClose }) {
  useDevLog('ChangeEmailModal', arguments[0] || {})
  const { actorId } = useAuthStore()
  const [step, setStep] = useState(1) // 1: Request, 2: Confirm, 3: Success
  const [newEmail, setNewEmail] = useState('')
  const [token, setToken] = useState('')
  const [countdown, setCountdown] = useState(TOTAL_SECONDS)

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1)
      setNewEmail('')
      setToken('')
      setCountdown(TOTAL_SECONDS)
    }
  }, [isOpen])

  // Countdown timer for step 2
  useEffect(() => {
    let timer = null
    if (isOpen && step === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [isOpen, step, countdown])

  const requestMutation = useMutation({
    mutationFn: (data) => identityApi.requestEmailChange(data),
    meta: { showErrorToast: true },
    onSuccess: () => {
      setStep(2)
      setCountdown(TOTAL_SECONDS)
    }
  })

  const confirmMutation = useMutation({
    mutationFn: (data) => identityApi.confirmEmailChange(data),
    meta: { showErrorToast: true },
    onSuccess: () => {
      setStep(3)
      setTimeout(() => {
        onClose()
      }, 2000)
    }
  })

  const handleRequestSubmit = (e) => {
    e.preventDefault()
    requestMutation.mutate({ newEmail })
  }

  const handleConfirmSubmit = (e) => {
    e.preventDefault()
    confirmMutation.mutate({ userId: actorId, newEmail, token })
  }

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      onClose()
    }
  }

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const progressPct = (countdown / TOTAL_SECONDS) * 100
  const isLowTime = countdown <= 60
  const hasPastedToken = token.length > 10

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} style={{ zIndex: 100 }}>
      <div className="modal-box" style={{ maxWidth: 400, padding: 32, textAlign: step > 1 ? 'center' : 'left' }}>
        
        {step === 1 && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800 }}>E-posta Değiştir</h2>
              <button type="button" className="btn-icon" onClick={onClose}>
                <X size={20} />
              </button>
            </div>
            <p className="text-muted" style={{ marginBottom: 24, fontSize: 14 }}>
              Yeni e-posta adresinize bir onay kodu göndereceğiz.
            </p>
            <form onSubmit={handleRequestSubmit} className="flex-col gap-4">
              <div className="form-group">
                <label className="text-muted" style={{ fontSize: 14 }}>Yeni E-posta Adresi</label>
                <input
                  className="input"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
              </div>
              <div style={{ marginTop: 16 }}>
                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={requestMutation.isPending}
                >
                  {requestMutation.isPending ? 'Kod Gönderiliyor...' : 'Onay Kodu Gönder'}
                </button>
              </div>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>Onay Kodu Gönderildi</h2>
            <p className="text-muted" style={{ marginBottom: 24 }}>
              <strong>{newEmail}</strong> adresine bir onay kodu gönderdik. Lütfen aşağıdaki alana girin.
            </p>
            
            <form onSubmit={handleConfirmSubmit} className="flex-col gap-4">
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="input"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Onay kodunu buraya yapıştırın"
                  spellCheck={false}
                  autoComplete="off"
                  required
                  style={{
                    textAlign: 'center',
                    padding: '14px',
                    fontSize: 14,
                    letterSpacing: 0.5,
                    border: hasPastedToken ? '2px solid var(--color-primary)' : undefined,
                    paddingRight: hasPastedToken ? '60px' : '14px' // prevent text from hiding under the badge
                  }}
                />
                {hasPastedToken && (
                  <span style={{
                    position: 'absolute', top: '50%', right: 14,
                    transform: 'translateY(-50%)',
                    fontSize: 11, color: 'var(--color-primary)',
                    fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3,
                  }}>
                    ✓ hazır
                  </span>
                )}
              </div>

              <div>
                <div style={{
                  height: 3, borderRadius: 99,
                  background: 'var(--color-border)',
                  overflow: 'hidden', marginBottom: 6,
                }}>
                  <div style={{
                    height: '100%',
                    width: `${progressPct}%`,
                    borderRadius: 99,
                    background: isLowTime ? 'var(--color-error)' : 'var(--color-primary)',
                    transition: 'width 1s linear, background 0.3s',
                  }} />
                </div>
                <p style={{
                  fontSize: 12, margin: 0,
                  color: isLowTime ? 'var(--color-error)' : 'var(--color-text-muted)',
                  fontWeight: isLowTime ? 600 : 400,
                  transition: 'color 0.3s',
                  textAlign: 'left'
                }}>
                  Kodun geçerliliği: <strong>{formatTime(countdown)}</strong>
                </p>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary w-full"
                disabled={confirmMutation.isPending || !token.trim()}
              >
                {confirmMutation.isPending ? 'Onaylanıyor...' : 'Değişikliği Onayla'}
              </button>
            </form>
          </>
        )}

        {step === 3 && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16, color: 'var(--color-success)' }}>Başarılı!</h2>
            <p className="text-muted">
              E-posta adresiniz başarıyla güncellendi.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
