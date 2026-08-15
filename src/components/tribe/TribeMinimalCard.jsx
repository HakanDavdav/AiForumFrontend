import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { tribeApi } from '../../api/tribeApi'
import useAuthStore from '../../store/authStore'
import useMyEntitiesStore from '../../store/myEntitiesStore'
import { Edit2, Brain, Crown } from 'lucide-react'
import useDevLog from '../../utils/useDevLog'
import { useTranslation } from 'react-i18next'

/**
 * TribeMinimalCard — plan.md Component #4
 * MinimalTribeDto'dan tribe kartı. Tıklanınca Center Panel'de TribeProfileView açar.
 */
export default function TribeMinimalCard({
  tribeId,
  tribeName,
  tribePoint,
  imageUrl,
  clickable = true,
  showPoint = true,
  showMindBtn = true,
  showEditBtn = true,
  variant = 'expanded',
  style = {},
}) {
  useDevLog('TribeMinimalCard', arguments[0] || {})
  const navigate = useNavigate()
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const { t } = useTranslation()

  const myTribes = useMyEntitiesStore((s) => s.myTribes)
  const isMyTribe = myTribes?.some((t) => t.tribeId === tribeId)
  const isCompact = variant === 'compact'

  const handleClick = (e) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation()
    }
    if (clickable) navigate('/tribe?tribeId=' + tribeId)
  }

  const handleMindClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    navigate('/mind?tribeId=' + tribeId)
  }

  const handleEditClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    navigate('/tribe/settings?tribeId=' + tribeId)
  }

  return (
    <div
      className={`tribe-card ${isCompact ? 'tribe-card--compact' : 'tribe-card--expanded'}`}
      onClick={handleClick}
      style={{
        width: isCompact ? 'auto' : '100%',
        maxWidth: '100%',
        cursor: clickable ? 'pointer' : 'default',
        margin: 0,
        ...style,
      }}
    >
      <div style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
        {imageUrl ? (
          <img src={imageUrl} alt={tribeName} className="tribe-card-img" />
        ) : (
          <div
            className="tribe-card-img"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              fontWeight: 700,
              fontSize: isCompact ? 11 : 16,
            }}
          >
            {tribeName?.[0] || 'T'}
          </div>
        )}
        {isMyTribe && (
          <span
            title={t('common.your_tribe', 'Senin Kabilen')}
            style={{
              position: 'absolute',
              top: isCompact ? -3 : -4,
              left: isCompact ? -3 : -4,
              color: 'var(--color-warning)',
              zIndex: 2,
              filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.5))',
              transform: 'rotate(-15deg)',
              display: 'flex',
              pointerEvents: 'auto',
            }}
          >
            <Crown size={isCompact ? 12 : 16} strokeWidth={2.5} />
          </span>
        )}
      </div>
      <div style={{ flex: isCompact ? '0 1 auto' : 1, minWidth: 0 }}>
        <div className="tribe-card-name truncate">{tribeName || 'İsimsiz Tribe'}</div>
      </div>
      {!isCompact && showMindBtn && (
        <button
          type="button"
          className="actor-chip-hier-btn"
          onClick={handleMindClick}
          title="Show mind map"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <Brain size={12} />
        </button>
      )}
      {!isCompact && isMyTribe && showEditBtn && (
        <button
          type="button"
          className="actor-chip-hier-btn"
          onClick={handleEditClick}
          title="Edit"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <Edit2 size={12} />
        </button>
      )}
      {!isCompact && showPoint && tribePoint != null && (
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
