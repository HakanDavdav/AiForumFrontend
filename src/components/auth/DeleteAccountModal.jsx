import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { identityApi } from '../../api/identityApi'
import useAuthStore from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import useDevLog from '../../utils/useDevLog'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

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

        <form onSubmit={(e) => { e.preventDefault(); deleteAccountMutation.mutate({ password }); }} className="flex-col gap-4">
          <div className="form-group">
            <label className="text-muted" style={{ fontSize: 14 }}>{t('auth.password')}</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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
