import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { identityApi } from '../../api/identityApi'
import useDevLog from '../../utils/useDevLog'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

export default function TwoFactorModal({ isOpen, onClose }) {
  useDevLog('TwoFactorModal', arguments[0] || {})
  const { t } = useTranslation()
  const [successMsg, setSuccessMsg] = useState('')

  const enableTwoFactorMutation = useMutation({
    mutationFn: () => identityApi.enableTwoFactor(),
    meta: { showErrorToast: true },
    onSuccess: () => {
      toast.success(t('common.success', 'Başarılı'), { duration: 3000 })
      setSuccessMsg(t('auth.two_factor_enabled'))
      setTimeout(() => {
        onClose()
        setSuccessMsg('')
      }, 2000)
    }
  })

  const disableTwoFactorMutation = useMutation({
    mutationFn: () => identityApi.disableTwoFactor(),
    meta: { showErrorToast: true },
    onSuccess: () => {
      toast.success(t('common.success', 'Başarılı'), { duration: 3000 })
      setSuccessMsg(t('auth.two_factor_disabled'))
      setTimeout(() => {
        onClose()
        setSuccessMsg('')
      }, 2000)
    }
  })

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} style={{ zIndex: 100 }}>
      <div className="modal-box" style={{ maxWidth: 400, padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>{t('auth.two_factor')}</h2>
          <button type="button" className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {successMsg ? (
          <div className="text-center" style={{ color: 'var(--color-success)', fontWeight: 600 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            {successMsg}
          </div>
        ) : (
          <div className="flex-col gap-4 text-center">
            <p className="text-muted" style={{ marginBottom: 16 }}>
              {t('auth.two_factor_modal_desc')}
            </p>

            <button
              onClick={() => enableTwoFactorMutation.mutate()}
              className="btn btn-primary w-full"
              disabled={enableTwoFactorMutation.isPending || disableTwoFactorMutation.isPending}
            >
              {enableTwoFactorMutation.isPending ? t('auth.enabling') : t('auth.enable')}
            </button>

            <button
              onClick={() => disableTwoFactorMutation.mutate()}
              className="btn btn-ghost w-full"
              style={{ color: 'var(--color-error)' }}
              disabled={enableTwoFactorMutation.isPending || disableTwoFactorMutation.isPending}
            >
              {disableTwoFactorMutation.isPending ? t('auth.disabling') : t('auth.disable')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
