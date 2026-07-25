import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { identityApi } from '../../api/identityApi'
import useAuthStore from '../../store/authStore'
import useDevLog from '../../utils/useDevLog'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { triggerConfetti } from '../../utils/confetti'
import TokenModal from './TokenModal'

export default function ChangeEmailModal({ isOpen, onClose }) {
  useDevLog('ChangeEmailModal', arguments[0] || {})
  const { t } = useTranslation()
  const { actorId } = useAuthStore()
  const [step, setStep] = useState(1) // 1: Request, 2: Confirm
  const [newEmail, setNewEmail] = useState('')

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1)
      setNewEmail('')
    }
  }, [isOpen])

  const requestMutation = useMutation({
    mutationFn: (data) => identityApi.requestEmailChange(data),
    meta: { showErrorToast: true },
    onSuccess: () => {
      setStep(2)
    }
  })

  const confirmMutation = useMutation({
    mutationFn: (data) => identityApi.confirmEmailChange(data),
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

  const canSubmitRequest = newEmail.trim() !== '' && !requestMutation.isPending

  const handleRequestSubmit = (e) => {
    e.preventDefault()
    if (!canSubmitRequest) {
      setHasSubmitted(true)
      return
    }
    requestMutation.mutate({ newEmail })
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
        title={t('auth.change_email_title')}
        targetText={newEmail}
        onSubmit={(token) => confirmMutation.mutate({ userId: actorId, newEmail, token })}
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
              <h2 style={{ fontSize: 24, fontWeight: 800 }}>{t('auth.change_email_title')}</h2>
              <button type="button" className="btn-icon" onClick={onClose}>
                <X size={20} />
              </button>
            </div>
            <p className="text-muted" style={{ marginBottom: 24, fontSize: 14 }}>
              {t('auth.change_email_desc')}
            </p>
            <form noValidate onSubmit={handleRequestSubmit} className="flex-col gap-4">
              <div className="form-group">
                <label className="text-muted" style={{ fontSize: 14 }}>{t('auth.new_email')}</label>
                <input
                  className="input"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  style={{ borderColor: getBorderColor('newEmail', newEmail, true), outline: 'none' }}
                  onFocus={() => setFocused('newEmail')}
                  onBlur={() => setFocused(null)}
                />
              </div>
              <div style={{ marginTop: 16 }}>
                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={requestMutation.isPending}
                >
                  {requestMutation.isPending ? t('action.sending') : t('action.send')}
                </button>
              </div>
            </form>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
