import { useState, useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { identityApi } from '../../api/identityApi'
import { useNavigate } from 'react-router-dom'
import useDevLog from '../../utils/useDevLog'
import { KeyRound, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

const TOTAL_SECONDS = 120 // 2 dakika olarak ayarlıyoruz

export default function TokenModal({ isOpen, email, onSuccess, onTimeout, onClose }) {
  useDevLog('TokenModal', arguments[0] || {})
  const [token, setToken] = useState('')
  const [countdown, setCountdown] = useState(TOTAL_SECONDS)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const textareaRef = useRef(null)
  const navigate = useNavigate()
  const { t } = useTranslation()

  const confirmEmailMutation = useMutation({
    mutationFn: (data) => identityApi.confirmEmail(data),
    meta: { showErrorToast: true },
    onSuccess: () => {
      toast.success(t('common.success', 'Başarılı'), { duration: 3000 })
      setIsConfirmed(true)
      setTimeout(() => {
        if (onSuccess) onSuccess()
        navigate('/login')
      }, 2000)
    },
    onError: () => {
      setToken('')
      textareaRef.current?.focus()
    }
  })

  useEffect(() => {
    let timer = null
    if (isOpen) {
      if (countdown > 0 && !isConfirmed) {
        timer = setInterval(() => setCountdown((prev) => prev - 1), 1000)
      } else if (countdown === 0 && !isConfirmed) {
        if (onTimeout) onTimeout()
      }
    } else {
      setCountdown(TOTAL_SECONDS)
      setToken('')
      setIsConfirmed(false)
    }
    return () => { if (timer) clearInterval(timer) }
  }, [isOpen, countdown, isConfirmed, onTimeout])

  useEffect(() => {
    if (isOpen && !isConfirmed) {
      setTimeout(() => textareaRef.current?.focus(), 150)
    }
  }, [isOpen, isConfirmed])

  const handleChange = (e) => {
    setToken(e.target.value)
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

  const canSubmit = token.trim() !== '' && !confirmEmailMutation.isPending

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!canSubmit) {
      setHasSubmitted(true)
      return
    }
    confirmEmailMutation.mutate({ emailOrUsername: email, token: token.trim() })
  }

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const progressPct = (countdown / TOTAL_SECONDS) * 100
  const isLowTime = countdown <= 60
  const hasPasted = token.length > 10

  if (!isOpen) return null

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div
        className="modal-box"
        style={{ maxWidth: 460, padding: '40px 36px', textAlign: 'center', position: 'relative' }}
        onClick={(e) => e.stopPropagation()}
      >
        {onClose && (
          <button 
            type="button"
            className="btn-icon" 
            onClick={onClose} 
            style={{ position: 'absolute', top: 16, right: 16, color: 'var(--color-text-muted)' }}
          >
            <X size={20} />
          </button>
        )}
        {isConfirmed ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'var(--color-success-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 34, color: 'var(--color-success)',
              animation: 'tkSuccessPop 0.4s cubic-bezier(0.34,1.56,0.64,1)',
            }}>✓</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
              {t('auth.email_verified')}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
              {t('auth.redirecting', 'Giriş ekranına yönlendiriliyorsunuz…')}
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

            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 20px' }}>
              {t('auth.email_verification')}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '12px 0 28px', lineHeight: 1.6 }}>
              <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>{email}</span> adresine
              {' '}{t('auth.email_verification_desc')}
            </p>

            <form noValidate onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Token Input */}
              <div style={{ position: 'relative' }}>
                <input
                  ref={textareaRef}
                  type="text"
                  className="input"
                  value={token}
                  onChange={handleChange}
                  placeholder={t('auth.enter_code')}
                  spellCheck={false}
                  autoComplete="off"
                  required
                  style={{
                    textAlign: 'center',
                    padding: '14px',
                    fontSize: 14,
                    letterSpacing: 0.5,
                    border: `1.5px solid ${getBorderColor('token', token, true)}`,
                    paddingRight: hasPasted ? '60px' : '14px',
                    outline: 'none'
                  }}
                  onFocus={() => setFocused('token')}
                  onBlur={() => setFocused(null)}
                />
                {/* Yapıştırıldı onay etiketi */}
                {hasPasted && (
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
                }}>
                  {t('auth.code_expiry')}: <strong>{formatTime(countdown)}</strong>
                </p>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={confirmEmailMutation.isPending}
              >
                {confirmEmailMutation.isPending ? t('common.verifying') : t('action.verify')}
              </button>
            </form>
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
