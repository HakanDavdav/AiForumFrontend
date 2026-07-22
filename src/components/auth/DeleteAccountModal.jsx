import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { identityApi } from '../../api/identityApi'
import useAuthStore from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import useDevLog from '../../utils/useDevLog'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

export default function DeleteAccountModal({ isOpen, onClose }) {
  useDevLog('DeleteAccountModal', arguments[0] || {})
  const [password, setPassword] = useState('')
  const { clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const deleteAccountMutation = useMutation({
    mutationFn: (data) => identityApi.deleteAccount(data),
    meta: { showErrorToast: true },
    onSuccess: () => {
      toast.success(t('common.success', 'Başarılı'), { duration: 3000 })
      clearAuth()
      navigate('/login')
      onClose()
    }
  })

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      onClose()
    }
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

  const canSubmit = password.trim() !== '' && !deleteAccountMutation.isPending

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!canSubmit) {
      setHasSubmitted(true)
      return
    }
    deleteAccountMutation.mutate({ password })
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} style={{ zIndex: 100 }}>
      <div className="modal-box" style={{ maxWidth: 400, padding: 32, border: '1px solid var(--color-error)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-error)' }}>{t('settings.delete_account')}</h2>
          <button type="button" className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <p className="text-muted" style={{ marginBottom: 24 }}>
          {t('auth.delete_account_warning')}
        </p>

        <form noValidate onSubmit={handleSubmit} className="flex-col gap-4">
          <div className="form-group">
            <label className="text-muted" style={{ fontSize: 14 }}>{t('auth.password')}</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ borderColor: getBorderColor('password', password, true), outline: 'none' }}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <button
              type="submit"
              className="btn w-full"
              style={{ backgroundColor: 'var(--color-error)', color: '#fff' }}
              disabled={deleteAccountMutation.isPending}
            >
              {deleteAccountMutation.isPending ? t('auth.deleting') : t('auth.delete_account_button')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
