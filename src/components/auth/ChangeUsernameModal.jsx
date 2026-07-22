import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { identityApi } from '../../api/identityApi'
import useDevLog from '../../utils/useDevLog'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import confetti from 'canvas-confetti'

export default function ChangeUsernameModal({ isOpen, onClose }) {
  useDevLog('ChangeUsernameModal', arguments[0] || {})
  const [formData, setFormData] = useState({
    newUsername: '',
    password: ''
  })
  
  const { t } = useTranslation()
  const [successMsg, setSuccessMsg] = useState('')

  const changeUsernameMutation = useMutation({
    mutationFn: (data) => identityApi.changeUsername(data),
    meta: { showErrorToast: true },
    onSuccess: () => {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
      onClose()
      setFormData({ newUsername: '', password: '' })
      setHasSubmitted(false)
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

  const canSubmit = formData.newUsername.trim() !== '' && formData.password.trim() !== '' && !changeUsernameMutation.isPending

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!canSubmit) {
      setHasSubmitted(true)
      return
    }
    changeUsernameMutation.mutate(formData)
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} style={{ zIndex: 100 }}>
      <div className="modal-box" style={{ maxWidth: 400, padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>{t('settings.change_username')}</h2>
          <button type="button" className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form noValidate onSubmit={handleSubmit} className="flex-col gap-4">
            <div className="form-group">
              <label className="text-muted" style={{ fontSize: 14 }}>{t('auth.new_username')}</label>
              <input
                className="input"
                type="text"
                value={formData.newUsername}
                onChange={(e) => setFormData({ ...formData, newUsername: e.target.value })}
                required
                style={{ borderColor: getBorderColor('newUsername', formData.newUsername, true), outline: 'none' }}
                onFocus={() => setFocused('newUsername')}
                onBlur={() => setFocused(null)}
              />
            </div>

            <div className="form-group">
              <label className="text-muted" style={{ fontSize: 14 }}>{t('auth.current_password')}</label>
              <input
                className="input"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                style={{ borderColor: getBorderColor('password', formData.password, true), outline: 'none' }}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={changeUsernameMutation.isPending}
              >
                {changeUsernameMutation.isPending ? t('action.saving') : t('action.change')}
              </button>
            </div>
          </form>
      </div>
    </div>
  )
}
