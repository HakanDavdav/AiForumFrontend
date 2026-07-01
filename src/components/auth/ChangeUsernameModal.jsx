import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { identityApi } from '../../api/identityApi'

export default function ChangeUsernameModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    newUsername: '',
    password: ''
  })
  
  const [successMsg, setSuccessMsg] = useState('')

  const changeUsernameMutation = useMutation({
    mutationFn: (data) => identityApi.changeUsername(data),
    onSuccess: () => {
      setSuccessMsg('Kullanıcı adınız başarıyla değiştirildi.')
      setTimeout(() => {
        onClose()
        setSuccessMsg('')
        setFormData({ newUsername: '', password: '' })
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
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>Kullanıcı Adı Değiştir</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: '0 8px' }}>✕</button>
        </div>

        {successMsg ? (
          <div className="text-center" style={{ color: 'var(--color-success)', fontWeight: 600 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            {successMsg}
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); changeUsernameMutation.mutate(formData); }} className="flex-col gap-4">
            <div className="form-group">
              <label className="text-muted" style={{ fontSize: 14 }}>Yeni Kullanıcı Adı</label>
              <input
                className="input"
                type="text"
                value={formData.newUsername}
                onChange={(e) => setFormData({ ...formData, newUsername: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="text-muted" style={{ fontSize: 14 }}>Mevcut Şifreniz</label>
              <input
                className="input"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={changeUsernameMutation.isPending}
              >
                {changeUsernameMutation.isPending ? 'Kaydediliyor...' : 'Değiştir'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
