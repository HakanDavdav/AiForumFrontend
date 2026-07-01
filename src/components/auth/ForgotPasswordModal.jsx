import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { identityApi } from '../../api/identityApi'

export default function ForgotPasswordModal({ isOpen, onClose }) {
  // Step: 'request' | 'confirm' | 'success'
  const [step, setStep] = useState('request')
  
  // Form fields
  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [confirmToken, setConfirmToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  
  // Errors
  const [error, setError] = useState(null)
  
  // Countdown
  const [countdown, setCountdown] = useState(30)

  // 1. Request Password Reset Mutation
  const requestResetMutation = useMutation({
    mutationFn: (data) => identityApi.requestPasswordReset(data),
    onSuccess: () => {
      setStep('confirm')
      setCountdown(30)
      setError(null)
    },
    onError: (err) => {
      setError(err.message || 'Kod gönderilirken hata oluştu.')
    }
  })

  // 2. Confirm Password Reset Mutation
  const confirmResetMutation = useMutation({
    mutationFn: (data) => identityApi.confirmPasswordReset(data),
    onSuccess: () => {
      setStep('success')
      setTimeout(() => {
        handleClose()
      }, 1500)
    },
    onError: (err) => {
      setError(err.message || 'Onay kodu veya şifre geçersiz.')
    }
  })

  // Countdown Logic
  useEffect(() => {
    let timer = null
    if (isOpen && step === 'confirm') {
      if (countdown > 0) {
        timer = setInterval(() => {
          setCountdown((prev) => prev - 1)
        }, 1000)
      } else if (countdown === 0) {
        setStep('request')
        setError('Süreniz doldu (30 saniye). Lütfen tekrar deneyin.')
        setConfirmToken('')
        setNewPassword('')
      }
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [isOpen, step, countdown])

  const handleClose = () => {
    onClose()
    // reset state after closing animation
    setTimeout(() => {
      setStep('request')
      setEmailOrUsername('')
      setConfirmToken('')
      setNewPassword('')
      setError(null)
      setCountdown(30)
    }, 300)
  }

  const handleRequestSubmit = (e) => {
    e.preventDefault()
    setError(null)
    // distributionStrategy: 0 (Email)
    requestResetMutation.mutate({ emailOrUsername, distributionStrategy: 0 })
  }

  const handleConfirmSubmit = (e) => {
    e.preventDefault()
    setError(null)
    confirmResetMutation.mutate({ emailOrUsername, token: confirmToken, newPassword })
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" style={{ zIndex: 100 }} onClick={handleClose}>
      <div className="modal-box" style={{ maxWidth: 400, padding: 32, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
        
        {step === 'success' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16, color: 'var(--color-success)' }}>Confirmed!</h2>
            <p className="text-muted" style={{ marginBottom: 24 }}>
              Şifreniz başarıyla değiştirildi. Giriş yapabilirsiniz...
            </p>
          </>
        )}

        {step === 'request' && (
          <>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>Şifremi Unuttum</h2>
            <p className="text-muted" style={{ marginBottom: 24 }}>
              Kayıtlı e-posta adresinizi veya kullanıcı adınızı girin. Size bir onay kodu göndereceğiz.
            </p>
            
            <form onSubmit={handleRequestSubmit} className="flex-col gap-4">
              <div className="form-group">
                <input 
                  className="input" 
                  type="text" 
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  required 
                  placeholder="E-posta veya Kullanıcı Adı"
                />
              </div>

              {error && <div className="form-error text-center">{error}</div>}

              <button 
                type="submit" 
                className="btn btn-primary w-full"
                disabled={requestResetMutation.isPending}
              >
                {requestResetMutation.isPending ? 'Gönderiliyor...' : 'Gönder'}
              </button>
            </form>
          </>
        )}

        {step === 'confirm' && (
          <>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>Şifreyi Yenile</h2>
            <p className="text-muted" style={{ marginBottom: 24 }}>
              <strong>{emailOrUsername}</strong> adresine bir onay kodu gönderdik. Yeni şifrenizi ve kodu girin.
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
              <div className="form-group">
                <input 
                  className="input" 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required 
                  minLength={6}
                  placeholder="Yeni Şifre"
                />
              </div>

              {error && <div className="form-error text-center">{error}</div>}

              <button 
                type="submit" 
                className="btn btn-primary w-full"
                disabled={confirmResetMutation.isPending}
              >
                {confirmResetMutation.isPending ? 'Onaylanıyor...' : 'Şifreyi Değiştir'}
              </button>
            </form>

            <div style={{ marginTop: 24, fontSize: 14, color: countdown <= 10 ? 'var(--color-error)' : 'var(--color-text-secondary)' }}>
              Kalan Süre: <strong>{countdown} sn</strong>
            </div>
          </>
        )}

        {step !== 'success' && (
          <button 
            className="btn btn-ghost" 
            style={{ marginTop: 16, fontSize: 13 }} 
            onClick={handleClose}
          >
            İptal
          </button>
        )}
      </div>
    </div>
  )
}
