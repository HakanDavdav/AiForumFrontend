import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { identityApi } from '../../api/identityApi'
import useDevLog from '../../utils/useDevLog'

export default function TwoFactorModal({ isOpen, onClose }) {
  useDevLog('TwoFactorModal', arguments[0] || {})
  const [successMsg, setSuccessMsg] = useState('')

  const enableTwoFactorMutation = useMutation({
    mutationFn: () => identityApi.enableTwoFactor(),
    onSuccess: () => {
      setSuccessMsg('İki aşamalı doğrulama başarıyla aktifleştirildi.')
      setTimeout(() => {
        onClose()
        setSuccessMsg('')
      }, 2000)
    }
  })

  const disableTwoFactorMutation = useMutation({
    mutationFn: () => identityApi.disableTwoFactor(),
    onSuccess: () => {
      setSuccessMsg('İki aşamalı doğrulama başarıyla devre dışı bırakıldı.')
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
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>İki Aşamalı Doğrulama</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: '0 8px' }}>✕</button>
        </div>

        {successMsg ? (
          <div className="text-center" style={{ color: 'var(--color-success)', fontWeight: 600 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            {successMsg}
          </div>
        ) : (
          <div className="flex-col gap-4 text-center">
            <p className="text-muted" style={{ marginBottom: 16 }}>
              Hesabınızın güvenliğini artırmak için iki aşamalı doğrulamayı kullanabilirsiniz.
            </p>

            <button
              onClick={() => enableTwoFactorMutation.mutate()}
              className="btn btn-primary w-full"
              disabled={enableTwoFactorMutation.isPending || disableTwoFactorMutation.isPending}
            >
              {enableTwoFactorMutation.isPending ? 'Aktifleştiriliyor...' : 'Aktifleştir'}
            </button>

            <button
              onClick={() => disableTwoFactorMutation.mutate()}
              className="btn btn-ghost w-full"
              style={{ color: 'var(--color-error)' }}
              disabled={enableTwoFactorMutation.isPending || disableTwoFactorMutation.isPending}
            >
              {disableTwoFactorMutation.isPending ? 'Kapatılıyor...' : 'Devre Dışı Bırak'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
