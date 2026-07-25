import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { identityApi } from '../../api/identityApi'
import useDevLog from '../../utils/useDevLog'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { triggerConfetti } from '../../utils/confetti'
import TokenModal from './TokenModal'

export default function ChangePhoneModal({ isOpen, onClose }) {
  useDevLog('ChangePhoneModal', arguments[0] || {})
  const { t } = useTranslation()
  const [step, setStep] = useState(1) // 1: Request, 2: Confirm
  const [phoneNumber, setPhoneNumber] = useState('')

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1)
      setPhoneNumber('')
    }
  }, [isOpen])

  const requestMutation = useMutation({
    mutationFn: (data) => identityApi.requestPhoneChange(data),
    meta: { showErrorToast: true },
    onSuccess: () => {
      setStep(2)
    }
  })

  const confirmMutation = useMutation({
    mutationFn: (data) => identityApi.confirmPhone(data),
    meta: { showErrorToast: true },
    onSuccess: () => {
      onClose()
      triggerConfetti()
    }
  })

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

  const canSubmitRequest = phoneNumber.trim() !== '' && !requestMutation.isPending

  const handleRequestSubmit = (e) => {
    e.preventDefault()
    if (!canSubmitRequest) {
      setHasSubmitted(true)
      return
    }
    requestMutation.mutate({ phoneNumber })
  }

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      onClose()
    }
  }

  if (!isOpen) return null

  if (step === 2) {
    return (
      <TokenModal
        isOpen={isOpen}
        title={t('auth.change_phone_title')}
        targetText={phoneNumber}
        onSubmit={(token) => confirmMutation.mutate({ token })}
        isPending={confirmMutation.isPending}
        onClose={onClose}
      />
    )
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} style={{ zIndex: 100 }}>
      <div className="modal-box" style={{ maxWidth: 400, padding: 32, textAlign: 'left' }}>
        <AnimatePresence mode="wait">
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
            <form noValidate onSubmit={handleRequestSubmit} className="flex-col gap-4">
              <div className="form-group">
                <label className="text-muted" style={{ fontSize: 14 }}>{t('auth.phone_label')}</label>
                <input
                  className="input"
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+905..."
                  required
                  style={{ borderColor: getBorderColor('phoneNumber', phoneNumber, true), outline: 'none' }}
                  onFocus={() => setFocused('phoneNumber')}
                  onBlur={() => setFocused(null)}
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
        </AnimatePresence>
      </div>
    </div>
  )
}
