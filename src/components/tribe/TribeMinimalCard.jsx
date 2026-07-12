import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { tribeApi } from '../../api/tribeApi'
import useAuthStore from '../../store/authStore'
import { PenSquare } from 'lucide-react'
import useDevLog from '../../utils/useDevLog'

/**
 * TribeMinimalCard — plan.md Component #4
 * MinimalTribeDto'dan tribe kartı. Tıklanınca Center Panel'de TribeProfileView açar.
 */
export default function TribeMinimalCard({ tribeId, tribeName, tribePoint, imageUrl, clickable = true, showPoint = true }) {
  useDevLog('TribeMinimalCard', arguments[0] || {})
  const navigate = useNavigate()
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)

  const { data: myTribes } = useQuery({
    queryKey: ['myTribes'],
    queryFn: () => tribeApi.getMyTribes().then((res) => res.data.data),
    enabled: isLoggedIn,
  })

  const isMyTribe = myTribes?.some(t => t.tribeId === tribeId)

  const handleClick = () => {
    if (clickable) navigate('/tribe?tribeId=' + tribeId)
  }

  const handleEditClick = (e) => {
    e.stopPropagation()
    navigate('/tribe/settings?tribeId=' + tribeId)
  }

  return (
    <div className="tribe-card" onClick={handleClick} style={{ width: '100%', cursor: clickable ? 'pointer' : 'default', margin: 0 }}>
      {imageUrl ? (
        <img src={imageUrl} alt={tribeName} className="tribe-card-img" />
      ) : (
        <div
          className="tribe-card-img"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--color-primary-light)',
            color: 'var(--color-primary)', fontWeight: 700, fontSize: 16,
          }}
        >
          {tribeName?.[0] || 'T'}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="tribe-card-name truncate">{tribeName || 'İsimsiz Tribe'}</div>
      </div>
      {isMyTribe && (
        <button
          className="actor-chip-hier-btn"
          onClick={handleEditClick}
          title="Düzenle"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <PenSquare size={12} />
        </button>
      )}
      {showPoint && tribePoint != null && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--color-text-muted)',
            backgroundColor: 'var(--color-surface-2)',
            padding: '2px 6px',
            borderRadius: 12,
          }}
        >
          {tribePoint.toLocaleString('tr-TR')} P
        </span>
      )}
    </div>
  )
}
