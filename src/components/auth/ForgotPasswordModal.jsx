import { useState, useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { identityApi } from '../../api/identityApi'
import useDevLog from '../../utils/useDevLog'
import { KeyRound, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const TOTAL_SECONDS = 120 // 2 dakika olarak ayarlıyoruz

export default function ForgotPasswordModal({ isOpen, onClose }) {
  useDevLog('ForgotPasswordModal', arguments[0] || {})
  
  // Step: 'request' | 'confirm' | 'success'
  const [step, setStep] = useState('request')
  const { t } = useTranslation()
  
  // Form fields
  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [confirmToken, setConfirmToken] = useState('')
  const [newPassword, setNewPassword] = useState('')

  // Countdown
  const [countdown, setCountdown] = useState(TOTAL_SECONDS)
  const textareaRef = useRef(null)

  // 1. Request Password Reset Mutation
  const requestResetMutation = useMutation({
    mutationFn: (data) => identityApi.requestPasswordReset(data),
    meta: { showErrorToast: true },
    onSuccess: () => {
      setStep('confirm')
      setCountdown(TOTAL_SECONDS)
    }
  })

  // 2. Confirm Password Reset Mutation
  const confirmResetMutation = useMutation({
    mutationFn: (data) => identityApi.confirmPasswordReset(data),
    meta: { showErrorToast: true },
    onSuccess: () => {
      setStep('success')
      setTimeout(() => {
        handleClose()
      }, 2000)
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
        setConfirmToken('')
        setNewPassword('')
      }
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [isOpen, step, countdown])

  useEffect(() => {
    if (isOpen && step === 'confirm') {
      setTimeout(() => textareaRef.current?.focus(), 150)
    }
  }, [isOpen, step])

  const handleClose = () => {
    onClose()
    setTimeout(() => {
      setStep('request')
      setEmailOrUsername('')
      setConfirmToken('')
      setNewPassword('')
      setCountdown(TOTAL_SECONDS)
    }, 300)
  }

  const handleRequestSubmit = (e) => {
    e.preventDefault()
    // distributionStrategy: 0 (Email)
    requestResetMutation.mutate({ emailOrUsername, distributionStrategy: 0 })
  }

  const handleConfirmSubmit = (e) => {
    e.preventDefault()
    if (!confirmToken.trim() || !newPassword) return
    confirmResetMutation.mutate({ emailOrUsername, token: confirmToken.trim(), newPassword })
  }

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const progressPct = (countdown / TOTAL_SECONDS) * 100
  const isLowTime = countdown <= 60
  const hasPastedToken = confirmToken.length > 10

  if (!isOpen) return null

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={handleClose}>
      <div 
        className="modal-box" 
        style={{ maxWidth: 460, padding: '40px 36px', textAlign: 'center', position: 'relative' }} 
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          type="button"
          className="btn-icon" 
          onClick={handleClose} 
          style={{ position: 'absolute', top: 16, right: 16, color: 'var(--color-text-muted)' }}
        >
          <X size={20} />
        </button>

        {step === 'success' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'var(--color-success-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 34, color: 'var(--color-success)',
              animation: 'tkSuccessPop 0.4s cubic-bezier(0.34,1.56,0.64,1)',
            }}>✓</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
              {t('auth.password_changed')}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
              {t('auth.password_changed_desc')}
            </p>
          </div>
        ) : (
          <>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'var(--color-primary-lighter)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <KeyRound size={26} color="var(--color-primary)" strokeWidth={2} />
            </div>

            {step === 'request' && (
              <>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 20px' }}>
                  {t('auth.forgot_password_title')}
                </h2>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '12px 0 28px', lineHeight: 1.6 }}>
                  {t('auth.forgot_password_desc')}
                </p>
                
                <form onSubmit={handleRequestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <input 
                    className="input" 
                    type="text" 
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    required 
                    placeholder={t('auth.email_or_username')}
                    style={{ textAlign: 'center', padding: '14px', fontSize: 14 }}
                  />

                  <button 
                    type="submit" 
                    className="btn btn-primary w-full"
                    disabled={requestResetMutation.isPending || !emailOrUsername.trim()}
                    style={{ marginTop: 8 }}
                  >
                    {requestResetMutation.isPending ? t('common.sending') : t('action.send')}
                  </button>
                </form>
              </>
            )}

            {step === 'confirm' && (
              <>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 20px' }}>
                  {t('auth.reset_password')}
                </h2>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '12px 0 28px', lineHeight: 1.6 }}>
                  <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>{emailOrUsername}</span> adresine
                  {' '}{t('auth.reset_password_desc')}
                </p>
                
                <form onSubmit={handleConfirmSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  
                  {/* Token Input */}
                  <div style={{ position: 'relative' }}>
                    <input
                      ref={textareaRef}
                      type="text"
                      className="input"
                      value={confirmToken}
                      onChange={(e) => setConfirmToken(e.target.value)}
                      placeholder={t('auth.enter_code')}
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
                        ✓ {t('common.ready')}
                      </span>
                    )}
                  </div>

                  {/* New Password */}
                  <input 
                    className="input" 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required 
                    minLength={6}
                    placeholder={t('auth.new_password')}
                    style={{ textAlign: 'center', padding: '14px', fontSize: 14 }}
                  />

                  {/* Geri Sayım */}
                  <div style={{ marginTop: 8 }}>
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
                    }}>
                      {t('auth.code_expiry')}: <strong>{formatTime(countdown)}</strong>
                    </p>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary w-full"
                    disabled={confirmResetMutation.isPending || !confirmToken.trim() || !newPassword}
                    style={{ marginTop: 8 }}
                  >
                    {confirmResetMutation.isPending ? t('common.verifying') : t('settings.change_password')}
                  </button>
                </form>
              </>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes tkSuccessPop {
          from { transform: scale(0.5); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  )
}
