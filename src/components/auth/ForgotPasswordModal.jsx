import { useState, useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { identityApi } from '../../api/identityApi'
import useDevLog from '../../utils/useDevLog'
import { KeyRound, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import confetti from 'canvas-confetti'
import { useNavigate } from 'react-router-dom'

const VERIFY_SECONDS = 120
const PASSWORD_SECONDS = 180

export default function ForgotPasswordModal({ isOpen, onClose }) {
  useDevLog('ForgotPasswordModal', arguments[0] || {})
  
  // Step: 'request' | 'verify_token' | 'set_password' | 'success'
  const [step, setStep] = useState('request')
  const { t } = useTranslation()
  const navigate = useNavigate()
  
  // Form fields
  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [confirmToken, setConfirmToken] = useState('')
  const [newPassword, setNewPassword] = useState('')

  // Countdown
  const [countdown, setCountdown] = useState(VERIFY_SECONDS)
  const textareaRef = useRef(null)

  // 1. Request Password Reset Mutation
  const requestResetMutation = useMutation({
    mutationFn: (data) => identityApi.requestPasswordReset(data),
    meta: { showErrorToast: true },
    onSuccess: () => {
      setStep('verify_token')
      setCountdown(VERIFY_SECONDS)
    }
  })

  // 2. Verify Token Mutation
  const verifyTokenMutation = useMutation({
    mutationFn: (data) => identityApi.verifyPasswordResetToken(data),
    meta: { showErrorToast: true },
    onSuccess: () => {
      setStep('set_password')
      setCountdown(PASSWORD_SECONDS)
    }
  })

  // 3. Confirm Password Reset Mutation
  const confirmResetMutation = useMutation({
    mutationFn: (data) => identityApi.confirmPasswordReset(data),
    meta: { showErrorToast: true },
    onSuccess: () => {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
      onClose()
    }
  })

  // Countdown Logic
  useEffect(() => {
    let timer = null
    if (isOpen && (step === 'verify_token' || step === 'set_password')) {
      if (countdown > 0) {
        timer = setInterval(() => {
          setCountdown((prev) => prev - 1)
        }, 1000)
      } else if (countdown === 0) {
        if (step === 'verify_token') {
          setStep('request')
          setConfirmToken('')
        } else if (step === 'set_password') {
          toast.error(t('common.session_timeout', 'Oturum zaman aşımına uğradı.'))
          handleClose()
          navigate('/register')
        }
      }
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [isOpen, step, countdown])

  useEffect(() => {
    if (isOpen && step === 'verify_token') {
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
      setCountdown(VERIFY_SECONDS)
      setHasSubmitted(false)
    }, 300)
  }

  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [focused, setFocused] = useState(null)

  const getBorderColor = (fieldName, value, isRequired) => {
    if (focused === fieldName) return 'var(--color-primary)'
    if (!hasSubmitted) return 'var(--color-border)'
    
    if (isRequired) {
      return (!value || !value.trim()) ? 'var(--color-error)' : 'var(--color-primary)'
    }
    return 'var(--color-border)'
  }

  const canSubmitRequest = emailOrUsername.trim() !== '' && !requestResetMutation.isPending
  const canSubmitVerify = confirmToken.trim() !== '' && !verifyTokenMutation.isPending
  const canSubmitConfirm = newPassword.trim() !== '' && !confirmResetMutation.isPending

  const handleRequestSubmit = (e) => {
    e.preventDefault()
    if (!canSubmitRequest) {
      setHasSubmitted(true)
      return
    }
    requestResetMutation.mutate({ emailOrUsername, distributionStrategy: 0 })
  }

  const handleVerifySubmit = (e) => {
    e.preventDefault()
    if (!canSubmitVerify) {
      setHasSubmitted(true)
      return
    }
    verifyTokenMutation.mutate({ emailOrUsername, token: confirmToken.trim() })
  }

  const handleConfirmSubmit = (e) => {
    e.preventDefault()
    if (!canSubmitConfirm) {
      setHasSubmitted(true)
      return
    }
    confirmResetMutation.mutate({ emailOrUsername, token: confirmToken.trim(), newPassword })
  }

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  
  const currentTotalSeconds = step === 'set_password' ? PASSWORD_SECONDS : VERIFY_SECONDS
  const progressPct = (countdown / currentTotalSeconds) * 100
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
                
                <form noValidate onSubmit={handleRequestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <input 
                    className="input" 
                    type="text" 
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    required 
                    placeholder={t('auth.email_or_username')}
                    style={{ textAlign: 'center', padding: '14px', fontSize: 14, borderColor: getBorderColor('emailOrUsername', emailOrUsername, true), outline: 'none' }}
                    onFocus={() => setFocused('emailOrUsername')}
                    onBlur={() => setFocused(null)}
                  />

                  <button 
                    type="submit" 
                    className="btn btn-primary w-full"
                    disabled={requestResetMutation.isPending}
                    style={{ marginTop: 8 }}
                  >
                    {requestResetMutation.isPending ? t('common.sending') : t('action.send')}
                  </button>
                </form>
              </>
            )}

            {step === 'verify_token' && (
              <>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 20px' }}>
                  {t('auth.reset_password')}
                </h2>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '12px 0 28px', lineHeight: 1.6 }}>
                  <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>{emailOrUsername}</span> adresine
                  {' '}{t('auth.reset_password_desc')}
                </p>
                
                <form noValidate onSubmit={handleVerifySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  
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
                        border: `1.5px solid ${getBorderColor('confirmToken', confirmToken, true)}`,
                        paddingRight: hasPastedToken ? '60px' : '14px',
                        outline: 'none'
                      }}
                      onFocus={() => setFocused('confirmToken')}
                      onBlur={() => setFocused(null)}
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
                    disabled={verifyTokenMutation.isPending}
                    style={{ marginTop: 8 }}
                  >
                    {verifyTokenMutation.isPending ? t('common.verifying') : t('action.verify')}
                  </button>
                </form>
              </>
            )}

            {step === 'set_password' && (
              <>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 20px' }}>
                  {t('settings.change_password')}
                </h2>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '12px 0 28px', lineHeight: 1.6 }}>
                  Lütfen yeni şifrenizi belirleyin.
                </p>
                
                <form noValidate onSubmit={handleConfirmSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  
                  {/* New Password */}
                  <input 
                    className="input" 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required 
                    minLength={6}
                    placeholder={t('auth.new_password')}
                    style={{ textAlign: 'center', padding: '14px', fontSize: 14, borderColor: getBorderColor('newPassword', newPassword, true), outline: 'none' }}
                    onFocus={() => setFocused('newPassword')}
                    onBlur={() => setFocused(null)}
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
                    disabled={confirmResetMutation.isPending}
                    style={{ marginTop: 8 }}
                  >
                    {confirmResetMutation.isPending ? t('common.verifying') : t('settings.change_password')}
                  </button>
                </form>
              </>
            )}
      </div>
    </div>
  )
}
