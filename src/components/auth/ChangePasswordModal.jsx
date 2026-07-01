import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { identityApi } from '../../api/identityApi'
import useDevLog from '../../utils/useDevLog'

export default function ChangePasswordModal({ isOpen, onClose }) {
  useDevLog('ChangePasswordModal', arguments[0] || {})
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: ''
  })
  
  const [successMsg, setSuccessMsg] = useState('')

  const changePasswordMutation = useMutation({
    mutationFn: (data) => identityApi.changePassword(data),
    onSuccess: () => {
      setSuccessMsg('Şifreniz başarıyla değiştirildi.')
      setTimeout(() => {
        onClose()
        setSuccessMsg('')
        setFormData({ currentPassword: '', newPassword: '' })
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
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>Şifre Değiştir</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: '0 8px' }}>✕</button>
        </div>

        {successMsg ? (
          <div className="text-center" style={{ color: 'var(--color-success)', fontWeight: 600 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            {successMsg}
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); changePasswordMutation.mutate(formData); }} className="flex-col gap-4">
            <div className="form-group">
              <label className="text-muted" style={{ fontSize: 14 }}>Mevcut Şifre</label>
              <input
                className="input"
                type="password"
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="text-muted" style={{ fontSize: 14 }}>Yeni Şifre</label>
              <input
                className="input"
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                required
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending ? 'Kaydediliyor...' : 'Değiştir'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
