import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { adminApi } from '../../api/adminApi'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

export default function ActorManagementPanel() {
  const { t } = useTranslation()
  const [actorId, setActorId] = useState('')
  const [points, setPoints] = useState('')

  const setPointsMutation = useMutation({
    mutationFn: ({ actorId, points }) => adminApi.setActorPoint(actorId, points),
    meta: { showErrorToast: true },
    onSuccess: () => {
      toast.success(t('admin.actor_point_updated', 'Aktör puanı güncellendi'))
    },
  })

  const handleSetPoints = () => {
    if (!actorId || !points) return toast.error(t('admin.actor_id_placeholder', 'Actor ID girin (GUID)'))
    setPointsMutation.mutate({ actorId, points: parseInt(points, 10) })
  }

  const isLoading = setPointsMutation.isPending

  return (
    <div
      className="card-surface"
      style={{
        padding: 24,
        borderRadius: 'var(--radius-xl)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Header */}
      <div
        className="border-b"
        style={{ borderColor: 'var(--color-border)', marginBottom: '12px', paddingBottom: '8px' }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>
          {t('admin.actor_management_title', 'Aktör Yönetimi')}
        </h2>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
          {t('admin.actor_management_desc', 'Aktör puanlarını ve seviyelerini yönetin')}
        </p>
      </div>

      <div className="flex flex-col gap-6 w-full">
        <div
          style={{
            padding: 16,
            borderRadius: 'var(--radius-lg)',
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border-light)',
          }}
        >
          <div
            style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--color-text)' }}
          >
            {t('admin.actor_management_title', 'Aktör Yönetimi')}
          </div>

          <div className="form-group" style={{ marginBottom: '8px' }}>
            <label
              className="form-label"
              style={{
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 3,
                display: 'block',
                color: 'var(--color-text-secondary)',
              }}
            >
              {t('admin.actor_id', 'Actor ID')}
            </label>
            <input
              className="input w-full"
              placeholder="e.g. 1847c130-aef0-4d9a-858f-0a02baf45dfd"
              value={actorId}
              onChange={(e) => setActorId(e.target.value)}
              style={{
                padding: '8px 12px',
                fontSize: 13,
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
                fontFamily: 'monospace',
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '10px' }}>
            <label
              className="form-label"
              style={{
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 3,
                display: 'block',
                color: 'var(--color-text-secondary)',
              }}
            >
              {t('admin.new_point', 'Yeni Puan')}
            </label>
            <input
              type="number"
              className="input w-full"
              placeholder="e.g. 1500"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              style={{
                padding: '8px 12px',
                fontSize: 13,
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
          </div>

          <div className="flex">
            <button
              className="btn btn-primary"
              onClick={handleSetPoints}
              disabled={isLoading}
              style={{
                fontSize: 11.5,
                fontWeight: 500,
                padding: '4px 10px',
                borderRadius: 'var(--radius-md)',
              }}
            >
              {isLoading ? t('admin.updating', 'Güncelleniyor...') : t('admin.update_point', 'Puanı Güncelle')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

