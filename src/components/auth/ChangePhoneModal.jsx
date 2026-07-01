import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { identityApi } from '../../api/identityApi'

export default function ChangePhoneModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1) // 1: Request, 2: Confirm, 3: Success
  const [phoneNumber, setPhoneNumber] = useState('')
  const [token, setToken] = useState('')
  const [countdown, setCountdown] = useState(30)

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1)
      setPhoneNumber('')
      setToken('')
      setCountdown(30)
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
    mutationFn: (data) => identityApi.requestPhoneChange(data),
    onSuccess: () => {
      setStep(2)
      setCountdown(30)
    }
  })

  const confirmMutation = useMutation({
    mutationFn: (data) => identityApi.confirmPhone(data),
    onSuccess: () => {
      setStep(3)
      setTimeout(() => {
        onClose()
      }, 2000)
    }
  })

  const handleRequestSubmit = (e) => {
    e.preventDefault()
    requestMutation.mutate({ phoneNumber })
  }

  const handleConfirmSubmit = (e) => {
    e.preventDefault()
    confirmMutation.mutate({ token })
  }

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} style={{ zIndex: 100 }}>
      <div className="modal-box" style={{ maxWidth: 400, padding: 32, textAlign: step > 1 ? 'center' : 'left' }}>
        
        {step === 1 && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800 }}>Telefon Numarası Ekle/Değiştir</h2>
              <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: '0 8px' }}>✕</button>
            </div>
            <p className="text-muted" style={{ marginBottom: 24, fontSize: 14 }}>
              Telefon numaranıza bir SMS onay kodu göndereceğiz.
            </p>
            <form onSubmit={handleRequestSubmit} className="flex-col gap-4">
              <div className="form-group">
                <label className="text-muted" style={{ fontSize: 14 }}>Telefon Numarası</label>
                <input
                  className="input"
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+905..."
                  required
                />
              </div>
              <div style={{ marginTop: 16 }}>
                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={requestMutation.isPending}
                >
                  {requestMutation.isPending ? 'Kod Gönderiliyor...' : 'SMS Gönder'}
                </button>
              </div>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>Onay Kodu Gönderildi</h2>
            <p className="text-muted" style={{ marginBottom: 24 }}>
              <strong>{phoneNumber}</strong> numarasına bir onay kodu gönderdik. Lütfen kodu girin.
            </p>
            
            <form onSubmit={handleConfirmSubmit} className="flex-col gap-4">
              <div className="form-group">
                <input 
                  className="input text-center" 
                  type="text" 
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required 
                  placeholder="Onay Kodu"
                  style={{ fontSize: 24, letterSpacing: 4 }}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary w-full"
                disabled={confirmMutation.isPending}
              >
                {confirmMutation.isPending ? 'Onaylanıyor...' : 'Değişikliği Onayla'}
              </button>
            </form>

            <div style={{ marginTop: 24, fontSize: 14, color: countdown <= 10 ? 'var(--color-error)' : 'var(--color-text-secondary)' }}>
              Kalan Süre: <strong>{countdown} sn</strong>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16, color: 'var(--color-success)' }}>Başarılı!</h2>
            <p className="text-muted">
              Telefon numaranız başarıyla güncellendi.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
