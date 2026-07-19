import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { identityApi } from '../../api/identityApi'
import useDevLog from '../../utils/useDevLog'
import { X, CheckCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'

const TOTAL_SECONDS = 120

export default function ChangePhoneModal({ isOpen, onClose }) {
  useDevLog('ChangePhoneModal', arguments[0] || {})
  const { t } = useTranslation()
  const [step, setStep] = useState(1) // 1: Request, 2: Confirm, 3: Success
  const [phoneNumber, setPhoneNumber] = useState('')
  const [token, setToken] = useState('')
  const [countdown, setCountdown] = useState(TOTAL_SECONDS)

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1)
      setPhoneNumber('')
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
    mutationFn: (data) => identityApi.requestPhoneChange(data),
    meta: { showErrorToast: true },
    onSuccess: () => {
      setStep(2)
      setCountdown(TOTAL_SECONDS)
    }
  })

  const confirmMutation = useMutation({
    mutationFn: (data) => identityApi.confirmPhone(data),
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

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const progressPct = (countdown / TOTAL_SECONDS) * 100
  const isLowTime = countdown <= 60
  const hasPastedToken = token.length > 10

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} style={{ zIndex: 100 }}>
      <div className="modal-box" style={{ maxWidth: 400, padding: 32, textAlign: step > 1 ? 'center' : 'left' }}>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 24, fontWeight: 800 }}>{t('auth.change_phone_title')}</h2>
                <button type="button" className="btn-icon" onClick={onClose}>
                  <X size={20} />
                </button>
              </div>
              <p className="text-muted" style={{ marginBottom: 24, fontSize: 14 }}>
                {t('auth.change_phone_desc')}
              </p>
              <form onSubmit={handleRequestSubmit} className="flex-col gap-4">
                <div className="form-group">
                  <label className="text-muted" style={{ fontSize: 14 }}>{t('auth.phone_label')}</label>
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
                    {requestMutation.isPending ? t('common.sending') : t('auth.send_sms')}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>{t('auth.code_sent')}</h2>
              <p className="text-muted" style={{ marginBottom: 24 }}>
                {t('auth.code_sent_desc', { phone: phoneNumber })}
              </p>
              
              <form onSubmit={handleConfirmSubmit} className="flex-col gap-4">
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="input"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
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
                      paddingRight: hasPastedToken ? '60px' : '14px'
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
                    {t('auth.code_expiry')}: <strong>{formatTime(countdown)}</strong>
                  </p>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary w-full"
                  disabled={confirmMutation.isPending || !token.trim()}
                >
                  {confirmMutation.isPending ? t('common.verifying') : t('auth.confirm_change')}
                </button>
              </form>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3" 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="text-center"
            >
              <div style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', width: 64, height: 64, borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--color-success)', marginBottom: 24 }}>
                <CheckCircle size={32} />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16, color: 'var(--color-success)' }}>{t('auth.success_title')}</h2>
              <p className="text-muted">
                {t('auth.change_phone_success')}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
